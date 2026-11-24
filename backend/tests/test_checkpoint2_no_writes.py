"""Checkpoint 2 acceptance tests: the wizard cannot write to the server or create a lead.

The API is inspected directly: Checkpoint 2 must expose no route that accepts a write, and no
route that concerns leads, requests, quotes or registrations. These tests are read-only and do
not depend on which location seed has been loaded.
"""
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import server  # noqa: E402
from db import engine  # noqa: E402
from models import InterestRegistration, Lead, LeadEvent, Quote  # noqa: E402

READ_ONLY_METHODS = {"GET", "HEAD", "OPTIONS"}
WRITE_METHODS = ("post", "put", "patch", "delete")
LEAD_WORDS = ("lead", "quote", "interest", "register", "submit", "contact", "wizard", "intake", "tire-match")
PROBE_PATHS = (
    "/api/leads", "/api/lead", "/api/public/leads", "/api/public/lead", "/api/public/tire-match",
    "/api/tire-match", "/api/public/wizard", "/api/public/intake", "/api/public/interest",
    "/api/public/locations", "/api/public/config", "/api/health",
)
WIZARD_PAYLOAD = {
    "city": "ottawa", "postal_code": "K1A 0B1", "travel_radius_km": 25, "need_type": "buy_4",
    "first_name": "Test", "phone": "6135550100",
}


@pytest.fixture()
def client():
    return TestClient(server.app)


def record_counts() -> dict:
    with Session(engine) as session:
        return {
            model.__tablename__: session.scalar(select(func.count()).select_from(model))
            for model in (Lead, LeadEvent, Quote, InterestRegistration)
        }


def api_routes():
    return [route for route in server.app.routes if getattr(route, "path", "").startswith("/api")]


def test_every_api_route_is_read_only():
    routes = api_routes()
    assert routes, "expected the API to expose at least the health and public routes"
    for route in routes:
        assert set(route.methods) <= READ_ONLY_METHODS, f"{route.path} accepts {sorted(route.methods)}"


def test_no_lead_or_wizard_endpoint_exists():
    for route in api_routes():
        assert not any(word in route.path.lower() for word in LEAD_WORDS), route.path


def test_write_attempts_are_rejected_and_create_no_records(client):
    before = record_counts()
    for path in PROBE_PATHS:
        for method in WRITE_METHODS:
            response = getattr(client, method)(path, **({} if method == "delete" else {"json": WIZARD_PAYLOAD}))
            assert response.status_code in (404, 405), f"{method.upper()} {path} returned {response.status_code}"
    assert record_counts() == before


def test_no_lead_records_exist_in_the_preview_database():
    assert record_counts() == {"leads": 0, "lead_events": 0, "quotes": 0, "interest_registrations": 0}


def test_public_locations_lists_only_the_three_review_cities(client):
    """The wizard's city dropdown is database-driven: exactly the publicly listed cities."""
    cities = client.get("/api/public/locations").json()["cities"]
    assert sorted(city["slug"] for city in cities) == ["hamilton", "ottawa", "toronto"]
    for city in cities:
        assert not any(key in city for key in ("market_group", "planning_prospect_count", "shops", "offers", "price"))
