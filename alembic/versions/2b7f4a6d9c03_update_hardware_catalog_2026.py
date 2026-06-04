"""update hardware catalog 2026

Revision ID: 2b7f4a6d9c03
Revises: 9e8b2c4d7a11
Create Date: 2026-06-04 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "2b7f4a6d9c03"
down_revision: Union[str, Sequence[str], None] = "9e8b2c4d7a11"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name != "mysql":
        return

    def execute(statement: str, params: dict[str, str] | None = None) -> None:
        bind.execute(sa.text(statement), params or {})

    era = execute_scalar(bind, "SELECT `value` FROM settings WHERE `key` = 'hardware_data_era' LIMIT 1")

    execute(
        """
        DELETE gm
        FROM gpumodel gm
        JOIN gpubrand gb ON gb.id = gm.gpu_brand_id
        LEFT JOIN gpu g ON g.gpu_model_id = gm.id
        WHERE gb.name = '3dfx'
          AND gm.name = 'Voodoo 2 SLI'
          AND g.id IS NULL
        """
    )

    if era in {"retro", "retroextended"}:
        for name, brand in (
            ("Duron", "AMD"),
            ("Celeron", "Intel"),
        ):
            execute(
                """
                INSERT INTO cpufamily (name, cpu_brand_id)
                SELECT :name, id FROM cpubrand WHERE name = :brand
                ON DUPLICATE KEY UPDATE name = VALUES(name)
                """,
                {"name": name, "brand": brand},
            )

        for name, brand in (
            ("TNT2 M64", "NVIDIA"),
            ("TNT2 Pro", "NVIDIA"),
            ("TNT2 Ultra", "NVIDIA"),
        ):
            execute(
                """
                INSERT INTO gpumodel (name, gpu_brand_id)
                SELECT :name, id FROM gpubrand WHERE name = :brand
                ON DUPLICATE KEY UPDATE name = VALUES(name)
                """,
                {"name": name, "brand": brand},
            )

    if era == "modern":
        for name, brand in (
            ("GeForce 200 Series", "NVIDIA"),
            ("GeForce 400 Series", "NVIDIA"),
            ("GeForce 500 Series", "NVIDIA"),
            ("GeForce 600 Series", "NVIDIA"),
            ("GeForce 700 Series", "NVIDIA"),
            ("GeForce 900 Series", "NVIDIA"),
            ("GeForce 50 Series (RTX 5000)", "NVIDIA"),
            ("Radeon RX 9000 Series", "AMD"),
            ("Intel Arc B-Series", "Intel"),
            ("Intel Arc Pro B-Series", "Intel"),
        ):
            execute(
                """
                INSERT INTO gpumodel (name, gpu_brand_id)
                SELECT :name, id FROM gpubrand WHERE name = :brand
                ON DUPLICATE KEY UPDATE name = VALUES(name)
                """,
                {"name": name, "brand": brand},
            )


def execute_scalar(bind: sa.engine.Connection, statement: str) -> str | None:
    return bind.execute(sa.text(statement)).scalar()


def downgrade() -> None:
    # Keep catalog rows on downgrade; deleting shared lookup data is riskier than leaving it.
    pass
