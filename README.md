# Benchmarkinator

Benchmarkinator is a local benchmark result manager for hardware test systems.

It stores:
- hardware components
- complete test system configurations
- benchmark definitions
- benchmark results

It provides:
- a FastAPI backend
- a React/Vite web UI
- a MySQL database through Docker Compose
- optional hardware seed data
- backup and restore scripts

This is intended for personal or LAN use. Do not expose it directly to the public internet.

## Services

Default ports:

| Service | URL |
| --- | --- |
| Web UI | http://localhost:4000 |
| API | http://localhost:12345 |
| API docs | http://localhost:12345/docs |
| MySQL | localhost:3306 |

The web UI container serves static files through nginx and proxies `/api` to the API container.

## Requirements

- Docker
- Docker Compose
- Bash for `setup.sh`, `backup.sh`, and `restore.sh`

For local development outside Docker:
- Python 3.13
- Node.js 22+
- npm

## Setup

Copy the example environment file:

```bash
cp env.example .env
```

Edit `.env` as needed.

Start the application:

```bash
docker compose build
docker compose up -d
```

Or run the setup script:

```bash
./setup.sh
```

`setup.sh` creates `.env` if needed, generates credentials, asks whether to load seed hardware data, optionally configures a backup cron job, builds the containers, and can start the stack.

## Configuration

Important `.env` values:

| Variable | Purpose |
| --- | --- |
| `MYSQL_DATABASE` | MySQL database name |
| `MYSQL_USER` | MySQL application user |
| `MYSQL_PASSWORD` | MySQL application user password |
| `MYSQL_ROOT_PASSWORD` | MySQL root password |
| `MYSQL_PORT` | Host port mapped to MySQL |
| `API_PORT` | Host port mapped to the API |
| `API_KEY` | API key for protected API routes |
| `WEBADMIN` | Web login username |
| `WEBPASSWORD` | Web login password |
| `AUTH_TOKEN_TTL_SECONDS` | Lifetime of web login tokens |
| `LOAD_HARDWARE_DATA` | Whether to load seed hardware data on startup |
| `HARDWARE_ERA` | Seed data set: `retro`, `retroextended`, or `modern` |

The API also accepts `DATABASE_URL`; Docker Compose sets it automatically.

## Authentication

The web UI logs in through the backend using `WEBADMIN` and `WEBPASSWORD`.

Successful login returns a signed token. The protected API routes accept either:
- the configured raw `API_KEY`
- a valid signed web token

Benchmark results can be viewed without logging in through the public results route. Editing data requires login.

## Hardware Seed Data

Seed SQL files are in `extras/sql`:

- `retro_hardware_2005.sql`
- `retro_hardware_extended_2008.sql`
- `modern_hardware.sql`

Set these in `.env` before startup:

```env
LOAD_HARDWARE_DATA=true
HARDWARE_ERA=retroextended
```

The loader is intended for initial/local data population. Review the SQL files before using them with an existing database.

## Database Migrations

Alembic is included.

Fresh database:

```bash
alembic upgrade head
```

Existing database that already matches the current models:

```bash
alembic stamp head
```

The app still creates missing tables on startup for local convenience. Use Alembic for schema changes.

## Backup And Restore

Backup:

```bash
./backup.sh
```

Restore:

```bash
./restore.sh
```

Backups are written under `backups/`.

Review these scripts before running them against data you care about.

## API Examples

Read CPUs:

```bash
curl -H "X-API-Key: YOUR_KEY" http://localhost:12345/api/cpu/
```

Add a result:

```bash
curl -X POST \
  -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"benchmark_id": 1, "config_id": 1, "result": 1500}' \
  http://localhost:12345/api/benchmark_results/
```

Public results data:

```bash
curl http://localhost:12345/api/public/results-data
```

## Local Development

Backend:

```bash
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
uvicorn main:app --reload --host 0.0.0.0 --port 12345
```

Frontend:

```bash
cd webui
npm install
npm run dev
```

The Vite dev server runs on port `4000`.

## Tests

Backend tests:

```bash
pytest
```

Frontend production build:

```bash
cd webui
npm run build
```

## Troubleshooting

Check containers:

```bash
docker compose ps
```

View logs:

```bash
docker compose logs -f
```

Rebuild after dependency or frontend changes:

```bash
docker compose build
docker compose up -d
```

Common checks:
- Make sure ports `4000`, `12345`, and `3306` are available or change them in `.env`.
- Make sure `.env` exists.
- If login fails, check `WEBADMIN`, `WEBPASSWORD`, and `API_KEY`.
- If the API cannot connect to MySQL, check `MYSQL_*` values and `docker compose logs benchmarkinator-db`.

## License

MIT. See `LICENSE`.
