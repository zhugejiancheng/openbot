# OpenBot

OpenBot 是一个功能丰富的开源AI助手项目，旨在提供类似于先进AI助手的能力，包括自然语言处理、任务自动化、文件操作、命令执行等多种能力。

## 项目简介

OpenBot是一个高度可扩展的AI助手，具备以下核心功能：

- **自然语言理解和生成** - 基于先进的大语言模型
- **智能工具使用** - 能够读写文件、执行命令、搜索网络等
- **任务自动化执行** - 自动化各种日常任务
- **文件管理系统** - 读取、写入和编辑文件
- **命令行接口** - 执行系统命令
- **记忆管理** - 保持对话上下文
- **多种API集成** - 集成各种外部服务

## 安装指南

### 前提条件
- Node.js 14.x 或更高版本
- npm (随Node.js一起安装)

### 安装步骤

1. 克隆项目：
```bash
git clone https://github.com/zhugejiancheng/openbot.git
cd openbot
```

2. 安装依赖：
```bash
npm install
```

或者使用安装脚本：
```bash
./install.sh
```

3. 配置环境变量：
```bash
cp .env.example .env
# 编辑 .env 文件，填入相应的API密钥
```

## 使用方法

### 启动服务器

开发模式（需要先安装nodemon）：
```bash
npm install -g nodemon  # 仅首次
npm run dev
```

生产模式：
```bash
npm start
```

或使用启动脚本：
```bash
./start.sh
```

### API端点

- `GET /` - 基本信息和可用功能
- `GET /health` - 健康检查
- `POST /chat` - 与OpenBot对话
- `GET /tools` - 获取可用工具列表
- `GET /conversation/:userId` - 获取对话历史
- `POST /conversation/reset/:userId` - 重置对话
- `POST /tool/:toolName` - 直接执行特定工具

### 示例请求

```bash
# 与OpenBot对话
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, OpenBot!", "userId": "test-user"}'

# 获取可用工具
curl http://localhost:3000/tools

# 执行特定工具
curl -X POST http://localhost:3000/tool/exec \
  -H "Content-Type: application/json" \
  -d '{"command": "echo Hello World"}'
```

## 功能特性

- **智能对话** - 支持自然语言交互
- **文件操作** - 读取、写入、编辑文件
- **命令执行** - 安全地执行系统命令
- **网络搜索** - 搜索和获取网络信息
- **记忆管理** - 维护对话上下文
- **工具链** - 智能选择和使用适当工具
- **对话历史** - 保持用户对话状态
- **可扩展性** - 易于添加新功能和工具

## 配置选项

在 `.env` 文件中可以配置以下选项：

- `NODE_ENV` - 运行环境 (development/production)
- `PORT` - 服务器端口 (默认: 3000)
- `LOG_LEVEL` - 日志级别 (debug/info/warn/error)
- `OPENAI_API_KEY` - OpenAI API密钥
- `MODEL_NAME` - 使用的AI模型 (默认: gpt-3.5-turbo)
- `TEMPERATURE` - AI响应随机性 (默认: 0.7)
- `MAX_TOKENS` - 最大响应长度 (默认: 1000)

## 架构说明

OpenBot采用模块化架构：

- `src/index.js` - 主服务器入口
- `src/utils/chatProcessor.js` - 基础聊天处理
- `src/utils/enhancedChatProcessor.js` - 增强聊天处理，支持工具使用
- `src/utils/toolManager.js` - 工具管理器
- `src/config/config.js` - 配置管理
- `docs/` - 文档

## 贡献指南

欢迎提交Issue和Pull Request来帮助改进OpenBot。

## 许可证

MIT License