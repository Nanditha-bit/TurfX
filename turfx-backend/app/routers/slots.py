from fastapi import APIRouter, Depends, HTTPException
from app.database import get_db
from app.schemas import CreateSlotRequest, UpdateSlotRequest
from app.utils.security import require_roles

router = APIRouter(prefix="/slots", tags=["slots"])
OWNER_OR_ADMIN = require_roles("owner", "admin")


@router.post("")
def create_slot(body: CreateSlotRequest, user=Depends(OWNER_OR_ADMIN)):
    with get_db() as conn:
        with conn.cursor() as cur:
            # Verify ownership
            cur.execute("SELECT id FROM turfs WHERE id=%s AND owner_id=%s", (body.turf_id, user["id"]))
            if not cur.fetchone() and user["role"] != "admin":
                raise HTTPException(403, "Not authorized for this venue.")

            cur.execute(
                "SELECT id FROM slots WHERE turf_id=%s AND date=%s AND time_slot=%s",
                (body.turf_id, body.date, body.time_slot),
            )
            if cur.fetchone():
                raise HTTPException(409, "Slot already exists for this date and time.")

            cur.execute(
                "INSERT INTO slots (turf_id,date,time_slot,created_by_owner) VALUES (%s,%s,%s,TRUE) RETURNING *",
                (body.turf_id, body.date, body.time_slot),
            )
            s = dict(cur.fetchone())
    return {"_id": str(s["id"]), **s}


@router.put("/{slot_id}")
def update_slot(slot_id: str, body: UpdateSlotRequest, user=Depends(OWNER_OR_ADMIN)):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """UPDATE slots SET
                   date=COALESCE(%s,date), time_slot=COALESCE(%s,time_slot)
                   WHERE id=%s AND created_by_owner=TRUE AND is_booked=FALSE
                   RETURNING *""",
                (body.date, body.time_slot, slot_id),
            )
            s = cur.fetchone()
            if not s:
                raise HTTPException(404, "Slot not found, booked, or not editable.")
    return {"_id": str(s["id"]), **dict(s)}


@router.delete("/{slot_id}")
def delete_slot(slot_id: str, user=Depends(OWNER_OR_ADMIN)):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM slots WHERE id=%s AND created_by_owner=TRUE AND is_booked=FALSE RETURNING id",
                (slot_id,),
            )
            if not cur.fetchone():
                raise HTTPException(404, "Slot not found, booked, or cannot be deleted.")
    return {"msg": "Slot deleted."}
