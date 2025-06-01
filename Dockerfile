# syntax=docker/dockerfile:1.2

# Etap 1 - budowanie aplikacji
FROM scratch AS build
ADD alpine-minirootfs-3.21.3-x86_64.tar /

# Instalujemy pakiety do budowy aplikacji
RUN apk add --no-cache nodejs npm

# Katalog roboczy
WORKDIR /usr/app

# Instalacja zależności aplikacji
COPY package.json ./
RUN npm install --production

# Kopiowanie plików źródłowych
COPY server.js ./

# Etap 2 – finalny obraz
FROM node:20-alpine AS final

# Katalog roboczy
WORKDIR /usr/app

# Instalacja curl
RUN apk add --no-cache curl

# Skopiowanie zbudowanej aplikacji
COPY --from=build /usr/app /usr/app

# OCI Metadata
LABEL org.opencontainers.image.authors="Michał Filipczak"

EXPOSE 3000

# HEALTHCHECK – czy działa HTTP na porcie 3000
HEALTHCHECK --interval=10s --timeout=2s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

# Komenda uruchomieniowa
CMD ["node", "server.js"]
