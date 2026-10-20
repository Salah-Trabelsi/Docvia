# Docvia local production-style Docker

One Compose service builds React and TypeScript, then runs the existing Express `dist/server.js` entry point. Atlas, Resend and Cloudinary remain external. Nothing seeds the database automatically.

This is a **localhost portfolio/demo setup**, separate from the intended Vercel frontend and Render backend deployment. It has not been built or run as part of implementation.

## Image stages

The Dockerfile uses `node:24-bookworm-slim` in every stage: [Node 24 is an LTS release](https://nodejs.org/en/download). Matching Debian/glibc stages avoid mixing native Sharp/bcrypt binaries across platforms.

1. `frontend-build`: `npm ci`, then `VITE_API_URL=/api npm run build`. This is the only frontend environment override; it is public and contains no credentials.
2. `backend-build`: `npm ci`, then `npm run build`.
3. `backend-dependencies`: `npm ci --omit=dev` installs runtime dependencies without TypeScript/dev tools.
4. `runtime`: copies only backend runtime dependencies, package metadata, compiled backend and frontend assets. Runs as the built-in non-root `node` user on port 3000.

Lockfiles are used unchanged. Secrets are never Docker build arguments or copied environment files. The root `.dockerignore` excludes private environments, node_modules, local builds, Git and temporary files. Tags receive updates: use `--pull` when rebuilding; verify native dependencies on your target architecture before demonstrating the image.

## Prepare configuration

Run these commands from `application/` with Docker Engine/Desktop and Compose v2 available:

```powershell
Copy-Item Docker/.env.example Docker/.env
```

Fill in `Docker/.env` using a local editor; do not commit it. It is ignored by Git and excluded from the build context. Use single-quoted dotenv values when a value contains `$` to avoid Compose interpolation. Do not share `docker compose config` output, environment dumps or screenshots containing credentials.

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | Required Atlas connection to a dedicated test database with transaction support. Include a database name and appropriate credentials. |
| `JWT_SECRET` | Required independently generated high-entropy secret, at least 32 characters. Do not reuse production credentials. |
| `RESEND_API_KEY` | Required to exercise verification/reset/email-change and appointment email delivery; runtime only. App startup permits omission, but those email features will not work. |
| `EMAIL_FROM_VERIFY` | Verification sender; example uses `Docvia <verify@docvia.space>`. |
| `EMAIL_FROM_SECURITY` | Password/security sender; example uses `Docvia <security@docvia.space>`. |
| `EMAIL_FROM_APPOINTMENTS` | Appointment sender; existing validation requires `Docvia <appointments@docvia.space>`. |
| `APPOINTMENT_EMAIL_WORKER_ENABLED` | Defaults to **false** in this Compose setup. Set true only after isolating the test database and stopping any other worker using it. |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Required for avatar upload; use test resources. Backend-only runtime values. |

Compose fixes `NODE_ENV=production`, `PORT=3000`, `FRONTEND_URL=http://localhost:3000`, `SERVE_FRONTEND=true`, `DOCKER_LOCAL_HTTP=true` and an empty `TRUSTED_PROXY_CIDRS`. These cannot accidentally be overridden by values in the secrets file. The worker flag is read through Compose interpolation; use the explicit `--env-file Docker/.env` argument shown below when enabling it.

Atlas must allow your development machine's outbound public IP, not a Docker internal address. Do not open Atlas to every IP just to make the demo work. Existing startup creates/checks the application's indexes and may remove the obsolete outbox index as before; point it only at a prepared test database. This Docker integration does not modify that startup behavior.

## Build, run, logs and stop

```powershell
docker compose --env-file Docker/.env -f Docker/docker-compose.yaml build --pull
docker compose --env-file Docker/.env -f Docker/docker-compose.yaml up -d
docker compose --env-file Docker/.env -f Docker/docker-compose.yaml ps
docker compose --env-file Docker/.env -f Docker/docker-compose.yaml logs --tail=100 -f docvia
```

Open **http://localhost:3000**. Use `localhost`, not `127.0.0.1`, as the browser origin: the latter does not match the exact CSRF origin. Port publishing is restricted to host loopback (`127.0.0.1:3000`), not your LAN.

Stop/remove the container:

```powershell
docker compose --env-file Docker/.env -f Docker/docker-compose.yaml down
```

Rebuild after source changes:

```powershell
docker compose --env-file Docker/.env -f Docker/docker-compose.yaml up -d --build
```

Recreate after runtime environment changes:

```powershell
docker compose --env-file Docker/.env -f Docker/docker-compose.yaml up -d --force-recreate
```

No source bind mounts or database volumes are used. Stopping the container does not remove Atlas data or Cloudinary assets. `unless-stopped` restarts an exited process; Docker health status alone does **not** restart a running unhealthy process.

## Serving, cookies and rate limiting

- With `SERVE_FRONTEND=true`, Express serves `/app/public` after its existing API routes. React Router page requests receive `index.html`; unknown `/api` routes get JSON 404, never the SPA. Missing files such as JS/CSS remain 404.
- Without that flag (the default), backend static serving is disabled. Existing Vite development and Vercel/Render serving remain separate.
- The compiled frontend uses relative `/api`, keeping requests same-origin in Docker. Existing credentialed Axios calls, JWT verification and exact Origin/Referer protection are unchanged.
- `NODE_ENV` stays production. Only the explicit `DOCKER_LOCAL_HTTP` exception removes Secure from session cookies for local HTTP. Validation rejects that exception unless combined serving is enabled, `FRONTEND_URL` is exactly `http://localhost:3000`, port is 3000 and proxy trust is empty. Cookie creation and all clearing flows share this decision; HttpOnly, SameSite=Lax, Path=/ and expiration behavior are unchanged.
- This exception is **not for public hosting**. Configuration validation cannot enforce a network boundary; retain the loopback port mapping and do not expose this container through tunnels or public proxies with the exception enabled.
- Standalone Docker ignores forwarded IP headers. Docker Desktop/NAT can make local requests share an IP budget; account-level limits still apply. Do not enable blanket proxy trust to work around this.
- Rate counters and upload concurrency remain process-local and reset on restart. Do not scale this single-service demo as if it had a shared limiter.

## Email worker safety

The original server still starts the worker. Compose defaults its flag to false, causing the existing worker to pause both reminder discovery and appointment outbox delivery. Booking/cancellation/rescheduling can still enqueue events.

For an email demonstration, use a dedicated test database with only test recipients, stop any local/Render worker targeting that database, then set `APPOINTMENT_EMAIL_WORKER_ENABLED=true` and recreate the container. Inspect pending events before enabling: previously queued emails can be delivered. Never start a second demo stack against shared real patient data.

Disabling this worker does **not** disable direct registration, password-reset or email-change emails. Use only controlled test inboxes and credentials. Links generated in this mode point to localhost and must be opened on the machine running Docker.

Existing leases/retries recover work after a stopped container restarts. This integration does not change worker delivery semantics or add graceful-shutdown handling; verify interrupted delivery and restart behavior separately.

## Manual validation (not executed)

After starting the container, run from the host:

```powershell
curl.exe -i http://localhost:3000/api/health
curl.exe -i -H "Accept: text/html" http://localhost:3000/profile
curl.exe -i http://localhost:3000/api/not-a-route
curl.exe -i http://localhost:3000/assets/not-a-file.js
docker compose --env-file Docker/.env -f Docker/docker-compose.yaml exec docvia id
```

Expected: health JSON `{"status":"ok"}`; HTML for the profile deep link (the client then applies auth protection); JSON 404 for the unknown API; 404 for the missing asset; a non-root process user.

The health endpoint is a process liveness check, not a continuing database/provider/worker readiness check. The server only starts listening after its existing database/index startup completes.

In a browser, using disposable accounts:

1. Confirm `/login` and refreshed deep links load, and network requests target `/api` on localhost rather than a baked-in external/localhost Vite API URL.
2. Log in and refresh a protected page. Inspect the cookie: HttpOnly, SameSite=Lax, Path=/, without Secure only in this local mode. Confirm logout clears it.
3. Exercise profile edits and uploads with test data; verify allowed Origin and the existing rate-limit responses. A missing/untrusted Origin must still be rejected for protected mutations.
4. Check doctor discovery and availability. If testing booking/emails, use only the isolated database and worker procedure above.
5. Confirm invalid configuration is rejected by startup; specifically never allow the local HTTP exception with a public frontend origin.

## Public deployment remains Vercel + Render

Do not use this localhost Compose file as a public deployment recipe.

- Vercel builds `frontend/` with `VITE_API_URL=https://api.docvia.space/api`.
- Render builds/runs `backend/` with `NODE_ENV=production`, `FRONTEND_URL=https://docvia.space`, and existing runtime secrets. Leave `SERVE_FRONTEND` and `DOCKER_LOCAL_HTTP` unset/false.
- Production cookies remain Secure; exact CORS/CSRF origin checks stay enabled.
- Verify trusted ingress CIDRs, HTTPS, cookie/session flows, dependencies/native modules, Atlas permissions/indexes and worker continuity before deploying publicly. Use shared rate-limit storage before multiple instances.
- No frontend secret, Docker runtime exception or localhost-generated email link should be carried into the public deployment.
