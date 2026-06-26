import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from app.database import get_db
from app.schemas import CreateTurfRequest, UpdateTurfRequest
from app.utils.security import get_current_user, require_roles
from app.utils.helpers import fmt_turf

router = APIRouter(prefix="/turfs", tags=["turfs"])

OWNER_OR_ADMIN = require_roles("owner", "admin")


def _turf_query_base() -> str:
    return """
        SELECT t.*,
            u.name  AS owner_name,
            u.phone AS owner_phone,
            u.email AS owner_email,
            COALESCE(rv.avg_rating, t.rating) AS rating,
            COALESCE(rv.cnt, 0)               AS review_count
        FROM turfs t
        LEFT JOIN users u ON t.owner_id = u.id
        LEFT JOIN LATERAL (
            SELECT ROUND(AVG(r.rating)::numeric, 1) AS avg_rating,
                   COUNT(*)::int                     AS cnt
            FROM reviews r
            WHERE r.turf_id = t.id
        ) rv ON TRUE
    """


# ── GET /api/turfs ────────────────────────────────────────────────────────────
@router.get("")
def list_turfs(
    city: Optional[str] = None,
    sport: Optional[str] = None,
    search: Optional[str] = None,
    minPrice: Optional[float] = None,
    maxPrice: Optional[float] = None,
    limit: int = Query(100, le=500),
):
    base = _turf_query_base() + " WHERE t.is_active=TRUE AND t.status='active'"
    params = []

    if city and city.lower() not in ("", "all cities"):
        base += " AND LOWER(t.city) LIKE %s"
        params.append(f"%{city.lower()}%")
    if sport and sport.lower() != "all":
        base += " AND LOWER(t.sport)=%s"
        params.append(sport.lower())
    if search:
        base += " AND (LOWER(t.name) LIKE %s OR LOWER(t.location) LIKE %s OR LOWER(t.city) LIKE %s)"
        s = f"%{search.lower()}%"
        params.extend([s, s, s])
    if maxPrice is not None:
        base += " AND t.price_per_hour<=%s"
        params.append(maxPrice)
    if minPrice is not None:
        base += " AND t.price_per_hour>=%s"
        params.append(minPrice)

    base += " ORDER BY t.rating DESC LIMIT %s"
    params.append(limit)

    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(base, params)
            rows = cur.fetchall()
    return [fmt_turf(dict(r)) for r in rows]


# ── GET /api/turfs/nearby ─────────────────────────────────────────────────────
@router.get("/nearby")
def nearby_turfs(
    lat: float = Query(...),
    lng: float = Query(...),
    radius: float = Query(10000),
):
    sql = """
        SELECT t.*,
            u.name AS owner_name, u.phone AS owner_phone, u.email AS owner_email,
            (6371000 * acos(
              cos(radians(%s)) * cos(radians(t.lat)) * cos(radians(t.lng)-radians(%s))
              + sin(radians(%s)) * sin(radians(t.lat))
            )) AS distance
        FROM turfs t
        LEFT JOIN users u ON t.owner_id=u.id
        WHERE t.is_active=TRUE AND t.status='active'
          AND t.lat IS NOT NULL AND t.lng IS NOT NULL
          AND (6371000 * acos(
              cos(radians(%s)) * cos(radians(t.lat)) * cos(radians(t.lng)-radians(%s))
              + sin(radians(%s)) * sin(radians(t.lat))
          )) <= %s
        ORDER BY distance ASC LIMIT 20
    """
    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (lat, lng, lat, lat, lng, lat, radius))
                rows = cur.fetchall()
        return [fmt_turf(dict(r)) for r in rows]
    except Exception:
        # Fall back to all turfs if geo query fails
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    _turf_query_base()
                    + " WHERE t.is_active=TRUE AND t.status='active' ORDER BY t.rating DESC LIMIT 20"
                )
                rows = cur.fetchall()
        return [fmt_turf(dict(r)) for r in rows]


# ── GET /api/turfs/:id ────────────────────────────────────────────────────────
@router.get("/{turf_id}")
def get_turf(turf_id: str):
    sql = _turf_query_base() + " WHERE t.id = %s"
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (turf_id,))
            row = cur.fetchone()
    if not row:
        raise HTTPException(404, "Venue not found.")
    return fmt_turf(dict(row))


# ── POST /api/turfs ───────────────────────────────────────────────────────────
@router.post("")
def create_turf(body: CreateTurfRequest, user=Depends(OWNER_OR_ADMIN)):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO turfs
                   (owner_id,name,location,city,state,pincode,price_per_hour,
                    sport,sports,type,venue_size,surface_type,booking_type,
                    description,short_description,amenities,images,videos,
                    lat,lng,is_active,status)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,TRUE,'active')
                   RETURNING *""",
                (
                    user["id"], body.name.strip(), body.location, body.city,
                    body.state, body.pincode, body.price_per_hour,
                    body.sport or "Football",
                    json.dumps(body.sports or [body.sport or "Football"]),
                    body.type, body.venueSize, body.surfaceType,
                    body.bookingType, body.description, body.shortDescription,
                    json.dumps(body.amenities or []),
                    json.dumps(body.images or []),
                    json.dumps(body.videos or []),
                    body.lat, body.lng,
                ),
            )
            turf = cur.fetchone()
    return fmt_turf(dict(turf))


# ── PUT /api/turfs/:id ────────────────────────────────────────────────────────
@router.put("/{turf_id}")
def update_turf(turf_id: str, body: UpdateTurfRequest, user=Depends(OWNER_OR_ADMIN)):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM turfs WHERE id=%s", (turf_id,))
            existing = cur.fetchone()
            if not existing:
                raise HTTPException(404, "Venue not found.")
            if user["role"] != "admin" and str(existing["owner_id"]) != str(user["id"]):
                raise HTTPException(403, "Not authorized to edit this venue.")

            fields = []
            params = []

            mapping = {
                "name": body.name,
                "location": body.location,
                "city": body.city,
                "state": body.state,
                "pincode": body.pincode,
                "price_per_hour": body.price_per_hour,
                "sport": body.sport,
                "type": body.type,
                "venue_size": body.venueSize,
                "surface_type": body.surfaceType,
                "booking_type": body.bookingType,
                "description": body.description,
                "short_description": body.shortDescription,
                "lat": body.lat,
                "lng": body.lng,
            }
            for col, val in mapping.items():
                if val is not None:
                    fields.append(f"{col}=%s")
                    params.append(val)

            json_fields = {
                "sports": body.sports,
                "amenities": body.amenities,
                "images": body.images,
                "videos": body.videos,
                "pricing_rules": body.pricingRules,
            }
            for col, val in json_fields.items():
                if val is not None:
                    fields.append(f"{col}=%s")
                    params.append(json.dumps(val))

            if not fields:
                return fmt_turf(dict(existing))

            params.append(turf_id)
            cur.execute(
                f"UPDATE turfs SET {', '.join(fields)},updated_at=NOW() WHERE id=%s RETURNING *",
                params,
            )
            updated = cur.fetchone()
    return fmt_turf(dict(updated))


# ── PATCH /api/turfs/:id/status ───────────────────────────────────────────────
@router.patch("/{turf_id}/status")
def toggle_turf_status(turf_id: str, user=Depends(OWNER_OR_ADMIN)):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM turfs WHERE id=%s", (turf_id,))
            existing = cur.fetchone()
            if not existing:
                raise HTTPException(404, "Venue not found.")
            if user["role"] != "admin" and str(existing["owner_id"]) != str(user["id"]):
                raise HTTPException(403, "Not authorized.")
            cur.execute(
                "UPDATE turfs SET is_active=NOT is_active,updated_at=NOW() WHERE id=%s RETURNING *",
                (turf_id,),
            )
            updated = cur.fetchone()
    return fmt_turf(dict(updated))


# ── DELETE /api/turfs/:id ─────────────────────────────────────────────────────
@router.delete("/{turf_id}")
def delete_turf(turf_id: str, user=Depends(OWNER_OR_ADMIN)):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT owner_id FROM turfs WHERE id=%s", (turf_id,))
            existing = cur.fetchone()
            if not existing:
                raise HTTPException(404, "Venue not found.")
            if user["role"] != "admin" and str(existing["owner_id"]) != str(user["id"]):
                raise HTTPException(403, "Not authorized.")
            cur.execute("DELETE FROM turfs WHERE id=%s", (turf_id,))
    return {"msg": "Venue deleted successfully."}
