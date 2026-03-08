# Next.js 应用 - 与 vision 服务一起由 docker-compose 启动
FROM node:20-bookworm-slim AS base
WORKDIR /app

# 安装 OpenSSL，满足 Prisma 引擎依赖
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
ENV NODE_ENV=production
CMD ["npm", "start"]
