from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from utils.helper import validate_and_normalize_name
from models.config import Config
from models.ram import RAM
from database import get_db

router = APIRouter()

@router.post("/", response_model=Config)
def create_config(config: Config, db: Session = Depends(get_db)):
    ram_type = db.get(RAM, config.ram_type_id)
    if ram_type is None:
        raise HTTPException(status_code=400, detail="Invalid RAM type")

    if hasattr(config, "name"):
        config.name = validate_and_normalize_name(config.name, db, Config)

    db.add(config)
    db.commit()
    db.refresh(config)
    return config

@router.get("/", response_model=list[Config])
def get_configs(db: Session = Depends(get_db)):
    configs = db.exec(select(Config)).all()
    return configs

@router.get("/{config_id}", response_model=Config)
def get_config(config_id: int, db: Session = Depends(get_db)):
    config = db.get(Config, config_id)
    if config is None:
        raise HTTPException(status_code=404, detail="Config not found")
    return config

@router.put("/{config_id}", response_model=Config)
def update_config(config_id: int, config: Config, db: Session = Depends(get_db)):
    ram_type = db.get(RAM, config.ram_type_id)
    if ram_type is None:
        raise HTTPException(status_code=400, detail="Invalid RAM type")

    db_config = db.get(Config, config_id)
    if db_config is None:
        raise HTTPException(status_code=404, detail="Config not found")

    if hasattr(config, "name"):
        config.name = validate_and_normalize_name(config.name, db, Config)

    db_config.cpu_id = config.cpu_id
    db_config.motherboard_id = config.motherboard_id
    db_config.gpu_id = config.gpu_id
    db_config.disk_id = config.disk_id
    db_config.os_id = config.os_id
    db_config.ram_size = config.ram_size
    db_config.ram_type_id = config.ram_type_id
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
    db_config.notes = config.notes

    db.commit()
    db.refresh(db_config)
    return db_config

@router.delete("/{config_id}")
def delete_config(config_id: int, db: Session = Depends(get_db)):
    config = db.get(Config, config_id)
    if config is None:
        raise HTTPException(status_code=404, detail="Config not found")

    db.delete(config)
    db.commit()
    return {"message": "Config deleted successfully"}