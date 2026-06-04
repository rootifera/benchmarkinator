from fastapi import APIRouter, HTTPException, Depends, status
from sqlmodel import Session, select
from utils.helper import validate_and_normalize_name
from models.oses import OS
from models.config import Config
from database import get_db

router = APIRouter()


@router.post("/", response_model=OS)
def create_os(os: OS, db: Session = Depends(get_db)):
    os.name = validate_and_normalize_name(os.name, db, OS)
    db.add(os)
    db.commit()
    db.refresh(os)
    return os


@router.get("/", response_model=list[OS])
def get_oses(db: Session = Depends(get_db)):
    oses = db.exec(select(OS)).all()
    return oses


@router.get("/{os_id}", response_model=OS)
def get_os(os_id: int, db: Session = Depends(get_db)):
    os = db.get(OS, os_id)
    if os is None:
        raise HTTPException(status_code=404, detail="OS not found")
    return os


@router.put("/{os_id}", response_model=OS)
def update_os(os_id: int, os: OS, db: Session = Depends(get_db)):
    db_os = db.get(OS, os_id)
    if db_os is None:
        raise HTTPException(status_code=404, detail="OS not found")
    os.name = validate_and_normalize_name(os.name, db, OS, current_id=os_id)
    db_os.name = os.name
    db.commit()
    db.refresh(db_os)
    return db_os


@router.delete("/{os_id}")
def delete_os(os_id: int, db: Session = Depends(get_db)):
    os = db.get(OS, os_id)
    if os is None:
        raise HTTPException(status_code=404, detail="OS not found")

    in_config = db.exec(select(Config).where(Config.os_id == os_id)).first()
    if in_config:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete OS because it is referenced by one or more config records."
        )

    db.delete(os)
    db.commit()
    return {"message": "OS deleted successfully"}
