# frontend/Dockerfile
# Build: docker build -t esperancar-frontend -f frontend/Dockerfile .
FROM nginx:alpine AS production
COPY frontend/nginx-frontend.conf /etc/nginx/conf.d/default.conf
COPY dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
