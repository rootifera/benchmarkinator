from fastapi import APIRouter, HTTPException, Depends
from models.config import Config
from sqlmodel import Session, select
from database import engine

router = APIRouter()


def get_db():
    with Session(engine) as session:
        yield session


@router.post("/", response_model=Config)
def create_config(config: Config, db: Session = Depends(get_db)):
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
    db_config = db.get(Config, config_id)
    if db_config is None:
        raise HTTPException(status_code=404, detail="Config not found")

    db_config.cpu = config.cpu
    db_config.motherboard = config.motherboard
    db_config.ram_size = config.ram_size
    db_config.ram_type = config.ram_type
    db_config.gpu = config.gpu
    db_config.disk = config.disk
    db_config.os = config.os

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
