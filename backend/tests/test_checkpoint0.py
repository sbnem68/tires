"""Checkpoint 0 acceptance tests: schema, migrations, location seed, guard rails.

Runs against the PostgreSQL database in DATABASE_URL. Every test runs inside a
transaction that is rolled back, so the database is left untouched.

Numbers in test names refer to Addendum J ("Required tests").
"""
import sys
from datetime import datetime, timezone
from pathlib import Path

import pytest
from sqlalchemy import func, inspect, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from db import engine  # noqa: E402
from models import (  # noqa: E402
    Base, City, Install, Lead, LocationSubarea, MarketGroup, Prospect, ProvinceConfig, Shop, ShopOffer,
)
from seed import location_totals, seed_locations  # noqa: E402


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


def _head_revision() -> str:
    from alembic.config import Config
    from alembic.script import ScriptDirectory

    backend = Path(__file__).resolve().parents[1]
    cfg = Config(str(backend / "alembic.ini"))
    cfg.set_main_option("script_location", str(backend / "alembic"))
    return ScriptDirectory.from_config(cfg).get_current_head()


HEAD_REVISION = _head_revision()
# Cities given a public review page at Checkpoint 1 (migration 0002).
LISTED_CITIES = {"ottawa", "toronto", "hamilton"}


def count(session, model):
    return session.scalar(select(func.count()).select_from(model))


def city(session, slug):
    return session.scalars(select(City).where(City.slug == slug)).one()


# ------------------------------------------------------------------ migrations / schema

def test_database_connects_and_migration_is_applied(session):
    assert session.execute(text("SELECT 1")).scalar() == 1
    assert session.execute(text("SELECT version_num FROM alembic_version")).scalar() == HEAD_REVISION


def test_all_model_tables_exist():
    insp = inspect(engine)
    required = {"shops", "shop_offers", "leads", "quotes", "installs", "market_groups", "cities",
                "location_subareas", "prospects", "expansion_overrides", "interest_registrations"}
    assert required <= set(Base.metadata.tables)
    for table in Base.metadata.tables:
        assert insp.has_table(table), table


def test_required_foreign_keys_exist():
    insp = inspect(engine)

    def fks(table):
        return {(fk["constrained_columns"][0], fk["referred_table"]) for fk in insp.get_foreign_keys(table)}

    assert ("city_id", "cities") in fks("shops")
    assert ("city_id", "cities") in fks("prospects")
    assert ("requested_city_id", "cities") in fks("leads")
    assert ("landing_city_id", "cities") in fks("leads")
    assert ("shop_id", "shops") in fks("shop_offers")
    assert ("market_group_id", "market_groups") in fks("cities")
    assert ("city_id", "cities") in fks("location_subareas")


def test_offers_and_shops_have_no_free_text_city():
    insp = inspect(engine)
    offer_cols = {c["name"] for c in insp.get_columns("shop_offers")}
    shop_cols = {c["name"] for c in insp.get_columns("shops")}
    assert not {"city", "city_id", "city_name"} & offer_cols  # derived from the shop
    assert not {"city", "city_name"} & shop_cols


# ------------------------------------------------------------------ seed (Addendum J)

def test_01_seed_has_exactly_14_groups_and_28_cities(session):
    assert count(session, MarketGroup) == 14
    assert count(session, City) == 28


def test_02_toronto_has_exactly_the_three_supplied_subareas(session):
    toronto = city(session, "toronto")
    assert sorted(s.name for s in toronto.subareas) == ["Etobicoke", "North York", "Scarborough"]
    assert count(session, LocationSubarea) == 3


def test_03_planning_counts_total_348_without_duplication(session):
    assert session.scalar(select(func.sum(MarketGroup.planning_prospect_count))) == 348
    # The count lives on the group only; cities carry no count to duplicate.
    assert "planning_prospect_count" not in {c["name"] for c in inspect(engine).get_columns("cities")}
    corridor = session.scalars(select(MarketGroup).where(MarketGroup.slug == "burlington-corridor")).one()
    assert corridor.planning_prospect_count == 47 and len(corridor.cities) == 4


def test_04_rerunning_seed_creates_no_duplicates(session):
    before = location_totals(session)
    assert seed_locations(session) == before
    assert seed_locations(session) == before
    assert count(session, ProvinceConfig) == 2


def test_04b_rerunning_seed_preserves_launch_state(session):
    hamilton = city(session, "hamilton")
    hamilton.launch_status = "paused"
    session.flush()
    seed_locations(session)
    session.refresh(hamilton)
    assert hamilton.launch_status == "paused"
    assert city(session, "ottawa").launch_status == "onboarding"
    assert city(session, "toronto").public_listing_enabled is True


def test_05_seed_creates_no_prospects_partners_offers_or_business_records(session):
    models = (Prospect, Shop, ShopOffer, Lead, Install)
    before = [count(session, m) for m in models]
    seed_locations(session)
    assert [count(session, m) for m in models] == before


def test_06_no_city_is_live_and_only_review_cities_are_listed(session):
    for c in session.scalars(select(City)).all():
        # Ottawa is the onboarding pilot (approved at Checkpoint 0 review); nothing is live.
        assert c.launch_status == ("onboarding" if c.slug == "ottawa" else "planned"), c.slug
        assert c.public_listing_enabled is (c.slug in LISTED_CITIES), c.slug
        assert c.launched_at is None and c.seo_indexable is False


def test_08_subareas_belong_to_toronto_and_are_not_cities(session):
    toronto = city(session, "toronto")
    for sub in session.scalars(select(LocationSubarea)).all():
        assert sub.city_id == toronto.id
    slugs = set(session.scalars(select(City.slug)).all())
    assert not {"north-york", "scarborough", "etobicoke"} & slugs


def test_09_market_group_grants_no_service_relationship(session):
    barrie, peterborough = city(session, "barrie"), city(session, "peterborough")
    assert barrie.market_group_id == peterborough.market_group_id  # planning group only
    # Serving another city needs an explicit shop_service_cities row; none are seeded.
    assert session.execute(text("SELECT count(*) FROM shop_service_cities")).scalar() == 0


def test_10_gatineau_uses_quebec_configuration(session):
    gatineau = city(session, "gatineau")
    assert gatineau.province_code == "QC"
    assert gatineau.default_locale == "fr-CA"
    assert set(gatineau.supported_locales) == {"fr-CA", "en-CA"}
    qc, on = session.get(ProvinceConfig, "QC"), session.get(ProvinceConfig, "ON")
    assert qc.tax_components != on.tax_components
    # Nothing is pre-approved for Quebec.
    assert qc.consent_wording_approved_at is None and qc.privacy_wording_approved_at is None
    others = session.scalars(select(City).where(City.slug != "gatineau")).all()
    assert all(c.province_code == "ON" for c in others)


def test_11_gatineau_and_kingston_pools_are_below_the_five_shop_gate(session):
    small = session.scalars(select(MarketGroup).where(MarketGroup.planning_prospect_count < 5)).all()
    assert sorted(g.slug for g in small) == ["gatineau", "kingston"]
    assert all(g.notes for g in small)


def test_14_new_city_is_configured_with_data_only(session):
    group = MarketGroup(name="Test Group", slug="test-group", tier=4, priority_order=99, planning_prospect_count=0)
    session.add(group)
    session.flush()
    session.add(City(market_group_id=group.id, name="Testville", slug="testville", province_code="ON",
                     timezone="America/Toronto", default_locale="en-CA", supported_locales=["en-CA"]))
    session.flush()
    new_city = city(session, "testville")
    assert new_city.launch_status == "planned" and new_city.public_listing_enabled is False
    assert count(session, City) == 29


# ------------------------------------------------------------------ guard rails in the schema

def test_city_cannot_go_live_without_recorded_approval(session):
    ottawa = city(session, "ottawa")
    with pytest.raises(IntegrityError):
        with session.begin_nested():
            ottawa.launch_status = "live"
            session.flush()
    session.refresh(ottawa)
    now = datetime.now(timezone.utc)
    ottawa.launch_status, ottawa.launch_approved_by = "live", "Sam"
    ottawa.launch_approved_at = ottawa.launched_at = now
    session.flush()


def test_invalid_launch_status_is_rejected(session):
    with pytest.raises(IntegrityError):
        with session.begin_nested():
            session.execute(text("UPDATE cities SET launch_status = 'open' WHERE slug = 'ottawa'"))


def test_active_offer_must_be_all_in_and_city_comes_from_shop(session):
    ottawa = city(session, "ottawa")
    shop = Shop(city_id=ottawa.id, name="Schema Test Shop", slug="schema-test-shop", is_demo=True)
    session.add(shop)
    session.flush()
    assert shop.referral_fee_set_cents == 4500 and shop.referral_fee_pair_cents == 2250
    with pytest.raises(IntegrityError):
        with session.begin_nested():
            session.add(ShopOffer(shop_id=shop.id, package_type="set_of_4", tire_count=4, brand="X",
                                  price_all_in_cents=10000, status="active", includes_taxes=False))
            session.flush()
    offer = ShopOffer(shop_id=shop.id, package_type="set_of_4", tire_count=4, brand="X",
                      price_all_in_cents=10000, status="active", is_demo=True)
    session.add(offer)
    session.flush()
    assert offer.shop.city.slug == "ottawa"


# ------------------------------------------------------------------ API

def test_health_endpoint():
    from fastapi.testclient import TestClient
    import server

    body = TestClient(server.app).get("/api/health").json()
    assert body["status"] == "ok" and body["database"] == "connected" and body["migration_revision"] == HEAD_REVISION


def test_architecture_endpoint_is_hidden_in_production(monkeypatch):
    from fastapi.testclient import TestClient
    import server

    client = TestClient(server.app)
    import settings

    monkeypatch.setattr(settings, "APP_ENV", "staging")
    body = client.get("/api/system/architecture").json()
    assert body["totals"] == {"market_groups": 14, "cities": 28, "subareas": 3, "planning_prospects": 348}
    assert "DATABASE_URL" not in str(body) and "postgresql://" not in str(body)
    monkeypatch.setattr(settings, "APP_ENV", "production")
    assert client.get("/api/system/architecture").status_code == 404
