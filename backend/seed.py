"""Idempotent location-directory seed.

Safe to rerun: rows are matched on their stable slug/code.
- Planning metadata (names, tiers, priorities, counts) is refreshed from seed_data.py.
- Operational state (launch_status, public_listing_enabled, launched_at, approvals,
  verification timestamps) is NEVER touched after the first insert.
- No shops, offers, prospects, leads or installs are created here.

The default command seeds the full planning directory. Use
``python seed.py --review-cities-only`` for the restricted Replit preview dataset:
Ottawa, Toronto and Hamilton only, plus the minimum non-public parent rows required
by the schema.
"""
import argparse

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
            stmt = insert(City).values(
                market_group_id=group_id, name=city_name, slug=sd.slugify(city_name), sort_order=order,
                province_code=province, country_code="CA", timezone=sd.TIMEZONE,
                default_locale=cfg["default_locale"], supported_locales=cfg["supported_locales"],
                launch_status="planned", public_listing_enabled=False,
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


def seed_review_cities_only(session: Session) -> None:
    """Add only the three approved public city records and required parent rows.

    The schema requires each city to reference a province and a market group. The
    parent groups use zero as the required, non-public planning-count placeholder;
    no planning figures or other cities are seeded by this path.
    """
    existing_slugs = set(session.scalars(select(City.slug)).all())
    if existing_slugs - REVIEW_CITY_SLUGS:
        raise RuntimeError(
            "Refusing the restricted seed because other city rows already exist; "
            "no existing data was changed."
        )

    session.execute(
        insert(ProvinceConfig)
        .values(
            code="ON",
            name="Ontario",
            country_code="CA",
            default_locale="en-CA",
            supported_locales=["en-CA"],
            tax_components=[],
        )
        .on_conflict_do_nothing(index_elements=["code"])
    )

    for priority, tier, name, slug, _count, province, cities in sd.MARKET_GROUPS:
        if province != "ON":
            continue
        included_cities = [
            (order, city_name)
            for order, city_name in enumerate(cities, start=1)
            if sd.slugify(city_name) in REVIEW_CITY_SLUGS
        ]
        if not included_cities:
            continue

        existing_group = session.scalars(
            select(MarketGroup).where(MarketGroup.slug == slug)
        ).one_or_none()
        if existing_group and existing_group.planning_prospect_count != 0:
            raise RuntimeError(
                "Refusing the restricted seed because a required parent group has "
                "existing planning metadata; no existing data was changed."
            )

        session.execute(
            insert(MarketGroup)
            .values(
                name=name,
                slug=slug,
                tier=tier,
                priority_order=priority,
                planning_prospect_count=0,
                count_source=None,
                notes=None,
            )
            .on_conflict_do_nothing(index_elements=["slug"])
        )
        group_id = session.scalar(
            select(MarketGroup.id).where(MarketGroup.slug == slug)
        )

        for order, city_name in included_cities:
            city_slug = sd.slugify(city_name)
            session.execute(
                insert(City)
                .values(
                    market_group_id=group_id,
                    name=city_name,
                    slug=city_slug,
                    sort_order=order,
                    province_code="ON",
                    country_code="CA",
                    timezone=sd.TIMEZONE,
                    default_locale="en-CA",
                    supported_locales=["en-CA"],
                    launch_status="onboarding" if city_slug == "ottawa" else "planned",
                    public_listing_enabled=True,
                    seo_indexable=False,
                )
                .on_conflict_do_nothing(index_elements=["slug"])
            )

    session.flush()

    cities = session.scalars(
        select(City).where(City.slug.in_(REVIEW_CITY_SLUGS))
    ).all()
    expected_statuses = {
        "ottawa": "onboarding",
        "toronto": "planned",
        "hamilton": "planned",
    }
    if len(cities) != len(REVIEW_CITY_SLUGS) or any(
        not city.public_listing_enabled
        or city.launch_status != expected_statuses[city.slug]
        or city.seo_indexable
        for city in cities
    ):
        raise RuntimeError(
            "The restricted seed did not produce the approved review-city state; "
            "the transaction must be rolled back."
        )

    subarea_count = session.scalar(select(func.count()).select_from(LocationSubarea))
    if subarea_count:
        raise RuntimeError(
            "Refusing the restricted seed because subarea rows already exist; "
            "no existing data was changed."
        )


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed the location directory.")
    parser.add_argument(
        "--review-cities-only",
        action="store_true",
        help="Seed only Ottawa, Toronto and Hamilton for the Replit preview.",
    )
    args = parser.parse_args()

    from db import SessionLocal

    with SessionLocal() as s:
        if args.review_cities_only:
            seed_review_cities_only(s)
        else:
            totals = seed_locations(s)
        s.commit()
    if args.review_cities_only:
        print("Restricted preview city seed complete.")
    else:
        print("Seed complete:", totals)


if __name__ == "__main__":
    main()
