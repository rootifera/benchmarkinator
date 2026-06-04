"""respect hardware era catalog

Revision ID: 7f3c9d2e1b80
Revises: 2b7f4a6d9c03
Create Date: 2026-06-04 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "7f3c9d2e1b80"
down_revision: Union[str, Sequence[str], None] = "2b7f4a6d9c03"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name != "mysql":
        return

    era = bind.execute(
        sa.text("SELECT `value` FROM settings WHERE `key` = 'hardware_data_era' LIMIT 1")
    ).scalar()

    if era in {"retro", "retroextended"}:
        _delete_unused_gpu_models(
            bind,
            "NVIDIA",
            (
                "GeForce 200 Series",
                "GeForce 400 Series",
                "GeForce 500 Series",
                "GeForce 600 Series",
                "GeForce 700 Series",
                "GeForce 900 Series",
                "GeForce 50 Series (RTX 5000)",
            ),
        )
        _delete_unused_gpu_models(bind, "AMD", ("Radeon RX 9000 Series",))
        _delete_unused_gpu_models(bind, "Intel", ("Intel Arc B-Series", "Intel Arc Pro B-Series"))

    if era == "modern":
        _delete_unused_cpu_families(bind, "AMD", ("Duron",))
        _delete_unused_gpu_models(bind, "NVIDIA", ("TNT2 M64", "TNT2 Pro", "TNT2 Ultra"))


def _delete_unused_gpu_models(bind: sa.engine.Connection, brand: str, names: tuple[str, ...]) -> None:
    bind.execute(
        sa.text(
            """
            DELETE gm
            FROM gpumodel gm
            JOIN gpubrand gb ON gb.id = gm.gpu_brand_id
            LEFT JOIN gpu g ON g.gpu_model_id = gm.id
            WHERE gb.name = :brand
              AND gm.name IN :names
              AND g.id IS NULL
            """
        ).bindparams(sa.bindparam("names", expanding=True)),
        {"brand": brand, "names": names},
    )


def _delete_unused_cpu_families(bind: sa.engine.Connection, brand: str, names: tuple[str, ...]) -> None:
    bind.execute(
        sa.text(
            """
            DELETE cf
            FROM cpufamily cf
            JOIN cpubrand cb ON cb.id = cf.cpu_brand_id
            LEFT JOIN cpu c ON c.cpu_family_id = cf.id
            WHERE cb.name = :brand
              AND cf.name IN :names
              AND c.id IS NULL
            """
        ).bindparams(sa.bindparam("names", expanding=True)),
        {"brand": brand, "names": names},
    )


def downgrade() -> None:
    pass
