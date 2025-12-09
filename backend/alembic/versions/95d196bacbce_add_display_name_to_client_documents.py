"""add_display_name_to_client_documents

Revision ID: 95d196bacbce
Revises: 1e1fc219b55b
Create Date: 2025-12-01 23:20:11.452985

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '95d196bacbce'
down_revision: Union[str, None] = '1e1fc219b55b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('client_documents', sa.Column('display_name', sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column('client_documents', 'display_name')
