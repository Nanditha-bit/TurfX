from fastapi import APIRouter, Depends, HTTPException
from app.database import get_db
from app.schemas import (
    RegisterRequest, LoginRequest, SendOTPRequest,
    VerifyOTPRequest, ForgotPasswordRequest, ResetPasswordRequest,
    UpdateProfileRequest,
)
from app.utils.security import (
    hash_password, verify_password, create_token,
    generate_otp, store_otp, verify_otp, get_current_user,
)
from app.utils.email import send_otp_email
from app.utils.helpers import fmt_user
from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])


# ── Register ──────────────────────────────────────────────────────────────────
@router.post("/register-password")
def register(body: RegisterRequest):
    print("📝 REGISTER REQUEST RECEIVED:")
    print(f"  Name: {body.name}")
    print(f"  Phone: {body.phone}")
    print(f"  Email: {body.email}")
    print(f"  Role requested: {body.role}")
    print(f"  Password length: {len(body.password)}")
    
    if len(body.password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters.")
    if not body.phone.startswith("+"):
        raise HTTPException(400, "Phone must include country code e.g. +91XXXXXXXXXX")

    valid_roles = {"user", "owner"}
    role = body.role if body.role in valid_roles else "user"
    print(f"  Final role to assign: {role}")
    
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM users WHERE phone=%s", (body.phone,))
            if cur.fetchone():
                raise HTTPException(400, "An account with this phone number already exists.")
            if body.email:
                cur.execute("SELECT id FROM users WHERE email=%s", (body.email,))
                if cur.fetchone():
                    raise HTTPException(400, "An account with this email already exists.")

            pw_hash = hash_password(body.password)
            print("  Inserting into users table...")
            cur.execute(
                """INSERT INTO users (name, phone, email, password_hash, role)
                   VALUES (%s,%s,%s,%s,%s) RETURNING *""",
                (body.name.strip(), body.phone, body.email or None, pw_hash, role),
            )
            user = dict(cur.fetchone())
            print(f"  User created successfully! User data: {user}")
            print(f"  User's role from DB: {user['role']}")

    token = create_token({"id": str(user["id"]), "role": user["role"]})
    print(f"  Token created. Returning user: {fmt_user(user)}")
    return {"token": token, "user": fmt_user(user)}


import logging
from fastapi import HTTPException

# ── Test endpoint ────────────────────────────────────────────────────────────
@router.get("/test")
def test_endpoint():
    return {"message": "✅ Backend is reachable!", "status": "success"}

# ── Login ─────────────────────────────────────────────────────────────────────
@router.post("/password-login")
def login(body: LoginRequest):
    logging.info(f"🔐 LOGIN ATTEMPT: Phone={body.phone!r}, Password={body.password!r}")
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT * FROM users WHERE phone=%s AND is_active=TRUE", (body.phone,)
            )
            user = cur.fetchone()
            logging.info(f"📊 Found user: {dict(user) if user else 'None'}")

    if not user:
        raise HTTPException(401, "Invalid phone number or password.")
    if not user["password_hash"]:
        raise HTTPException(401, "This account uses OTP login.")
    
    valid = verify_password(body.password, user["password_hash"])
    logging.info(f"🔑 Password valid? {valid}")
    if not valid:
        raise HTTPException(401, "Invalid phone number or password.")

    token = create_token({"id": str(user["id"]), "role": user["role"]})
    logging.info(f"✅ Login successful! User role: {user['role']}")
    return {"token": token, "user": fmt_user(dict(user))}


# ── Send OTP ──────────────────────────────────────────────────────────────────
@router.post("/send-otp")
def send_otp(body: SendOTPRequest):
    identifier = body.email or body.phone
    if not identifier:
        raise HTTPException(400, "Email or phone is required.")

    otp = generate_otp()

    with get_db() as conn:
        store_otp(conn, identifier, otp, "login")

    if body.email:
        sent = send_otp_email(body.email, otp, "login")
        if not sent and settings.ENVIRONMENT == "development":
            return {"msg": "OTP generated (dev mode)", "otp": otp}
        if not sent:
            raise HTTPException(500, "Failed to send OTP email.")

    if settings.ENVIRONMENT == "development":
        return {"msg": "OTP sent (dev mode)", "otp": otp}
    return {"msg": "OTP sent successfully."}


# ── Verify OTP ────────────────────────────────────────────────────────────────
@router.post("/verify-otp")
def verify_otp_route(body: VerifyOTPRequest):
    identifier = body.email or body.phone
    if not identifier or not body.otp:
        raise HTTPException(400, "Identifier and OTP are required.")

    with get_db() as conn:
        if not verify_otp(conn, identifier, body.otp, "login"):
            raise HTTPException(400, "Invalid or expired OTP.")

        with conn.cursor() as cur:
            if body.email:
                cur.execute("SELECT * FROM users WHERE email=%s", (body.email,))
            else:
                cur.execute("SELECT * FROM users WHERE phone=%s", (body.phone,))
            user = cur.fetchone()

            if not user:
                # Auto-create user
                placeholder_phone = body.phone or body.email
                cur.execute(
                    """INSERT INTO users (name, phone, email, role)
                       VALUES (%s,%s,%s,'user') RETURNING *""",
                    (
                        (body.email or "User").split("@")[0],
                        placeholder_phone,
                        body.email or None,
                    ),
                )
                user = cur.fetchone()

    token = create_token({"id": str(user["id"]), "role": user["role"]})
    return {"token": token, "user": fmt_user(dict(user))}


# ── Forgot Password ───────────────────────────────────────────────────────────
@router.post("/forgot-password")
def forgot_password(body: ForgotPasswordRequest):
    identifier = body.email or body.phone
    if not identifier:
        raise HTTPException(400, "Email or phone is required.")

    otp = generate_otp()

    with get_db() as conn:
        with conn.cursor() as cur:
            if body.email:
                cur.execute("SELECT email FROM users WHERE email=%s", (body.email,))
            else:
                cur.execute("SELECT email FROM users WHERE phone=%s", (body.phone,))
            user = cur.fetchone()

        # Always store OTP (don't reveal if user exists)
        store_otp(conn, identifier, otp, "forgot_password")

    if user and user.get("email"):
        send_otp_email(user["email"], otp, "forgot_password")

    if settings.ENVIRONMENT == "development":
        return {"msg": "OTP generated (dev mode)", "otp": otp}
    return {"msg": "If an account exists, an OTP has been sent."}


# ── Reset Password ────────────────────────────────────────────────────────────
@router.post("/reset-password")
def reset_password(body: ResetPasswordRequest):
    identifier = body.email or body.phone
    if not identifier:
        raise HTTPException(400, "Email or phone is required.")
    if len(body.newPassword) < 6:
        raise HTTPException(400, "Password must be at least 6 characters.")

    with get_db() as conn:
        if not verify_otp(conn, identifier, body.otp, "forgot_password"):
            raise HTTPException(400, "Invalid or expired OTP.")

        pw_hash = hash_password(body.newPassword)
        with conn.cursor() as cur:
            if body.email:
                cur.execute(
                    "UPDATE users SET password_hash=%s WHERE email=%s RETURNING id",
                    (pw_hash, body.email),
                )
            else:
                cur.execute(
                    "UPDATE users SET password_hash=%s WHERE phone=%s RETURNING id",
                    (pw_hash, body.phone),
                )
            if not cur.fetchone():
                raise HTTPException(404, "User not found.")

    return {"msg": "Password reset successfully."}


# ── Update Profile ────────────────────────────────────────────────────────────
@router.post("/update-profile")
def update_profile(body: UpdateProfileRequest, user=Depends(get_current_user)):
    if not body.name.strip():
        raise HTTPException(400, "Name cannot be empty.")

    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE users SET name=%s WHERE id=%s RETURNING *",
                (body.name.strip(), user["id"]),
            )
            updated = cur.fetchone()

    return fmt_user(dict(updated))


# ── Become Partner (upgrade user role to owner) ───────────────────────────────
@router.post("/become-partner")
def become_partner(user=Depends(get_current_user)):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE users SET role='owner', updated_at=NOW() WHERE id=%s RETURNING *",
                (user["id"],),
            )
            updated = cur.fetchone()
    token = create_token({"id": str(updated["id"]), "role": updated["role"]})
    return {"token": token, "user": fmt_user(dict(updated))}


# ── Logout ────────────────────────────────────────────────────────────────────
@router.post("/logout")
def logout(user=Depends(get_current_user)):
    return {"msg": "Logged out successfully."}


# ── Me ──────────────────────────────────────────────────────────────────────
@router.get("/me")
def me(user=Depends(get_current_user)):
    return fmt_user(user)

# ── Upgrade to Partner (owner) ────────────────────────────────────────────────
@router.post("/upgrade-to-partner")
def upgrade_to_partner(user=Depends(get_current_user)):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("UPDATE users SET role='owner' WHERE id=%s RETURNING *", (user["id"],))
            updated_user = cur.fetchone()
            if not updated_user:
                raise HTTPException(404, "User not found!")
    
    return {"token": create_token({"id": str(updated_user["id"]), "role": updated_user["role"]}), "user": fmt_user(updated_user)}
