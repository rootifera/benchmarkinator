// src/config/api.js

// Keep your existing constants above this…

export const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || "").trim();
export const API_BASE_PATH = (process.env.REACT_APP_API_BASE_PATH || "/api").trim(); // usually "/api"

// Compute the base once
const RAW_BASE = API_BASE_URL || API_BASE_PATH;

// JOIN helper: ensures exactly one slash between base and path,
// and prevents accidental double "/api/api/…"
export function buildApiUrl(path = "") {
  const base = RAW_BASE.replace(/\/+$/, "");         // strip trailing slashes
  let p = String(path);

  // Remove leading slashes
  p = p.replace(/^\/+/, "");

  // If someone passes "/api/..." or "api/..." normalize to just the remainder
  if (p.toLowerCase().startsWith("api/")) {
    p = p.slice(4); // drop "api/"
  }

  // Done if empty (rare)
  if (!p) return base || "/";

  return `${base}/${p}`;
}

// Optional: export canonical endpoints WITHOUT the "/api" prefix.
// (You can keep using buildApiUrl('/api/…') thanks to the normalization above,
// but these help prevent regressions.)
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "auth/login",
    REGISTER: "auth/register",
    ME: "auth/me",
  },
  CPU: "cpu",
  GPU: "gpu",
  MOTHERBOARD: "motherboard",
  RAM: "ram",
  DISK: "disk",
  OS: "oses",
  CONFIG: "config",
  BENCHMARK: "benchmark",
  BENCHMARK_RESULTS: "benchmark_results",
};
