"""Initial schema"
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";")
    user_role = sa.Enum("superadmin", "manager", "client", name="user_role")
    trip_status = sa.Enum("scheduled", "in_transit", "completed", "cancelled", name="trip_status")
    space_status = sa.Enum("available", "reserved", "blocked", "on_hold", "internal", name="space_status")
    reservation_status = sa.Enum("pending", "confirmed", "cancelled", name="reservation_status")
    payment_method = sa.Enum("cash", "bank_transfer", "mercadopago", name="payment_method")
    payment_status = sa.Enum("unpaid", "pending_review", "paid", "refunded", name="payment_status")
    document_type = sa.Enum(
        "fianza", "contrato", "etiquetas", "comprobante_pago", "constancia_fiscal", "otro", name="document_type"
    )

    user_role.create(op.get_bind(), checkfirst=True)
    trip_status.create(op.get_bind(), checkfirst=True)
    space_status.create(op.get_bind(), checkfirst=True)
    reservation_status.create(op.get_bind(), checkfirst=True)
    payment_method.create(op.get_bind(), checkfirst=True)
    payment_status.create(op.get_bind(), checkfirst=True)
    document_type.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("email", sa.String(length=255), nullable=False, unique=True),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("phone", sa.String(length=20)),
        sa.Column("role", user_role, nullable=False, server_default="client"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("is_verified", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP")),
    )
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_users_role", "users", ["role"])
    op.create_index("ix_users_is_active", "users", ["is_active"])

    op.create_table(
        "client_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("business_name", sa.String(length=255)),
        sa.Column("rfc", sa.String(length=13)),
        sa.Column("cfdi_use", sa.String(length=10)),
        sa.Column("fiscal_zip_code", sa.String(length=5)),
        sa.Column("invoice_email", sa.String(length=255)),
        sa.Column("contact_phone", sa.String(length=20)),
        sa.Column("fiscal_constancy_path", sa.String(length=500)),
        sa.Column("is_fiscal_verified", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP")),
    )

    op.create_table(
        "trips",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("origin", sa.String(length=255), nullable=False),
        sa.Column("destination", sa.String(length=255), nullable=False),
        sa.Column("departure_date", sa.Date(), nullable=False),
        sa.Column("departure_time", sa.Time()),
        sa.Column("status", trip_status, nullable=False, server_default="scheduled"),
        sa.Column("total_spaces", sa.Integer(), nullable=False),
        sa.Column("price_per_space", sa.Numeric(10, 2), nullable=False),
        sa.Column("individual_pricing", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("tax_included", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("tax_rate", sa.Numeric(5, 4), nullable=False, server_default=sa.text("0.16")),
        sa.Column("payment_deadline_hours", sa.Integer(), nullable=False, server_default=sa.text("24")),
        sa.Column("notes_internal", sa.Text()),
        sa.Column("notes_public", sa.Text()),
        sa.Column("truck_identifier", sa.String(length=50)),
        sa.Column("trailer_identifier", sa.String(length=50)),
        sa.Column("truck_plate", sa.String(length=20)),
        sa.Column("trailer_plate", sa.String(length=20)),
        sa.Column("driver_name", sa.String(length=255)),
        sa.Column("driver_phone", sa.String(length=20)),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP")),
    )

    op.create_table(
        "spaces",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("trip_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("trips.id", ondelete="CASCADE"), nullable=False),
        sa.Column("space_number", sa.Integer(), nullable=False),
        sa.Column("status", space_status, nullable=False, server_default="available"),
        sa.Column("price", sa.Numeric(10, 2)),
        sa.Column("hold_expires_at", sa.DateTime(timezone=True)),
        sa.Column("held_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP")),
    )
    op.create_index("ix_spaces_trip", "spaces", ["trip_id"])
    op.create_index("ix_spaces_status", "spaces", ["status"])

    op.create_table(
        "reservations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("client_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("trip_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("trips.id"), nullable=False),
        sa.Column("status", reservation_status, nullable=False, server_default="pending"),
        sa.Column("payment_method", payment_method, nullable=False),
        sa.Column("payment_status", payment_status, nullable=False, server_default="unpaid"),
        sa.Column("subtotal", sa.Numeric(10, 2), nullable=False),
        sa.Column("tax_amount", sa.Numeric(10, 2), nullable=False, server_default=sa.text("0")),
        sa.Column("total_amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("discount_amount", sa.Numeric(10, 2), nullable=False, server_default=sa.text("0")),
        sa.Column("discount_reason", sa.String(length=255)),
        sa.Column("cargo_type", sa.String(length=100)),
        sa.Column("cargo_description", sa.Text()),
        sa.Column("cargo_weight", sa.Numeric(10, 2)),
        sa.Column("cargo_value", sa.Numeric(12, 2)),
        sa.Column("requires_invoice", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("invoice_pdf_path", sa.String(length=500)),
        sa.Column("invoice_xml_path", sa.String(length=500)),
        sa.Column("ticket_pdf_path", sa.String(length=500)),
        sa.Column("payment_proof_path", sa.String(length=500)),
        sa.Column("payment_confirmed_at", sa.DateTime(timezone=True)),
        sa.Column("payment_confirmed_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP")),
    )

    op.create_table(
        "reservation_spaces",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("reservation_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("reservations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("space_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("spaces.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.UniqueConstraint("reservation_id", "space_id"),
    )

    op.create_table(
        "client_documents",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("client_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("reservation_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("reservations.id", ondelete="SET NULL")),
        sa.Column("doc_type", document_type, nullable=False),
        sa.Column("filename", sa.String(length=255), nullable=False),
        sa.Column("file_path", sa.String(length=500), nullable=False),
        sa.Column("expires_at", sa.Date()),
        sa.Column("is_approved", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("approved_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.Column("approved_at", sa.DateTime(timezone=True)),
        sa.Column("rejection_reason", sa.String(length=500)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP")),
    )

    op.create_table(
        "system_config",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("key", sa.String(length=100), nullable=False, unique=True),
        sa.Column("value", sa.Text(), nullable=False),
        sa.Column("value_type", sa.String(length=20), nullable=False, server_default="string"),
        sa.Column("description", sa.String(length=500)),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
    )

    op.create_table(
        "audit_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.Column("action", sa.String(length=100), nullable=False),
        sa.Column("entity_type", sa.String(length=50), nullable=False),
        sa.Column("entity_id", postgresql.UUID(as_uuid=True)),
        sa.Column("old_values", postgresql.JSONB()),
        sa.Column("new_values", postgresql.JSONB()),
        sa.Column("ip_address", postgresql.INET()),
        sa.Column("user_agent", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP")),
    )

    op.create_table(
        "messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("sender_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("recipient_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("reservation_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("reservations.id")),
        sa.Column("subject", sa.String(length=255)),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("read_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP")),
    )


def downgrade() -> None:
    op.drop_table("messages")
    op.drop_table("audit_logs")
    op.drop_table("system_config")
    op.drop_table("client_documents")
    op.drop_table("reservation_spaces")
    op.drop_table("reservations")
    op.drop_table("spaces")
    op.drop_table("trips")
    op.drop_table("client_profiles")
    op.drop_table("users")

    for enum in [
        "document_type",
        "payment_status",
        "payment_method",
        "reservation_status",
        "space_status",
        "trip_status",
        "user_role",
    ]:
        op.execute(sa.text(f"DROP TYPE IF EXISTS {enum}"))
