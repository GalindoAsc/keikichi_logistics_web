"""create_trip_quotes_table

Revision ID: d5e6f7a8b9c0
Revises: beead64cb52a
Create Date: 2025-12-09 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = 'd5e6f7a8b9c0'
down_revision = 'beead64cb52a'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)
    tables = inspector.get_table_names()

    # Only create if table doesn't exist
    if 'trip_quotes' not in tables:
        # Create the quote_status enum if it doesn't exist
        quote_status = postgresql.ENUM(
            'pending', 'quoted', 'negotiating', 'accepted', 'rejected',
            name='quote_status',
            create_type=False
        )
        quote_status.create(conn, checkfirst=True)

        op.create_table(
            'trip_quotes',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column('client_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),

            # Trip details
            sa.Column('origin', sa.String(255), nullable=False),
            sa.Column('destination', sa.String(255), nullable=False),
            sa.Column('is_international', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('pallet_count', sa.Integer(), nullable=False),
            sa.Column('preferred_date', sa.Date(), nullable=False),
            sa.Column('flexible_dates', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('preferred_currency', sa.String(3), nullable=False, server_default='USD'),

            # Stops (JSON array)
            sa.Column('stops', sa.JSON(), nullable=True),

            # International options
            sa.Column('requires_bond', sa.Boolean(), nullable=False, server_default='false'),

            # Merchandise details
            sa.Column('merchandise_type', sa.String(100), nullable=True),
            sa.Column('merchandise_weight', sa.String(50), nullable=True),
            sa.Column('merchandise_description', sa.Text(), nullable=True),

            # Services
            sa.Column('requires_refrigeration', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('temperature_min', sa.Numeric(5, 2), nullable=True),
            sa.Column('temperature_max', sa.Numeric(5, 2), nullable=True),
            sa.Column('requires_labeling', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('requires_pickup', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('pickup_address', sa.Text(), nullable=True),
            sa.Column('pickup_date', sa.DateTime(timezone=True), nullable=True),

            # Special requirements
            sa.Column('special_requirements', sa.Text(), nullable=True),

            # Admin quote
            sa.Column('quoted_price', sa.Numeric(12, 2), nullable=True),
            sa.Column('quoted_currency', sa.String(3), nullable=True),
            sa.Column('free_stops', sa.Integer(), nullable=True, server_default='0'),
            sa.Column('price_per_extra_stop', sa.Numeric(10, 2), nullable=True),
            sa.Column('admin_notes', sa.Text(), nullable=True),
            sa.Column('quoted_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
            sa.Column('quoted_at', sa.DateTime(timezone=True), nullable=True),

            # Status and client response
            sa.Column('status', sa.Enum('pending', 'quoted', 'negotiating', 'accepted', 'rejected', name='quote_status'), nullable=False, server_default='pending'),
            sa.Column('client_response', sa.Text(), nullable=True),

            # Timestamps
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
            sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),

            # Created trip reference
            sa.Column('created_trip_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('trips.id'), nullable=True),
        )

        # Create index on status for faster filtering
        op.create_index('ix_trip_quotes_status', 'trip_quotes', ['status'])
        op.create_index('ix_trip_quotes_client_id', 'trip_quotes', ['client_id'])


def downgrade() -> None:
    op.drop_index('ix_trip_quotes_client_id', table_name='trip_quotes')
    op.drop_index('ix_trip_quotes_status', table_name='trip_quotes')
    op.drop_table('trip_quotes')

    # Drop enum type
    op.execute('DROP TYPE IF EXISTS quote_status')
