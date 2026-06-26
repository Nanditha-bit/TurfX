import random
import string
from datetime import datetime, timezone


def generate_booking_id() -> str:
    ts = datetime.now(timezone.utc).strftime("%y%m%d%H%M")
    rand = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"TFX-{ts}-{rand}"


# ── Serialisers (map DB rows → frontend-compatible dicts) ─────────────────────

def fmt_user(u: dict) -> dict:
    return {
        "_id": str(u["id"]),
        "id": str(u["id"]),
        "name": u.get("name"),
        "phone": u.get("phone"),
        "email": u.get("email"),
        "role": u.get("role"),
        "createdAt": u["created_at"].isoformat() if u.get("created_at") else None,
    }


def fmt_turf(t: dict) -> dict:
    owner = None
    if t.get("owner_id"):
        owner = {
            "_id": str(t["owner_id"]),
            "name": t.get("owner_name"),
            "phone": t.get("owner_phone"),
            "email": t.get("owner_email"),
        }
    return {
        "_id": str(t["id"]),
        "id": str(t["id"]),
        "name": t.get("name"),
        "description": t.get("description"),
        "shortDescription": t.get("short_description"),
        "location": t.get("location"),
        "city": t.get("city"),
        "state": t.get("state"),
        "pincode": t.get("pincode"),
        "sport": t.get("sport"),
        "sports": t.get("sports") or [],
        "type": t.get("type"),
        "venueSize": t.get("venue_size"),
        "surfaceType": t.get("surface_type"),
        "bookingType": t.get("booking_type"),
        "price_per_hour": float(t.get("price_per_hour") or 0),
        "pricingRules": t.get("pricing_rules") or [],
        "amenities": t.get("amenities") or [],
        "images": t.get("images") or [],
        "videos": t.get("videos") or [],
        "rating": float(t.get("rating") or 4.5),
        "reviewCount": int(t.get("review_count") or 0),
        "isActive": t.get("is_active"),
        "status": t.get("status"),
        "lat": float(t["lat"]) if t.get("lat") else None,
        "lng": float(t["lng"]) if t.get("lng") else None,
        "owner_id": owner,
        "earnings": float(t.get("earnings") or 0),
        "createdAt": t["created_at"].isoformat() if t.get("created_at") else None,
    }


def fmt_booking(b: dict) -> dict:
    turf_ref = None
    if b.get("turf_id"):
        turf_ref = {
            "_id": str(b["turf_id"]),
            "name": b.get("turf_name"),
            "location": b.get("turf_location"),
            "city": b.get("turf_city"),
            "sport": b.get("turf_sport"),
            "price_per_hour": float(b.get("turf_price") or 0),
            "amenities": b.get("turf_amenities") or [],
            "images": b.get("turf_images") or [],
            "rating": float(b.get("turf_rating") or 4.5),
        }

    user_ref = None
    if b.get("user_id"):
        user_ref = {
            "_id": str(b["user_id"]),
            "name": b.get("user_name"),
            "phone": b.get("user_phone"),
            "email": b.get("user_email"),
        }

    slots = b.get("time_slots") or []
    return {
        "_id": str(b["id"]),
        "id": str(b["id"]),
        "booking_id": b.get("booking_id"),
        "user_id": user_ref,
        "turf_id": turf_ref,
        "user_name": b.get("user_name"),
        "user_phone": b.get("user_phone"),
        "user_email": b.get("user_email"),
        "turf_name": b.get("turf_name"),
        "turf_location": b.get("turf_location"),
        "turf_city": b.get("turf_city"),
        "turf_sport": b.get("turf_sport"),
        "date": str(b["date"]) if b.get("date") else None,
        "time_slots": slots,
        "time_slot": slots[0] if slots else None,
        "sport": b.get("sport"),
        "total_price": float(b.get("total_price") or 0),
        "court_amount": float(b.get("court_amount") or 0),
        "platform_fee": float(b.get("platform_fee") or 25),
        "turf_fee": float(b.get("turf_fee") or 20),
        "gst": float(b.get("gst") or 8),
        "status": b.get("status"),
        "razorpay_order_id": b.get("razorpay_order_id"),
        "razorpay_payment_id": b.get("razorpay_payment_id"),
        "payment_id": b.get("payment_id"),
        "cancel_reason": b.get("cancel_reason"),
        "refund_amount": float(b.get("refund_amount") or 0),
        "rating": b.get("rating"),
        "review": b.get("review"),
        "createdAt": b["created_at"].isoformat() if b.get("created_at") else None,
    }


def fmt_review(r: dict) -> dict:
    return {
        "_id": str(r["id"]),
        "id": str(r["id"]),
        "turf_id": str(r["turf_id"]) if r.get("turf_id") else None,
        "user_id": {
            "_id": str(r["user_id"]) if r.get("user_id") else None,
            "name": r.get("user_name") or "Anonymous",
        },
        "rating": r.get("rating"),
        "comment": r.get("comment"),
        "createdAt": r["created_at"].isoformat() if r.get("created_at") else None,
    }
