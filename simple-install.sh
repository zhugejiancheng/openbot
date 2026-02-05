#!/bin/bash
# OpenBot 简化安装脚本
# 一键安装，无需复杂交互

set -e

echo "🚀 正在安装 OpenBot..."

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未检测到 Node.js，请先安装 Node.js 14+"
    exit 1
fi

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo "❌ 未检测到 npm"
    exit 1
fi

# 克隆或进入项目目录
PROJECT_DIR="$HOME/openbot-simple"

if [ ! -d "$PROJECT_DIR" ]; then
    echo "📥 正在下载 OpenBot..."
    git clone https://github.com/zhugejiancheng/openbot.git "$PROJECT_DIR"
fi

cd "$PROJECT_DIR"

# 安装依赖
echo "📦 正在安装依赖..."
npm install

# 创建默认配置
if [ ! -f ".env" ]; then
    echo "⚙️  创建默认配置..."
    cat > .env << EOF
PORT=3000
NODE_ENV=production
LOG_LEVEL=info
# 如需使用 OpenAI，在下方添加 API KEY
# OPENAI_API_KEY=your_key_here
EOF
fi

echo "✅ 安装完成！"
echo
echo "启动命令："
echo "cd $PROJECT_DIR && npm start"
echo
echo "启动后访问：http://localhost:3000"
echo
echo "中文聊天接口：http://localhost:3000/chinese-chat"
echo "支持的中文指令："
echo "  - '读取文件 /path/to/file'"
echo "  - '执行命令 ls -la'"
echo "  - '搜索 人工智能最新发展'"
echo "  - '发送消息 你好世界'"