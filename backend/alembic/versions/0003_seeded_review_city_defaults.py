"""Apply Checkpoint 1 review-city defaults after the location seed.

Revision ID: 0003
Revises: 0002
"""
from typing import Sequence, Union

from alembic import op

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


REVIEW_CITIES = "('ottawa', 'toronto', 'hamilton')"


def upgrade() -> None:
    # Revision 0002 may run before the first location seed, so apply its intended
    # review-city defaults once those rows exist.
    op.execute(
        "UPDATE cities SET launch_status = 'onboarding', updated_at = now() "
        "WHERE slug = 'ottawa' AND launch_status = 'planned'"
    )
    op.execute(
        f"UPDATE cities SET public_listing_enabled = true, updated_at = now() "
        f"WHERE slug IN {REVIEW_CITIES} AND public_listing_enabled = false"
    )


def downgrade() -> None:
    op.execute(
        f"UPDATE cities SET public_listing_enabled = false, updated_at = now() "
        f"WHERE slug IN {REVIEW_CITIES} AND public_listing_enabled = true"
    )
    op.execute(
        "UPDATE cities SET launch_status = 'planned', updated_at = now() "
        "WHERE slug = 'ottawa' AND launch_status = 'onboarding'"
    )
