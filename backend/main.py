import sqlite3

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.routes import auth, billing, changelog, projects, webhooks

# Create tables and add any missing columns (simple migration for SQLite)
Base.metadata.create_all(bind=engine)


def _migrate_db():
    """Add columns introduced after initial schema without dropping data."""
    if "sqlite" not in settings.database_url:
        return
    db_path = settings.database_url.replace("sqlite:///", "").replace("./", "")
    try:
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        existing = {row[1] for row in cur.execute("PRAGMA table_info(users)")}
        new_cols = {
            "stripe_customer_id": "TEXT",
            "subscription_status": "TEXT DEFAULT 'trial'",
            "trial_ends_at": "TEXT",
        }
        for col, typedef in new_cols.items():
            if col not in existing:
                cur.execute(f"ALTER TABLE users ADD COLUMN {col} {typedef}")
        conn.commit()
        conn.close()
    except Exception:
        pass


_migrate_db()

app = FastAPI(title="Shiplog API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(webhooks.router)
app.include_router(projects.router)
app.include_router(changelog.router)
app.include_router(billing.router)


@app.get("/health")
def health():
    return {"status": "ok"}


def _migrate_db():
    """Add columns introduced after initial schema without dropping data."""
    if "sqlite" not in settings.database_url:
        return
    db_path = settings.database_url.replace("sqlite:///", "").replace("./", "")
    try:
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        existing = {row[1] for row in cur.execute("PRAGMA table_info(users)")}
        new_cols = {
            "stripe_customer_id": "TEXT",
            "subscription_status": "TEXT DEFAULT 'trial'",
            "trial_ends_at": "TEXT",
        }
        for col, typedef in new_cols.items():
            if col not in existing:
                cur.execute(f"ALTER TABLE users ADD COLUMN {col} {typedef}")
        conn.commit()
        conn.close()
    except Exception:
        pass
