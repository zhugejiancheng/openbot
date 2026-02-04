# OpenBot

<div align="center">
  <h3>一个功能丰富的开源AI助手项目</h3>
  <p>提供类似于先进AI助手的能力，包括自然语言处理、任务自动化、文件操作、命令执行等多种能力</p>
</div>

## ✨ 特性

- **🤖 智能对话** - 自然语言理解和生成
- **🛠️ 工具使用** - 读写文件、执行命令、搜索网络等
- **⚡ 任务自动化** - 自动化各种日常任务
- **📂 文件管理** - 读取、写入和编辑文件
- **💻 命令执行** - 安全地执行系统命令
- **🧠 记忆管理** - 保持对话上下文
- **🔗 API集成** - 集成各种外部服务
- **🇨🇳 国产渠道** - 支持飞书、企业微信、钉钉
- **📊 监控服务** - 主动监测和提醒功能
- **🔄 任务调度** - 自动化任务执行和管理

## 🚀 快速开始

### 系统要求
- **Node.js** 14.x 或更高版本
- **npm** (随Node.js一起安装)

### 安装方式

#### 方式一：图形化安装向导 (推荐)
1. 克隆项目：
   ```bash
   git clone https://github.com/zhugejiancheng/openbot.git
   cd openbot
   ```

2. 直接打开图形化安装向导：
   ```bash
   open setup-wizard.html  # macOS
   # 或在浏览器中直接打开该文件
   ```

3. 按照界面提示点击几下鼠标完成配置

#### 方式二：交互式命令行安装
1. **克隆项目**
   ```bash
   git clone https://github.com/zhugejiancheng/openbot.git
   cd openbot
   ```

2. **运行交互式安装向导**
   ```bash
   ./install.sh
   ```

3. **配置环境** (可选但推荐)
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，添加您的API密钥
   ```

#### 方式三：手动安装
```bash
npm install
```

### 启动服务

**生产模式：**
```bash
npm start
```

**开发模式：**
```bash
npm run dev  # 需要先安装 nodemon: npm install -g nodemon
```

**或使用启动脚本：**
```bash
./start.sh
```

服务启动后，访问 `http://localhost:3000` 查看基本信息。

## 🛠️ API 接口

### 基础接口
- `GET /` - 获取基本信息
- `GET /health` - 健康检查
- `POST /chat` - 与OpenBot对话

### 工具接口
- `GET /tools` - 获取可用工具列表
- `POST /tool/:toolName` - 执行特定工具

### 对话接口
- `GET /conversation/:userId` - 获取对话历史
- `POST /conversation/reset/:userId` - 重置对话

### 国产渠道接口
- `GET /channels` - 获取可用渠道
- `POST /channels/:channelName/send` - 发送消息到渠道
- `POST /channels/:channelName/send-rich` - 发送富文本消息
- `GET /channels/:channelName/user/:userId` - 获取用户信息
- `POST /channels/:channelName/callback` - 处理渠道事件

### 监控和任务接口
- `POST /monitor/add` - 添加监控器
- `GET /monitor/status` - 监控状态
- `GET /monitor/alerts` - 获取警报
- `POST /tasks/add` - 添加任务
- `POST /tasks/execute/:taskId` - 执行任务
- `POST /tasks/schedule` - 计划任务
- `GET /tasks/status/:taskId?` - 任务状态
- `GET /tasks/history` - 任务历史

## 🔧 配置选项

在 `.env` 文件中可以配置：

| 变量 | 描述 | 默认值 |
|------|------|--------|
| `PORT` | 服务器端口 | `3000` |
| `NODE_ENV` | 运行环境 | `development` |
| `LOG_LEVEL` | 日志级别 | `info` |
| `OPENAI_API_KEY` | OpenAI API密钥 | - |
| `MODEL_NAME` | AI模型名称 | `gpt-3.5-turbo` |

### 国产渠道配置
- **飞书 (Feishu)**: `FEISHU_APP_ID`, `FEISHU_APP_SECRET`, 等
- **企业微信 (WeChat Work)**: `WECHAT_WORK_CORP_ID`, `WECHAT_WORK_AGENT_ID`, 等
- **钉钉 (DingTalk)**: `DINGTALK_APP_KEY`, `DINGTALK_APP_SECRET`, 等

## 📖 使用示例

### 与OpenBot对话
```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "你好", "userId": "my-user"}'
```

### 获取可用工具
```bash
curl http://localhost:3000/tools
```

### 执行特定工具
```bash
curl -X POST http://localhost:3000/tool/exec \
  -H "Content-Type: application/json" \
  -d '{"command": "ls -la"}'
```

## 🏗️ 架构说明

OpenBot采用模块化架构：

```
src/
├── index.js              # 主服务器入口
├── config/
│   └── config.js         # 配置管理
├── utils/
│   ├── enhancedChatProcessor.js  # 增强聊天处理
│   ├── toolManager.js    # 工具管理器
│   ├── monitoringService.js  # 监控服务
│   └── taskScheduler.js  # 任务调度器
└── integrations/
    ├── channelsManager.js # 渠道管理器
    ├── feishuIntegration.js    # 飞书集成
    ├── wechatWorkIntegration.js # 企业微信集成
    └── dingtalkIntegration.js  # 钉钉集成
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来帮助改进 OpenBot！

## 📄 许可证

MIT License

---

<div align="center">
  <p>由 OpenBot 团队 ❤️ 开发</p>
  <p><em>让AI助手更智能、更易用</em></p>
</div>