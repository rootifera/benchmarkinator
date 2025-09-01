// src/config/api.js

// Flexible, browser-safe API config.
// - Default: use SAME-ORIGIN relative "/api" so Nginx (in the webui container) can proxy to the API.
// - Override: set REACT_APP_API_HOST and REACT_APP_API_PORT (and optionally REACT_APP_API_BASE_PATH)
//   to build absolute URLs (e.g., benchmarkinator-api:12345) if you really need to bypass the proxy.

import axios from "axios";

// Environment-driven knobs (optional)
const API_HOST = (process.env.REACT_APP_API_HOST || "").trim();     // e.g., "benchmarkinator-api"
const API_PORT = (process.env.REACT_APP_API_PORT || "").trim();     // e.g., "12345"
const API_BASE_PATH = (process.env.REACT_APP_API_BASE_PATH || "/api").trim(); // usually "/api"

// Build the base URL:
// - If HOST is provided → "http://HOST[:PORT]/api"
// - Else → "/api" (relative, same-origin; ideal with Nginx proxying /api → API service)
const buildBaseURL = () => {
  if (!API_HOST) return API_BASE_PATH; // same-origin relative path
  const port = API_PORT ? `:${API_PORT}` : "";
  const base = `http://${API_HOST}${port}`;
  // Ensure we join without duplicate slashes
  return base.replace(/\/$/, "") + "/" + API_BASE_PATH.replace(/^\//, "");
};

// Safe join helper
const joinUrl = (base, path) =>
  base.replace(/\/$/, "") + "/" + String(path || "").replace(/^\//, "");

// Public config object (endpoints remain under /api)
export const API_CONFIG = {
  API_HOST,
  API_PORT,
  BASE_PATH: API_BASE_PATH,
  ENDPOINTS: {
    // Authentication
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    ME: "/api/auth/me",

    // Hardware
    CPU: "/api/cpu",
    GPU: "/api/gpu",
    MOTHERBOARD: "/api/motherboard",
    RAM: "/api/ram",
    DISK: "/api/disk",
    OS: "/api/oses",

    // Config & Benchmarks
    CONFIG: "/api/config",
    BENCHMARK: "/api/benchmark",
    BENCHMARK_RESULTS: "/api/benchmark_results",
  },
};

// Base URL resolved from env/defaults
export const API_BASE_URL = buildBaseURL();

// Helper to build a full URL for any endpoint/key
export const buildApiUrl = (endpoint) => joinUrl(API_BASE_URL, endpoint);

// Shared axios instance using the resolved base URL
export const api = axios.create({ baseURL: API_BASE_URL });

// Note:
// - In production with Nginx, keep envs unset so API_BASE_URL = "/api".
//   Nginx should proxy /api → http://benchmarkinator-api:12345
// - If you insist on talking directly to the service name from the browser,
//   set REACT_APP_API_HOST=benchmarkinator-api and REACT_APP_API_PORT=12345
//   (and enable CORS on the API).
