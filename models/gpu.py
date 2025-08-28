from sqlmodel import Field, SQLModel, Relationship
from typing import List, Optional
from sqlalchemy import UniqueConstraint


class GPUManufacturer(SQLModel, table=True):
    """Represents the AIB/board partner (e.g., Leadtek, ASUS)."""
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True)

    gpus: List["GPU"] = Relationship(back_populates="manufacturer")


class GPUBrand(SQLModel, table=True):
    """Represents the silicon brand (e.g., NVIDIA, ATI/AMD)."""
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True)

    models: List["GPUModel"] = Relationship(back_populates="brand")
    gpus: List["GPU"] = Relationship(back_populates="brand")


class GPUModel(SQLModel, table=True):
    """Represents the model within a brand (e.g., TNT2 M64, GTX 1080)."""
    __table_args__ = (
        UniqueConstraint("gpu_brand_id", "name", name="uq_gpumodel_brand_name"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str

    gpu_brand_id: int = Field(foreign_key="gpubrand.id")

    brand: Optional[GPUBrand] = Relationship(back_populates="models")
    gpus: List["GPU"] = Relationship(back_populates="model")


class GPUVRAMType(SQLModel, table=True):
    """Represents VRAM type (e.g., SDR, DDR, GDDR5, GDDR6)."""
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True)

    gpus: List["GPU"] = Relationship(back_populates="vram_type")


class GPU(SQLModel, table=True):
    """Represents a concrete GPU card instance/spec."""
    __table_args__ = (
        UniqueConstraint("gpu_model_id", "gpu_vram_type_id", "vram_size", name="uq_gpu_model_vramtype_size"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    vram_size: str
    serial: Optional[str] = None

    gpu_manufacturer_id: Optional[int] = Field(default=None, foreign_key="gpumanufacturer.id")
    gpu_brand_id: int = Field(foreign_key="gpubrand.id")
    gpu_model_id: int = Field(foreign_key="gpumodel.id")
    gpu_vram_type_id: int = Field(foreign_key="gpuvramtype.id")

    manufacturer: Optional[GPUManufacturer] = Relationship(back_populates="gpus")
    brand: Optional[GPUBrand] = Relationship(back_populates="gpus")
    model: Optional[GPUModel] = Relationship(back_populates="gpus")
    vram_type: Optional[GPUVRAMType] = Relationship(back_populates="gpus")
