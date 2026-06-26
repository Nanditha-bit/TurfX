from fastapi import APIRouter, Depends, HTTPException
from app.database import get_db
from app.schemas import CreateTicketRequest
from app.utils.security import get_current_user

router = APIRouter(prefix="/support", tags=["support"])


def _fmt(t: dict) -> dict:
    return {
        "_id": str(t["id"]), "id": str(t["id"]),
        "subject": t["subject"], "description": t["description"],
        "category": t["category"], "priority": t["priority"],
        "status": t["status"], "admin_reply": t.get("admin_reply"),
        "createdAt": t["created_at"].isoformat() if t.get("created_at") else None,
    }


@router.get("/tickets")
def my_tickets(user=Depends(get_current_user)):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT * FROM support_tickets WHERE user_id=%s ORDER BY created_at DESC",
                (user["id"],),
            )
            rows = cur.fetchall()
    return [_fmt(dict(r)) for r in rows]


@router.post("/tickets")
def create_ticket(body: CreateTicketRequest, user=Depends(get_current_user)):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO support_tickets (user_id,subject,description,category,priority)
                   VALUES (%s,%s,%s,%s,%s) RETURNING *""",
                (user["id"], body.subject, body.description or "",
                 body.category, body.priority),
            )
            t = dict(cur.fetchone())
    return _fmt(t)


@router.get("/tickets/{ticket_id}")
def get_ticket(ticket_id: str, user=Depends(get_current_user)):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT * FROM support_tickets WHERE id=%s AND user_id=%s",
                (ticket_id, user["id"]),
            )
            t = cur.fetchone()
    if not t:
        raise HTTPException(404, "Ticket not found.")
    return _fmt(dict(t))
