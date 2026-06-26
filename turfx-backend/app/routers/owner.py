from fastapi import APIRouter, Depends, HTTPException
from app.database import get_db
from app.utils.security import require_roles, get_current_user
from app.utils.helpers import fmt_turf, fmt_booking

router = APIRouter(prefix="/owner", tags=["owner"])
OWNER_OR_ADMIN = require_roles("owner", "admin")


@router.get("/turfs")
def get_owner_turfs(user=Depends(OWNER_OR_ADMIN)):
    owner_id = user["id"]
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT t.*,
                    COALESCE(COUNT(b.id), 0) AS total_bookings
                   FROM turfs t
                   LEFT JOIN bookings b ON b.turf_id=t.id AND b.status!='cancelled'
                   WHERE t.owner_id=%s
                   GROUP BY t.id
                   ORDER BY t.created_at DESC""",
                (owner_id,),
            )
            turf_rows = cur.fetchall()
    return [
        {
            **fmt_turf(dict(r)),
            "total_bookings": r.get("total_bookings", 0)
        }
        for r in turf_rows
    ]


@router.put("/turfs/{turf_id}")
def update_turf_status(turf_id: str, body: dict, user=Depends(OWNER_OR_ADMIN)):
    owner_id = user["id"]
    new_status = body.get("status", "active")
    
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """UPDATE turfs
                   SET status=%s, updated_at=NOW()
                   WHERE id=%s AND owner_id=%s
                   RETURNING *""",
                (new_status, turf_id, owner_id),
            )
            updated = cur.fetchone()
            if not updated:
                raise HTTPException(404, "Turf not found or not authorized.")
    return fmt_turf(dict(updated))


@router.get("/dashboard")
def dashboard(user=Depends(OWNER_OR_ADMIN)):
    owner_id = user["id"]

    with get_db() as conn:
        with conn.cursor() as cur:

            # Turfs with earnings
            cur.execute(
                """SELECT t.*,
                    u.name AS owner_name, u.phone AS owner_phone, u.email AS owner_email,
                    COALESCE(SUM(CASE WHEN b.status!='cancelled' THEN b.total_price ELSE 0 END),0) AS earnings,
                    COALESCE(rv.avg_rating, t.rating) AS rating,
                    COALESCE(rv.cnt, 0) AS review_count
                   FROM turfs t
                   LEFT JOIN users u ON t.owner_id=u.id
                   LEFT JOIN bookings b ON b.turf_id=t.id
                   LEFT JOIN LATERAL (
                       SELECT ROUND(AVG(r.rating)::numeric,1) AS avg_rating, COUNT(*)::int AS cnt
                       FROM reviews r WHERE r.turf_id=t.id
                   ) rv ON TRUE
                   WHERE t.owner_id=%s
                   GROUP BY t.id, u.name, u.phone, u.email, rv.avg_rating, rv.cnt
                   ORDER BY t.created_at DESC""",
                (owner_id,),
            )
            turf_rows = cur.fetchall()
            turf_ids = [str(r["id"]) for r in turf_rows]

            bookings = []
            slots = []
            offers = []
            reviews = []
            avg_rating = 0

            if turf_ids:
                # All bookings
                placeholders = ",".join(["%s"] * len(turf_ids))
                cur.execute(
                    f"""SELECT b.*,
                        t.name AS turf_name, t.location AS turf_location,
                        t.city AS turf_city, t.sport AS turf_sport,
                        t.price_per_hour AS turf_price,
                        t.amenities AS turf_amenities, t.images AS turf_images,
                        t.rating AS turf_rating,
                        u.name AS user_name, u.phone AS user_phone, u.email AS user_email
                       FROM bookings b
                       JOIN turfs t ON b.turf_id=t.id
                       JOIN users u ON b.user_id=u.id
                       WHERE t.owner_id=%s
                       ORDER BY b.created_at DESC""",
                    (owner_id,),
                )
                booking_rows = cur.fetchall()
                bookings = [fmt_booking(dict(r)) for r in booking_rows]

                # Slots
                cur.execute(
                    """SELECT s.*, t.name AS turf_name, t.location AS turf_location
                       FROM slots s
                       JOIN turfs t ON s.turf_id=t.id
                       WHERE t.owner_id=%s
                       ORDER BY s.date DESC, s.time_slot ASC""",
                    (owner_id,),
                )
                for s in cur.fetchall():
                    slots.append({
                        "_id": str(s["id"]),
                        "id": str(s["id"]),
                        "turf_id": {"_id": str(s["turf_id"]), "name": s["turf_name"], "location": s["turf_location"]},
                        "date": str(s["date"]),
                        "time_slot": s["time_slot"],
                        "is_booked": s["is_booked"],
                        "is_locked": s["is_locked"],
                        "created_by_owner": s["created_by_owner"],
                    })

                # Offers
                cur.execute(
                    """SELECT o.*, t.name AS turf_ref_name
                       FROM offers o
                       LEFT JOIN turfs t ON o.turf_id=t.id
                       WHERE o.owner_id=%s
                       ORDER BY o.created_at DESC""",
                    (owner_id,),
                )
                for o in cur.fetchall():
                    offers.append({
                        "_id": str(o["id"]),
                        "id": str(o["id"]),
                        "turf_id": {"_id": str(o["turf_id"]), "name": o["turf_ref_name"]},
                        "title": o["title"],
                        "discount": o["discount"],
                        "description": o["description"],
                        "valid_until": o["valid_until"].isoformat() if o.get("valid_until") else None,
                        "is_active": o["is_active"],
                    })

                # Reviews for owner's turfs
                reviews = []
                cur.execute(
                    """SELECT r.*, u.name AS user_name, t.name AS turf_name
                       FROM reviews r
                       JOIN turfs t ON r.turf_id = t.id
                       LEFT JOIN users u ON r.user_id = u.id
                       WHERE t.owner_id=%s
                       ORDER BY r.created_at DESC""",
                    (owner_id,),
                )
                review_rows = cur.fetchall()
                reviews = [
                    {
                        "_id": str(rv["id"]),
                        "turf_id": {"_id": str(rv["turf_id"]), "name": rv["turf_name"]},
                        "user_id": {"_id": str(rv["user_id"]) if rv.get("user_id") else None, "name": rv.get("user_name") or "Anonymous"},
                        "rating": rv["rating"],
                        "comment": rv["comment"],
                        "createdAt": rv["created_at"].isoformat() if rv.get("created_at") else None,
                    }
                    for rv in review_rows
                ]
                avg_rating = round(sum(r["rating"] for r in reviews) / len(reviews), 1) if reviews else 0

    from datetime import date
    today = str(date.today())

    upcoming = [b for b in bookings if b["status"] in ("confirmed", "approved", "pending") and (b["date"] or "") >= today]
    pending_approvals = [b for b in bookings if b["status"] == "pending"]
    total_earnings = sum(b["total_price"] for b in bookings if b["status"] != "cancelled")

    recent_activity = [
        {
            "message": f"New booking from {b['user_id']['name'] if b.get('user_id') else 'Customer'}"
                       f" for {b['turf_id']['name'] if b.get('turf_id') else 'Venue'} on {b['date']}",
            "time": b["createdAt"],
        }
        for b in bookings[:10]
    ]

    return {
        "turfs": [
            {**fmt_turf(dict(r)), "earnings": float(r["earnings"] or 0)}
            for r in turf_rows
        ],
        "bookings": bookings,
        "slots": slots,
        "offers": offers,
        "reviews": reviews if turf_ids else [],
        "avgRating": avg_rating if turf_ids else 0,
        "upcomingBookings": upcoming[:10],
        "upcomingBookingsCount": len(upcoming),
        "pendingApprovals": pending_approvals[:10],
        "totalBookings": sum(1 for b in bookings if b["status"] != "cancelled"),
        "totalEarnings": total_earnings,
        "recentActivity": recent_activity,
        "notificationCount": len(pending_approvals),
    }


@router.put("/bookings/cancel/{booking_id}")
def owner_cancel_booking(booking_id: str, user=Depends(OWNER_OR_ADMIN)):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """UPDATE bookings SET status='cancelled',cancel_reason='Cancelled by venue',updated_at=NOW()
                   WHERE id=%s AND turf_id IN (SELECT id FROM turfs WHERE owner_id=%s)
                   RETURNING id""",
                (booking_id, user["id"]),
            )
            if not cur.fetchone():
                raise HTTPException(404, "Booking not found or not authorized.")
    return {"msg": "Booking cancelled."}


# ── PUT /api/owner/profile ────────────────────────────────────────────────────
@router.put("/profile")
def update_owner_profile(body: dict, user=Depends(get_current_user)):
    name = body.get("name", "").strip()
    email = body.get("email", "").strip() or None

    if not name:
        raise HTTPException(400, "Name cannot be empty.")

    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE users SET name=%s, email=COALESCE(%s, email), updated_at=NOW() WHERE id=%s RETURNING *",
                (name, email, user["id"]),
            )
            updated = cur.fetchone()
            if not updated:
                raise HTTPException(404, "User not found.")

    from app.utils.helpers import fmt_user
    return fmt_user(dict(updated))


# ── PUT /api/owner/settings/password ─────────────────────────────────────────
@router.put("/settings/password")
def change_password(body: dict, user=Depends(get_current_user)):
    from app.utils.security import verify_password, hash_password
    current = body.get("currentPassword", "")
    new_pw = body.get("newPassword", "")

    if not current or not new_pw:
        raise HTTPException(400, "Current and new password are required.")
    if len(new_pw) < 6:
        raise HTTPException(400, "New password must be at least 6 characters.")

    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT password_hash FROM users WHERE id=%s", (user["id"],))
            row = cur.fetchone()
            if not row or not row["password_hash"]:
                raise HTTPException(400, "No password set for this account.")
            if not verify_password(current, row["password_hash"]):
                raise HTTPException(401, "Current password is incorrect.")
            new_hash = hash_password(new_pw)
            cur.execute(
                "UPDATE users SET password_hash=%s, updated_at=NOW() WHERE id=%s",
                (new_hash, user["id"]),
            )
    return {"msg": "Password changed successfully."}
