# frontend/Dockerfile
# Copia o build já gerado localmente e serve via Nginx

FROM nginx:alpine AS production
COPY nginx-frontend.conf /etc/nginx/conf.d/default.conf
COPY dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
