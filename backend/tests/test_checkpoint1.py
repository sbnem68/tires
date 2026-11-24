"""Checkpoint 1 acceptance tests: public location API, listing rules, SEO flags, corrections.

Read-only against DATABASE_URL except where a rolled-back transaction is used.
"""
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, inspect, select, text
from sqlalchemy.orm import Session

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import public_api  # noqa: E402
import server  # noqa: E402
import settings  # noqa: E402
from db import engine  # noqa: E402
from models import City, InterestRegistration, Lead, ProvinceConfig, Shop, ShopOffer  # noqa: E402

REVIEW_CITIES = ["hamilton", "ottawa", "toronto"]
FORBIDDEN_PUBLIC_KEYS = ("planning", "prospect", "price", "offer", "shop", "market_group", "tax")


@pytest.fixture()
def client():
    return TestClient(server.app)


@pytest.fixture()
def session():
    connection = engine.connect()
    trans = connection.begin()
    s = Session(bind=connection, join_transaction_mode="create_savepoint")
    try:
        yield s
    finally:
        s.close()
        trans.rollback()
        connection.close()


def test_only_the_three_review_cities_are_publicly_listed(client):
    cities = client.get("/api/public/locations").json()["cities"]
    assert sorted(c["slug"] for c in cities) == REVIEW_CITIES


def test_review_city_pages_resolve(client):
    for slug in REVIEW_CITIES:
        body = client.get(f"/api/public/locations/{slug}").json()
        assert body["slug"] == slug and body["name"].lower() == slug


def test_unlisted_and_unknown_cities_are_not_found(client):
    for slug in ("gatineau", "burlington", "kingston", "sudbury", "nowhere"):
        assert client.get(f"/api/public/locations/{slug}").status_code == 404


def test_toronto_subareas_are_not_cities(client, session):
    toronto = client.get("/api/public/locations/toronto").json()
    assert sorted(s["name"] for s in toronto["subareas"]) == ["Etobicoke", "North York", "Scarborough"]
    for slug in ("north-york", "scarborough", "etobicoke"):
        assert client.get(f"/api/public/locations/{slug}").status_code == 404
    assert session.scalar(select(func.count()).select_from(City)) == 28


def test_no_city_is_live_and_ottawa_is_onboarding(session):
    statuses = dict(session.execute(select(City.slug, City.launch_status)).all())
    assert statuses.pop("ottawa") == "onboarding"
    assert set(statuses.values()) == {"planned"}
    assert len(statuses) == 27


def test_public_api_exposes_no_planning_counts_prices_or_shops(client):
    payload = client.get("/api/public/locations").text.lower()
    for word in FORBIDDEN_PUBLIC_KEYS:
        assert word not in payload, word


def test_every_page_is_noindex_for_now(client):
    assert client.get("/api/public/config").json()["site_indexing_enabled"] is False
    assert all(c["indexable"] is False for c in client.get("/api/public/locations").json()["cities"])


def test_indexing_requires_site_switch_and_city_flag_and_live_status(monkeypatch):
    def city(status, flag):
        return City(name="X", slug="x", launch_status=status, seo_indexable=flag)

    monkeypatch.setenv("SITE_INDEXING_ENABLED", "true")
    assert public_api.is_indexable(city("live", True)) is True
    assert public_api.is_indexable(city("live", False)) is False
    for status in ("planned", "onboarding", "paused"):
        assert public_api.is_indexable(city(status, True)) is False
    monkeypatch.setenv("SITE_INDEXING_ENABLED", "false")
    assert public_api.is_indexable(city("live", True)) is False


def test_preview_tools_are_disabled_in_production(client, monkeypatch):
    assert client.get("/api/public/config").json()["preview_enabled"] is True  # staging
    monkeypatch.setattr(settings, "APP_ENV", "production")
    assert client.get("/api/public/config").json()["preview_enabled"] is False


def test_no_public_write_endpoints_exist(client):
    """Checkpoint 1 collects no customer data: there is nothing to POST to."""
    for route in server.app.routes:
        methods = getattr(route, "methods", set()) or set()
        assert not methods & {"POST", "PUT", "PATCH", "DELETE"}, route.path
    assert client.post("/api/public/locations", json={}).status_code == 405


def test_no_customer_or_inventory_records_exist(session):
    for model in (Lead, InterestRegistration, Shop, ShopOffer):
        assert session.scalar(select(func.count()).select_from(model)) == 0, model.__tablename__


def test_tax_components_are_unverified_placeholders(session):
    for province in session.scalars(select(ProvinceConfig)).all():
        assert province.tax_components_verified is False
        assert province.tax_components  # placeholders kept


def test_lead_events_records_timestamp_actor_type_and_notes():
    columns = {c["name"] for c in inspect(engine).get_columns("lead_events")}
    assert {"created_at", "actor", "event_type", "notes"} <= columns


def test_gatineau_is_french_first_and_unpublished(session):
    gatineau = session.scalars(select(City).where(City.slug == "gatineau")).one()
    assert gatineau.default_locale == "fr-CA" and "en-CA" in gatineau.supported_locales
    assert gatineau.public_listing_enabled is False and gatineau.launch_status == "planned"


def test_no_expansion_overrides_created(session):
    assert session.execute(text("SELECT count(*) FROM expansion_overrides")).scalar() == 0
