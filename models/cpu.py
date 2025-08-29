from sqlmodel import Field, SQLModel, Relationship
from typing import List, Optional
from sqlalchemy import UniqueConstraint


class CPUBrand(SQLModel, table=True):
    """CPU brand (e.g., Intel, AMD)."""
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True)

    families: List["CPUFamily"] = Relationship(back_populates="brand")
    cpus: List["CPU"] = Relationship(back_populates="brand")


class CPUFamily(SQLModel, table=True):
    """Family under a brand (e.g., Pentium III, K6-2)."""
    __table_args__ = (
        UniqueConstraint("cpu_brand_id", "name", name="uq_cpufamily_brand_name"),
    )
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str

    cpu_brand_id: int = Field(foreign_key="cpubrand.id")

    brand: Optional[CPUBrand] = Relationship(back_populates="families")
    cpus: List["CPU"] = Relationship(back_populates="family")


class CPU(SQLModel, table=True):
    """
    Concrete CPU rows — duplicates ALLOWED (same family+model+speed ok).
    Brand-family binding is enforced in the router.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    model: str
    speed: str
    core_count: int
    serial: Optional[str] = None

    cpu_brand_id: int = Field(foreign_key="cpubrand.id")
    cpu_family_id: int = Field(foreign_key="cpufamily.id")

    brand: Optional[CPUBrand] = Relationship(back_populates="cpus")
    family: Optional[CPUFamily] = Relationship(back_populates="cpus")
