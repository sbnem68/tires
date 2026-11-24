"""Database engine and session factory (PostgreSQL via SQLAlchemy 2 + psycopg 3)."""
import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

load_dotenv(Path(__file__).parent / ".env")


def database_url() -> str:
    """Return DATABASE_URL normalised to the psycopg 3 driver.

    Prefer the project-specific external database secret when present. Replit reserves
    DATABASE_URL for its managed Postgres connection, so an external Supabase URL uses
    TIRES4TODAY_DATABASE_URL instead. Railway and most hosts hand out postgres:// URLs.
    """
    url = os.environ.get("TIRES4TODAY_DATABASE_URL") or os.environ["DATABASE_URL"]
    for prefix in ("postgresql+psycopg://", "postgresql://", "postgres://"):
        if url.startswith(prefix):
            return "postgresql+psycopg://" + url[len(prefix):]
    raise RuntimeError("DATABASE_URL must be a PostgreSQL connection string")


engine = create_engine(database_url(), pool_pre_ping=True, pool_size=5, max_overflow=5)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)


def get_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
