"""Tests for the restricted Replit preview location seed."""
import pytest
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from db import engine
from models import City, LocationSubarea, MarketGroup
from seed import seed_review_cities_only


@pytest.fixture()
def session():
    connection = engine.connect()
    transaction = connection.begin()
    db_session = Session(bind=connection, expire_on_commit=False)
    try:
        yield db_session
    finally:
        db_session.close()
        transaction.rollback()
        connection.close()


def test_restricted_seed_adds_only_the_three_review_cities(session):
    seed_review_cities_only(session)

    cities = session.scalars(select(City).order_by(City.slug)).all()
    assert [city.slug for city in cities] == ["hamilton", "ottawa", "toronto"]
    assert all(city.public_listing_enabled for city in cities)
    assert {city.launch_status for city in cities} == {"planned", "onboarding"}
    assert all(city.seo_indexable is False for city in cities)
    assert session.scalar(select(func.count()).select_from(LocationSubarea)) == 0

    groups = session.scalars(select(MarketGroup).order_by(MarketGroup.slug)).all()
    assert {group.slug for group in groups} == {
        "burlington-corridor",
        "ottawa",
        "toronto",
    }
    assert all(group.planning_prospect_count == 0 for group in groups)


def test_restricted_seed_is_idempotent(session):
    seed_review_cities_only(session)
    seed_review_cities_only(session)

    assert set(session.scalars(select(City.slug)).all()) == {
        "hamilton",
        "ottawa",
        "toronto",
    }
