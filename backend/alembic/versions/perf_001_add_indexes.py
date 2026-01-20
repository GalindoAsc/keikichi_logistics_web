"""Add performance indexes for frequently queried columns

Revision ID: perf_001_indexes
Revises: i4j5k6l7m8n9
Create Date: 2026-01-19

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = 'perf_001_indexes'
down_revision = 'i4j5k6l7m8n9'
branch_labels = None
depends_on = None


def upgrade():
    # ReservationSpace indexes - frequently joined
    op.create_index(
        'ix_reservation_spaces_reservation_id',
        'reservation_spaces',
        ['reservation_id']
    )
    op.create_index(
        'ix_reservation_spaces_space_id',
        'reservation_spaces',
        ['space_id']
    )
    
    # Space index - queried by trip_id on every trip view
    op.create_index(
        'ix_spaces_trip_id',
        'spaces',
        ['trip_id']
    )
    
    # Reservation indexes - frequently filtered
    op.create_index(
        'ix_reservations_client_id',
        'reservations',
        ['client_id']
    )
    op.create_index(
        'ix_reservations_trip_id',
        'reservations',
        ['trip_id']
    )
    
    # Composite index for common query pattern
    op.create_index(
        'ix_reservations_trip_status',
        'reservations',
        ['trip_id', 'status']
    )
    
    # Notification index - always queried by user
    op.create_index(
        'ix_notifications_user_id',
        'notifications',
        ['user_id']
    )
    
    # TripQuote index - queried by client and status
    op.create_index(
        'ix_trip_quotes_client_id',
        'trip_quotes',
        ['client_id']
    )
    op.create_index(
        'ix_trip_quotes_status',
        'trip_quotes',
        ['status']
    )


def downgrade():
    op.drop_index('ix_trip_quotes_status', table_name='trip_quotes')
    op.drop_index('ix_trip_quotes_client_id', table_name='trip_quotes')
    op.drop_index('ix_notifications_user_id', table_name='notifications')
    op.drop_index('ix_reservations_trip_status', table_name='reservations')
    op.drop_index('ix_reservations_trip_id', table_name='reservations')
    op.drop_index('ix_reservations_client_id', table_name='reservations')
    op.drop_index('ix_spaces_trip_id', table_name='spaces')
    op.drop_index('ix_reservation_spaces_space_id', table_name='reservation_spaces')
    op.drop_index('ix_reservation_spaces_reservation_id', table_name='reservation_spaces')
