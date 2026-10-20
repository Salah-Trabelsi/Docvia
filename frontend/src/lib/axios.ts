import axios from "axios";

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
if (import.meta.env.PROD && !configuredApiUrl) {
  throw new Error("VITE_API_URL must be configured for production.");
}

export const api = axios.create({
  baseURL: configuredApiUrl || "http://localhost:3000/api",
  timeout: 10000,
});
