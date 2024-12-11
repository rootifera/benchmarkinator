from sqlmodel import Field, SQLModel, Relationship
from typing import Optional, List


class Config(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True)

    cpu_id: Optional[int] = Field(default=None, foreign_key="cpu.id")
    motherboard_id: Optional[int] = Field(default=None, foreign_key="motherboard.id")
    gpu_id: Optional[int] = Field(default=None, foreign_key="gpu.id")
    disk_id: Optional[int] = Field(default=None, foreign_key="disk.id")
    os_id: Optional[int] = Field(default=None, foreign_key="os.id")
    ram_type_id: Optional[int] = Field(default=None, foreign_key="ram.id")

    ram_size: str
    cpu_driver_version: Optional[str] = None
    mb_chipset_driver_version: Optional[str] = None
    gpu_driver_version: Optional[str] = None
    cpu_overclock: bool = False
    cpu_baseclock: Optional[int] = None
    cpu_currentclock: Optional[int] = None
    gpu_core_overclock: bool = False
    gpu_core_baseclock: Optional[int] = None
    gpu_core_currentclock: Optional[int] = None
    gpu_vram_overclock: bool = False
    gpu_vram_baseclock: Optional[int] = None
    gpu_vram_currentclock: Optional[int] = None
    notes: Optional[str] = None

    cpu: Optional["CPU"] = Relationship()
    motherboard: Optional["Motherboard"] = Relationship()
    gpu: Optional["GPU"] = Relationship()
    disk: Optional["Disk"] = Relationship()
    os: Optional["OS"] = Relationship()
    ram_type: Optional["RAM"] = Relationship()
    benchmark_results: List["BenchmarkResult"] = Relationship(back_populates="config")
