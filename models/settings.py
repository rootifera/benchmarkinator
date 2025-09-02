from sqlmodel import SQLModel, Field


class Setting(SQLModel, table=True):
    """
    Minimal key/value store for application settings & state.
    Used for one-time hardware data flags (e.g., hardware_data_loaded).
    """
    __tablename__ = "settings"

    key: str = Field(primary_key=True, max_length=191)
    value: str | None = Field(default=None, max_length=1000)
