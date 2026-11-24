"""Database engine and session factory (PostgreSQL via SQLAlchemy 2 + psycopg 3)."""
import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

load_dotenv(Path(__file__).parent / ".env")


def database_url() -> str:
    """Return DATABASE_URL normalised to the psycopg 3 driver.

    Railway and most hosts hand out postgres:// or postgresql:// URLs.
    """
    url = os.environ["DATABASE_URL"]
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
