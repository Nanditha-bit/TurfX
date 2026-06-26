from fastapi import APIRouter, Depends, HTTPException
from app.database import get_db
from app.schemas import CreateOfferRequest, UpdateOfferRequest
from app.utils.security import get_current_user, require_roles

router = APIRouter(prefix="/offers", tags=["offers"])
OWNER_OR_ADMIN = require_roles("owner", "admin")


def _fmt_offer(o: dict) -> dict:
    return {
        "_id": str(o["id"]),
        "id": str(o["id"]),
        "turf_id": {"_id": str(o.get("turf_id")), "name": o.get("turf_ref_name"), "city": o.get("turf_city")},
        "title": o.get("title"),
        "discount": o.get("discount"),
        "description": o.get("description"),
        "valid_until": o["valid_until"].isoformat() if o.get("valid_until") else None,
        "is_active": o.get("is_active"),
        "createdAt": o["created_at"].isoformat() if o.get("created_at") else None,
    }


@router.get("")
def list_offers():
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT o.*, t.name AS turf_ref_name, t.city AS turf_city
                   FROM offers o
                   LEFT JOIN turfs t ON o.turf_id=t.id
                   WHERE o.is_active=TRUE AND (o.valid_until IS NULL OR o.valid_until>NOW())
                   ORDER BY o.created_at DESC LIMIT 20"""
            )
            rows = cur.fetchall()
    return [_fmt_offer(dict(r)) for r in rows]


@router.post("")
def create_offer(body: CreateOfferRequest, user=Depends(OWNER_OR_ADMIN)):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO offers (owner_id,turf_id,title,discount,description,valid_until)
                   VALUES (%s,%s,%s,%s,%s,%s) RETURNING *""",
                (
                    user["id"], body.turf_id, body.title,
                    body.discount or "", body.description or "",
                    body.valid_until or None,
                ),
            )
            o = dict(cur.fetchone())
    return {"_id": str(o["id"]), **o}


@router.put("/{offer_id}")
def update_offer(offer_id: str, body: UpdateOfferRequest, user=Depends(OWNER_OR_ADMIN)):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """UPDATE offers SET
                   title=COALESCE(%s,title),
                   discount=COALESCE(%s,discount),
                   description=COALESCE(%s,description),
                   valid_until=COALESCE(%s,valid_until),
                   turf_id=COALESCE(%s,turf_id),
                   updated_at=NOW()
                   WHERE id=%s AND owner_id=%s RETURNING *""",
                (
                    body.title, body.discount, body.description,
                    body.valid_until, body.turf_id,
                    offer_id, user["id"],
                ),
            )
            o = cur.fetchone()
            if not o:
                raise HTTPException(404, "Offer not found.")
    return {"_id": str(o["id"]), **dict(o)}


@router.delete("/{offer_id}")
def delete_offer(offer_id: str, user=Depends(OWNER_OR_ADMIN)):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM offers WHERE id=%s AND owner_id=%s RETURNING id",
                (offer_id, user["id"]),
            )
            if not cur.fetchone():
                # Admin can delete any
                if user["role"] == "admin":
                    cur.execute("DELETE FROM offers WHERE id=%s", (offer_id,))
                else:
                    raise HTTPException(404, "Offer not found.")
    return {"msg": "Offer deleted."}
