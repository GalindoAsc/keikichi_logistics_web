"""add labeling bond pickup fields to quotes

Revision ID: h3i4j5k6l7m8
Revises: g2h3i4j5k6l7
Create Date: 2026-01-17 08:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'h3i4j5k6l7m8'
down_revision: Union[str, None] = 'g2h3i4j5k6l7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Labeling fields
    op.add_column('trip_quotes', sa.Column('labeling_type', sa.String(20), nullable=True))
    op.add_column('trip_quotes', sa.Column('labeling_size', sa.String(100), nullable=True))
    op.add_column('trip_quotes', sa.Column('labeling_quantity', sa.Integer(), nullable=True))
    
    # Bond type
    op.add_column('trip_quotes', sa.Column('bond_type', sa.String(20), nullable=True))
    
    # Pickup additional fields
    op.add_column('trip_quotes', sa.Column('pickup_address_reference', sa.Text(), nullable=True))
    op.add_column('trip_quotes', sa.Column('pickup_contact_name', sa.String(255), nullable=True))
    op.add_column('trip_quotes', sa.Column('pickup_contact_phone', sa.String(50), nullable=True))
    op.add_column('trip_quotes', sa.Column('pickup_notes', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('trip_quotes', 'pickup_notes')
    op.drop_column('trip_quotes', 'pickup_contact_phone')
    op.drop_column('trip_quotes', 'pickup_contact_name')
    op.drop_column('trip_quotes', 'pickup_address_reference')
    op.drop_column('trip_quotes', 'bond_type')
    op.drop_column('trip_quotes', 'labeling_quantity')
    op.drop_column('trip_quotes', 'labeling_size')
    op.drop_column('trip_quotes', 'labeling_type')
