"""add benchmark result settings

Revision ID: 5c4d8f1a2b90
Revises: 7f3c9d2e1b80
Create Date: 2026-07-14 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "5c4d8f1a2b90"
down_revision: Union[str, Sequence[str], None] = "7f3c9d2e1b80"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    existing_columns = {column["name"] for column in sa.inspect(op.get_bind()).get_columns("benchmarkresult")}

    if "settings" not in existing_columns:
        op.add_column("benchmarkresult", sa.Column("settings", sa.Text(), nullable=True))


def downgrade() -> None:
    existing_columns = {column["name"] for column in sa.inspect(op.get_bind()).get_columns("benchmarkresult")}

    if "settings" in existing_columns:
        op.drop_column("benchmarkresult", "settings")
