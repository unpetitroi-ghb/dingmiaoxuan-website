# 丁妙煊的奇妙工坊 - 静态站点（nginx）
# Cloud Run 要求容器监听 PORT（默认 8080）
FROM nginx:alpine
COPY index.html /usr/share/nginx/html/
RUN echo 'server { listen 8080; root /usr/share/nginx/html; index index.html; location / { try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
