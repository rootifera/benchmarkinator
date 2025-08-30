from typing import Optional
from sqlmodel import SQLModel, Field


class RAM(SQLModel, table=True):
    """
    Simple RAM catalog entry (e.g., 'SDRAM 100MHz', 'DDR 400MHz', 'DDR2 800MHz').
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True)
