# PMC 前端镜像：多阶段构建（Node 构建 → Nginx 托管 + 反代网关）
# 构建参数：VITE_MODE=server（生产服务端模式，需登录连后端）| local（纯本地 localStorage）
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm config set registry https://registry.npmmirror.com && npm ci || npm install
COPY . .
ARG VITE_MODE=server
ENV VITE_MODE=$VITE_MODE
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
