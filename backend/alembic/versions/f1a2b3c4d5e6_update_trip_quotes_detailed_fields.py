"""update_trip_quotes_detailed_fields

Revision ID: f1a2b3c4d5e6
Revises: beead64cb52a
Create Date: 2025-12-10 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'f1a2b3c4d5e6'
down_revision = 'beead64cb52a'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Add new columns
    op.add_column('trip_quotes', sa.Column('stops', sa.JSON(), nullable=True))
    op.add_column('trip_quotes', sa.Column('merchandise_type', sa.String(length=100), nullable=True))
    op.add_column('trip_quotes', sa.Column('merchandise_weight', sa.String(length=50), nullable=True))
    op.add_column('trip_quotes', sa.Column('merchandise_description', sa.Text(), nullable=True))
    op.add_column('trip_quotes', sa.Column('requires_labeling', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('trip_quotes', sa.Column('requires_pickup', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('trip_quotes', sa.Column('pickup_date', sa.DateTime(timezone=True), nullable=True))
    op.add_column('trip_quotes', sa.Column('free_stops', sa.Integer(), nullable=True, server_default='0'))
    op.add_column('trip_quotes', sa.Column('price_per_extra_stop', sa.Numeric(precision=10, scale=2), nullable=True))
    
    # Drop old columns
    op.drop_column('trip_quotes', 'tiradas')
    op.drop_column('trip_quotes', 'free_tiradas')
    op.drop_column('trip_quotes', 'price_per_extra_tirada')

def downgrade() -> None:
    # Reverse operations
    op.add_column('trip_quotes', sa.Column('price_per_extra_tirada', sa.Numeric(precision=10, scale=2), autoincrement=False, nullable=True))
    op.add_column('trip_quotes', sa.Column('free_tiradas', sa.Integer(), server_default=sa.text('0'), autoincrement=False, nullable=True))
    op.add_column('trip_quotes', sa.Column('tiradas', sa.Integer(), server_default=sa.text('0'), autoincrement=False, nullable=True))
    
    op.drop_column('trip_quotes', 'price_per_extra_stop')
    op.drop_column('trip_quotes', 'free_stops')
    op.drop_column('trip_quotes', 'pickup_date')
    op.drop_column('trip_quotes', 'requires_pickup')
    op.drop_column('trip_quotes', 'requires_labeling')
    op.drop_column('trip_quotes', 'merchandise_description')
    op.drop_column('trip_quotes', 'merchandise_weight')
    op.drop_column('trip_quotes', 'merchandise_type')
    op.drop_column('trip_quotes', 'stops')
