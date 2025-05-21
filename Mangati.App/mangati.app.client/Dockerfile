# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY ["Mangati.App/mangati.app.client/package*.json", "./"]
RUN npm ci
COPY ["Mangati.App/mangati.app.client", "./"]
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY ["Mangati.App/mangati.app.client/nginx.conf", "/etc/nginx/conf.d/default.conf"]
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]