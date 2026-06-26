from fastapi import APIRouter, Depends, HTTPException
from app.database import get_db
from app.schemas import KYCRequest, KYCReviewRequest
from app.utils.security import require_roles

router = APIRouter(prefix="/kyc", tags=["kyc"])
ADMIN = require_roles("admin")
OWNER = require_roles("owner")


@router.get("/admin/all")
def all_kyc(user=Depends(ADMIN)):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT k.*, u.name AS owner_name, u.phone AS owner_phone, u.email AS owner_email
                   FROM kyc_requests k JOIN users u ON k.owner_id=u.id
                   ORDER BY k.created_at DESC"""
            )
            rows = cur.fetchall()
    return [
        {
            "_id": str(r["id"]), "id": str(r["id"]),
            "owner_id": {
                "_id": str(r["owner_id"]),
                "name": r["owner_name"], "phone": r["owner_phone"], "email": r["owner_email"],
            },
            "business_name": r["business_name"], "pan_number": r["pan_number"],
            "gst_number": r["gst_number"], "bank_account_number": r["bank_account_number"],
            "ifsc_code": r["ifsc_code"], "account_holder_name": r["account_holder_name"],
            "bank_name": r["bank_name"], "status": r["status"], "admin_note": r["admin_note"],
            "createdAt": r["created_at"].isoformat() if r.get("created_at") else None,
        }
        for r in rows
    ]


@router.post("")
def submit_kyc(body: KYCRequest, user=Depends(OWNER)):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id FROM kyc_requests WHERE owner_id=%s AND status='pending'",
                (user["id"],),
            )
            if cur.fetchone():
                raise HTTPException(400, "A KYC request is already pending.")
            cur.execute(
                """INSERT INTO kyc_requests
                   (owner_id,business_name,pan_number,gst_number,bank_account_number,
                    ifsc_code,account_holder_name,bank_name)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id""",
                (
                    user["id"], body.business_name, body.pan_number, body.gst_number,
                    body.bank_account_number, body.ifsc_code,
                    body.account_holder_name, body.bank_name,
                ),
            )
    return {"msg": "KYC submitted for review."}


@router.patch("/{kyc_id}")
def review_kyc(kyc_id: str, body: KYCReviewRequest, user=Depends(ADMIN)):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE kyc_requests SET status=%s,admin_note=%s,updated_at=NOW() WHERE id=%s RETURNING id",
                (body.status, body.admin_note, kyc_id),
            )
            if not cur.fetchone():
                raise HTTPException(404, "KYC request not found.")
    return {"msg": f"KYC {body.status}."}


# Alias: frontend calls PUT /kyc/admin/review/:id
@router.put("/admin/review/{kyc_id}")
def review_kyc_put(kyc_id: str, body: KYCReviewRequest, user=Depends(ADMIN)):
    return review_kyc(kyc_id, body, user)
