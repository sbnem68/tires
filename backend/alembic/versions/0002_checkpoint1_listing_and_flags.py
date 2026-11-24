"""Checkpoint 1: verification flags, per-city SEO control, event notes, review-city listing.

Revision ID: 0002
Revises: 0001
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

REVIEW_CITIES = "('ottawa', 'toronto', 'hamilton')"


def upgrade() -> None:
    # 3.1 Tax settings are unverified placeholders until Sam verifies them.
    op.add_column("province_configs", sa.Column(
        "tax_components_verified", sa.Boolean(), server_default=sa.text("false"), nullable=False))
    # Per-page indexing control. A page is indexable only if this is true AND the city is live
    # AND site-wide indexing is enabled.
    op.add_column("cities", sa.Column(
        "seo_indexable", sa.Boolean(), server_default=sa.text("false"), nullable=False))
    # 3.4 lead_events: timestamp, actor, event type, optional notes.
    op.add_column("lead_events", sa.Column("notes", sa.Text(), nullable=True))

    # Ottawa is the pilot city: onboarding, NOT live.
    op.execute("UPDATE cities SET launch_status = 'onboarding', updated_at = now() "
               "WHERE slug = 'ottawa' AND launch_status = 'planned'")
    # Only the three review cities get a public page. The other 25 stay unlisted.
    op.execute(f"UPDATE cities SET public_listing_enabled = true, updated_at = now() WHERE slug IN {REVIEW_CITIES}")


def downgrade() -> None:
    op.execute(f"UPDATE cities SET public_listing_enabled = false WHERE slug IN {REVIEW_CITIES}")
    op.execute("UPDATE cities SET launch_status = 'planned' WHERE slug = 'ottawa' AND launch_status = 'onboarding'")
    op.drop_column("lead_events", "notes")
    op.drop_column("cities", "seo_indexable")
    op.drop_column("province_configs", "tax_components_verified")
