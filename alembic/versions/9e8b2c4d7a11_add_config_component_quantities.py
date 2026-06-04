"""add config component quantities

Revision ID: 9e8b2c4d7a11
Revises: 46cd05edcf1b
Create Date: 2026-06-04 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "9e8b2c4d7a11"
down_revision: Union[str, Sequence[str], None] = "46cd05edcf1b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    existing_columns = {column["name"] for column in sa.inspect(op.get_bind()).get_columns("config")}

    if "cpu_quantity" not in existing_columns:
        op.add_column("config", sa.Column("cpu_quantity", sa.Integer(), nullable=False, server_default="1"))
    if "cpu_component_ids" not in existing_columns:
        op.add_column("config", sa.Column("cpu_component_ids", sa.Text(), nullable=True))
    if "gpu_quantity" not in existing_columns:
        op.add_column("config", sa.Column("gpu_quantity", sa.Integer(), nullable=False, server_default="1"))
    if "gpu_component_ids" not in existing_columns:
        op.add_column("config", sa.Column("gpu_component_ids", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("config", "gpu_component_ids")
    op.drop_column("config", "gpu_quantity")
    op.drop_column("config", "cpu_component_ids")
    op.drop_column("config", "cpu_quantity")
