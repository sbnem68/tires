"""Tires4Today API - Checkpoint 0: foundation only (health + staging architecture review)."""
import logging
import os

from fastapi import APIRouter, Depends, FastAPI, HTTPException
from sqlalchemy import inspect, select, text
from sqlalchemy.orm import Session, selectinload
from starlette.middleware.cors import CORSMiddleware

from db import engine, get_session
from models import Base, City, Install, Lead, MarketGroup, Prospect, ProvinceConfig, Quote, Shop, ShopOffer
from seed import location_totals

# Fail closed: anything not explicitly marked staging/development behaves as production.
APP_ENV = os.environ.get("APP_ENV", "production").lower()

app = FastAPI(title="Tires4Today Tire Match API")
api = APIRouter(prefix="/api")
logger = logging.getLogger("tires4today")
logging.basicConfig(level=logging.INFO)


@api.get("/health")
def health(session: Session = Depends(get_session)):
    """Liveness + database + migration check. Used by the host's health probe."""
    try:
        session.execute(text("SELECT 1"))
        revision = session.execute(text("SELECT version_num FROM alembic_version")).scalar_one_or_none()
    except Exception as exc:  # report, never leak connection details
        logger.error("health check failed: %s", type(exc).__name__)
        raise HTTPException(status_code=503, detail="Database unavailable or not migrated")
    return {"status": "ok", "database": "connected", "migration_revision": revision, "environment": APP_ENV}


@api.get("/system/architecture")
def architecture(session: Session = Depends(get_session)):
    """Checkpoint 0 review data: live schema + location seed. Not available in production."""
    if APP_ENV == "production":
        raise HTTPException(status_code=404, detail="Not found")

    insp = inspect(engine)
    tables = []
    for name in sorted(Base.metadata.tables):
        if not insp.has_table(name):
            continue
        fks = {fk["constrained_columns"][0]: f'{fk["referred_table"]}.{fk["referred_columns"][0]}'
               for fk in insp.get_foreign_keys(name)}
        pks = set(insp.get_pk_constraint(name)["constrained_columns"])
        tables.append({
            "name": name,
            "columns": [{
                "name": c["name"], "type": str(c["type"]), "nullable": c["nullable"],
                "primary_key": c["name"] in pks, "references": fks.get(c["name"]),
            } for c in insp.get_columns(name)],
        })

    groups = session.scalars(
        select(MarketGroup).options(selectinload(MarketGroup.cities).selectinload(City.subareas))
        .order_by(MarketGroup.priority_order)
    ).all()
    provinces = session.scalars(select(ProvinceConfig).order_by(ProvinceConfig.code)).all()

    def count(model):
        return session.scalar(select(text("count(*)")).select_from(model))

    return {
        "environment": APP_ENV,
        "totals": location_totals(session),
        "record_counts": {
            "prospects": count(Prospect), "shops": count(Shop), "shop_offers": count(ShopOffer),
            "leads": count(Lead), "quotes": count(Quote), "installs": count(Install),
        },
        "provinces": [{
            "code": p.code, "name": p.name, "default_locale": p.default_locale,
            "supported_locales": p.supported_locales, "tax_components": p.tax_components,
            "tax_config_verified": p.tax_config_verified_at is not None,
            "consent_wording_approved": p.consent_wording_approved_at is not None,
            "privacy_wording_approved": p.privacy_wording_approved_at is not None,
        } for p in provinces],
        "market_groups": [{
            "priority_order": g.priority_order, "tier": g.tier, "name": g.name, "slug": g.slug,
            "planning_prospect_count": g.planning_prospect_count,
            "count_verified": g.count_verified_at is not None, "notes": g.notes,
            "cities": [{
                "name": c.name, "slug": c.slug, "province_code": c.province_code, "timezone": c.timezone,
                "default_locale": c.default_locale, "supported_locales": c.supported_locales,
                "launch_status": c.launch_status, "public_listing_enabled": c.public_listing_enabled,
                "subareas": [s.name for s in c.subareas],
            } for c in g.cities],
        } for g in groups],
        "tables": tables,
    }


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
