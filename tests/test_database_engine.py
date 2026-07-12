import importlib


def test_mysql_engine_uses_idle_safe_pooling(monkeypatch):
    import database

    monkeypatch.setenv("DATABASE_URL", "mysql+pymysql://user:password@example.invalid:3306/benchmarkinator")
    monkeypatch.setenv("MYSQL_POOL_RECYCLE_SECONDS", "123")

    reloaded = importlib.reload(database)
    try:
        assert reloaded.engine.pool._pre_ping is True
        assert reloaded.engine.pool._recycle == 123
    finally:
        monkeypatch.setenv("DATABASE_URL", "sqlite:////tmp/benchmarkinator-tests.db")
        importlib.reload(database)


def test_get_db_closes_session_on_exception(monkeypatch):
    import database

    events = []

    class DummySession:
        def __init__(self, engine):
            self.engine = engine

        def rollback(self):
            events.append("rollback")

        def close(self):
            events.append("close")

    monkeypatch.setattr(database, "Session", DummySession)

    dependency = database.get_db()
    session = next(dependency)
    assert session.engine is database.engine

    try:
        dependency.throw(RuntimeError("request failed"))
    except RuntimeError:
        pass

    assert events == ["rollback", "close"]


def test_get_db_closes_session_after_success(monkeypatch):
    import database

    events = []

    class DummySession:
        def __init__(self, engine):
            self.engine = engine

        def rollback(self):
            events.append("rollback")

        def close(self):
            events.append("close")

    monkeypatch.setattr(database, "Session", DummySession)

    dependency = database.get_db()
    session = next(dependency)
    assert session.engine is database.engine

    try:
        next(dependency)
    except StopIteration:
        pass

    assert events == ["close"]
