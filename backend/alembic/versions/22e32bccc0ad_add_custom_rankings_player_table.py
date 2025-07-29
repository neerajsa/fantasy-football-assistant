"""Add custom rankings player table

Revision ID: 22e32bccc0ad
Revises: ad6d72065edb
Create Date: 2025-07-29 08:42:36.881361

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '22e32bccc0ad'
down_revision: Union[str, None] = 'ad6d72065edb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create custom_rankings_players table
    op.create_table('custom_rankings_players',
    sa.Column('id', sa.dialects.postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('player_name', sa.String(length=100), nullable=False),
    sa.Column('position', sa.String(length=10), nullable=False),
    sa.Column('team', sa.String(length=10), nullable=False),
    sa.Column('ecr_rank_standard', sa.Integer(), nullable=True),
    sa.Column('ecr_rank_ppr', sa.Integer(), nullable=True),
    sa.Column('ecr_rank_half_ppr', sa.Integer(), nullable=True),
    sa.Column('adp_standard', sa.Numeric(precision=5, scale=2), nullable=True),
    sa.Column('adp_ppr', sa.Numeric(precision=5, scale=2), nullable=True),
    sa.Column('adp_half_ppr', sa.Numeric(precision=5, scale=2), nullable=True),
    sa.Column('previous_year_points_standard', sa.Numeric(precision=6, scale=2), nullable=True),
    sa.Column('previous_year_points_ppr', sa.Numeric(precision=6, scale=2), nullable=True),
    sa.Column('previous_year_points_half_ppr', sa.Numeric(precision=6, scale=2), nullable=True),
    sa.Column('last_updated', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    # Drop custom_rankings_players table
    op.drop_table('custom_rankings_players')
