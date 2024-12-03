from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from database import get_session
from models.cpu import CPU
from utils.auth import authenticate

router = APIRouter()

@router.post("/cpus", dependencies=[Depends(authenticate)])
def create_cpu(cpu: CPU, session: Session = Depends(get_session)):
    session.add(cpu)
    session.commit()
    session.refresh(cpu)
    return cpu
