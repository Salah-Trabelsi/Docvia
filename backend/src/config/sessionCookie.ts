import { validateEnv } from "./env.js";

// Preserve public production HTTPS cookies. The only HTTP exception is the
// explicitly enabled, validated localhost combined-container configuration.
export function secureSessionCookie() {
  const env = validateEnv();
  return process.env.NODE_ENV === "production" && !env.DOCKER_LOCAL_HTTP;
}
