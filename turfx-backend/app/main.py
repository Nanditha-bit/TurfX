import logging
import os
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.exceptions import HTTPException, RequestValidationError

from app.config import settings
from app.database import run_migrations, get_db
from app.routers import (
    auth, turfs, bookings, reviews,
    owner, admin, slots, offers,
    support, kyc, wallet, exports, upload,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="TurfX API",
    description="Production-ready backend for TurfX sports booking platform",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# ── HTTPException → always return {"msg": "..."} so frontend can read it ──────
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"msg": exc.detail},
    )

# ── Pydantic validation errors → readable message ─────────────────────────────
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    # Build a human-readable message from the first validation error
    first = errors[0] if errors else {}
    field = " → ".join(str(x) for x in first.get("loc", []) if x != "body")
    msg = first.get("msg", "Validation error")
    detail = f"{field}: {msg}" if field else msg
    return JSONResponse(
        status_code=422,
        content={"msg": detail, "errors": errors},
    )

# ── CORS ──────────────────────────────────────────────────────────────────────
origins = [
    settings.FRONTEND_URL,
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Extra safety: ensure CORS header survives even on unhandled 500s ──────────
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request as StarletteRequest
from starlette.responses import Response as StarletteResponse

class ForceCORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: StarletteRequest, call_next):
        origin = request.headers.get("origin", "")
        response: StarletteResponse = await call_next(request)
        if any(origin.startswith(o) for o in origins):
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "*"
            response.headers["Access-Control-Allow-Headers"] = "*"
        return response

app.add_middleware(ForceCORSMiddleware)

# ── Uploads static folder ─────────────────────────────────────────────────────
uploads_dir = Path(settings.UPLOAD_DIR)
uploads_dir.mkdir(parents=True, exist_ok=True)
(uploads_dir / "images").mkdir(exist_ok=True)
(uploads_dir / "videos").mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

# ── Startup: run migrations and create admin ───────────────────────────────────
@app.on_event("startup")
def startup():
    logger.info("🚀 TurfX API starting up …")
    try:
        run_migrations()
    except Exception as e:
        logger.error(f"Migration error (non-fatal): {e}")
    
    # Create or update admin user
    try:
        from app.utils.security import hash_password
        from app.config import settings
        
        with get_db() as conn:
            with conn.cursor() as cur:
                # Check if admin exists
                cur.execute("SELECT * FROM users WHERE phone = %s", (settings.ADMIN_PHONE,))
                admin = cur.fetchone()
                
                admin_hash = hash_password(settings.ADMIN_PASSWORD)
                
                if admin:
                    # Update existing admin
                    cur.execute(
                        """UPDATE users 
                           SET password_hash = %s, role = 'admin', name = 'TurfX Admin' 
                           WHERE phone = %s 
                           RETURNING *""",
                        (admin_hash, settings.ADMIN_PHONE)
                    )
                    logger.info("✅ Admin user updated.")
                else:
                    # Create new admin
                    cur.execute(
                        """INSERT INTO users (name, phone, email, password_hash, role)
                           VALUES (%s, %s, %s, %s, 'admin')
                           RETURNING *""",
                        ("TurfX Admin", settings.ADMIN_PHONE, "admin@turfx.in", admin_hash)
                    )
                    logger.info("✅ Admin user created.")
    except Exception as e:
        logger.error(f"Admin creation error (non-fatal): {e}")
        
    logger.info(f"🌍 Environment : {settings.ENVIRONMENT}")
    logger.info(f"🔗 Docs        : http://localhost:{settings.PORT}/api/docs")


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["health"])
def health():
    return {"status": "ok", "service": "TurfX API", "version": "1.0.0"}


@app.get("/api/health", tags=["health"])
def api_health():
    return {"status": "ok", "service": "TurfX API", "version": "1.0.0"}


# ── Global exception handler ──────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.method} {request.url}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"msg": "Internal server error"},
    )


# ── Register all routers under /api ──────────────────────────────────────────
prefix = "/api"
app.include_router(auth.router,     prefix=prefix)
app.include_router(turfs.router,    prefix=prefix)
app.include_router(bookings.router, prefix=prefix)
app.include_router(reviews.router,  prefix=prefix)
app.include_router(owner.router,    prefix=prefix)
app.include_router(admin.router,    prefix=prefix)
app.include_router(slots.router,    prefix=prefix)
app.include_router(offers.router,   prefix=prefix)
app.include_router(support.router,  prefix=prefix)
app.include_router(kyc.router,      prefix=prefix)
app.include_router(wallet.router,   prefix=prefix)
app.include_router(exports.router,  prefix=prefix)
app.include_router(upload.router,   prefix=prefix)
