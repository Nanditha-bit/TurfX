
import sys
import os

# Add the current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import get_db

def main():
    # --------------------------
    # UPDATE THESE VALUES!
    # --------------------------
    USER_PHONE = "+919999999999"  # Replace with YOUR phone number!
    NEW_ROLE = "owner"            # Set to "owner" for partner, "user" for regular user
    # --------------------------

    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                # First find the user
                cur.execute("SELECT id, name, phone, role FROM users WHERE phone = %s", (USER_PHONE,))
                user = cur.fetchone()
                
                if not user:
                    print(f"❌ User with phone {USER_PHONE} not found!")
                    return
                
                print(f"\n✅ Found user:")
                print(f"   ID: {user['id']}")
                print(f"   Name: {user['name']}")
                print(f"   Phone: {user['phone']}")
                print(f"   Current role: {user['role']}")
                
                # Update the role
                cur.execute(
                    "UPDATE users SET role = %s WHERE id = %s",
                    (NEW_ROLE, user['id'])
                )
                conn.commit()
                
                print(f"\n🎉 SUCCESS! Role updated to '{NEW_ROLE}'!")
                print("\n📱 Now you can:")
                print("   1. Log out and log back in to your mobile app")
                print("   2. Or tap '🔄 Refresh Role' on your Profile screen!")
                
    except Exception as e:
        print(f"\n❌ Error: {e}")

if __name__ == "__main__":
    main()
