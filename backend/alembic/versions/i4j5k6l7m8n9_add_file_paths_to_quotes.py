"""Add file path columns to trip_quotes

Revision ID: i4j5k6l7m8n9
Revises: h3i4j5k6l7m8
Create Date: 2026-01-17 09:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'i4j5k6l7m8n9'
down_revision: Union[str, None] = 'h3i4j5k6l7m8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add labeling_file_path column
    op.add_column('trip_quotes', sa.Column('labeling_file_path', sa.String(500), nullable=True))
    
    # Add bond_file_path column
    op.add_column('trip_quotes', sa.Column('bond_file_path', sa.String(500), nullable=True))


def downgrade() -> None:
    op.drop_column('trip_quotes', 'bond_file_path')
    op.drop_column('trip_quotes', 'labeling_file_path')
