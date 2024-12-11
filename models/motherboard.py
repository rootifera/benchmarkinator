from sqlmodel import Field, SQLModel, Relationship
from typing import List, Optional


class MotherboardManufacturer(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True)

    motherboards: List["Motherboard"] = Relationship(back_populates="manufacturer")


class MotherboardChipset(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True)

    motherboards: List["Motherboard"] = Relationship(back_populates="chipset")


class Motherboard(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    model: str  # Add the model field
    serial: Optional[str] = None

    motherboard_manufacturer_id: Optional[int] = Field(default=None, foreign_key="motherboardmanufacturer.id")
    motherboard_chipset_id: Optional[int] = Field(default=None, foreign_key="motherboardchipset.id")

    manufacturer: Optional[MotherboardManufacturer] = Relationship(back_populates="motherboards")
    chipset: Optional[MotherboardChipset] = Relationship(back_populates="motherboards")
