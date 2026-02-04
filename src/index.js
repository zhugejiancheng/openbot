/**
 * OpenBot - An open-source AI assistant
 * Entry point of the application
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors'); // Add CORS support
const EnhancedChatProcessor = require('./utils/enhancedChatProcessor');
const ChannelsManager = require('./integrations/channelsManager');

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
  console.log(`\nAI Configured: ${chatProcessor.isAIConfigured() ? 'Yes' : 'No'}`);
  console.log(`Available Tools: ${chatProcessor.getAvailableTools().length}`);
  console.log(`Available Channels: ${channelsManager.getAvailableChannels().length}`);
});

module.exports = app;