"""update_trip_quotes_detailed_fields

Revision ID: f1a2b3c4d5e6
Revises: beead64cb52a
Create Date: 2025-12-10 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = 'f1a2b3c4d5e6'
down_revision = 'beead64cb52a'
branch_labels = None
depends_on = None

def upgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)
    
    # Get list of existing columns
    columns = [c['name'] for c in inspector.get_columns('trip_quotes')]

    # Add new columns if they don't exist
    if 'stops' not in columns:
        op.add_column('trip_quotes', sa.Column('stops', sa.JSON(), nullable=True))
        
    if 'merchandise_type' not in columns:
        op.add_column('trip_quotes', sa.Column('merchandise_type', sa.String(length=100), nullable=True))
        
    if 'merchandise_weight' not in columns:
        op.add_column('trip_quotes', sa.Column('merchandise_weight', sa.String(length=50), nullable=True))
        
    if 'merchandise_description' not in columns:
        op.add_column('trip_quotes', sa.Column('merchandise_description', sa.Text(), nullable=True))
        
    if 'requires_labeling' not in columns:
        op.add_column('trip_quotes', sa.Column('requires_labeling', sa.Boolean(), nullable=False, server_default='false'))
        
    if 'requires_pickup' not in columns:
        op.add_column('trip_quotes', sa.Column('requires_pickup', sa.Boolean(), nullable=False, server_default='false'))
        
    if 'pickup_date' not in columns:
        op.add_column('trip_quotes', sa.Column('pickup_date', sa.DateTime(timezone=True), nullable=True))
        
    if 'free_stops' not in columns:
        op.add_column('trip_quotes', sa.Column('free_stops', sa.Integer(), nullable=True, server_default='0'))
        
    if 'price_per_extra_stop' not in columns:
        op.add_column('trip_quotes', sa.Column('price_per_extra_stop', sa.Numeric(precision=10, scale=2), nullable=True))
    
    # Drop old columns if they exist
    if 'tiradas' in columns:
        op.drop_column('trip_quotes', 'tiradas')
        
    if 'free_tiradas' in columns:
        op.drop_column('trip_quotes', 'free_tiradas')
        
    if 'price_per_extra_tirada' in columns:
        op.drop_column('trip_quotes', 'price_per_extra_tirada')

def downgrade() -> None:
    # Downgrade logic omitted for safety in forward-fix scenario
    pass
