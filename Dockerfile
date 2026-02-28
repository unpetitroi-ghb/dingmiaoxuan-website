# 丁妙煊的奇妙工坊 - 静态站点（nginx）
# Cloud Run 要求容器监听 PORT（默认 8080）
FROM nginx:alpine
COPY index.html avatar.png /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
