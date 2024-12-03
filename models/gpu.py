from sqlmodel import Field, SQLModel, Relationship
from typing import List, Optional


class GPUManufacturer(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True)

    gpus: List["GPU"] = Relationship(back_populates="manufacturer")


class GPUBrand(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True)

    gpus: List["GPU"] = Relationship(back_populates="brand")


class GPUVRAMType(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True)

    gpus: List["GPU"] = Relationship(back_populates="vram_type")


class GPU(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    vram_size: str
    serial: Optional[str] = None

    gpu_manufacturer_id: Optional[int] = Field(default=None, foreign_key="gpumanufacturer.id")
    gpu_brand_id: Optional[int] = Field(default=None, foreign_key="gpubrand.id")
    gpu_vram_type_id: Optional[int] = Field(default=None, foreign_key="gpuvramtype.id")

    manufacturer: Optional[GPUManufacturer] = Relationship(back_populates="gpus")
    brand: Optional[GPUBrand] = Relationship(back_populates="gpus")
    vram_type: Optional[GPUVRAMType] = Relationship(back_populates="gpus")
