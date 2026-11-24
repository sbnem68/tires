"""Idempotent location-directory seed.  Usage:  python seed.py

Safe to rerun: rows are matched on their stable slug/code.
- Planning metadata (names, tiers, priorities, counts) is refreshed from seed_data.py.
- Operational state (launch_status, public_listing_enabled, launched_at, approvals,
  verification timestamps) is NEVER touched after the first insert.
- No shops, offers, prospects, leads or installs are created here.
"""
from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

import seed_data as sd
from models import City, LocationSubarea, MarketGroup, ProvinceConfig

REVIEW_CITY_SLUGS = {"ottawa", "toronto", "hamilton"}


def seed_locations(session: Session) -> dict:
    provinces = {p["code"]: p for p in sd.PROVINCES}

    for p in sd.PROVINCES:
        stmt = insert(ProvinceConfig).values(country_code="CA", **p)
        session.execute(stmt.on_conflict_do_update(
            index_elements=["code"],
            set_={"name": p["name"], "default_locale": p["default_locale"],
                  "supported_locales": p["supported_locales"], "updated_at": func.now()},
        ))

    for priority, tier, name, slug, count, province, cities in sd.MARKET_GROUPS:
        stmt = insert(MarketGroup).values(
            name=name, slug=slug, tier=tier, priority_order=priority,
            planning_prospect_count=count, count_source=sd.COUNT_SOURCE,
            notes=sd.GROUP_NOTES.get(slug),
        )
        group_id = session.execute(stmt.on_conflict_do_update(
            index_elements=["slug"],
            set_={"name": name, "tier": tier, "priority_order": priority,
                  "planning_prospect_count": count, "count_source": sd.COUNT_SOURCE,
                  "updated_at": func.now()},
        ).returning(MarketGroup.id)).scalar_one()

        cfg = provinces[province]
        for order, city_name in enumerate(cities, start=1):
            city_slug = sd.slugify(city_name)
            stmt = insert(City).values(
                market_group_id=group_id, name=city_name, slug=city_slug, sort_order=order,
                province_code=province, country_code="CA", timezone=sd.TIMEZONE,
                default_locale=cfg["default_locale"], supported_locales=cfg["supported_locales"],
                launch_status="onboarding" if city_slug == "ottawa" else "planned",
                public_listing_enabled=city_slug in REVIEW_CITY_SLUGS,
            )
            session.execute(stmt.on_conflict_do_update(
                index_elements=["slug"],
                set_={"market_group_id": group_id, "name": city_name, "sort_order": order,
                      "province_code": province, "updated_at": func.now()},
            ))

    for city_slug, names in sd.SUBAREAS.items():
        city_id = session.execute(select(City.id).where(City.slug == city_slug)).scalar_one()
        for name in names:
            stmt = insert(LocationSubarea).values(city_id=city_id, name=name, slug=sd.slugify(name), aliases=[])
            session.execute(stmt.on_conflict_do_update(
                constraint="uq_location_subareas_city_slug", set_={"name": name, "updated_at": func.now()},
            ))

    session.flush()
    return location_totals(session)


def location_totals(session: Session) -> dict:
    return {
        "market_groups": session.scalar(select(func.count()).select_from(MarketGroup)),
        "cities": session.scalar(select(func.count()).select_from(City)),
        "subareas": session.scalar(select(func.count()).select_from(LocationSubarea)),
        "planning_prospects": session.scalar(select(func.coalesce(func.sum(MarketGroup.planning_prospect_count), 0))),
    }


if __name__ == "__main__":
    from db import SessionLocal

    with SessionLocal() as s:
        totals = seed_locations(s)
        s.commit()
    print("Seed complete:", totals)
