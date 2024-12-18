from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from utils.helper import validate_and_normalize_name
from models.disk import Disk
from database import get_db

router = APIRouter()


@router.post("/", response_model=Disk)
def create_disk(disk: Disk, db: Session = Depends(get_db)):
    if hasattr(disk, "name"):
        disk.name = validate_and_normalize_name(disk.name, db, Disk)

    db.add(disk)
    db.commit()
    db.refresh(disk)
    return disk


@router.get("/", response_model=list[Disk])
def get_disks(db: Session = Depends(get_db)):
    disks = db.exec(select(Disk)).all()
    return disks


@router.get("/{disk_id}", response_model=Disk)
def get_disk(disk_id: int, db: Session = Depends(get_db)):
    disk = db.get(Disk, disk_id)
    if disk is None:
        raise HTTPException(status_code=404, detail="Disk not found")
    return disk


@router.put("/{disk_id}", response_model=Disk)
def update_disk(disk_id: int, disk: Disk, db: Session = Depends(get_db)):
    db_disk = db.get(Disk, disk_id)
    if db_disk is None:
        raise HTTPException(status_code=404, detail="Disk not found")

    if hasattr(disk, "name"):
        disk.name = validate_and_normalize_name(disk.name, db, Disk, current_id=disk_id)

    db_disk.name = disk.name

    db.commit()
    db.refresh(db_disk)
    return db_disk


@router.delete("/{disk_id}")
def delete_disk(disk_id: int, db: Session = Depends(get_db)):
    disk = db.get(Disk, disk_id)
    if disk is None:
        raise HTTPException(status_code=404, detail="Disk not found")

    db.delete(disk)
    db.commit()
    return {"message": "Disk deleted successfully"}
