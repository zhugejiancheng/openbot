/**
 * OpenBot - An open-source AI assistant
 * Entry point of the application
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors'); // Add CORS support
const EnhancedChatProcessor = require('./utils/enhancedChatProcessor');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize enhanced chat processor
const chatProcessor = new EnhancedChatProcessor();

// Basic route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to OpenBot - An open-source AI assistant',
    status: 'running',
    version: '2.0.0',
    features: [
      'Natural language processing',
      'File operations (read/write/edit)',
      'Command execution',
      'Web searching',
      'Memory management',
      'Tool usage capabilities',
      'Conversation history'
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
    available_tools: chatProcessor.getAvailableTools().length
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
  console.log(`\nAI Configured: ${chatProcessor.isAIConfigured() ? 'Yes' : 'No'}`);
  console.log(`Available Tools: ${chatProcessor.getAvailableTools().length}`);
});

module.exports = app;