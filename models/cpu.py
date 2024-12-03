from sqlmodel import Field, SQLModel, Relationship
from typing import List, Optional


class CPUBrand(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True)

    cpus: List["CPU"] = Relationship(back_populates="brand")


class CPUFamily(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True)

    cpus: List["CPU"] = Relationship(back_populates="family")


class CPU(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    model: str
    speed: str
    core_count: int
    serial: Optional[str] = None

    # Foreign Keys
    cpu_brand_id: Optional[int] = Field(default=None, foreign_key="cpubrand.id")
    cpu_family_id: Optional[int] = Field(default=None, foreign_key="cpufamily.id")

    # Relationships
    brand: Optional[CPUBrand] = Relationship(back_populates="cpus")
    family: Optional[CPUFamily] = Relationship(back_populates="cpus")
