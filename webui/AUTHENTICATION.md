# Authentication

The web UI authenticates through the FastAPI backend.

## Behavior

- `/results` can be viewed without logging in.
- Editing, hardware management, benchmark management, and other protected views require login.
- Login uses `WEBADMIN` and `WEBPASSWORD` from the backend environment.
- Successful login sets an HttpOnly session cookie.
- The browser does not store the signed session token in `localStorage`.
- Logout clears the session cookie and local UI state.

## Configuration

Relevant `.env` values:

```env
WEBADMIN=admin
WEBPASSWORD=change-this
API_KEY=change-this-long-random-value
AUTH_TOKEN_TTL_SECONDS=43200
AUTH_COOKIE_SECURE=false
AUTH_COOKIE_SAMESITE=lax
LOGIN_RATE_LIMIT_ATTEMPTS=5
LOGIN_RATE_LIMIT_WINDOW_SECONDS=300
```

For HTTPS/public deployment:

```env
AUTH_COOKIE_SECURE=true
ALLOWED_ORIGINS=https://your-domain.example
```

`API_KEY` signs web session tokens and is also accepted as a raw API key for trusted scripts. Keep it secret.

## Development

The Vite dev server proxies `/api` to the backend, so cookie auth works as same-origin during development.

```bash
cd webui
npm run dev
```

Set `VITE_DEV_API_TARGET` if the backend is not running on `http://localhost:12345`.

## Troubleshooting

- If login fails, check `WEBADMIN`, `WEBPASSWORD`, and API logs.
- If login succeeds but the session is lost on refresh, check cookie settings and whether the browser is using HTTP or HTTPS.
- If using a separate frontend origin, set `ALLOWED_ORIGINS` to that exact origin.
