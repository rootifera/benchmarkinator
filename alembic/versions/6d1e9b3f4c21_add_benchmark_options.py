"""add benchmark options

Revision ID: 6d1e9b3f4c21
Revises: 5c4d8f1a2b90
Create Date: 2026-07-14 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "6d1e9b3f4c21"
down_revision: Union[str, Sequence[str], None] = "5c4d8f1a2b90"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    tables = set(sa.inspect(op.get_bind()).get_table_names())
    if "benchmarkoption" not in tables:
        op.create_table(
            "benchmarkoption",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("benchmark_id", sa.Integer(), nullable=False),
            sa.Column("name", sa.String(length=255), nullable=False),
            sa.Column("values", sa.Text(), nullable=False),
            sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
            sa.ForeignKeyConstraint(["benchmark_id"], ["benchmark.id"]),
            sa.PrimaryKeyConstraint("id"),
        )

    existing_columns = {column["name"] for column in sa.inspect(op.get_bind()).get_columns("benchmarkresult")}
    if "option_values" not in existing_columns:
        op.add_column("benchmarkresult", sa.Column("option_values", sa.Text(), nullable=True))


def downgrade() -> None:
    tables = set(sa.inspect(op.get_bind()).get_table_names())
    existing_columns = {column["name"] for column in sa.inspect(op.get_bind()).get_columns("benchmarkresult")}
    if "option_values" in existing_columns:
        op.drop_column("benchmarkresult", "option_values")
    if "benchmarkoption" in tables:
        op.drop_table("benchmarkoption")
