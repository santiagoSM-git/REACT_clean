# syntax=docker/dockerfile:1
# =============================================================================
# KAFFA — imagen de producción del frontend (React + Vite)
# =============================================================================
# Se construye desde la carpeta REACT_kaffa:
#   docker build -t kaffa-web .
#
# La SPA se compila dentro del VPS. El resultado (dist) se copia a Nginx,
# que además recibe la configuración del backend mediante un volumen del
# docker-compose. El frontend y la API quedan en el mismo origen.
# =============================================================================

FROM node:22-alpine AS build

WORKDIR /app

ENV CI=true

RUN npm install -g pnpm@9.15.9

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

ARG VITE_API_URL=/api/v1
ARG VITE_CLOUDINARY_CLOUD_NAME
ARG VITE_CLOUDINARY_UPLOAD_PRESET

ENV VITE_API_URL=$VITE_API_URL \
    VITE_CLOUDINARY_CLOUD_NAME=$VITE_CLOUDINARY_CLOUD_NAME \
    VITE_CLOUDINARY_UPLOAD_PRESET=$VITE_CLOUDINARY_UPLOAD_PRESET

RUN pnpm build

# =============================================================================

FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
