import psycopg2
import psycopg2.extras
from contextlib import contextmanager
from app.config import settings
import logging
from urllib.parse import urlparse

logger = logging.getLogger(__name__)


def get_connection():
    """Create a new database connection using DATABASE_URL or individual settings."""
    db_url = settings.final_database_url
    if db_url.startswith("postgresql://") or db_url.startswith("postgres://"):
        # Parse the database URL
        parsed = urlparse(db_url)
        return psycopg2.connect(
            host=parsed.hostname,
            port=parsed.port or 5432,
            dbname=parsed.path[1:],
            user=parsed.username,
            password=parsed.password,
            cursor_factory=psycopg2.extras.RealDictCursor,
        )
    else:
        # Fall back to individual settings
        return psycopg2.connect(
            host=settings.DB_HOST,
            port=settings.DB_PORT,
            dbname=settings.DB_NAME,
            user=settings.DB_USER,
            password=settings.DB_PASSWORD,
            cursor_factory=psycopg2.extras.RealDictCursor,
        )


@contextmanager
def get_db():
    """Context manager that yields a database connection and handles commit/rollback."""
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        logger.error(f"Database error: {e}")
        raise
    finally:
        conn.close()


def execute(query: str, params=None, fetch: str = None):
    """Execute a single query with automatic connection management.
    
    fetch: None | 'one' | 'all'
    """
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(query, params or ())
            if fetch == "one":
                return cur.fetchone()
            if fetch == "all":
                return cur.fetchall()
            return None


def run_migrations():
    """Create all tables if they don't exist."""
    sql = """
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE,
        password_hash VARCHAR(255),
        role VARCHAR(20) NOT NULL DEFAULT 'user'
            CHECK (role IN ('user', 'owner', 'admin')),
        is_active BOOLEAN DEFAULT TRUE,
        profile_pic VARCHAR(500),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS otps (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        identifier VARCHAR(255) NOT NULL,
        otp VARCHAR(10) NOT NULL,
        type VARCHAR(20) NOT NULL DEFAULT 'login'
            CHECK (type IN ('login', 'forgot_password', 'register')),
        expires_at TIMESTAMPTZ NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS turfs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        short_description VARCHAR(500),
        location VARCHAR(500),
        city VARCHAR(100),
        state VARCHAR(100),
        pincode VARCHAR(10),
        sport VARCHAR(100) DEFAULT 'Football',
        sports JSONB DEFAULT '[]',
        type VARCHAR(50) DEFAULT 'Outdoor',
        venue_size VARCHAR(100),
        surface_type VARCHAR(100),
        booking_type VARCHAR(50) DEFAULT 'Hourly',
        price_per_hour NUMERIC(10,2) NOT NULL DEFAULT 0,
        pricing_rules JSONB DEFAULT '[]',
        amenities JSONB DEFAULT '[]',
        images JSONB DEFAULT '[]',
        videos JSONB DEFAULT '[]',
        rating NUMERIC(3,2) DEFAULT 4.5,
        review_count INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        status VARCHAR(20) DEFAULT 'active'
            CHECK (status IN ('active', 'pending', 'inactive')),
        lat NUMERIC(10,8),
        lng NUMERIC(11,8),
        outside_food_allowed BOOLEAN DEFAULT FALSE,
        pets_allowed BOOLEAN DEFAULT FALSE,
        changing_rooms BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS bookings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        booking_id VARCHAR(30) UNIQUE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        turf_id UUID REFERENCES turfs(id) ON DELETE SET NULL,
        date DATE NOT NULL,
        time_slots JSONB NOT NULL DEFAULT '[]',
        sport VARCHAR(100),
        total_price NUMERIC(10,2) NOT NULL,
        court_amount NUMERIC(10,2),
        platform_fee NUMERIC(10,2) DEFAULT 20,
        turf_fee NUMERIC(10,2) DEFAULT 5,
        gst NUMERIC(10,2) DEFAULT 5,
        status VARCHAR(30) DEFAULT 'confirmed'
            CHECK (status IN ('pending','confirmed','approved','completed','cancelled','checked-in')),
        razorpay_order_id VARCHAR(255),
        razorpay_payment_id VARCHAR(255),
        razorpay_signature VARCHAR(500),
        payment_id VARCHAR(255),
        cancel_reason TEXT,
        refund_amount NUMERIC(10,2) DEFAULT 0,
        rating INTEGER,
        review TEXT,
        checked_in_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        turf_id UUID REFERENCES turfs(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS slots (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        turf_id UUID REFERENCES turfs(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        time_slot VARCHAR(50) NOT NULL,
        is_booked BOOLEAN DEFAULT FALSE,
        is_locked BOOLEAN DEFAULT FALSE,
        created_by_owner BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS offers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        turf_id UUID REFERENCES turfs(id) ON DELETE CASCADE,
        owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        discount VARCHAR(100),
        description TEXT,
        valid_until TIMESTAMPTZ,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS support_tickets (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        subject VARCHAR(500) NOT NULL,
        description TEXT,
        category VARCHAR(100) DEFAULT 'Other',
        priority VARCHAR(20) DEFAULT 'Medium'
            CHECK (priority IN ('Low','Medium','High','Urgent')),
        status VARCHAR(30) DEFAULT 'Open'
            CHECK (status IN ('Open','In Progress','Resolved','Closed')),
        admin_reply TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS kyc_requests (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
        business_name VARCHAR(255),
        pan_number VARCHAR(20),
        gst_number VARCHAR(30),
        bank_account_number VARCHAR(30),
        ifsc_code VARCHAR(15),
        account_holder_name VARCHAR(255),
        bank_name VARCHAR(255),
        status VARCHAR(20) DEFAULT 'pending'
            CHECK (status IN ('pending','approved','rejected')),
        admin_note TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS wallet_transactions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        type VARCHAR(20) NOT NULL
            CHECK (type IN ('credit','debit','withdrawal','refund')),
        amount NUMERIC(10,2) NOT NULL,
        description TEXT,
        reference_id VARCHAR(255),
        status VARCHAR(20) DEFAULT 'success'
            CHECK (status IN ('pending','success','failed')),
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255),
        message TEXT,
        type VARCHAR(50),
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_turfs_city    ON turfs(city);
    CREATE INDEX IF NOT EXISTS idx_turfs_sport   ON turfs(sport);
    CREATE INDEX IF NOT EXISTS idx_turfs_owner   ON turfs(owner_id);
    CREATE INDEX IF NOT EXISTS idx_turfs_active  ON turfs(is_active);
    CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_turf ON bookings(turf_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
    CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
    CREATE INDEX IF NOT EXISTS idx_reviews_turf  ON reviews(turf_id);
    CREATE INDEX IF NOT EXISTS idx_slots_turf_date ON slots(turf_id, date);
    CREATE INDEX IF NOT EXISTS idx_otps_id       ON otps(identifier);
    CREATE INDEX IF NOT EXISTS idx_support_user  ON support_tickets(user_id);

    -- updated_at trigger function
    CREATE OR REPLACE FUNCTION update_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
    $$ LANGUAGE plpgsql;

    DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_users_upd') THEN
            CREATE TRIGGER trg_users_upd BEFORE UPDATE ON users
            FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_turfs_upd') THEN
            CREATE TRIGGER trg_turfs_upd BEFORE UPDATE ON turfs
            FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_bookings_upd') THEN
            CREATE TRIGGER trg_bookings_upd BEFORE UPDATE ON bookings
            FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_offers_upd') THEN
            CREATE TRIGGER trg_offers_upd BEFORE UPDATE ON offers
            FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_tickets_upd') THEN
            CREATE TRIGGER trg_tickets_upd BEFORE UPDATE ON support_tickets
            FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
        END IF;
    END $$;
    """
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
    logger.info("✅ Database migrations completed.")
