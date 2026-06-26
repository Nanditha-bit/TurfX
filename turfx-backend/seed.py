"""Run once to populate the DB with an admin, a partner, a user and sample turfs.
Usage:  python seed.py
"""
import json
import sys
from app.database import get_db, run_migrations
from app.utils.security import hash_password
from app.config import settings


SAMPLE_TURFS = [
    {
        "name": "Green Arena Football Ground",
        "location": "Koramangala 5th Block",
        "city": "Bengaluru", "state": "Karnataka",
        "sport": "Football", "price": 1200.0,
        "amenities": ["Floodlights", "Changing Rooms", "Parking", "Drinking Water"],
        "description": "Premium football turf with FIFA-grade artificial grass",
        "rating": 4.8,
    },
    {
        "name": "Cricket Hub Stadium",
        "location": "Indiranagar",
        "city": "Bengaluru", "state": "Karnataka",
        "sport": "Cricket", "price": 1500.0,
        "amenities": ["Floodlights", "Parking", "Seating Area", "Washrooms"],
        "description": "Professional cricket ground with full-length pitch",
        "rating": 4.6,
    },
    {
        "name": "Smash Badminton Court",
        "location": "HSR Layout",
        "city": "Bengaluru", "state": "Karnataka",
        "sport": "Badminton", "price": 800.0,
        "amenities": ["AC Pavilion", "Changing Rooms", "Wifi", "Cafeteria"],
        "description": "Air-conditioned badminton courts with wooden flooring",
        "rating": 4.9,
    },
    {
        "name": "Ace Tennis Arena",
        "location": "Whitefield",
        "city": "Bengaluru", "state": "Karnataka",
        "sport": "Tennis", "price": 1000.0,
        "amenities": ["Floodlights", "Parking", "Changing Rooms", "First Aid"],
        "description": "Professional tennis courts with synthetic surface",
        "rating": 4.5,
    },
    {
        "name": "Champions Football Ground",
        "location": "Andheri West",
        "city": "Mumbai", "state": "Maharashtra",
        "sport": "Football", "price": 1400.0,
        "amenities": ["Floodlights", "Parking", "Changing Rooms", "Cafeteria"],
        "description": "FIFA-certified artificial turf in the heart of Mumbai",
        "rating": 4.7,
    },
    {
        "name": "Delhi Sports Hub",
        "location": "Saket",
        "city": "Delhi", "state": "Delhi",
        "sport": "Football", "price": 1100.0,
        "amenities": ["Floodlights", "Parking", "Seating Area"],
        "description": "Multi-sport venue with premium facilities",
        "rating": 4.4,
    },
    {
        "name": "Hyderabad Cricket Ground",
        "location": "Banjara Hills",
        "city": "Hyderabad", "state": "Telangana",
        "sport": "Cricket", "price": 1300.0,
        "amenities": ["Floodlights", "Changing Rooms", "Parking", "First Aid"],
        "description": "Professional cricket turf with quality pitch preparation",
        "rating": 4.6,
    },
    {
        "name": "Chennai Badminton Arena",
        "location": "Anna Nagar",
        "city": "Chennai", "state": "Tamil Nadu",
        "sport": "Badminton", "price": 750.0,
        "amenities": ["AC Pavilion", "Wifi", "Changing Rooms"],
        "description": "Premium indoor badminton facility with international-standard courts",
        "rating": 4.7,
    },
]


def seed():
    print("Running migrations ...")
    try:
        run_migrations()
    except Exception as e:
        print(f"  Migration note: {e}")

    print("Seeding users & turfs ...")

    with get_db() as conn:
        with conn.cursor() as cur:

            # ── Admin ──────────────────────────────────────────────────────
            admin_hash = hash_password(settings.ADMIN_PASSWORD)
            cur.execute(
                """INSERT INTO users (name, phone, email, password_hash, role)
                   VALUES (%s,%s,%s,%s,'admin')
                   ON CONFLICT (phone) DO UPDATE SET name=EXCLUDED.name
                   RETURNING id""",
                ("TurfX Admin", settings.ADMIN_PHONE, "admin@turfx.in", admin_hash),
            )
            print(f"  Admin  : {settings.ADMIN_PHONE} / {settings.ADMIN_PASSWORD}")

            # ── Partner ────────────────────────────────────────────────────
            partner_hash = hash_password("Partner@123")
            cur.execute(
                """INSERT INTO users (name, phone, email, password_hash, role)
                   VALUES (%s,%s,%s,%s,'owner')
                   ON CONFLICT (phone) DO UPDATE SET name=EXCLUDED.name
                   RETURNING id""",
                ("Test Partner", "+919876543210", "partner@turfx.in", partner_hash),
            )
            partner_id = cur.fetchone()["id"]
            print("  Partner: +919876543210 / Partner@123")

            # ── Regular user ───────────────────────────────────────────────
            user_hash = hash_password("User@123")
            cur.execute(
                """INSERT INTO users (name, phone, email, password_hash, role)
                   VALUES (%s,%s,%s,%s,'user')
                   ON CONFLICT (phone) DO NOTHING""",
                ("Test User", "+917654321098", "user@turfx.in", user_hash),
            )
            print("  User   : +917654321098 / User@123")

            # ── Sample turfs ───────────────────────────────────────────────
            for t in SAMPLE_TURFS:
                cur.execute(
                    """INSERT INTO turfs
                       (owner_id,name,location,city,state,sport,
                        price_per_hour,amenities,description,rating,
                        review_count,is_active,status,images,sports)
                       VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                       ON CONFLICT DO NOTHING""",
                    (
                        partner_id,
                        t["name"], t["location"], t["city"], t["state"],
                        t["sport"], t["price"],
                        json.dumps(t["amenities"]),
                        t["description"], t["rating"],
                        20,
                        True,  # is_active
                        "active",  # status
                        json.dumps([]),  # images
                        json.dumps([t["sport"]]),  # sports
                    ),
                )
            print(f"  {len(SAMPLE_TURFS)} sample turfs inserted (skipped if already exist)")

    print()
    print("Seed complete.")
    print()
    print("Credentials:")
    print(f"Admin  : phone={settings.ADMIN_PHONE}   password={settings.ADMIN_PASSWORD}")
    print("Partner : phone=+919876543210  password=Partner@123")
    print("User   : phone=+917654321098  password=User@123")


if __name__ == "__main__":
    seed()
