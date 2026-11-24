"""Tires4Today data model.

Conventions
- UUID primary keys, stable slugs, foreign keys everywhere (no free-text city on shops/offers/leads).
- Money is stored as integer cents (CAD).
- Status columns are VARCHAR + CHECK constraints (easy to extend in a migration).
- is_demo marks hypothetical/testing rows: excluded from production public results and from metrics.
- An offer has NO city column: its installation city is always shop.city_id.
"""
import uuid
from datetime import date, datetime
from typing import Optional

from sqlalchemy import (
    Boolean, CheckConstraint, Date, DateTime, ForeignKey, Index, Integer, String, Text,
    UniqueConstraint, Uuid, func, text,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

LAUNCH_STATUSES = ("planned", "onboarding", "live", "paused")
SHOP_STATUSES = ("onboarding", "active", "paused", "inactive")
OFFER_STATUSES = ("draft", "active", "inactive")
PACKAGE_TYPES = ("pair", "set_of_4")
TIRE_TYPES = ("winter", "all_season", "summer", "performance", "unknown")
TIRE_CONDITIONS = ("new", "used")
CURRENT_TIRE_CONDITIONS = ("new", "good", "worn", "damaged", "unknown")
PROSPECT_STATUSES = ("not_contacted", "contacted", "interested", "declined", "converted")
LEAD_STATUSES = ("new", "matched", "quoted", "booked", "completed", "lost", "needs_operator_review")
LEAD_ORIGINS = ("tires4today", "shop_organic")
NEED_TYPES = ("buy_2", "buy_4", "changeover", "repair", "not_sure")
PRIORITIES = ("lowest_price", "known_brand", "quality_used", "fastest_appointment", "best_value")
BUDGETS = ("under_400", "400_600", "600_800", "800_1000", "over_1000", "not_sure")
URGENCIES = ("today", "tomorrow", "this_week", "next_week", "flexible")
CONTACT_METHODS = ("text", "call")
QUOTE_STATUSES = ("draft", "sent", "accepted", "declined", "expired", "superseded")
PAYMENT_STATUSES = ("pending", "paid", "disputed")
OVERRIDE_TYPES = ("initial_pilot", "five_shop_exception", "combined_market")


def _in(column: str, values: tuple, nullable: bool = False) -> str:
    listed = ", ".join(f"'{v}'" for v in values)
    clause = f"{column} IN ({listed})"
    return f"({column} IS NULL OR {clause})" if nullable else clause


class Base(DeclarativeBase):
    pass


class Timestamps:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


def pk() -> Mapped[uuid.UUID]:
    return mapped_column(Uuid, primary_key=True, default=uuid.uuid4)


# --------------------------------------------------------------------------- locations

class ProvinceConfig(Base, Timestamps):
    """Province-level settings. Quebec is configured separately from Ontario (Addendum H)."""
    __tablename__ = "province_configs"

    code: Mapped[str] = mapped_column(String(2), primary_key=True)
    name: Mapped[str] = mapped_column(String(80))
    country_code: Mapped[str] = mapped_column(String(2), default="CA")
    default_locale: Mapped[str] = mapped_column(String(10))
    supported_locales: Mapped[list[str]] = mapped_column(ARRAY(String(10)))
    # e.g. [{"name": "HST", "rate": "0.13"}] - display/disclosure only until verified by Sam.
    tax_components: Mapped[list] = mapped_column(JSONB, server_default=text("'[]'::jsonb"))
    tax_config_verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    disclosure_notes: Mapped[Optional[str]] = mapped_column(Text)
    consent_wording_approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    privacy_wording_approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    content_approved_by: Mapped[Optional[str]] = mapped_column(String(120))


class MarketGroup(Base, Timestamps):
    """Prospecting / reporting group. NOT a proximity or routing concept."""
    __tablename__ = "market_groups"
    __table_args__ = (
        CheckConstraint("tier BETWEEN 1 AND 4", name="ck_market_groups_tier"),
        CheckConstraint("planning_prospect_count >= 0", name="ck_market_groups_count"),
    )

    id: Mapped[uuid.UUID] = pk()
    name: Mapped[str] = mapped_column(String(120), unique=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True)
    tier: Mapped[int] = mapped_column(Integer)
    priority_order: Mapped[int] = mapped_column(Integer, unique=True)
    # Supplied planning figure for the WHOLE group. Never a partner count, never per-city.
    planning_prospect_count: Mapped[int] = mapped_column(Integer, default=0)
    count_source: Mapped[Optional[str]] = mapped_column(String(200))
    count_verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    notes: Mapped[Optional[str]] = mapped_column(Text)

    cities: Mapped[list["City"]] = relationship(back_populates="market_group", order_by="City.sort_order")


class City(Base, Timestamps):
    __tablename__ = "cities"
    __table_args__ = (
        CheckConstraint(_in("launch_status", LAUNCH_STATUSES), name="ck_cities_launch_status"),
        # launched_at only exists for cities that are (or were) live.
        CheckConstraint("launched_at IS NULL OR launch_status IN ('live', 'paused')",
                        name="ck_cities_launched_at"),
        # A city cannot go live without a recorded approval (never automatic).
        CheckConstraint(
            "launch_status <> 'live' OR (launch_approved_by IS NOT NULL AND launch_approved_at IS NOT NULL "
            "AND launched_at IS NOT NULL)",
            name="ck_cities_live_requires_approval",
        ),
        Index("ix_cities_market_group_id", "market_group_id"),
        Index("ix_cities_launch_status", "launch_status"),
    )

    id: Mapped[uuid.UUID] = pk()
    market_group_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("market_groups.id", ondelete="RESTRICT"))
    name: Mapped[str] = mapped_column(String(120))
    slug: Mapped[str] = mapped_column(String(120), unique=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    province_code: Mapped[str] = mapped_column(ForeignKey("province_configs.code", ondelete="RESTRICT"))
    country_code: Mapped[str] = mapped_column(String(2), default="CA")
    timezone: Mapped[str] = mapped_column(String(64))
    default_locale: Mapped[str] = mapped_column(String(10))
    supported_locales: Mapped[list[str]] = mapped_column(ARRAY(String(10)))
    launch_status: Mapped[str] = mapped_column(String(20), default="planned", server_default="planned")
    public_listing_enabled: Mapped[bool] = mapped_column(Boolean, default=False, server_default=text("false"))
    launched_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    launch_approved_by: Mapped[Optional[str]] = mapped_column(String(120))
    launch_approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    market_group: Mapped[MarketGroup] = relationship(back_populates="cities")
    subareas: Mapped[list["LocationSubarea"]] = relationship(back_populates="city", order_by="LocationSubarea.name")


class LocationSubarea(Base, Timestamps):
    """Narrowing filter inside a city (e.g. North York in Toronto). Never a launch city."""
    __tablename__ = "location_subareas"
    __table_args__ = (UniqueConstraint("city_id", "slug", name="uq_location_subareas_city_slug"),)

    id: Mapped[uuid.UUID] = pk()
    city_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("cities.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(120))
    slug: Mapped[str] = mapped_column(String(120))
    aliases: Mapped[list[str]] = mapped_column(ARRAY(String(120)), server_default=text("'{}'"))

    city: Mapped[City] = relationship(back_populates="subareas")


class ExpansionOverride(Base):
    """Sam-approved exception to the expansion gate (5 active partners + 10 installs/week)."""
    __tablename__ = "expansion_overrides"
    __table_args__ = (CheckConstraint(_in("override_type", OVERRIDE_TYPES), name="ck_expansion_overrides_type"),)

    id: Mapped[uuid.UUID] = pk()
    city_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("cities.id", ondelete="CASCADE"), index=True)
    override_type: Mapped[str] = mapped_column(String(30))
    approved_by: Mapped[str] = mapped_column(String(120))
    approved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    reason: Mapped[str] = mapped_column(Text)
    measurement_scope: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# --------------------------------------------------------------------------- shops, offers, prospects

class Shop(Base, Timestamps):
    """An onboarded partner (or a clearly flagged demo shop). Prospects live in `prospects`."""
    __tablename__ = "shops"
    __table_args__ = (
        CheckConstraint(_in("status", SHOP_STATUSES), name="ck_shops_status"),
        CheckConstraint("install_capacity_per_day IS NULL OR install_capacity_per_day >= 0", name="ck_shops_capacity"),
        Index("ix_shops_city_status", "city_id", "status"),
    )

    id: Mapped[uuid.UUID] = pk()
    city_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("cities.id", ondelete="RESTRICT"))
    subarea_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("location_subareas.id", ondelete="SET NULL"))
    name: Mapped[str] = mapped_column(String(160))
    slug: Mapped[str] = mapped_column(String(160), unique=True)
    status: Mapped[str] = mapped_column(String(20), default="onboarding", server_default="onboarding")
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, server_default=text("false"))
    address: Mapped[Optional[str]] = mapped_column(String(240))
    postal_code: Mapped[Optional[str]] = mapped_column(String(12))
    # Coordinates stay NULL until real ones exist; no distance filter is claimed without them.
    latitude: Mapped[Optional[str]] = mapped_column(String(20))
    longitude: Mapped[Optional[str]] = mapped_column(String(20))
    phone: Mapped[Optional[str]] = mapped_column(String(32))
    email: Mapped[Optional[str]] = mapped_column(String(200))
    payment_email: Mapped[Optional[str]] = mapped_column(String(200))
    counter_contact_name: Mapped[Optional[str]] = mapped_column(String(120))
    sells_used_tires: Mapped[bool] = mapped_column(Boolean, default=False, server_default=text("false"))
    install_capacity_per_day: Mapped[Optional[int]] = mapped_column(Integer)
    top_sizes: Mapped[list[str]] = mapped_column(ARRAY(String(20)), server_default=text("'{}'"))
    referral_fee_set_cents: Mapped[int] = mapped_column(Integer, default=4500, server_default=text("4500"))
    referral_fee_pair_cents: Mapped[int] = mapped_column(Integer, default=2250, server_default=text("2250"))
    approved_by: Mapped[Optional[str]] = mapped_column(String(120))
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    notes: Mapped[Optional[str]] = mapped_column(Text)

    city: Mapped[City] = relationship()
    offers: Mapped[list["ShopOffer"]] = relationship(back_populates="shop")


class ShopServiceCity(Base):
    """Extra cities a shop explicitly agrees to serve. Sharing a market group grants nothing."""
    __tablename__ = "shop_service_cities"

    shop_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("shops.id", ondelete="CASCADE"), primary_key=True)
    city_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("cities.id", ondelete="CASCADE"), primary_key=True)


class ShopOffer(Base, Timestamps):
    __tablename__ = "shop_offers"
    __table_args__ = (
        CheckConstraint(_in("status", OFFER_STATUSES), name="ck_shop_offers_status"),
        CheckConstraint(_in("package_type", PACKAGE_TYPES), name="ck_shop_offers_package"),
        CheckConstraint(_in("tire_type", TIRE_TYPES), name="ck_shop_offers_tire_type"),
        CheckConstraint(_in("condition", TIRE_CONDITIONS), name="ck_shop_offers_condition"),
        CheckConstraint("price_all_in_cents > 0", name="ck_shop_offers_price"),
        CheckConstraint(
            "(package_type = 'pair' AND tire_count = 2) OR (package_type = 'set_of_4' AND tire_count = 4)",
            name="ck_shop_offers_tire_count",
        ),
        # "All-in" is a promise: an offer may only be active if every component is included.
        CheckConstraint(
            "status <> 'active' OR (includes_tires AND includes_mounting AND includes_balancing "
            "AND includes_disposal AND includes_taxes)",
            name="ck_shop_offers_all_in",
        ),
        Index("ix_shop_offers_shop_status", "shop_id", "status"),
    )

    id: Mapped[uuid.UUID] = pk()
    shop_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("shops.id", ondelete="CASCADE"))
    package_type: Mapped[str] = mapped_column(String(20))
    tire_count: Mapped[int] = mapped_column(Integer)
    brand: Mapped[str] = mapped_column(String(80))
    brand_tier: Mapped[Optional[str]] = mapped_column(String(40))
    tire_type: Mapped[str] = mapped_column(String(20), default="unknown", server_default="unknown")
    condition: Mapped[str] = mapped_column(String(10), default="new", server_default="new")
    tire_sizes: Mapped[list[str]] = mapped_column(ARRAY(String(20)), server_default=text("'{}'"))
    price_all_in_cents: Mapped[int] = mapped_column(Integer)
    currency: Mapped[str] = mapped_column(String(3), default="CAD", server_default="CAD")
    includes_tires: Mapped[bool] = mapped_column(Boolean, default=True, server_default=text("true"))
    includes_mounting: Mapped[bool] = mapped_column(Boolean, default=True, server_default=text("true"))
    includes_balancing: Mapped[bool] = mapped_column(Boolean, default=True, server_default=text("true"))
    includes_disposal: Mapped[bool] = mapped_column(Boolean, default=True, server_default=text("true"))
    includes_taxes: Mapped[bool] = mapped_column(Boolean, default=True, server_default=text("true"))
    availability_note: Mapped[Optional[str]] = mapped_column(String(200))
    status: Mapped[str] = mapped_column(String(20), default="draft", server_default="draft")
    valid_from: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    valid_until: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, server_default=text("false"))

    shop: Mapped[Shop] = relationship(back_populates="offers")


class Prospect(Base, Timestamps):
    """A shop we may call. Imported from a real list; never created from planning counts."""
    __tablename__ = "prospects"
    __table_args__ = (
        CheckConstraint(_in("contact_status", PROSPECT_STATUSES), name="ck_prospects_status"),
        Index("ix_prospects_city_status", "city_id", "contact_status"),
    )

    id: Mapped[uuid.UUID] = pk()
    city_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("cities.id", ondelete="RESTRICT"))
    subarea_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("location_subareas.id", ondelete="SET NULL"))
    business_name: Mapped[str] = mapped_column(String(200))
    address: Mapped[Optional[str]] = mapped_column(String(240))
    phone: Mapped[Optional[str]] = mapped_column(String(32))
    email: Mapped[Optional[str]] = mapped_column(String(200))
    website: Mapped[Optional[str]] = mapped_column(String(300))
    import_source: Mapped[Optional[str]] = mapped_column(String(200))
    contact_status: Mapped[str] = mapped_column(String(20), default="not_contacted", server_default="not_contacted")
    last_contacted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    converted_shop_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("shops.id", ondelete="SET NULL"))
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, server_default=text("false"))
    notes: Mapped[Optional[str]] = mapped_column(Text)


# --------------------------------------------------------------------------- leads, quotes, installs

class Lead(Base, Timestamps):
    __tablename__ = "leads"
    __table_args__ = (
        CheckConstraint(_in("status", LEAD_STATUSES), name="ck_leads_status"),
        CheckConstraint(_in("lead_origin", LEAD_ORIGINS), name="ck_leads_origin"),
        CheckConstraint(_in("need_type", NEED_TYPES), name="ck_leads_need_type"),
        CheckConstraint(_in("tire_type", TIRE_TYPES, nullable=True), name="ck_leads_tire_type"),
        CheckConstraint(_in("current_tire_condition", CURRENT_TIRE_CONDITIONS, nullable=True), name="ck_leads_tire_condition"),
        CheckConstraint(_in("priority", PRIORITIES, nullable=True), name="ck_leads_priority"),
        CheckConstraint(_in("budget", BUDGETS, nullable=True), name="ck_leads_budget"),
        CheckConstraint(_in("urgency", URGENCIES, nullable=True), name="ck_leads_urgency"),
        CheckConstraint(_in("preferred_contact_method", CONTACT_METHODS), name="ck_leads_contact_method"),
        CheckConstraint("consent_given", name="ck_leads_consent_required"),
        Index("ix_leads_requested_city_status", "requested_city_id", "status"),
        Index("ix_leads_assigned_shop", "assigned_shop_id"),
        Index("ix_leads_created_at", "created_at"),
        Index("ix_leads_phone", "phone"),
    )

    id: Mapped[uuid.UUID] = pk()
    # Client-generated key: resubmitting / refreshing can never create a second lead.
    idempotency_key: Mapped[str] = mapped_column(String(64), unique=True)
    status: Mapped[str] = mapped_column(String(30), default="new", server_default="new")
    # shop_organic leads are never counted as Tires4Today referrals.
    lead_origin: Mapped[str] = mapped_column(String(20), default="tires4today", server_default="tires4today")
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, server_default=text("false"))

    # Four separate location concepts (Addendum B).
    requested_city_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("cities.id", ondelete="RESTRICT"))
    requested_subarea_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("location_subareas.id", ondelete="SET NULL"))
    landing_city_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("cities.id", ondelete="SET NULL"))
    driver_postal_code: Mapped[Optional[str]] = mapped_column(String(12))
    driver_location_text: Mapped[Optional[str]] = mapped_column(String(160))
    # Preference for operator review only - not an enforced radius.
    travel_radius_km: Mapped[Optional[int]] = mapped_column(Integer)

    need_type: Mapped[str] = mapped_column(String(20))
    needs_new_tires: Mapped[Optional[bool]] = mapped_column(Boolean)
    issue_description: Mapped[Optional[str]] = mapped_column(Text)
    guidance_needed: Mapped[bool] = mapped_column(Boolean, default=False, server_default=text("false"))

    vehicle_year: Mapped[Optional[int]] = mapped_column(Integer)
    vehicle_make: Mapped[Optional[str]] = mapped_column(String(80))
    vehicle_model: Mapped[Optional[str]] = mapped_column(String(80))
    vehicle_trim: Mapped[Optional[str]] = mapped_column(String(120))
    tire_size: Mapped[Optional[str]] = mapped_column(String(40))
    tire_size_normalized: Mapped[Optional[str]] = mapped_column(String(20), index=True)
    tire_size_source: Mapped[Optional[str]] = mapped_column(String(10))
    tire_type: Mapped[Optional[str]] = mapped_column(String(20))
    current_tire_condition: Mapped[Optional[str]] = mapped_column(String(20))

    priority: Mapped[Optional[str]] = mapped_column(String(30))
    budget: Mapped[Optional[str]] = mapped_column(String(20))
    urgency: Mapped[Optional[str]] = mapped_column(String(20))

    first_name: Mapped[str] = mapped_column(String(80))
    phone: Mapped[str] = mapped_column(String(32))
    email: Mapped[Optional[str]] = mapped_column(String(200))
    preferred_contact_method: Mapped[str] = mapped_column(String(10), default="text", server_default="text")
    consent_given: Mapped[bool] = mapped_column(Boolean)
    consent_text: Mapped[str] = mapped_column(Text)
    consent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    locale: Mapped[str] = mapped_column(String(10), default="en-CA", server_default="en-CA")
    notes: Mapped[Optional[str]] = mapped_column(Text)

    # Original attribution: written once at creation, never overwritten by later city changes.
    attr_city: Mapped[Optional[str]] = mapped_column(String(120))
    attr_source: Mapped[Optional[str]] = mapped_column(String(200))
    attr_campaign: Mapped[Optional[str]] = mapped_column(String(200))
    attr_shop: Mapped[Optional[str]] = mapped_column(String(160))
    attr_package: Mapped[Optional[str]] = mapped_column(String(120))
    attr_price: Mapped[Optional[str]] = mapped_column(String(40))
    utm_source: Mapped[Optional[str]] = mapped_column(String(200))
    utm_medium: Mapped[Optional[str]] = mapped_column(String(200))
    utm_campaign: Mapped[Optional[str]] = mapped_column(String(200))
    referrer_url: Mapped[Optional[str]] = mapped_column(Text)
    landing_url: Mapped[Optional[str]] = mapped_column(Text)
    attribution_raw: Mapped[dict] = mapped_column(JSONB, server_default=text("'{}'::jsonb"))

    # Routing.
    shop_link_shop_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("shops.id", ondelete="SET NULL"))
    selected_offer_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("shop_offers.id", ondelete="SET NULL"))
    selected_offer_snapshot: Mapped[Optional[dict]] = mapped_column(JSONB)
    assigned_shop_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("shops.id", ondelete="SET NULL"))
    routing_reason: Mapped[Optional[str]] = mapped_column(String(40))
    shop_alert_sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    shop_confirmed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    shop_confirmation: Mapped[Optional[dict]] = mapped_column(JSONB)
    lost_reason: Mapped[Optional[str]] = mapped_column(String(200))


class LeadAdditionalCity(Base):
    """Nearby cities the driver explicitly opted into. Never inferred from market groups."""
    __tablename__ = "lead_additional_cities"

    lead_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("leads.id", ondelete="CASCADE"), primary_key=True)
    city_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("cities.id", ondelete="CASCADE"), primary_key=True)


class LeadEvent(Base):
    """Append-only audit / booking trail for a lead."""
    __tablename__ = "lead_events"
    __table_args__ = (Index("ix_lead_events_lead_created", "lead_id", "created_at"),)

    id: Mapped[uuid.UUID] = pk()
    lead_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("leads.id", ondelete="CASCADE"))
    event_type: Mapped[str] = mapped_column(String(60))
    actor: Mapped[Optional[str]] = mapped_column(String(120))
    payload: Mapped[dict] = mapped_column(JSONB, server_default=text("'{}'::jsonb"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Quote(Base, Timestamps):
    __tablename__ = "quotes"
    __table_args__ = (
        CheckConstraint(_in("status", QUOTE_STATUSES), name="ck_quotes_status"),
        CheckConstraint(_in("package_type", PACKAGE_TYPES), name="ck_quotes_package"),
        CheckConstraint(_in("condition", TIRE_CONDITIONS), name="ck_quotes_condition"),
        CheckConstraint("price_all_in_cents > 0", name="ck_quotes_price"),
        # A sent quote always carries its 72-hour expiry.
        CheckConstraint("sent_at IS NULL OR expires_at IS NOT NULL", name="ck_quotes_expiry"),
        Index("ix_quotes_lead", "lead_id"),
        Index("ix_quotes_shop_status", "shop_id", "status"),
    )

    id: Mapped[uuid.UUID] = pk()
    lead_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("leads.id", ondelete="CASCADE"))
    shop_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("shops.id", ondelete="RESTRICT"))
    offer_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("shop_offers.id", ondelete="SET NULL"))
    public_token: Mapped[str] = mapped_column(String(64), unique=True)
    status: Mapped[str] = mapped_column(String(20), default="draft", server_default="draft")
    package_type: Mapped[str] = mapped_column(String(20))
    tire_count: Mapped[int] = mapped_column(Integer)
    brand: Mapped[str] = mapped_column(String(80))
    condition: Mapped[str] = mapped_column(String(10))
    tire_size: Mapped[str] = mapped_column(String(40))
    price_all_in_cents: Mapped[int] = mapped_column(Integer)
    appointment_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    counter_contact_name: Mapped[Optional[str]] = mapped_column(String(120))
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    accepted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, server_default=text("false"))


class Install(Base, Timestamps):
    __tablename__ = "installs"
    __table_args__ = (
        CheckConstraint(_in("payment_status", PAYMENT_STATUSES), name="ck_installs_payment_status"),
        CheckConstraint(_in("package_type", PACKAGE_TYPES), name="ck_installs_package"),
        CheckConstraint("referral_fee_cents >= 0", name="ck_installs_fee"),
        Index("ix_installs_shop_week", "shop_id", "statement_week_start"),
        Index("ix_installs_payment_status", "payment_status"),
    )

    id: Mapped[uuid.UUID] = pk()
    lead_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("leads.id", ondelete="RESTRICT"), unique=True)
    quote_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("quotes.id", ondelete="RESTRICT"), unique=True)
    shop_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("shops.id", ondelete="RESTRICT"))
    package_type: Mapped[str] = mapped_column(String(20))
    tire_size: Mapped[str] = mapped_column(String(40))
    install_value_cents: Mapped[int] = mapped_column(Integer)
    referral_fee_cents: Mapped[int] = mapped_column(Integer)
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    statement_week_start: Mapped[date] = mapped_column(Date)
    payment_status: Mapped[str] = mapped_column(String(20), default="pending", server_default="pending")
    paid_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, server_default=text("false"))
    notes: Mapped[Optional[str]] = mapped_column(Text)


class InterestRegistration(Base):
    """'Coming soon' interest. Separate from leads: never routed, never counted as a booking."""
    __tablename__ = "interest_registrations"
    __table_args__ = (Index("ix_interest_city", "city_id"),)

    id: Mapped[uuid.UUID] = pk()
    city_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("cities.id", ondelete="CASCADE"))
    subarea_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("location_subareas.id", ondelete="SET NULL"))
    first_name: Mapped[Optional[str]] = mapped_column(String(80))
    email: Mapped[Optional[str]] = mapped_column(String(200))
    phone: Mapped[Optional[str]] = mapped_column(String(32))
    consent_given: Mapped[bool] = mapped_column(Boolean)
    consent_text: Mapped[str] = mapped_column(Text)
    locale: Mapped[str] = mapped_column(String(10), default="en-CA", server_default="en-CA")
    attribution_raw: Mapped[dict] = mapped_column(JSONB, server_default=text("'{}'::jsonb"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
