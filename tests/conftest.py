import os
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

os.environ["API_KEY"] = "test-api-key"
os.environ["DATABASE_URL"] = f"sqlite:///{tempfile.gettempdir()}/benchmarkinator-tests.db"
os.environ["LOAD_HARDWARE_DATA"] = "false"

import pytest
from sqlmodel import SQLModel, Session

from database import engine


@pytest.fixture(autouse=True)
def reset_database():
    SQLModel.metadata.drop_all(bind=engine)
    SQLModel.metadata.create_all(bind=engine)
    yield
    SQLModel.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    with Session(engine) as session:
        yield session
