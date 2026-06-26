from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from app.database import get_db
from app.schemas import WalletAddRequest, WalletWithdrawRequest
from app.utils.security import get_current_user
from app.config import settings

router = APIRouter(prefix="/wallet", tags=["wallet"])

_razorpay = None
if not settings.is_demo_razorpay:
    try:
        import razorpay as _rzp
        _razorpay = _rzp.Client(
            auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
        )
    except Exception:
        pass


@router.post("/add/create-order")
def create_wallet_order(body: WalletAddRequest, user=Depends(get_current_user)):
    if body.amount < 100:
        raise HTTPException(400, "Minimum amount is ₹100.")

    if not _razorpay:
        return {
            "orderId": f"demo_order_{int(datetime.now(timezone.utc).timestamp())}",
            "amount": int(body.amount * 100),
            "currency": "INR",
            "key": settings.RAZORPAY_KEY_ID,
            "demo": True,
        }

    order = _razorpay.order.create({"amount": int(body.amount * 100), "currency": "INR"})
    return {
        "orderId": order["id"],
        "amount": order["amount"],
        "currency": order["currency"],
        "key": settings.RAZORPAY_KEY_ID,
    }


@router.post("/add/verify")
def verify_wallet_payment(body: WalletAddRequest, user=Depends(get_current_user)):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO wallet_transactions (user_id,type,amount,description,status) VALUES (%s,'credit',%s,'Wallet top-up','success')",
                (user["id"], body.amount),
            )
    return {"msg": "Wallet updated successfully."}


@router.post("/withdraw")
def withdraw(body: WalletWithdrawRequest, user=Depends(get_current_user)):
    if body.amount < 500:
        raise HTTPException(400, "Minimum withdrawal is ₹500.")

    masked = body.bankAccount.accountNumber[-4:].rjust(len(body.bankAccount.accountNumber), "*")
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO wallet_transactions (user_id,type,amount,description,status) VALUES (%s,'withdrawal',%s,%s,'pending')",
                (user["id"], body.amount, f"Withdrawal to account {masked}"),
            )
    return {"msg": "Withdrawal request submitted. Processing within 3 business days."}
