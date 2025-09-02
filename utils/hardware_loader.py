# utils/hardware_loader.py
from __future__ import annotations

import os
from pathlib import Path
from datetime import datetime
from typing import Iterable, Iterator

from sqlalchemy import text
from sqlalchemy.engine import Connection

from database import engine

# --- Era → files mapping ------------------------------------------------------

_BASE_DIR = Path(__file__).resolve().parents[1]
_SQL_DIR = _BASE_DIR / "extras" / "sql"

_ERA_FILES = {
    "retro": [
        _SQL_DIR / "retro_hardware_2005.sql",
    ],
    "retroextended": [
        _SQL_DIR / "retro_hardware_2005.sql",
        _SQL_DIR / "retro_hardware_extended_2008.sql",
    ],
    "modern": [
        _SQL_DIR / "modern_hardware.sql",
    ],
}

# --- Settings keys ------------------------------------------------------------

ST_LOADED = "hardware_data_loaded"
ST_ERA = "hardware_data_era"
ST_LOADED_AT = "hardware_data_loaded_at"

# --- Advisory lock ------------------------------------------------------------

_LOCK_KEY = "benchmarkinator.hardware_loader"
_LOCK_TIMEOUT_SEC = 15


def _env_true(name: str, default: bool = False) -> bool:
    v = os.getenv(name)
    if v is None:
        return default
    return str(v).strip().lower() in {"1", "true", "yes", "on"}


def _require_files_exist(files: Iterable[Path]) -> None:
    missing = [str(p) for p in files if not p.exists()]
    if missing:
        raise FileNotFoundError(f"Missing SQL seed files: {', '.join(missing)}")


# ------------------------------- SQL parsing ---------------------------------

_SKIP_PREFIXES = (
    "START TRANSACTION",
    "COMMIT",
    "ROLLBACK",
    "DELIMITER",
)

_ALLOWED_STARTS = (
    "CREATE", "INSERT", "UPDATE", "DELETE", "REPLACE", "ALTER", "DROP",
    "RENAME", "TRUNCATE", "SET", "USE", "LOCK", "UNLOCK", "LOAD", "CALL",
)

def _strip_block_comments(s: str) -> str:
    # remove /* ... */ including MySQL /*! ... */
    out = []
    i, n = 0, len(s)
    while i < n:
        if i + 1 < n and s[i] == "/" and s[i + 1] == "*":
            i += 2
            while i + 1 < n and not (s[i] == "*" and s[i + 1] == "/"):
                i += 1
            i += 2 if i + 1 < n else 1
        else:
            out.append(s[i])
            i += 1
    return "".join(out)

def _semicolons_outside_quotes(buf: str) -> Iterator[int]:
    """
    Yield indices of ';' that are outside ' " and ` quotes, with backslash escaping.
    """
    in_quote: str | None = None
    escape = False
    for i, ch in enumerate(buf):
        if escape:
            escape = False
            continue
        if ch == "\\":
            escape = True
            continue
        if in_quote:
            if ch == in_quote:
                in_quote = None
            continue
        # not in quote
        if ch in ("'", '"', "`"):
            in_quote = ch
            continue
        if ch == ";":
            yield i

def _iter_statements(sql_text: str) -> Iterator[str]:
    """
    Robust(ish) iterator over executable statements:
    - removes block comments, line comments (--, #)
    - ignores prose / non-SQL lines until a line starts with an allowed keyword
    - splits on semicolons outside quotes/backticks
    - skips transactional control and DELIMITER lines
    """
    cleaned = _strip_block_comments(sql_text)
    lines = []
    for raw in cleaned.splitlines():
        line = raw.strip()
        if not line:
            continue
        if line.startswith("--") or line.startswith("#"):
            continue
        lines.append(line)

    buf = ""
    collecting = False

    def starts_allowed(s: str) -> bool:
        up = s.lstrip().upper()
        return any(up.startswith(pfx) for pfx in _ALLOWED_STARTS)

    i = 0
    while i < len(lines):
        line = lines[i]

        if not collecting:
            if starts_allowed(line):
                buf = line
                collecting = True
            else:
                # ignore stray prose like "concrete samples last."
                i += 1
                continue
        else:
            buf += "\n" + line

        # flush all complete statements in buf (there may be multiple ;)
        last = 0
        for idx in _semicolons_outside_quotes(buf):
            stmt = buf[last:idx].strip()
            last = idx + 1
            if not stmt:
                continue
            up = stmt[:40].upper()
            if any(up.startswith(skip) for skip in _SKIP_PREFIXES):
                continue
            yield stmt

        # keep remainder (incomplete statement) in buf
        buf = buf[last:].strip()
        if not buf:
            collecting = False

        i += 1

    # No trailing semicolon: ignore incomplete trailing bits

# ---------------------------- settings table helpers --------------------------

def _get_setting(conn: Connection, key: str) -> str | None:
    return conn.execute(
        text("SELECT `value` FROM `settings` WHERE `key` = :k LIMIT 1"),
        {"k": key},
    ).scalar()

def _set_setting(conn: Connection, key: str, value: str | None) -> None:
    conn.execute(
        text(
            "INSERT INTO `settings` (`key`,`value`) VALUES (:k,:v) "
            "ON DUPLICATE KEY UPDATE `value`=VALUES(`value`)"
        ),
        {"k": key, "v": value},
    )

# ---------------------------- Advisory lock helpers ---------------------------

def _acquire_lock(conn: Connection) -> bool:
    res = conn.execute(
        text("SELECT GET_LOCK(:name, :timeout)"),
        {"name": _LOCK_KEY, "timeout": _LOCK_TIMEOUT_SEC},
    ).scalar()
    return bool(res == 1)

def _release_lock(conn: Connection) -> None:
    try:
        conn.execute(text("SELECT RELEASE_LOCK(:name)"), {"name": _LOCK_KEY})
    except Exception:
        pass

# ----------------------------------- Runner ----------------------------------

def run_if_enabled() -> dict | None:
    """
    If LOAD_HARDWARE_DATA=true and data hasn't been loaded, load for HARDWARE_ERA.
    Returns a summary dict on success, or None if skipped/no-op/failure.
    """
    if not _env_true("LOAD_HARDWARE_DATA", default=False):
        print("[hardware_loader] LOAD_HARDWARE_DATA=false (or missing); skipping.")
        return None

    era = (os.getenv("HARDWARE_ERA") or "").strip().lower()
    if era not in _ERA_FILES:
        print(
            f"[hardware_loader] Invalid or missing HARDWARE_ERA='{era}'. "
            f"Expected one of: {', '.join(_ERA_FILES.keys())}. Skipping."
        )
        return None

    files = _ERA_FILES[era]
    try:
        _require_files_exist(files)
    except FileNotFoundError as e:
        print(f"[hardware_loader] {e}")
        return None

    with engine.connect() as conn:
        if not _acquire_lock(conn):
            print("[hardware_loader] Could not acquire advisory lock; another worker may be seeding. Skipping.")
            return None

        try:
            already_loaded = ((_get_setting(conn, ST_LOADED) or "").lower() == "true")
            loaded_era = _get_setting(conn, ST_ERA)

            if already_loaded:
                if loaded_era == era:
                    print(f"[hardware_loader] Already loaded era '{era}'. No-op.")
                else:
                    print(f"[hardware_loader] Already loaded era '{loaded_era}', ignoring request for '{era}'. No-op.")
                return None

            # Close any implicit txn opened by prior SELECTs
            try:
                conn.commit()
            except Exception:
                pass

            total_statements = 0
            started = datetime.utcnow()

            trans = conn.begin()
            try:
                for path in files:
                    sql_text = path.read_text(encoding="utf-8")
                    for stmt in _iter_statements(sql_text):
                        conn.execute(text(stmt))
                        total_statements += 1

                _set_setting(conn, ST_LOADED, "true")
                _set_setting(conn, ST_ERA, era)
                _set_setting(conn, ST_LOADED_AT, started.isoformat() + "Z")

                trans.commit()
            except Exception:
                trans.rollback()
                raise

            finished = datetime.utcnow()
            took_ms = int((finished - started).total_seconds() * 1000)

            summary = {
                "loaded": True,
                "era": era,
                "files": [str(p) for p in files],
                "statements": total_statements,
                "took_ms": took_ms,
                "loaded_at": finished.isoformat() + "Z",
            }
            print(f"[hardware_loader] Success: {summary}")
            return summary

        except Exception as e:
            print(f"[hardware_loader] Error during seed: {e}")
            return None
        finally:
            _release_lock(conn)
