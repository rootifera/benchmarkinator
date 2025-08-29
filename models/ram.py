from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship


class RAMBrand(SQLModel, table=True):
    """e.g., Corsair, Kingston, Crucial"""
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True)

    modules: List["RAMModule"] = Relationship(back_populates="brand")


class RAMType(SQLModel, table=True):
    """e.g., DDR, DDR2, DDR3, SDRAM, EDO"""
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True)

    modules: List["RAMModule"] = Relationship(back_populates="type")


class RAMModule(SQLModel, table=True):
    """
    Concrete RAM stick/dimm entry.
    - size: free text (e.g. "16GB", "32MB", "2x8GB")
    - speed_mhz: free text (e.g. "1600MHz", "PC100", "CL2")
    - part_number: optional identifier (not unique)
    - notes: free text for anything else
    """
    id: Optional[int] = Field(default=None, primary_key=True)

    brand_id: int = Field(foreign_key="rambrand.id")
    type_id: int = Field(foreign_key="ramtype.id")

    size: str
    speed_mhz: Optional[str] = None
    part_number: Optional[str] = None
    notes: Optional[str] = None

    brand: Optional[RAMBrand] = Relationship(back_populates="modules")
    type: Optional[RAMType] = Relationship(back_populates="modules")
