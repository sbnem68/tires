"""Public, unauthenticated read API for the landing pages (Checkpoint 1).

Only cities with public_listing_enabled are ever returned. Planning counts, prospects,
shops and offers are never exposed here. Nothing in this module writes data.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

import settings
from db import get_session
from models import City

router = APIRouter(prefix="/api/public", tags=["public"])


def is_indexable(city: City) -> bool:
    """A city page may be indexed only when all three conditions hold."""
    return settings.site_indexing_enabled() and city.seo_indexable and city.launch_status == "live"


def serialize_city(city: City) -> dict:
    return {
        "slug": city.slug,
        "name": city.name,
        "province_code": city.province_code,
        "launch_status": city.launch_status,
        "default_locale": city.default_locale,
        "supported_locales": city.supported_locales,
        "subareas": [{"slug": s.slug, "name": s.name, "aliases": s.aliases} for s in city.subareas],
        "indexable": is_indexable(city),
    }


def listed_cities_query():
    return (
        select(City)
        .where(City.public_listing_enabled.is_(True))
        .options(selectinload(City.subareas))
        .order_by(City.name)
    )


@router.get("/config")
def public_config():
    return {
        "environment": settings.APP_ENV,
        # Staging-only review tools (state preview, attribution inspector).
        "preview_enabled": not settings.is_production(),
        "site_indexing_enabled": settings.site_indexing_enabled(),
    }


@router.get("/locations")
def list_locations(session: Session = Depends(get_session)):
    return {"cities": [serialize_city(c) for c in session.scalars(listed_cities_query()).all()]}


@router.get("/locations/{slug}")
def get_location(slug: str, session: Session = Depends(get_session)):
    city = session.scalars(listed_cities_query().where(City.slug == slug.lower())).one_or_none()
    if city is None:  # unlisted and unknown cities are indistinguishable to the public
        raise HTTPException(status_code=404, detail="Location not found")
    return serialize_city(city)
