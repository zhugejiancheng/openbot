/**
 * OpenBot - An open-source AI assistant
 * Entry point of the application
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors'); // Add CORS support
const EnhancedChatProcessor = require('./utils/enhancedChatProcessor');
const ChannelsManager = require('./integrations/channelsManager');
const MonitoringService = require('./utils/monitoringService');
const TaskScheduler = require('./utils/taskScheduler');
const ConfigApi = require('./api/configApi');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize enhanced chat processor
const chatProcessor = new EnhancedChatProcessor();

// Initialize channels manager with configuration
const channelsManager = new ChannelsManager({
  feishu: {
    appId: process.env.FEISHU_APP_ID,
    appSecret: process.env.FEISHU_APP_SECRET,
    verificationToken: process.env.FEISHU_VERIFICATION_TOKEN,
    baseUrl: process.env.FEISHU_BASE_URL
  },
  wechatWork: {
    corpId: process.env.WECHAT_WORK_CORP_ID,
    appSecret: process.env.WECHAT_WORK_APP_SECRET,
    agentId: process.env.WECHAT_WORK_AGENT_ID,
    token: process.env.WECHAT_WORK_TOKEN,
    encodingAESKey: process.env.WECHAT_WORK_ENCODING_AES_KEY
  },
  dingtalk: {
    appKey: process.env.DINGTALK_APP_KEY,
    appSecret: process.env.DINGTALK_APP_SECRET,
    webhookUrl: process.env.DINGTALK_WEBHOOK_URL,
    accessToken: process.env.DINGTALK_ACCESS_TOKEN,
    signSecret: process.env.DINGTALK_SIGN_SECRET
  }
});

// Basic route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to OpenBot - An open-source AI assistant',
    status: 'running',
    version: '3.0.0',
    features: [
      'Natural language processing',
      'File operations (read/write/edit)',
      'Command execution',
      'Web searching',
      'Memory management',
      'Tool usage capabilities',
      'Conversation history',
      'Chinese channels integration (Feishu, WeChat Work, DingTalk)'
    ],
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    ai_configured: chatProcessor.isAIConfigured(),
    available_tools: chatProcessor.getAvailableTools().length,
    available_channels: channelsManager.getAvailableChannels().length
  });
});

// Chat endpoint with enhanced capabilities
app.post('/chat', async (req, res) => {
  const { message, userId = 'default', context = {} } = req.body;
  
  if (!message) {
    return res.status(400).json({
      error: 'Message is required',
      timestamp: new Date().toISOString()
    });
  }
  
  try {
    // Process the message with enhanced capabilities
    const result = await chatProcessor.processChatMessage(message, userId);
    
    res.json({
      response: result.response,
      toolUsed: result.toolUsed,
      requiresFollowUp: result.requiresFollowUp,
      aiConfigured: chatProcessor.isAIConfigured(),
      timestamp: new Date().toISOString(),
      userId: userId
    });
  } catch (error) {
    console.error('Error processing chat:', error);
    res.status(500).json({
      error: 'Failed to process chat message',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint to get available tools
app.get('/tools', (req, res) => {
  res.json({
    availableTools: chatProcessor.getAvailableTools(),
    count: chatProcessor.getAvailableTools().length,
    timestamp: new Date().toISOString()
  });
});

// Endpoint to get conversation history
app.get('/conversation/:userId?', (req, res) => {
  const userId = req.params.userId || 'default';
  const history = chatProcessor.getConversationHistory(userId);
  
  res.json({
    userId: userId,
    history: history,
    messageCount: history.length,
    timestamp: new Date().toISOString()
  });
});

// Endpoint to reset conversation
app.post('/conversation/reset/:userId?', (req, res) => {
  const userId = req.params.userId || 'default';
  chatProcessor.resetConversation(userId);
  
  res.json({
    message: `Conversation for user ${userId} has been reset`,
    userId: userId,
    timestamp: new Date().toISOString()
  });
});

// Endpoint to execute specific tools (for direct tool access)
app.post('/tool/:toolName', async (req, res) => {
  const toolName = req.params.toolName;
  const params = req.body;
  
  try {
    const result = await chatProcessor.toolManager.executeTool(toolName, params);
    
    res.json({
      tool: toolName,
      result: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error executing tool ${toolName}:`, error);
    res.status(500).json({
      error: `Failed to execute tool ${toolName}`,
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 国产渠道相关API端点

// 获取可用渠道
app.get('/channels', (req, res) => {
  res.json({
    availableChannels: channelsManager.getAvailableChannels(),
    stats: channelsManager.getStats(),
    timestamp: new Date().toISOString()
  });
});

// 发送消息到指定渠道
app.post('/channels/:channelName/send', async (req, res) => {
  const channelName = req.params.channelName;
  const { recipientId, message, options } = req.body;
  
  if (!recipientId || !message) {
    return res.status(400).json({
      error: 'recipientId and message are required',
      timestamp: new Date().toISOString()
    });
  }
  
  try {
    const result = await channelsManager.sendMessage(channelName, recipientId, message, options);
    
    res.json({
      channel: channelName,
      result: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error sending message to ${channelName}:`, error);
    res.status(500).json({
      error: `Failed to send message to ${channelName}`,
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 发送富文本消息到指定渠道
app.post('/channels/:channelName/send-rich', async (req, res) => {
  const channelName = req.params.channelName;
  const { recipientId, title, content, options } = req.body;
  
  if (!recipientId || !title || !content) {
    return res.status(400).json({
      error: 'recipientId, title, and content are required',
      timestamp: new Date().toISOString()
    });
  }
  
  try {
    const result = await channelsManager.sendRichMessage(channelName, recipientId, title, content, options);
    
    res.json({
      channel: channelName,
      result: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error sending rich message to ${channelName}:`, error);
    res.status(500).json({
      error: `Failed to send rich message to ${channelName}`,
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 获取用户信息
app.get('/channels/:channelName/user/:userId', async (req, res) => {
  const channelName = req.params.channelName;
  const userId = req.params.userId;
  const options = req.query;
  
  try {
    const userInfo = await channelsManager.getUserInfo(channelName, userId, options);
    
    res.json({
      channel: channelName,
      userId: userId,
      userInfo: userInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error getting user info from ${channelName}:`, error);
    res.status(500).json({
      error: `Failed to get user info from ${channelName}`,
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 处理渠道事件回调（用于接收消息）
app.post('/channels/:channelName/callback', async (req, res) => {
  const channelName = req.params.channelName;
  const eventData = req.body;
  const headers = req.headers;
  
  try {
    const result = await channelsManager.handleChannelEvent(channelName, eventData, headers);
    
    res.json({
      channel: channelName,
      result: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error handling callback from ${channelName}:`, error);
    res.status(500).json({
      error: `Failed to handle callback from ${channelName}`,
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 初始化监控服务和任务调度器
const monitoringService = new MonitoringService();
const taskScheduler = new TaskScheduler();

// 监控服务相关API端点

// 添加监控器
app.post('/monitor/add', async (req, res) => {
  const { name, checkFunction, intervalMs, options } = req.body;
  
  if (!name || !checkFunction) {
    return res.status(400).json({
      error: 'name and checkFunction are required',
      timestamp: new Date().toISOString()
    });
  }
  
  try {
    // 在实际应用中，checkFunction应该是预定义的函数
    // 这里我们只接受预定义的监控类型
    const predefinedChecks = {
      'disk-space': async () => {
        // 模拟磁盘空间检查
        return { value: Math.random() * 100, type: 'info', priority: 'low' };
      },
      'cpu-usage': async () => {
        // 模拟CPU使用率检查
        return { value: Math.random() * 100, type: 'info', priority: 'low' };
      },
      'memory-usage': async () => {
        // 模拟内存使用率检查
        return { value: Math.random() * 100, type: 'info', priority: 'low' };
      }
    };
    
    if (predefinedChecks[name]) {
      monitoringService.addMonitor(name, predefinedChecks[name], intervalMs, options);
      res.json({
        success: true,
        message: `Monitor '${name}' added successfully`,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        error: `Predefined check '${name}' not available`,
        available: Object.keys(predefinedChecks),
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error adding monitor:', error);
    res.status(500).json({
      error: 'Failed to add monitor',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 获取监控状态
app.get('/monitor/status', (req, res) => {
  res.json({
    status: monitoringService.getStatus(),
    timestamp: new Date().toISOString()
  });
});

// 获取警报
app.get('/monitor/alerts', (req, res) => {
  const { priority, limit = 50 } = req.query;
  res.json({
    alerts: monitoringService.getAlerts(priority, parseInt(limit)),
    count: monitoringService.getAlerts(priority, parseInt(limit)).length,
    timestamp: new Date().toISOString()
  });
});

// 清空警报
app.post('/monitor/alerts/clear', (req, res) => {
  monitoringService.clearAlerts();
  res.json({
    success: true,
    message: 'Alerts cleared',
    timestamp: new Date().toISOString()
  });
});

// 任务调度相关API端点

// 添加一次性任务
app.post('/tasks/add', (req, res) => {
  const { taskId, taskFunction, options } = req.body;
  
  if (!taskId || !taskFunction) {
    return res.status(400).json({
      error: 'taskId and taskFunction are required',
      timestamp: new Date().toISOString()
    });
  }
  
  try {
    // 在实际应用中，taskFunction应该是预定义的任务
    // 这里我们只接受预定义的任务类型
    const predefinedTasks = {
      'send-message': async () => {
        // 模拟发送消息任务
        return { success: true, message: 'Message sent' };
      },
      'backup-data': async () => {
        // 模拟备份数据任务
        return { success: true, message: 'Data backed up' };
      },
      'clean-cache': async () => {
        // 模拟清理缓存任务
        return { success: true, message: 'Cache cleaned' };
      }
    };
    
    if (predefinedTasks[taskFunction]) {
      taskScheduler.addTask(taskId, predefinedTasks[taskFunction], options);
      res.json({
        success: true,
        message: `Task '${taskId}' added successfully`,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        error: `Predefined task '${taskFunction}' not available`,
        available: Object.keys(predefinedTasks),
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error adding task:', error);
    res.status(500).json({
      error: 'Failed to add task',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 执行任务
app.post('/tasks/execute/:taskId', async (req, res) => {
  const taskId = req.params.taskId;
  
  try {
    const result = await taskScheduler.executeTask(taskId);
    res.json({
      success: true,
      taskId: taskId,
      result: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error executing task ${taskId}:`, error);
    res.status(500).json({
      error: `Failed to execute task ${taskId}`,
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 计划任务
app.post('/tasks/schedule', (req, res) => {
  const { taskId, taskFunction, schedule, options } = req.body;
  
  if (!taskId || !taskFunction || !schedule) {
    return res.status(400).json({
      error: 'taskId, taskFunction, and schedule are required',
      timestamp: new Date().toISOString()
    });
  }
  
  try {
    // 使用预定义的任务
    const predefinedTasks = {
      'send-daily-report': async () => {
        return { success: true, message: 'Daily report sent' };
      },
      'check-system-status': async () => {
        return { success: true, message: 'System status checked' };
      },
      'update-data': async () => {
        return { success: true, message: 'Data updated' };
      }
    };
    
    if (predefinedTasks[taskFunction]) {
      taskScheduler.scheduleTask(taskId, predefinedTasks[taskFunction], schedule, options);
      res.json({
        success: true,
        message: `Scheduled task '${taskId}' added successfully`,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        error: `Predefined task '${taskFunction}' not available`,
        available: Object.keys(predefinedTasks),
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error scheduling task:', error);
    res.status(500).json({
      error: 'Failed to schedule task',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 获取任务状态
app.get('/tasks/status/:taskId?', (req, res) => {
  const taskId = req.params.taskId;
  
  if (taskId) {
    const status = taskScheduler.getStatus(taskId);
    if (status) {
      res.json({
        taskId: taskId,
        status: status,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({
        error: `Task '${taskId}' not found`,
        timestamp: new Date().toISOString()
      });
    }
  } else {
    res.json({
      status: taskScheduler.getAllStatus(),
      timestamp: new Date().toISOString()
    });
  }
});

// 获取任务历史
app.get('/tasks/history', (req, res) => {
  const { limit = 50, status, type, taskId } = req.query;
  const filter = {};
  
  if (status) filter.status = status;
  if (type) filter.type = type;
  if (taskId) filter.taskId = taskId;
  
  res.json({
    history: taskScheduler.getHistory(parseInt(limit), filter),
    count: taskScheduler.getHistory(parseInt(limit), filter).length,
    timestamp: new Date().toISOString()
  });
});

// 配置API相关端点

// 初始化配置API
const configApi = new ConfigApi();

// 保存配置
app.post('/config/save', async (req, res) => {
  const configData = req.body;
  
  try {
    const result = await configApi.saveConfig(configData);
    
    res.json({
      success: result.success,
      message: result.message,
      path: result.path,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error saving config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save configuration',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 获取当前配置
app.get('/config/current', async (req, res) => {
  try {
    const result = await configApi.getCurrentConfig();
    
    res.json({
      success: result.success,
      exists: result.exists,
      content: result.content,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get configuration',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 验证系统要求
app.get('/config/validate-system', async (req, res) => {
  try {
    const result = await configApi.validateSystem();
    
    res.json({
      success: result.success,
      system: result.system,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error validating system:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate system',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 测试配置
app.post('/config/test', async (req, res) => {
  try {
    const result = await configApi.testConfig();
    
    res.json({
      success: result.success,
      message: result.message,
      port: result.port,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error testing config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test configuration',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`OpenBot server is running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to access the API`);
  console.log(`Available endpoints:`);
  console.log(`  GET  / - Basic info`);
  console.log(`  GET  /health - Health check`);
  console.log(`  POST /chat - Chat with OpenBot`);
  console.log(`  GET  /tools - Available tools`);
  console.log(`  GET  /conversation/:userId - Get conversation history`);
  console.log(`  POST /conversation/reset/:userId - Reset conversation`);
  console.log(`  POST /tool/:toolName - Execute specific tool`);
  console.log(`  GET  /channels - Available channels`);
  console.log(`  POST /channels/:channel/send - Send message to channel`);
  console.log(`  POST /channels/:channel/send-rich - Send rich message to channel`);
  console.log(`  GET  /channels/:channel/user/:userId - Get user info`);
  console.log(`  POST /channels/:channel/callback - Channel event callback`);
  console.log(`  POST /monitor/add - Add monitor`);
  console.log(`  GET  /monitor/status - Monitor status`);
  console.log(`  GET  /monitor/alerts - Get alerts`);
  console.log(`  POST /monitor/alerts/clear - Clear alerts`);
  console.log(`  POST /tasks/add - Add task`);
  console.log(`  POST /tasks/execute/:taskId - Execute task`);
  console.log(`  POST /tasks/schedule - Schedule task`);
  console.log(`  GET  /tasks/status/:taskId - Task status`);
  console.log(`  GET  /tasks/history - Task history`);
  console.log(`  POST /config/save - Save configuration`);
  console.log(`  GET  /config/current - Get current configuration`);
  console.log(`  GET  /config/validate-system - Validate system requirements`);
  console.log(`  POST /config/test - Test configuration`);
  console.log(`\nAI Configured: ${chatProcessor.isAIConfigured() ? 'Yes' : 'No'}`);
  console.log(`Available Tools: ${chatProcessor.getAvailableTools().length}`);
  console.log(`Available Channels: ${channelsManager.getAvailableChannels().length}`);
  console.log(`Monitoring Service: Initialized`);
  console.log(`Task Scheduler: Initialized`);
});

// 启动监控服务
setTimeout(() => {
  monitoringService.start().catch(console.error);
}, 2000);

module.exports = app;