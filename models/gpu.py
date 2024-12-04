from sqlmodel import Field, SQLModel, Relationship
from typing import List, Optional

class GPUManufacturer(SQLModel, table=True):
    """Represents the manufacturer of the GPU (e.g., Leadtek, ASUS)."""
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True)

    gpus: List["GPU"] = Relationship(back_populates="manufacturer")

class GPUBrand(SQLModel, table=True):
    """Represents the brand or technology provider (e.g., NVIDIA, ATI)."""
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True)

    gpus: List["GPU"] = Relationship(back_populates="brand")

class GPUModel(SQLModel, table=True):
    """Represents the specific model within the brand (e.g., TNT2 M64, GTX 1080)."""
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True)

    gpus: List["GPU"] = Relationship(back_populates="model")

class GPUVRAMType(SQLModel, table=True):
    """Represents the type of VRAM (e.g., GDDR5, GDDR6)."""
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True)

    gpus: List["GPU"] = Relationship(back_populates="vram_type")

class GPU(SQLModel, table=True):
    """Represents the specific GPU model."""
    id: Optional[int] = Field(default=None, primary_key=True)
    vram_size: str
    serial: Optional[str] = None

    gpu_manufacturer_id: Optional[int] = Field(default=None, foreign_key="gpumanufacturer.id")
    gpu_brand_id: Optional[int] = Field(default=None, foreign_key="gpubrand.id")
    gpu_model_id: Optional[int] = Field(default=None, foreign_key="gpumodel.id")
    gpu_vram_type_id: Optional[int] = Field(default=None, foreign_key="gpuvramtype.id")

    manufacturer: Optional[GPUManufacturer] = Relationship(back_populates="gpus")
    brand: Optional[GPUBrand] = Relationship(back_populates="gpus")
    model: Optional[GPUModel] = Relationship(back_populates="gpus")
    vram_type: Optional[GPUVRAMType] = Relationship(back_populates="gpus")