# Node 24 LTS; Debian/glibc stages keep Sharp and bcrypt native binaries compatible.
FROM node:24-bookworm-slim AS frontend-build
WORKDIR /build/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
# Public build configuration only. No backend secrets belong in build arguments.
RUN VITE_API_URL=/api npm run build

FROM node:24-bookworm-slim AS backend-build
WORKDIR /build/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

FROM node:24-bookworm-slim AS backend-dependencies
WORKDIR /build/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app
COPY --from=backend-dependencies /build/backend/node_modules ./node_modules
COPY --from=backend-dependencies /build/backend/package.json ./package.json
COPY --from=backend-build /build/backend/dist ./dist
COPY --from=frontend-build /build/frontend/dist ./public
USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]
