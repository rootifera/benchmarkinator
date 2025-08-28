from sqlmodel import Field, SQLModel, Relationship
from typing import List, Optional
from sqlalchemy import UniqueConstraint


class CPUBrand(SQLModel, table=True):
    """Represents the brand of the CPU (e.g., AMD, Intel)."""
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True)

    families: List["CPUFamily"] = Relationship(back_populates="brand")
    cpus: List["CPU"] = Relationship(back_populates="brand")


class CPUFamily(SQLModel, table=True):
    """Represents the family of the CPU (e.g., K6, Pentium III)."""
    __table_args__ = (
        UniqueConstraint("cpu_brand_id", "name", name="uq_cpufamily_brand_name"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str

    cpu_brand_id: int = Field(foreign_key="cpubrand.id")

    brand: Optional[CPUBrand] = Relationship(back_populates="families")
    cpus: List["CPU"] = Relationship(back_populates="family")


class CPU(SQLModel, table=True):
    """Represents the specific CPU model (e.g., '200MMX', '550MHz')."""
    __table_args__ = (
        UniqueConstraint("cpu_family_id", "model", "speed", name="uq_cpu_family_model_speed"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    model: str
    speed: str
    core_count: int
    serial: Optional[str] = None

    cpu_brand_id: int = Field(foreign_key="cpubrand.id")
    cpu_family_id: int = Field(foreign_key="cpufamily.id")

    brand: Optional[CPUBrand] = Relationship(back_populates="cpus")
    family: Optional[CPUFamily] = Relationship(back_populates="cpus")
