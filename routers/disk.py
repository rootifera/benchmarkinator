from fastapi import APIRouter, HTTPException, Depends
from models.disk import Disk
from sqlmodel import Session, select
from database import engine

router = APIRouter()


def get_db():
    with Session(engine) as session:
        yield session


@router.post("/disk/", response_model=Disk)
def create_disk(disk: Disk, db: Session = Depends(get_db)):
    db.add(disk)
    db.commit()
    db.refresh(disk)
    return disk


@router.get("/disk/", response_model=list[Disk])
def get_disks(db: Session = Depends(get_db)):
    disks = db.execute(select(Disk)).scalars().all()
    return disks


@router.get("/disk/{disk_id}", response_model=Disk)
def get_disk(disk_id: int, db: Session = Depends(get_db)):
    disk = db.get(Disk, disk_id)
    if disk is None:
        raise HTTPException(status_code=404, detail="Disk not found")
    return disk


@router.put("/disk/{disk_id}", response_model=Disk)
def update_disk(disk_id: int, disk: Disk, db: Session = Depends(get_db)):
    db_disk = db.get(Disk, disk_id)
    if db_disk is None:
        raise HTTPException(status_code=404, detail="Disk not found")

    db_disk.name = disk.name

    db.commit()
    db.refresh(db_disk)
    return db_disk


@router.delete("/disk/{disk_id}")
def delete_disk(disk_id: int, db: Session = Depends(get_db)):
    disk = db.get(Disk, disk_id)
    if disk is None:
        raise HTTPException(status_code=404, detail="Disk not found")

    db.delete(disk)
    db.commit()
    return {"message": "Disk deleted successfully"}
