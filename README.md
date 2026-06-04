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

Default configuration is local-only. For internet access, put the web UI behind HTTPS and keep MySQL and the raw API bound to localhost.

## Services

Default ports:

| Service | URL |
| --- | --- |
| Web UI | http://localhost:4000 |
| API | http://localhost:12345 |
| API docs | http://localhost:12345/docs |
| MySQL | localhost:3306 |

The web UI container serves static files through nginx and proxies `/api` to the API container.

In Docker Compose, MySQL and the API bind to `127.0.0.1` by default. The web UI also binds to `127.0.0.1` unless `WEB_BIND_ADDRESS` is changed.

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
| `WEB_PORT` | Host port mapped to the web UI |
| `WEB_BIND_ADDRESS` | Host address for the web UI binding |
| `API_KEY` | API key for protected API routes |
| `WEBADMIN` | Web login username |
| `WEBPASSWORD` | Web login password |
| `AUTH_TOKEN_TTL_SECONDS` | Lifetime of web login tokens |
| `AUTH_COOKIE_SECURE` | Set to `true` when the web UI is served over HTTPS |
| `AUTH_COOKIE_SAMESITE` | Browser SameSite policy for the session cookie |
| `LOGIN_RATE_LIMIT_ATTEMPTS` | Failed login attempts allowed per window |
| `LOGIN_RATE_LIMIT_WINDOW_SECONDS` | Login rate-limit window |
| `ALLOWED_ORIGINS` | Comma-separated CORS allowlist for direct API browser access |
| `LOAD_HARDWARE_DATA` | Whether to load seed hardware data on startup |
| `HARDWARE_ERA` | Seed data set: `retro`, `retroextended`, or `modern` |

The API also accepts `DATABASE_URL`; Docker Compose sets it automatically.

## Authentication

The web UI logs in through the backend using `WEBADMIN` and `WEBPASSWORD`.

Successful login sets a signed, HttpOnly session cookie. The protected API routes accept either:
- the configured raw `API_KEY`
- a valid signed web token

The raw `API_KEY` is for trusted scripts or local administration. Do not publish it in frontend code or share it with users.

Benchmark results can be viewed without logging in through the public results route. Editing data requires login.

## Public Deployment

Use a reverse proxy such as Caddy, nginx, Traefik, or Cloudflare Tunnel in front of the web UI. Terminate HTTPS there.

If the reverse proxy runs on the same host as Benchmarkinator:

```env
WEB_BIND_ADDRESS=127.0.0.1
WEB_PORT=4000
AUTH_COOKIE_SECURE=true
AUTH_COOKIE_SAMESITE=lax
ALLOWED_ORIGINS=https://your-domain.example
```

Proxy HTTPS traffic to:

```text
http://127.0.0.1:4000
```

If the reverse proxy runs on another machine and Benchmarkinator runs at `192.168.1.23`:

```env
WEB_BIND_ADDRESS=192.168.1.23
WEB_PORT=4000
AUTH_COOKIE_SECURE=true
AUTH_COOKIE_SAMESITE=lax
ALLOWED_ORIGINS=https://your-domain.example
```

Proxy HTTPS traffic to:

```text
http://192.168.1.23:4000
```

Recommended network shape:
- expose only the reverse proxy to the internet
- allow access to `WEB_PORT` only from the reverse proxy host
- keep MySQL on `127.0.0.1:${MYSQL_PORT}`
- keep the direct API on `127.0.0.1:${API_PORT}`
- use long random values for `API_KEY`, `MYSQL_PASSWORD`, `MYSQL_ROOT_PASSWORD`, and `WEBPASSWORD`
- keep `.env`, `backups/`, and database ports out of public web roots

This is reasonable for a small private service if you use HTTPS and strong credentials. It is not a full multi-user SaaS security model: there is one admin login, no MFA, no password reset flow, and no account-level permissions.

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

Existing database that has tables but no `alembic_version` row:

```bash
alembic stamp 46cd05edcf1b
alembic upgrade head
```

Use this when Alembic tries to create tables that already exist. The first command records the existing baseline schema; the second command applies later migrations.

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
