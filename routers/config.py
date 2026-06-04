import json

from fastapi import APIRouter, HTTPException, Depends, status
from sqlmodel import Session, select
from sqlalchemy.exc import IntegrityError
from utils.helper import validate_and_normalize_name
from models.config import Config
from models.ram import RAM
from models.cpu import CPU
from models.motherboard import Motherboard
from models.gpu import GPU
from models.disk import Disk
from models.oses import OS
from models.benchmark_results import BenchmarkResult
from database import get_db

router = APIRouter()


def _parse_component_ids(raw: str | None, fallback_id: int | None, fallback_quantity: int | None) -> list[int]:
    if raw:
        try:
            values = json.loads(raw)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Component list must be valid JSON")
        if not isinstance(values, list):
            raise HTTPException(status_code=400, detail="Component list must be a JSON array")
        ids = []
        for value in values:
            try:
                component_id = int(value)
            except (TypeError, ValueError):
                raise HTTPException(status_code=400, detail="Component list must contain numeric IDs")
            if component_id < 1:
                raise HTTPException(status_code=400, detail="Component list must contain valid IDs")
            ids.append(component_id)
        return ids

    if fallback_id is None:
        return []
    quantity = max(int(fallback_quantity or 1), 1)
    return [int(fallback_id)] * quantity


def _normalize_component_lists(config: Config, db: Session):
    cpu_ids = _parse_component_ids(config.cpu_component_ids, config.cpu_id, config.cpu_quantity)
    gpu_ids = _parse_component_ids(config.gpu_component_ids, config.gpu_id, config.gpu_quantity)

    if not cpu_ids:
        raise HTTPException(status_code=400, detail="At least one CPU is required")
    if not gpu_ids:
        raise HTTPException(status_code=400, detail="At least one GPU is required")

    for cpu_id in cpu_ids:
        if db.get(CPU, cpu_id) is None:
            raise HTTPException(status_code=400, detail="Invalid CPU")
    for gpu_id in gpu_ids:
        if db.get(GPU, gpu_id) is None:
            raise HTTPException(status_code=400, detail="Invalid GPU")

    config.cpu_id = cpu_ids[0]
    config.gpu_id = gpu_ids[0]
    config.cpu_quantity = len(cpu_ids)
    config.gpu_quantity = len(gpu_ids)
    config.cpu_component_ids = json.dumps(cpu_ids, separators=(",", ":"))
    config.gpu_component_ids = json.dumps(gpu_ids, separators=(",", ":"))


def _validate_component_quantities(config: Config):
    if (config.cpu_quantity or 0) < 1:
        raise HTTPException(status_code=400, detail="CPU quantity must be at least 1")
    if (config.gpu_quantity or 0) < 1:
        raise HTTPException(status_code=400, detail="GPU quantity must be at least 1")


@router.post("/", response_model=Config)
def create_config(config: Config, db: Session = Depends(get_db)):
    try:
        config.name = validate_and_normalize_name(config.name, db, Config)
        _normalize_component_lists(config, db)
        _validate_component_quantities(config)

        # Validate FKs
        if db.get(CPU, config.cpu_id) is None:
            raise HTTPException(status_code=400, detail="Invalid CPU")

        if db.get(Motherboard, config.motherboard_id) is None:
            raise HTTPException(status_code=400, detail="Invalid Motherboard")

        if db.get(GPU, config.gpu_id) is None:
            raise HTTPException(status_code=400, detail="Invalid GPU")

        if db.get(Disk, config.disk_id) is None:
            raise HTTPException(status_code=400, detail="Invalid Disk")

        if db.get(OS, config.os_id) is None:
            raise HTTPException(status_code=400, detail="Invalid OS")

        if db.get(RAM, config.ram_id) is None:
            raise HTTPException(status_code=400, detail="Invalid RAM")

        db.add(config)
        db.commit()
        db.refresh(config)
        return config

    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="A configuration with this name already exists")

@router.get("/", response_model=list[Config])
def get_configs(db: Session = Depends(get_db)):
    return db.exec(select(Config)).all()

@router.get("/{config_id}", response_model=Config)
def get_config(config_id: int, db: Session = Depends(get_db)):
    config = db.get(Config, config_id)
    if config is None:
        raise HTTPException(status_code=404, detail="Config not found")
    return config

@router.put("/{config_id}", response_model=Config)
def update_config(config_id: int, config: Config, db: Session = Depends(get_db)):
    db_config = db.get(Config, config_id)
    if db_config is None:
        raise HTTPException(status_code=404, detail="Config not found")

    # Validate FKs
    _normalize_component_lists(config, db)
    _validate_component_quantities(config)

    if db.get(CPU, config.cpu_id) is None:
        raise HTTPException(status_code=400, detail="Invalid CPU")
    if db.get(Motherboard, config.motherboard_id) is None:
        raise HTTPException(status_code=400, detail="Invalid Motherboard")
    if db.get(GPU, config.gpu_id) is None:
        raise HTTPException(status_code=400, detail="Invalid GPU")
    if db.get(Disk, config.disk_id) is None:
        raise HTTPException(status_code=400, detail="Invalid Disk")
    if db.get(OS, config.os_id) is None:
        raise HTTPException(status_code=400, detail="Invalid OS")
    if db.get(RAM, config.ram_id) is None:
        raise HTTPException(status_code=400, detail="Invalid RAM")

    if hasattr(config, "name"):
        config.name = validate_and_normalize_name(config.name, db, Config, current_id=config_id)

    existing_config = db.exec(select(Config).where(Config.name == config.name, Config.id != config_id)).first()
    if existing_config:
        raise HTTPException(status_code=400, detail="A configuration with this name already exists")

    db_config.name = config.name
    db_config.cpu_id = config.cpu_id
    db_config.cpu_quantity = config.cpu_quantity
    db_config.cpu_component_ids = config.cpu_component_ids
    db_config.motherboard_id = config.motherboard_id
    db_config.gpu_id = config.gpu_id
    db_config.gpu_quantity = config.gpu_quantity
    db_config.gpu_component_ids = config.gpu_component_ids
    db_config.disk_id = config.disk_id
    db_config.os_id = config.os_id
    db_config.ram_id = config.ram_id
    db_config.ram_size = config.ram_size

    db_config.cpu_driver_version = config.cpu_driver_version
    db_config.mb_chipset_driver_version = config.mb_chipset_driver_version
    db_config.gpu_driver_version = config.gpu_driver_version

    db_config.cpu_overclock = config.cpu_overclock
    db_config.cpu_baseclock = config.cpu_baseclock
    db_config.cpu_currentclock = config.cpu_currentclock

    db_config.gpu_core_overclock = config.gpu_core_overclock
    db_config.gpu_core_baseclock = config.gpu_core_baseclock
    db_config.gpu_core_currentclock = config.gpu_core_currentclock

    db_config.gpu_vram_overclock = config.gpu_vram_overclock
    db_config.gpu_vram_baseclock = config.gpu_vram_baseclock
    db_config.gpu_vram_currentclock = config.gpu_vram_currentclock

    db_config.ram_overclock = config.ram_overclock
    db_config.ram_baseclock = config.ram_baseclock
    db_config.ram_currentclock = config.ram_currentclock

    db_config.notes = config.notes

    try:
        db.commit()
        db.refresh(db_config)
        return db_config
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="A configuration with this name already exists")

@router.delete("/{config_id}")
def delete_config(config_id: int, db: Session = Depends(get_db)):
    config = db.get(Config, config_id)
    if config is None:
        raise HTTPException(status_code=404, detail="Config not found")

    has_results = db.exec(select(BenchmarkResult).where(BenchmarkResult.config_id == config_id)).first()
    if has_results:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete config because it is referenced by one or more benchmark results."
        )

    db.delete(config)
    db.commit()
    return {"message": "Config deleted successfully"}
