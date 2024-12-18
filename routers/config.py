from fastapi import APIRouter, HTTPException, Depends
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
from database import get_db

router = APIRouter()


@router.post("/", response_model=Config)
def create_config(config: Config, db: Session = Depends(get_db)):
    try:

        config.name = validate_and_normalize_name(config.name, db, Config)

        ram_type = db.get(RAM, config.ram_type_id)
        if ram_type is None:
            raise HTTPException(status_code=400, detail="Invalid RAM type")

        cpu = db.get(CPU, config.cpu_id)
        if cpu is None:
            raise HTTPException(status_code=400, detail="Invalid CPU")
        else:
            print(f"CPU found: {cpu}")

        motherboard = db.get(Motherboard, config.motherboard_id)
        if motherboard is None:
            raise HTTPException(status_code=400, detail="Invalid Motherboard")

        gpu = db.get(GPU, config.gpu_id)
        if gpu is None:
            raise HTTPException(status_code=400, detail="Invalid GPU")

        disk = db.get(Disk, config.disk_id)
        if disk is None:
            raise HTTPException(status_code=400, detail="Invalid Disk")

        os = db.get(OS, config.os_id)
        if os is None:
            raise HTTPException(status_code=400, detail="Invalid OS")

        db.add(config)
        db.commit()
        db.refresh(config)
        return config
    except IntegrityError as e:
        db.rollback()
        print(f"IntegrityError: {e}")
        raise HTTPException(status_code=400, detail="A configuration with this name already exists")


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


from sqlalchemy.exc import IntegrityError


@router.put("/{config_id}", response_model=Config)
def update_config(config_id: int, config: Config, db: Session = Depends(get_db)):
    ram_type = db.get(RAM, config.ram_type_id)
    if ram_type is None:
        raise HTTPException(status_code=400, detail="Invalid RAM type")

    cpu = db.get(CPU, config.cpu_id)
    if cpu is None:
        raise HTTPException(status_code=400, detail="Invalid CPU")

    motherboard = db.get(Motherboard, config.motherboard_id)
    if motherboard is None:
        raise HTTPException(status_code=400, detail="Invalid Motherboard")

    gpu = db.get(GPU, config.gpu_id)
    if gpu is None:
        raise HTTPException(status_code=400, detail="Invalid GPU")

    disk = db.get(Disk, config.disk_id)
    if disk is None:
        raise HTTPException(status_code=400, detail="Invalid Disk")

    os = db.get(OS, config.os_id)
    if os is None:
        raise HTTPException(status_code=400, detail="Invalid OS")

    db_config = db.get(Config, config_id)
    if db_config is None:
        raise HTTPException(status_code=404, detail="Config not found")

    if hasattr(config, "name"):
        config.name = validate_and_normalize_name(config.name, db, Config, current_id=config_id)

    existing_config = db.exec(select(Config).where(Config.name == config.name, Config.id != config_id)).first()
    if existing_config:
        raise HTTPException(status_code=400, detail="A configuration with this name already exists")

    db_config.name = config.name
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

    db.delete(config)
    db.commit()
    return {"message": "Config deleted successfully"}
