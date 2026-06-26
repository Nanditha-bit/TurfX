from app.database import get_db
from app.config import settings
from app.utils.security import hash_password

with get_db() as conn:
    with conn.cursor() as cur:
        print("Updating admin user...")
        new_hash = hash_password(settings.ADMIN_PASSWORD)
        cur.execute(
            """UPDATE users
               SET password_hash = %s, role = 'admin', name = 'TurfX Admin'
               WHERE phone = %s
               RETURNING *""",
            (new_hash, settings.ADMIN_PHONE),
        )
        updated = cur.fetchone()
        conn.commit()
        print(f"Updated user: {dict(updated)}")
        print("Admin credentials are now:")
        print(f"Phone: {settings.ADMIN_PHONE}")
        print(f"Password: {settings.ADMIN_PASSWORD}")
