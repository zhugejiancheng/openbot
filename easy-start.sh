#!/bin/bash
# OpenBot 简单启动脚本

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 启动 OpenBot..."
echo "项目目录: $PROJECT_DIR"
echo "访问 http://localhost:3000 查看服务状态"
echo "中文接口: POST /chinese-chat"
echo

cd "$PROJECT_DIR"
node src/index.js