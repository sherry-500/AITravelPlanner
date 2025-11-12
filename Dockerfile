# 多阶段构建 Dockerfile for AI Travel Planner

# 第一阶段：构建阶段
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖（包括开发依赖，用于构建）
RUN npm ci

# 复制源代码
COPY . .

# 设置构建时环境变量
ARG VITE_DEEPSEEK_API_KEY
ARG VITE_DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
ARG VITE_AMAP_WEB_SERVICE_KEY
ARG VITE_AMAP_WEB_KEY
ARG VITE_AMAP_SECURITY_CODE
ARG VITE_BAIDU_APP_ID
ARG VITE_BAIDU_API_KEY
ARG VITE_BAIDU_SECRET_KEY
ARG VITE_APP_NAME="AI 旅行规划师"
ARG VITE_APP_VERSION="1.0.0"

# 将 ARG 转换为 ENV（构建时可用）
ENV VITE_DEEPSEEK_API_KEY=$VITE_DEEPSEEK_API_KEY
ENV VITE_DEEPSEEK_BASE_URL=$VITE_DEEPSEEK_BASE_URL
ENV VITE_AMAP_WEB_SERVICE_KEY=$VITE_AMAP_WEB_SERVICE_KEY
ENV VITE_AMAP_WEB_KEY=$VITE_AMAP_WEB_KEY
ENV VITE_AMAP_SECURITY_CODE=$VITE_AMAP_SECURITY_CODE
ENV VITE_BAIDU_APP_ID=$VITE_BAIDU_APP_ID
ENV VITE_BAIDU_API_KEY=$VITE_BAIDU_API_KEY
ENV VITE_BAIDU_SECRET_KEY=$VITE_BAIDU_SECRET_KEY
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_APP_VERSION=$VITE_APP_VERSION

# 构建应用
RUN npm run build

# 第二阶段：生产阶段
FROM nginx:alpine AS production

# 安装 curl 用于健康检查
RUN apk add --no-cache curl

# 复制构建产物到 nginx 目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 nginx 配置文件
COPY nginx.conf /etc/nginx/nginx.conf

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]