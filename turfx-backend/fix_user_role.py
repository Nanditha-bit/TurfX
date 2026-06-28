
"""
Script to update a user's role in the database.
Run this from the turfx-backend directory: python fix_user_role.py
"""
import sys
from app.database import get_db
from app.config import settings

# User ID we want to update - from the login response
USER_ID = "6a38cd30a04c3eecfa501e7f"
NEW_ROLE = "admin"

print("Connecting to database...")
with get_db() as conn:
    with conn.cursor() as cur:
        # First, check current user
        cur.execute("SELECT * FROM users WHERE id = %s", (USER_ID,))
        user = cur.fetchone()
        if not user:
            print(f"User with id {USER_ID} not found!")
            sys.exit(1)
        
        print(f"Current user: {dict(user)}")
        print(f"Current role: {user['role']}")
        
        # Update the role
        cur.execute(
            "UPDATE users SET role = %s WHERE id = %s RETURNING *",
            (NEW_ROLE, USER_ID)
        )
        updated_user = cur.fetchone()
        
        print(f"Updated user: {dict(updated_user)}")
        print(f"Role updated to: {updated_user['role']}")
        
        print("\n✅ Role updated successfully!")

