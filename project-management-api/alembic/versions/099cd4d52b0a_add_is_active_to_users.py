"""Add is_active to users

Revision ID: 099cd4d52b0a
Revises: 0c5c20e21d57
Create Date: 2025-11-18 12:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '099cd4d52b0a'
down_revision: Union[str, Sequence[str], None] = '0c5c20e21d57'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ✅ FIX: Added server_default=sa.text('true') to populate existing rows
    op.add_column('users', sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False))


def downgrade() -> None:
    op.drop_column('users', 'is_active')