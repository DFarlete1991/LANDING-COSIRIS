# El "Static Site" nativo de Dokploy genera su propio Dockerfile con nginx
# sin forma de agregar cabeceras HTTP personalizadas ni el ruteo SPA que
# necesita esta app (ver docs.dokploy.com/docs/core/applications/build-type).
# Por eso este repo trae su propio Dockerfile: en el dashboard de Dokploy,
# el Build Type de este servicio debe ser "Dockerfile", no "Nixpacks"/"Static".
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
