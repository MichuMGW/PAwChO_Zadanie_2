# syntax=docker/dockerfile:1.5

# Etap 1 - budowanie aplikacji
FROM node:20-alpine AS builder

# Katalog roboczy
WORKDIR /usr/app

# Instalacja zależności aplikacji
COPY package*.json ./
RUN npm install --production

# Kopiowanie plików źródłowych
COPY . .

# Etap 2 – finalny obraz
FROM node:20-alpine AS final

# OCI Metadata
LABEL org.opencontainers.image.authors="Michał Filipczak"

# Katalog roboczy
WORKDIR /usr/app

# Instalacja curl
RUN apk add --no-cache curl

# Skopiowanie zbudowanej aplikacji
COPY --from=builder /usr/app /usr/app

EXPOSE 3000

# HEALTHCHECK – czy działa HTTP na porcie 3000
HEALTHCHECK --interval=10s --timeout=2s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

CMD ["node", "server.js"]

