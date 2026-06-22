# frontend/Dockerfile
# Build Vite + servir via Nginx

# =============================================
# Stage 1: Build
# =============================================
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_MODE=BACKEND
ARG VITE_API_BASE_URL=/api
ENV VITE_API_MODE=${VITE_API_MODE}
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build

# =============================================
# Stage 2: Output (usado pelo Nginx)
# =============================================
FROM alpine AS output
WORKDIR /app
COPY --from=builder /app/dist /app/dist

# Este stage apenas expõe o dist para o volume compartido
CMD ["echo", "Frontend build complete"]
