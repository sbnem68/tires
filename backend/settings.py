"""Runtime settings read from environment variables."""
import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

# Fail closed: anything not explicitly staging/development behaves as production.
APP_ENV = os.environ.get("APP_ENV", "production").lower()


def is_production() -> bool:
    return APP_ENV not in ("staging", "development")


def site_indexing_enabled() -> bool:
    """Site-wide switch. While false, every page is noindex regardless of city settings."""
    return os.environ.get("SITE_INDEXING_ENABLED", "false").lower() == "true"
