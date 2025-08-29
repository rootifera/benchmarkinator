from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import UniqueConstraint


class RAMBrand(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True)

    modules: List["RAMModule"] = Relationship(back_populates="brand")


class RAMType(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True)

    modules: List["RAMModule"] = Relationship(back_populates="type")


class RAMModule(SQLModel, table=True):
    """
    A concrete RAM stick/spec. Uniqueness enforces we don't create duplicate
    spec entries (brand+type+size+speed). Multiple configs can reference the same module.
    """
    __table_args__ = (
        UniqueConstraint("brand_id", "type_id", "size_mb", "speed_mhz", name="uq_ram_module_spec"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)

    brand_id: int = Field(foreign_key="rambrand.id")
    type_id: int = Field(foreign_key="ramtype.id")
    size_mb: int
    speed_mhz: int

    brand: Optional[RAMBrand] = Relationship(back_populates="modules")
    type: Optional[RAMType] = Relationship(back_populates="modules")
