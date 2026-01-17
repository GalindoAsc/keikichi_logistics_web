"""create_saved_stops_table

Revision ID: g2h3i4j5k6l7
Revises: f1a2b3c4d5e6
Create Date: 2026-01-16 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'g2h3i4j5k6l7'
down_revision: Union[str, None] = 'f1a2b3c4d5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Crear tabla saved_stops para el catálogo de paradas/tiradas
    op.create_table(
        'saved_stops',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('city', sa.String(length=100), nullable=True),
        sa.Column('state', sa.String(length=100), nullable=True),
        sa.Column('country', sa.String(length=50), nullable=True, default='USA'),
        sa.Column('default_contact', sa.String(length=255), nullable=True),
        sa.Column('default_phone', sa.String(length=50), nullable=True),
        sa.Column('default_schedule', sa.String(length=100), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_saved_stops_id'), 'saved_stops', ['id'], unique=False)
    op.create_index(op.f('ix_saved_stops_name'), 'saved_stops', ['name'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_saved_stops_name'), table_name='saved_stops')
    op.drop_index(op.f('ix_saved_stops_id'), table_name='saved_stops')
    op.drop_table('saved_stops')
