from typing import List, Optional
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import UniqueConstraint


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
    Concrete motherboard entry.
    - model is free text (e.g., "P3B-F", "B550 Tomahawk").
    - Must reference an existing manufacturer and chipset.
    - Unique per (manufacturer, model) to avoid duplicates like "ASUS P3B-F".
    """
    __table_args__ = (
        UniqueConstraint("manufacturer_id", "model", name="uq_motherboard_mfr_model"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    model: str

    manufacturer_id: int = Field(foreign_key="motherboardmanufacturer.id")
    chipset_id: int = Field(foreign_key="motherboardchipset.id")

    serial: Optional[str] = None
    notes: Optional[str] = None

    manufacturer: Optional[MotherboardManufacturer] = Relationship(back_populates="motherboards")
    chipset: Optional[MotherboardChipset] = Relationship(back_populates="motherboards")
