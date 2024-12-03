from fastapi import APIRouter, HTTPException, Depends
from models.oses import OS
from sqlmodel import Session, select
from database import engine

router = APIRouter()


def get_db():
    with Session(engine) as session:
        yield session


@router.post("/os/", response_model=OS)
def create_os(os: OS, db: Session = Depends(get_db)):
    db.add(os)
    db.commit()
    db.refresh(os)
    return os


@router.get("/os/", response_model=list[OS])
def get_oses(db: Session = Depends(get_db)):
    oses = db.execute(select(OS)).scalars().all()
    return oses


@router.get("/os/{os_id}", response_model=OS)
def get_os(os_id: int, db: Session = Depends(get_db)):
    os = db.get(OS, os_id)
    if os is None:
        raise HTTPException(status_code=404, detail="OS not found")
    return os


@router.put("/os/{os_id}", response_model=OS)
def update_os(os_id: int, os: OS, db: Session = Depends(get_db)):
    db_os = db.get(OS, os_id)
    if db_os is None:
        raise HTTPException(status_code=404, detail="OS not found")

    db_os.name = os.name

    db.commit()
    db.refresh(db_os)
    return db_os


@router.delete("/os/{os_id}")
def delete_os(os_id: int, db: Session = Depends(get_db)):
    os = db.get(OS, os_id)
    if os is None:
        raise HTTPException(status_code=404, detail="OS not found")

    db.delete(os)
    db.commit()
    return {"message": "OS deleted successfully"}
