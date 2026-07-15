# ═══ SPRINT 9 ═══
# Stage 1: build Vite (genera i file statici in /dist).
FROM node:22-alpine AS build
WORKDIR /src
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: nginx serve i file statici e fa da proxy verso il backend
# (stesso ruolo del proxy Vite in sviluppo).
FROM nginx:alpine
COPY --from=build /src/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
