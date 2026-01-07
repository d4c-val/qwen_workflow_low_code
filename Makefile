# ============================================
# QwenFlow Makefile
# ============================================
# 常用命令快捷方式
# ============================================

.PHONY: help install dev build docker-build docker-up docker-down docker-logs clean

# 默认目标：显示帮助
help:
	@echo ""
	@echo "🚀 QwenFlow - 常用命令"
	@echo "============================================"
	@echo ""
	@echo "  make install      安装依赖"
	@echo "  make dev          启动开发环境"
	@echo "  make build        构建生产版本"
	@echo ""
	@echo "  make docker-build 构建 Docker 镜像"
	@echo "  make docker-up    启动 Docker 容器"
	@echo "  make docker-down  停止 Docker 容器"
	@echo "  make docker-logs  查看 Docker 日志"
	@echo ""
	@echo "  make clean        清理构建产物"
	@echo ""

# 安装依赖
install:
	@echo "📦 安装后端依赖..."
	pip install -r requirements.txt
	@echo "📦 安装前端依赖..."
	cd qwen-ui && npm install
	@echo "✅ 依赖安装完成！"

# 启动开发环境
dev:
	@echo "🚀 启动开发环境..."
	@echo "后端: http://localhost:8000"
	@echo "前端: http://localhost:5173"
	@echo ""
	@echo "请在两个终端分别运行:"
	@echo "  终端1: uvicorn main:app --reload --port 8000"
	@echo "  终端2: cd qwen-ui && npm run dev"

# 构建生产版本
build:
	@echo "🔨 构建前端..."
	cd qwen-ui && npm run build
	@echo "📁 复制到 static 目录..."
	rm -rf static && cp -r qwen-ui/dist static
	@echo "✅ 构建完成！运行 'uvicorn main:app' 启动服务"

# Docker 构建
docker-build:
	@echo "🐳 构建 Docker 镜像..."
	docker-compose build

# Docker 启动
docker-up:
	@echo "🐳 启动 Docker 容器..."
	docker-compose up -d
	@echo "✅ 服务已启动: http://localhost:8000"

# Docker 停止
docker-down:
	@echo "🐳 停止 Docker 容器..."
	docker-compose down

# Docker 日志
docker-logs:
	docker-compose logs -f

# 清理
clean:
	@echo "🧹 清理构建产物..."
	rm -rf static
	rm -rf qwen-ui/dist
	rm -rf qwen-ui/node_modules/.vite
	rm -rf __pycache__
	@echo "✅ 清理完成！"

