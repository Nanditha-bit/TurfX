import math
from fastapi import APIRouter, Depends, HTTPException
from app.database import get_db
from app.utils.security import require_roles
from app.utils.helpers import fmt_turf, fmt_booking
from app.schemas import UpdateTicketRequest

router = APIRouter(prefix="/admin", tags=["admin"])
ADMIN = require_roles("admin")
ADMIN_OR_OWNER = require_roles("admin", "owner")

PLATFORM_FEE = 25
TURF_FEE = 0
GST_RATE = 0.18
GST_PER_BOOKING = math.ceil(PLATFORM_FEE * GST_RATE)   # 18% of ₹25 = 4.5 → ₹5
TOTAL_FEE = PLATFORM_FEE + GST_PER_BOOKING          # ₹30


# ── GET /api/admin/revenue ────────────────────────────────────────────────────
@router.get("/revenue")
def revenue(user=Depends(ADMIN_OR_OWNER)):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT b.*,
                    t.name AS turf_name,
                    u.name AS user_name, u.phone AS user_phone
                   FROM bookings b
                   JOIN turfs t ON b.turf_id=t.id
                   JOIN users u ON b.user_id=u.id
                   WHERE b.status IN ('confirmed','completed','checked-in')
                   ORDER BY b.created_at DESC"""
            )
            confirmed = [dict(r) for r in cur.fetchall()]

            cur.execute(
                """SELECT COUNT(*) FILTER (WHERE role='user')    AS total_users,
                          COUNT(*) FILTER (WHERE role='owner')   AS total_partners
                   FROM users WHERE is_active=TRUE"""
            )
            counts = dict(cur.fetchone())

            cur.execute("SELECT COUNT(*) AS total_turfs FROM turfs WHERE is_active=TRUE")
            turf_count = cur.fetchone()["total_turfs"]

    total_bookings = len(confirmed)
    total_platform_fee = total_bookings * PLATFORM_FEE
    total_gst = total_bookings * GST_PER_BOOKING
    total_revenue = total_platform_fee + total_gst
    total_gmv = sum(float(b["total_price"] or 0) for b in confirmed)

    # Monthly breakdown
    monthly_map: dict = {}
    for b in confirmed:
        month = b["created_at"].strftime("%Y-%m") if b.get("created_at") else "unknown"
        if month not in monthly_map:
            monthly_map[month] = {"month": month, "bookings": 0, "revenue": 0,
                                  "platformFee": 0, "gst": 0, "gmv": 0}
        monthly_map[month]["bookings"] += 1
        monthly_map[month]["platformFee"] += PLATFORM_FEE
        monthly_map[month]["gst"] += GST_PER_BOOKING
        monthly_map[month]["revenue"] += PLATFORM_FEE + GST_PER_BOOKING
        monthly_map[month]["gmv"] += float(b["total_price"] or 0)
    monthly = sorted(monthly_map.values(), key=lambda x: x["month"])

    # Per-turf breakdown
    turf_map: dict = {}
    for b in confirmed:
        name = b["turf_name"] or "Unknown"
        if name not in turf_map:
            turf_map[name] = {"turfName": name, "bookings": 0, "revenue": 0,
                               "platformFee": 0, "gst": 0, "gmv": 0}
        turf_map[name]["bookings"] += 1
        turf_map[name]["platformFee"] += PLATFORM_FEE
        turf_map[name]["gst"] += GST_PER_BOOKING
        turf_map[name]["revenue"] += PLATFORM_FEE + GST_PER_BOOKING
        turf_map[name]["gmv"] += float(b["total_price"] or 0)
    per_turf = sorted(turf_map.values(), key=lambda x: -x["revenue"])

    recent_transactions = [
        {
            "bookingRef": (b.get("booking_id") or str(b["id"])[-6:]).upper(),
            "userName": b["user_name"],
            "userPhone": b["user_phone"],
            "turfName": b["turf_name"],
            "date": str(b["date"]),
            "timeSlot": (b.get("time_slots") or [None])[0] or "-",
            "courtAmount": max(float(b["total_price"] or 0) - TOTAL_FEE, 0),
            "platformFee": PLATFORM_FEE,
            "gst": GST_PER_BOOKING,
            "totalPaid": float(b["total_price"] or 0),
        }
        for b in confirmed[:100]
    ]

    return {
        "summary": {
            "totalBookings": total_bookings,
            "totalRevenue": total_revenue,
            "totalPlatformFee": total_platform_fee,
            "totalGST": total_gst,
            "totalGMV": round(total_gmv),
            "totalUsers": int(counts["total_users"] or 0),
            "totalPartners": int(counts["total_partners"] or 0),
            "totalTurfs": int(turf_count or 0),
            "platformFeePerBooking": PLATFORM_FEE,
            "turfFeePerBooking": TURF_FEE,
            "gstPerBooking": GST_PER_BOOKING,
            "totalFeePerBooking": TOTAL_FEE,
        },
        "monthly": monthly,
        "perTurf": per_turf,
        "recentTransactions": recent_transactions,
        "allBookings": [fmt_booking(b) for b in confirmed],
    }


# ── GET /api/admin/turfs ──────────────────────────────────────────────────────
@router.get("/turfs")
def all_turfs(user=Depends(ADMIN)):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT t.*, u.name AS owner_name, u.phone AS owner_phone, u.email AS owner_email
                   FROM turfs t LEFT JOIN users u ON t.owner_id=u.id
                   ORDER BY t.created_at DESC"""
            )
            rows = cur.fetchall()
    return [fmt_turf(dict(r)) for r in rows]


# ── PATCH /api/admin/turfs/:id/status ────────────────────────────────────────
@router.patch("/turfs/{turf_id}/status")
def toggle_turf(turf_id: str, user=Depends(ADMIN)):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE turfs SET is_active=NOT is_active,updated_at=NOW() WHERE id=%s RETURNING *",
                (turf_id,),
            )
            row = cur.fetchone()
            if not row:
                raise HTTPException(404, "Venue not found.")
    return fmt_turf(dict(row))


# ── GET /api/admin/users ──────────────────────────────────────────────────────
@router.get("/users")
def all_users(user=Depends(ADMIN)):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT u.*,
                    (SELECT COUNT(*) FROM bookings b WHERE b.user_id=u.id AND b.status!='cancelled') AS total_bookings,
                    (SELECT COUNT(*) FROM turfs t WHERE t.owner_id=u.id) AS total_venues
                   FROM users u ORDER BY u.created_at DESC"""
            )
            rows = cur.fetchall()
    return [
        {
            "_id": str(r["id"]), "id": str(r["id"]),
            "name": r["name"], "phone": r["phone"],
            "email": r["email"], "role": r["role"],
            "is_active": r["is_active"],
            "totalBookings": int(r["total_bookings"] or 0),
            "totalVenues": int(r["total_venues"] or 0),
            "createdAt": r["created_at"].isoformat() if r.get("created_at") else None,
        }
        for r in rows
    ]


# ── PATCH /api/admin/users/:id/status ────────────────────────────────────────
@router.patch("/users/{user_id}/status")
def toggle_user(user_id: str, user=Depends(ADMIN)):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE users SET is_active=NOT is_active WHERE id=%s RETURNING is_active",
                (user_id,),
            )
            row = cur.fetchone()
            if not row:
                raise HTTPException(404, "User not found.")
    return {"msg": "Status updated.", "isActive": row["is_active"]}


# ── GET /api/admin/support/tickets ───────────────────────────────────────────
@router.get("/support/tickets")
def support_tickets(user=Depends(ADMIN)):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT st.*, u.name AS user_name, u.phone AS user_phone, u.role AS user_role
                   FROM support_tickets st
                   LEFT JOIN users u ON st.user_id=u.id
                   ORDER BY st.created_at DESC"""
            )
            rows = cur.fetchall()
    return [
        {
            "_id": str(r["id"]), "id": str(r["id"]),
            "user_id": {
                "_id": str(r["user_id"]) if r.get("user_id") else None,
                "name": r["user_name"], "phone": r["user_phone"], "role": r["user_role"],
            },
            "subject": r["subject"], "description": r["description"],
            "category": r["category"], "priority": r["priority"],
            "status": r["status"], "admin_reply": r["admin_reply"],
            "createdAt": r["created_at"].isoformat() if r.get("created_at") else None,
        }
        for r in rows
    ]


# ── PATCH /api/admin/support/tickets/:id ─────────────────────────────────────
@router.patch("/support/tickets/{ticket_id}")
def update_ticket(ticket_id: str, body: UpdateTicketRequest, user=Depends(ADMIN)):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """UPDATE support_tickets
                   SET status=COALESCE(%s,status), admin_reply=COALESCE(%s,admin_reply), updated_at=NOW()
                   WHERE id=%s RETURNING id""",
                (body.status, body.admin_reply, ticket_id),
            )
            if not cur.fetchone():
                raise HTTPException(404, "Ticket not found.")
    return {"msg": "Ticket updated."}
