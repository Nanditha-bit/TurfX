import json
import math
import threading
import io
import base64
from datetime import date as date_type, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import Response
from app.database import get_db
from app.schemas import (
    CreateOrderRequest, DirectBookingRequest,
    CancelBookingRequest, RescheduleRequest, RejectBookingRequest,
)
from app.utils.security import get_current_user, require_roles
from app.utils.helpers import generate_booking_id, fmt_booking
from app.utils.email import send_booking_confirmation
from app.config import settings

router = APIRouter(prefix="/bookings", tags=["bookings"])
OWNER_OR_ADMIN = require_roles("owner", "admin")

# ── Razorpay setup ────────────────────────────────────────────────────────────
_razorpay = None
if not settings.is_demo_razorpay:
    try:
        import razorpay as _rzp
        _razorpay = _rzp.Client(
            auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
        )
    except Exception:
        pass


# ── GET /api/bookings/booked-slots/:turfId/:date ──────────────────────────────
@router.get("/booked-slots/{turf_id}/{booking_date}")
def booked_slots(turf_id: str, booking_date: str):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT time_slots FROM bookings WHERE turf_id=%s AND date=%s AND status!='cancelled'",
                (turf_id, booking_date),
            )
            rows = cur.fetchall()

    all_slots: list[str] = []
    for r in rows:
        all_slots.extend(r["time_slots"] or [])
    return {"bookedSlots": list(set(all_slots))}


# ── POST /api/bookings/razorpay-order ─────────────────────────────────────────
@router.post("/razorpay-order")
def create_order(body: CreateOrderRequest, user=Depends(get_current_user)):
    if body.amount < 1:
        raise HTTPException(400, "Valid amount required.")

    if not _razorpay:
        return {
            "id": f"demo_order_{int(datetime.now().timestamp())}",
            "amount": int(body.amount * 100),
            "currency": "INR",
            "demo": True,
        }

    order = _razorpay.order.create(
        {"amount": int(body.amount * 100), "currency": "INR"}
    )
    return {
        "id": order["id"],
        "amount": order["amount"],
        "currency": order["currency"],
        "demo": False,
    }


# ── POST /api/bookings/direct ─────────────────────────────────────────────────
@router.post("/direct")
def direct_booking(body: DirectBookingRequest, user=Depends(get_current_user)):
    if not body.time_slots:
        raise HTTPException(400, "At least one time slot is required.")

    with get_db() as conn:
        with conn.cursor() as cur:
            # Verify turf
            cur.execute("SELECT * FROM turfs WHERE id=%s", (body.turf_id,))
            turf = cur.fetchone()
            if not turf:
                raise HTTPException(404, "Venue not found.")

            # Enforce minimum ₹500 per slot
            MIN_SLOT_FEE = 500
            num_slots = len(body.time_slots)
            min_court = MIN_SLOT_FEE * num_slots
            if body.total_price < min_court:
                raise HTTPException(400, f"Minimum turf fee is ₹{MIN_SLOT_FEE} per slot.")

            # Conflict check
            cur.execute(
                "SELECT time_slots FROM bookings WHERE turf_id=%s AND date=%s AND status!='cancelled'",
                (body.turf_id, body.date),
            )
            conflicts: list[str] = []
            for r in cur.fetchall():
                for s in (r["time_slots"] or []):
                    if s in body.time_slots:
                        conflicts.append(s)
            if conflicts:
                raise HTTPException(
                    409, f"Slots already booked: {', '.join(conflicts)}"
                )

            platform_fee = 25
            turf_fee = 0
            gst = math.ceil(platform_fee * 0.18)                 # 18% of ₹25 = 4.5 → ₹5
            court_amount = max(body.total_price - platform_fee - gst, 0)
            booking_id = generate_booking_id()

            cur.execute(
                """INSERT INTO bookings
                   (booking_id,user_id,turf_id,date,time_slots,sport,
                    total_price,court_amount,platform_fee,turf_fee,gst,status,
                    razorpay_order_id,razorpay_payment_id,razorpay_signature,payment_id)
                   VALUES (%s,%s,%s,%s,%s::jsonb,%s,%s,%s,%s,%s,%s,'confirmed',%s,%s,%s,%s)
                   RETURNING *""",
                (
                    booking_id, user["id"], body.turf_id, body.date,
                    json.dumps(body.time_slots),   # cast list → jsonb
                    body.sport or turf["sport"],
                    body.total_price, court_amount,
                    platform_fee, turf_fee, gst,
                    body.razorpay_order_id, body.razorpay_payment_id,
                    body.razorpay_signature,
                    body.payment_id or body.razorpay_payment_id,
                ),
            )
            booking = dict(cur.fetchone())

    # Send confirmation email in background (non-blocking)
    if user.get("email"):
        threading.Thread(
            target=send_booking_confirmation,
            args=(
                user["email"],
                turf["name"],
                body.date,
                ", ".join(body.time_slots),
                body.total_price,
            ),
            daemon=True,
        ).start()

    return _full_booking(booking["id"])


# ── GET /api/bookings/mine ────────────────────────────────────────────────────
@router.get("/mine")
def my_bookings(user=Depends(get_current_user)):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT b.*,
                    t.name AS turf_name, t.location AS turf_location,
                    t.city AS turf_city, t.sport AS turf_sport,
                    t.price_per_hour AS turf_price,
                    t.amenities AS turf_amenities, t.images AS turf_images,
                    t.rating AS turf_rating,
                    u.name AS user_name, u.phone AS user_phone, u.email AS user_email
                   FROM bookings b
                   LEFT JOIN turfs t ON b.turf_id=t.id
                   LEFT JOIN users u ON b.user_id=u.id
                   WHERE b.user_id=%s
                   ORDER BY b.created_at DESC""",
                (user["id"],),
            )
            rows = cur.fetchall()
    return [fmt_booking(dict(r)) for r in rows]


# ── PUT /api/bookings/cancel/:id ──────────────────────────────────────────────
@router.put("/cancel/{booking_id}")
def cancel_booking(booking_id: str, body: CancelBookingRequest = CancelBookingRequest(),
                   user=Depends(get_current_user)):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM bookings WHERE id=%s", (booking_id,))
            b = cur.fetchone()
            if not b:
                raise HTTPException(404, "Booking not found.")
            if str(b["user_id"]) != str(user["id"]) and user["role"] not in ("admin", "owner"):
                raise HTTPException(403, "Not authorized.")
            if b["status"] in ("cancelled", "completed"):
                raise HTTPException(400, f"Cannot cancel a {b['status']} booking.")

            booking_date = b["date"]
            if isinstance(booking_date, str):
                booking_date = date_type.fromisoformat(booking_date)
            now = datetime.now(timezone.utc).date()
            hours_until = (booking_date - now).days * 24

            refund = 0.0
            if hours_until > 24:
                refund = float(b["total_price"])
            elif hours_until > 2:
                refund = float(b["total_price"]) * 0.5

            cur.execute(
                """UPDATE bookings SET status='cancelled',refund_amount=%s,
                   cancel_reason=%s,updated_at=NOW() WHERE id=%s""",
                (refund, body.reason or "Cancelled by user", booking_id),
            )
    return {"msg": "Booking cancelled successfully.", "refundAmount": refund}


# ── PUT /api/bookings/reschedule/:id ─────────────────────────────────────────
@router.put("/reschedule/{booking_id}")
def reschedule(booking_id: str, body: RescheduleRequest, user=Depends(get_current_user)):
    new_slots = body.newTimeSlot if isinstance(body.newTimeSlot, list) else [body.newTimeSlot]

    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM bookings WHERE id=%s", (booking_id,))
            b = cur.fetchone()
            if not b:
                raise HTTPException(404, "Booking not found.")
            if str(b["user_id"]) != str(user["id"]):
                raise HTTPException(403, "Not authorized.")
            if b["status"] == "cancelled":
                raise HTTPException(400, "Cannot reschedule a cancelled booking.")

            cur.execute(
                "UPDATE bookings SET date=%s,time_slots=%s::jsonb,updated_at=NOW() WHERE id=%s RETURNING *",
                (body.newDate, json.dumps(new_slots), booking_id),
            )
            updated = dict(cur.fetchone())

    return _full_booking(updated["id"])


# ── POST /api/bookings/checkin/:id ────────────────────────────────────────────
@router.post("/checkin/{booking_id}")
def checkin(booking_id: str, user=Depends(OWNER_OR_ADMIN)):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """UPDATE bookings SET status='checked-in',checked_in_at=NOW(),updated_at=NOW()
                   WHERE id=%s RETURNING *""",
                (booking_id,),
            )
            b = cur.fetchone()
            if not b:
                raise HTTPException(404, "Booking not found.")
    return {"msg": "Check-in successful.", "booking": fmt_booking(dict(b))}


# ── GET /api/bookings/partner/pending ────────────────────────────────────────
@router.get("/partner/pending")
def partner_pending(user=Depends(OWNER_OR_ADMIN)):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT b.*,
                    t.name AS turf_name, t.location AS turf_location,
                    t.sport AS turf_sport, t.id AS turf_ref_id,
                    u.name AS user_name, u.phone AS user_phone, u.email AS user_email
                   FROM bookings b
                   JOIN turfs t ON b.turf_id=t.id
                   JOIN users u ON b.user_id=u.id
                   WHERE t.owner_id=%s AND b.status='pending'
                   ORDER BY b.created_at DESC""",
                (user["id"],),
            )
            rows = cur.fetchall()
    return [fmt_booking(dict(r)) for r in rows]


# ── PUT /api/bookings/approve/:id ─────────────────────────────────────────────
@router.put("/approve/{booking_id}")
def approve(booking_id: str, user=Depends(OWNER_OR_ADMIN)):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE bookings SET status='confirmed',updated_at=NOW() WHERE id=%s RETURNING *",
                (booking_id,),
            )
            b = cur.fetchone()
            if not b:
                raise HTTPException(404, "Booking not found.")
    return {"msg": "Booking approved.", "booking": fmt_booking(dict(b))}


# ── PUT /api/bookings/reject/:id ──────────────────────────────────────────────
@router.put("/reject/{booking_id}")
def reject(booking_id: str, body: RejectBookingRequest = RejectBookingRequest(),
           user=Depends(OWNER_OR_ADMIN)):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """UPDATE bookings SET status='cancelled',cancel_reason=%s,updated_at=NOW()
                   WHERE id=%s RETURNING *""",
                (body.reason or "Rejected by venue", booking_id),
            )
            b = cur.fetchone()
            if not b:
                raise HTTPException(404, "Booking not found.")
    return {"msg": "Booking rejected.", "booking": fmt_booking(dict(b))}


# ── GET /api/bookings/:id ─────────────────────────────────────────────────────
@router.get("/{booking_id}")
def get_booking(booking_id: str, user=Depends(get_current_user)):
    """Fetch a single booking by numeric ID — used by QR scanner."""
    result = _full_booking(booking_id)
    if not result:
        raise HTTPException(404, "Booking not found.")
    # Users can only view their own booking; owners/admins can view all
    if user["role"] not in ("admin", "owner"):
        if str(result.get("user_id")) != str(user["id"]):
            raise HTTPException(403, "Not authorized.")
    return result


# ── GET /api/bookings/:id/qr ──────────────────────────────────────────────────
@router.get("/{booking_id}/qr")
def get_booking_qr(booking_id: str, request: Request, token: str = None):
    """Return a PNG QR code image. Accepts Bearer header OR ?token= query param for mobile."""
    from app.utils.security import _get_user_from_token

    # Resolve token from header or query param
    raw_token = None
    auth_header = request.headers.get("authorization", "")
    if auth_header.startswith("Bearer "):
        raw_token = auth_header[7:]
    elif token:
        raw_token = token

    if not raw_token:
        raise HTTPException(401, "Authorization required.")

    try:
        user = _get_user_from_token(raw_token)
    except HTTPException:
        raise HTTPException(401, "Invalid or expired token.")

    try:
        import qrcode  # type: ignore
    except ImportError:
        raise HTTPException(500, "QR library not installed. Run: pip install qrcode[pil]")

    result = _full_booking(booking_id)
    if not result:
        raise HTTPException(404, "Booking not found.")

    # Authorization: users only see own bookings; owners/admins see all
    if user["role"] not in ("admin", "owner"):
        if str(result.get("user_id")) != str(user["id"]):
            raise HTTPException(403, "Not authorized.")

    qr_data = f"TURFX:BOOKING:{booking_id}"
    qr = qrcode.QRCode(
        version=2,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(qr_data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#084734", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return Response(content=buf.read(), media_type="image/png")


# ── Helper ────────────────────────────────────────────────────────────────────
def _full_booking(booking_id: str):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT b.*,
                    t.name AS turf_name, t.location AS turf_location,
                    t.city AS turf_city, t.sport AS turf_sport,
                    t.price_per_hour AS turf_price,
                    t.amenities AS turf_amenities, t.images AS turf_images,
                    t.rating AS turf_rating,
                    u.name AS user_name, u.phone AS user_phone, u.email AS user_email
                   FROM bookings b
                   LEFT JOIN turfs t ON b.turf_id=t.id
                   LEFT JOIN users u ON b.user_id=u.id
                   WHERE b.id=%s""",
                (booking_id,),
            )
            row = cur.fetchone()
    return fmt_booking(dict(row)) if row else {}
