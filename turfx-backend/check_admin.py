import sys
from app.database import get_db
from app.config import settings
from app.utils.security import hash_password, verify_password

with get_db() as conn:
    with conn.cursor() as cur:
        print(f"Checking for admin with phone: {settings.ADMIN_PHONE}")
        cur.execute("SELECT * FROM users WHERE phone = %s", (settings.ADMIN_PHONE,))
        user = cur.fetchone()
        if user:
            print(f"Found user: {dict(user)}")
            print(f"Password hash exists: {bool(user['password_hash'])}")
            # Test password
            test_pw = input("Enter password to verify (admin@123): ")
            print(f"Password correct: {verify_password(test_pw, user['password_hash'])}")
        else:
            print("Admin user NOT FOUND!")
            print("Let's insert it now!")
            admin_hash = hash_password(settings.ADMIN_PASSWORD)
            cur.execute(
                """INSERT INTO users (name, phone, email, password_hash, role)
                   VALUES (%s,%s,%s,%s,'admin')
                   RETURNING *""",
                ("TurfX Admin", settings.ADMIN_PHONE, "admin@turfx.in", admin_hash),
            )
            conn.commit()
            new_user = cur.fetchone()
            print(f"Inserted admin: {dict(new_user)}")
