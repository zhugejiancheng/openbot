#!/usr/bin/env node

/**
 * OpenBot 安装向导
 * 提供友好的交互式安装体验
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

// 创建readline接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 询问函数
function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

// 彩色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function colorize(color, text) {
  return `${color}${text}${colors.reset}`;
}

function logSuccess(text) {
  console.log(colorize(colors.green, `✓ ${text}`));
}

function logInfo(text) {
  console.log(colorize(colors.blue, `→ ${text}`));
}

function logWarning(text) {
  console.log(colorize(colors.yellow, `⚠ ${text}`));
}

function logError(text) {
  console.log(colorize(colors.red, `✗ ${text}`));
}

async function main() {
  console.log('');
  console.log(colorize(colors.cyan, '╔══════════════════════════════════════╗'));
  console.log(colorize(colors.cyan, '║           OpenBot 安装向导           ║'));
  console.log(colorize(colors.cyan, '║      一个强大的AI助手框架            ║'));
  console.log(colorize(colors.cyan, '╚══════════════════════════════════════╝'));
  console.log('');

  // 检查Node.js版本
  logInfo('正在检查系统环境...');
  const nodeVersion = process.version;
  const nodeMajor = parseInt(nodeVersion.split('.')[0].substring(1));
  
  if (nodeMajor < 14) {
    logError(`Node.js 版本过低 (${nodeVersion})，需要 Node.js 14.x 或更高版本`);
    process.exit(1);
  }
  
  logSuccess(`检测到 Node.js ${nodeVersion}`);
  logSuccess('环境检查通过');

  // 检查npm
  try {
    const npmVersion = execSync('npm --version', { encoding: 'utf-8' }).trim();
    logSuccess(`检测到 npm ${npmVersion}`);
  } catch (e) {
    logError('未找到 npm，请确保已安装 Node.js');
    process.exit(1);
  }

  console.log('');
  logInfo('开始安装 OpenBot...');

  // 检查是否已有package.json
  const hasPackageJson = fs.existsSync(path.join(process.cwd(), 'package.json'));
  
  if (!hasPackageJson) {
    logInfo('初始化项目...');
    try {
      execSync('npm init -y', { stdio: 'pipe' });
      logSuccess('项目初始化完成');
    } catch (e) {
      logError('项目初始化失败: ' + e.message);
      process.exit(1);
    }
  } else {
    logInfo('检测到现有项目，跳过初始化');
  }

  // 安装依赖
  console.log('');
  logInfo('正在安装依赖包...');
  console.log(colorize(colors.yellow, '  这可能需要几分钟时间，请耐心等待...'));

  try {
    execSync('npm install express cors axios dotenv ws node-fetch openai', {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    logSuccess('核心依赖安装完成');
  } catch (e) {
    logError('依赖安装失败: ' + e.message);
    process.exit(1);
  }

  // 检查是否有.env文件
  const envExists = fs.existsSync(path.join(process.cwd(), '.env'));
  
  if (!envExists) {
    logInfo('创建配置文件...');
    const envTemplate = `# OpenBot 配置文件
# 将以下变量设置为您自己的值

# 服务器配置
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# AI配置（可选）
OPENAI_API_KEY=

# 飞书配置（可选）
FEISHU_APP_ID=
FEISHU_APP_SECRET=
FEISHU_ENCRYPT_KEY=
FEISHU_VERIFICATION_TOKEN=

# 企业微信配置（可选）
WECHAT_WORK_CORP_ID=
WECHAT_WORK_AGENT_ID=
WECHAT_WORK_SECRET=

# 钉钉配置（可选）
DINGTALK_APP_KEY=
DINGTALK_APP_SECRET=
DINGTALK_WEBHOOK_URL=
`;
    
    fs.writeFileSync('.env', envTemplate);
    logSuccess('配置文件 .env 创建完成');
  } else {
    logInfo('检测到现有配置文件 .env');
  }

  // 检查是否有README
  const readmeExists = fs.existsSync(path.join(process.cwd(), 'README.md'));
  
  if (!readmeExists) {
    logInfo('创建说明文档...');
    const readmeContent = `# OpenBot

OpenBot 是一个功能丰富的开源AI助手项目，旨在提供类似于先进AI助手的能力，包括自然语言处理、任务自动化、文件操作、命令执行等多种能力。

## 快速开始

### 安装
\`\`\`
npm install
\`\`\`

### 启动
\`\`\`
npm start
# 或
node src/index.js
\`\`\`

### 开发模式
\`\`\`
npm run dev  # 需要先安装 nodemon
\`\`\`

## 配置

复制 .env.example 到 .env 并填入相应配置。

## API 接口

- \`GET /\` - 基本信息
- \`POST /chat\` - 与OpenBot对话
- \`GET /health\` - 健康检查
- \`GET /tools\` - 可用工具列表
- \`GET /channels\` - 可用渠道列表

## 使用示例

\`\`\`bash
# 与OpenBot对话
curl -X POST http://localhost:3000/chat \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Hello", "userId": "test"}'
\`\`\`

## 许可证

MIT
`;

    fs.writeFileSync('README.md', readmeContent);
    logSuccess('说明文档 README.md 创建完成');
  }

  // 检查是否有src目录
  const srcDir = path.join(process.cwd(), 'src');
  if (!fs.existsSync(srcDir)) {
    logInfo('创建项目结构...');
    fs.mkdirSync(srcDir, { recursive: true });
    
    // 创建子目录
    const utilsDir = path.join(srcDir, 'utils');
    const integrationsDir = path.join(srcDir, 'integrations');
    const configDir = path.join(srcDir, 'config');
    
    fs.mkdirSync(utilsDir, { recursive: true });
    fs.mkdirSync(integrationsDir, { recursive: true });
    fs.mkdirSync(configDir, { recursive: true });
    
    logSuccess('项目结构创建完成');
  }

  // 检查是否有基本配置文件
  const configPath = path.join(srcDir, 'config', 'config.js');
  if (!fs.existsSync(configPath)) {
    logInfo('创建配置文件...');
    const configContent = `/**
 * OpenBot 配置文件
 */

require('dotenv').config();

const config = {
  server: {
    port: parseInt(process.env.PORT) || 3000,
    host: process.env.HOST || 'localhost',
    env: process.env.NODE_ENV || 'development'
  },
  ai: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY || null,
      model: process.env.MODEL_NAME || 'gpt-3.5-turbo',
      temperature: parseFloat(process.env.TEMPERATURE) || 0.7,
      maxTokens: parseInt(process.env.MAX_TOKENS) || 1000
    }
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  },
  features: {
    enableChannels: true,
    enableTools: true,
    enableMemory: true
  }
};

module.exports = config;
`;

    fs.writeFileSync(configPath, configContent);
    logSuccess('配置文件创建完成');
  }

  console.log('');
  logInfo('安装完成！🎉');

  console.log('');
  console.log(colorize(colors.green, '🎉 OpenBot 安装成功！'));
  console.log('');
  console.log(colorize(colors.cyan, '快速开始：'));
  console.log(colorize(colors.white, '  1. 检查 .env 文件并按需配置'));
  console.log(colorize(colors.white, '  2. 启动服务: npm start'));
  console.log(colorize(colors.white, '  3. 访问: http://localhost:3000'));
  console.log('');
  console.log(colorize(colors.yellow, '提示：'));
  console.log(colorize(colors.white, '  - 如需AI功能，请配置 OPENAI_API_KEY'));
  console.log(colorize(colors.white, '  - 如需国产渠道功能，请配置相应平台参数'));
  console.log(colorize(colors.white, '  - 查看 README.md 获取更多信息'));

  console.log('');
  logInfo('感谢您选择 OpenBot！');
  logInfo('祝您使用愉快！😊');

  rl.close();
}

// 运行主函数
main().catch(err => {
  console.error('安装过程中出现错误:', err);
  process.exit(1);
});