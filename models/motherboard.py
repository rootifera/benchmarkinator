from typing import List, Optional
from sqlmodel import SQLModel, Field, Relationship


class MotherboardManufacturer(SQLModel, table=True):
    """Board maker (e.g., ASUS, MSI, Gigabyte)."""
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True)
    motherboards: List["Motherboard"] = Relationship(back_populates="manufacturer")


class MotherboardChipset(SQLModel, table=True):
    """Chipset (e.g., Intel 440BX, AMD B550, VIA KT133)."""
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True)
    motherboards: List["Motherboard"] = Relationship(back_populates="chipset")


class Motherboard(SQLModel, table=True):
    """
    Concrete motherboard rows — duplicates ALLOWED (same model allowed).
    Model is free text. FKs required.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    model: str
    manufacturer_id: int = Field(foreign_key="motherboardmanufacturer.id")
    chipset_id: int = Field(foreign_key="motherboardchipset.id")

    serial: Optional[str] = None
    notes: Optional[str] = None

    manufacturer: Optional[MotherboardManufacturer] = Relationship(back_populates="motherboards")
    chipset: Optional[MotherboardChipset] = Relationship(back_populates="motherboards")
