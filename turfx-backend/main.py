"""Entry point — run with:  uvicorn main:app --reload --port 5000"""
from app.main import app  # re-export

if __name__ == "__main__":
    import uvicorn
    from app.config import settings
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=(settings.ENVIRONMENT == "development"),
        log_level="info",
    )
