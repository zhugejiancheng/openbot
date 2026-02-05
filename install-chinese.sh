#!/bin/bash

# OpenBot 中文安装脚本
# 一键安装和配置 OpenBot

set -e  # 遇到错误时退出

echo "==========================================="
echo "    欢迎使用 OpenBot 中文安装向导"
echo "==========================================="
echo

# 检查 Node.js 是否已安装
check_node() {
    if ! command -v node &> /dev/null; then
        echo "❌ 错误: Node.js 未安装"
        echo "请先安装 Node.js (版本 14.x 或更高)"
        echo "可以从 https://nodejs.org 下载"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | sed 's/v//')
    MIN_VERSION="14.0.0"
    
    if [[ "$(printf '%s\n' "$MIN_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$MIN_VERSION" ]]; then
        echo "❌ 错误: Node.js 版本过低"
        echo "当前版本: $NODE_VERSION, 需要至少: $MIN_VERSION"
        exit 1
    fi
    
    echo "✅ Node.js 版本: $NODE_VERSION"
}

# 检查 npm 是否已安装
check_npm() {
    if ! command -v npm &> /dev/null; then
        echo "❌ 错误: npm 未安装"
        exit 1
    fi
    
    NPM_VERSION=$(npm -v)
    echo "✅ npm 版本: $NPM_VERSION"
}

# 克隆或更新项目
setup_project() {
    PROJECT_DIR="$HOME/openbot"
    
    if [ -d "$PROJECT_DIR" ]; then
        echo "📁 检测到现有项目，正在更新..."
        cd "$PROJECT_DIR"
        git pull origin main
    else
        echo "📥 正在克隆 OpenBot 项目..."
        git clone https://github.com/zhugejiancheng/openbot.git "$PROJECT_DIR"
        cd "$PROJECT_DIR"
    fi
    
    echo "✅ 项目设置完成: $PROJECT_DIR"
}

# 安装依赖
install_dependencies() {
    echo "📦 正在安装项目依赖..."
    npm install
    echo "✅ 依赖安装完成"
}

# 配置环境变量
configure_environment() {
    echo "⚙️  正在配置环境..."
    
    if [ ! -f ".env" ]; then
        cp .env.example .env
        echo "✅ 已创建 .env 配置文件"
    fi
    
    # 询问用户是否需要配置 API 密钥
    echo
    echo "📋 您可以选择配置以下服务的 API 密钥:"
    echo "   1. OpenAI (可选，留空则使用基础功能)"
    echo "   2. 飞书集成 (可选)"
    echo "   3. 企业微信集成 (可选)"
    echo "   4. 钉钉集成 (可选)"
    echo
    
    read -p "是否现在配置 API 密钥? [y/N]: " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        configure_openai
        configure_feishu
        configure_wechat_work
        configure_dingtalk
    fi
}

configure_openai() {
    echo
    echo "🔑 OpenAI 配置:"
    read -p "   请输入 OpenAI API 密钥 (可选，直接回车跳过): " OPENAI_KEY
    if [ ! -z "$OPENAI_KEY" ]; then
        sed -i.bak "s|^OPENAI_API_KEY=.*|OPENAI_API_KEY=$OPENAI_KEY|" .env && rm -f .env.bak
        echo "✅ OpenAI API 密钥已配置"
    fi
}

configure_feishu() {
    echo
    echo "🪶 飞书配置 (可选):"
    read -p "   飞书应用ID (App ID, 可选): " FEISHU_APP_ID
    if [ ! -z "$FEISHU_APP_ID" ]; then
        sed -i.bak "s|^FEISHU_APP_ID=.*|FEISHU_APP_ID=$FEISHU_APP_ID|" .env && rm -f .env.bak
    fi
    
    read -p "   飞书应用密钥 (App Secret, 可选): " FEISHU_APP_SECRET
    if [ ! -z "$FEISHU_APP_SECRET" ]; then
        sed -i.bak "s|^FEISHU_APP_SECRET=.*|FEISHU_APP_SECRET=$FEISHU_APP_SECRET|" .env && rm -f .env.bak
    fi
    
    if [ ! -z "$FEISHU_APP_ID" ] || [ ! -z "$FEISHU_APP_SECRET" ]; then
        echo "✅ 飞书配置已保存"
    fi
}

configure_wechat_work() {
    echo
    echo "💬 企业微信配置 (可选):"
    read -p "   企业ID (Corp ID, 可选): " WECHAT_WORK_CORP_ID
    if [ ! -z "$WECHAT_WORK_CORP_ID" ]; then
        sed -i.bak "s|^WECHAT_WORK_CORP_ID=.*|WECHAT_WORK_CORP_ID=$WECHAT_WORK_CORP_ID|" .env && rm -f .env.bak
    fi
    
    read -p "   应用密钥 (App Secret, 可选): " WECHAT_WORK_APP_SECRET
    if [ ! -z "$WECHAT_WORK_APP_SECRET" ]; then
        sed -i.bak "s|^WECHAT_WORK_APP_SECRET=.*|WECHAT_WORK_APP_SECRET=$WECHAT_WORK_APP_SECRET|" .env && rm -f .env.bak
    fi
    
    if [ ! -z "$WECHAT_WORK_CORP_ID" ] || [ ! -z "$WECHAT_WORK_APP_SECRET" ]; then
        echo "✅ 企业微信配置已保存"
    fi
}

configure_dingtalk() {
    echo
    echo "🔔 钉钉配置 (可选):"
    read -p "   钉钉应用密钥 (App Key, 可选): " DINGTALK_APP_KEY
    if [ ! -z "$DINGTALK_APP_KEY" ]; then
        sed -i.bak "s|^DINGTALK_APP_KEY=.*|DINGTALK_APP_KEY=$DINGTALK_APP_KEY|" .env && rm -f .env.bak
    fi
    
    read -p "   钉钉应用密钥 (App Secret, 可选): " DINGTALK_APP_SECRET
    if [ ! -z "$DINGTALK_APP_SECRET" ]; then
        sed -i.bak "s|^DINGTALK_APP_SECRET=.*|DINGTALK_APP_SECRET=$DINGTALK_APP_SECRET|" .env && rm -f .env.bak
    fi
    
    if [ ! -z "$DINGTALK_APP_KEY" ] || [ ! -z "$DINGTALK_APP_SECRET" ]; then
        echo "✅ 钉钉配置已保存"
    fi
}

# 创建启动脚本
create_start_script() {
    cat > start.sh << 'EOF'
#!/bin/bash
# OpenBot 启动脚本

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 启动 OpenBot..."
echo "项目目录: $PROJECT_DIR"
echo "访问 http://localhost:3000 查看服务状态"
echo

cd "$PROJECT_DIR"
node src/index.js
EOF

    chmod +x start.sh
    echo "✅ 启动脚本已创建 (start.sh)"
}

# 显示完成信息
show_completion_info() {
    echo
    echo "🎉 恭喜! OpenBot 已成功安装和配置"
    echo
    echo "🔧 接下来您可以:"
    echo "   1. 启动服务: ./start.sh"
    echo "   2. 访问 http://localhost:3000 查看状态"
    echo "   3. 使用 API 端点进行开发"
    echo
    echo "🌐 支持的 API 端点:"
    echo "   - GET / - 基本信息"
    echo "   - POST /chinese-chat - 中文聊天接口"
    echo "   - POST /chat - 英文聊天接口"
    echo "   - GET /health - 健康检查"
    echo "   - GET /chinese-chat/tools - 中文工具列表"
    echo "   - GET /chinese-chat/help - 中文帮助"
    echo
    echo "💡 提示: 您可以通过中文指令与机器人交互，例如:"
    echo "   - '读取文件 /path/to/file'"
    echo "   - '搜索 人工智能最新发展'"
    echo "   - '执行命令 ls -la'"
    echo "   - '发送消息 你好世界'"
    echo
    echo "👋 感谢使用 OpenBot!"
}

# 主安装流程
main() {
    echo "🔍 检查系统环境..."
    check_node
    check_npm
    
    echo
    setup_project
    
    echo
    install_dependencies
    
    echo
    configure_environment
    
    echo
    create_start_script
    
    show_completion_info
}

# 运行主函数
main "$@"