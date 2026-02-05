# OpenClaw 原生模式

此模式下，OpenBot将以接近OpenClaw的原生方式运行，保留其原有的特性和交互方式。

## 启动 OpenClaw 原生模式

### 1. 环境配置
确保已安装 OpenClaw 所需的依赖：
- Node.js 16+
- Python 3.8+ (如果需要使用Python工具)
- Docker (如果需要容器化功能)

### 2. 启用原生模式
在 `.env` 文件中添加：
```bash
# 启用 OpenClaw 原生模式
CLAW_NATIVE_MODE=true

# 保持 OpenClaw 的默认行为
CLAW_COMPATIBILITY_MODE=true
```

### 3. 运行原生模式
```bash
# 使用特殊启动参数
npm run claw-native
# 或
node src/index.js --claw-mode
```

## 原生 OpenClaw 特性

### 工具可用性
所有 OpenClaw 工具保持原有接口和行为：
- `read`: 文件读取工具
- `write`: 文件写入工具
- `edit`: 文件编辑工具
- `exec`: 命令执行工具
- `web_search`: 网络搜索
- `web_fetch`: 网页抓取
- `browser`: 浏览器控制
- `image`: 图像分析
- `cron`: 定时任务
- `message`: 消息发送
- `memory_search`: 记忆搜索
- `memory_get`: 记忆获取
- 飞书相关工具 (feishu_*)

### 交互方式
- 保持 OpenClaw 的原始交互逻辑
- 支持原有的工具调用格式
- 保持原有的错误处理机制
- 维持原有的权限控制

### 配置兼容性
- 支持 OpenClaw 的配置文件格式
- 兼容原有的认证方式
- 保持工具配置的一致性

## 中文增强功能

即使在原生模式下，仍可使用中文增强功能：

### 中文指令
- 保留所有 OpenClaw 原生功能
- 增加中文指令映射
- 支持中文参数解析

### API 端点
- `/claw/native` - 原生 OpenClaw 接口
- `/claw/chinese` - 中文化 OpenClaw 接口
- `/claw/tools` - 工具列表
- `/claw/session` - 会话管理

## 使用示例

### 原生工具调用
```javascript
// 直接调用 OpenClaw 工具
await exec({ command: "ls -la" });
await read({ path: "./README.md" });
await web_search({ query: "人工智能发展趋势" });
```

### 中文增强调用
```bash
# 中文接口
curl -X POST http://localhost:3000/claw/chinese \
  -H "Content-Type: application/json" \
  -d '{"command": "read", "params": {"path": "./README.md"}}'

# 原生接口
curl -X POST http://localhost:3000/claw/native \
  -H "Content-Type: application/json" \
  -d '{"tool": "read", "arguments": {"path": "./README.md"}}'
```

## 配置选项

### 模式选择
- `CLAW_NATIVE_MODE`: 启用原生 OpenClaw 模式
- `CLAW_CHINESE_ENHANCED`: 启用中文增强功能
- `CLAW_BACKWARD_COMPATIBLE`: 保持向后兼容

### 工具配置
每个 OpenClaw 工具可在配置中单独启用/禁用：
```json
{
  "tools": {
    "exec": {
      "enabled": true,
      "security": "allowlist"
    },
    "read": {
      "enabled": true,
      "allowed_paths": ["./", "../data"]
    }
  }
}
```

此模式确保 OpenBot 既保留了 OpenClaw 的核心特性和功能，又增加了中文支持和易用性改进。