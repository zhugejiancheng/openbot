/**
 * Enhanced Chat Processing for OpenBot
 * Handles advanced AI conversations with tool usage capabilities
 */

const OpenAI = require('openai');
const config = require('../config/config');
const ToolManager = require('./toolManager');

class EnhancedChatProcessor {
  constructor() {
    this.toolManager = new ToolManager();
    
    // Initialize OpenAI client if API key is available
    if (config.ai.openai.apiKey) {
      this.openai = new OpenAI({
        apiKey: config.ai.openai.apiKey
      });
    } else {
      this.openai = null;
    }
    
    // Conversation history storage
    this.conversations = new Map();
  }

  /**
   * Process a chat message with potential tool usage
   */
  async processChatMessage(message, userId = 'default') {
    try {
      // Get or initialize conversation history
      if (!this.conversations.has(userId)) {
        this.conversations.set(userId, []);
      }
      const history = this.conversations.get(userId);
      
      // Add current message to history
      history.push({
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      });

      // Determine if we need to use tools based on the message
      const toolUsageResult = await this.analyzeForToolUsage(message, history);
      
      if (toolUsageResult.needsTool) {
        // Execute the required tool
        const toolResult = await this.toolManager.executeTool(
          toolUsageResult.toolName, 
          toolUsageResult.params
        );
        
        // Add tool result to history
        history.push({
          role: 'function',
          name: toolUsageResult.toolName,
          content: JSON.stringify(toolResult),
          timestamp: new Date().toISOString()
        });
        
        // Generate final response using AI with tool results
        const finalResponse = await this.generateResponseWithTools(history);
        
        // Add AI response to history
        history.push({
          role: 'assistant',
          content: finalResponse,
          timestamp: new Date().toISOString()
        });
        
        // Keep only the last 10 exchanges to prevent history from growing too large
        if (history.length > 20) { // 10 exchanges = 20 messages (user + assistant)
          this.conversations.set(userId, history.slice(-20));
        }
        
        return {
          response: finalResponse,
          toolUsed: toolUsageResult.toolName,
          toolResult: toolResult,
          requiresFollowUp: toolUsageResult.requiresFollowUp
        };
      } else {
        // Generate response without tools
        const response = await this.generateResponseWithoutTools(message, history);
        
        // Add AI response to history
        history.push({
          role: 'assistant',
          content: response,
          timestamp: new Date().toISOString()
        });
        
        // Keep only the last 10 exchanges to prevent history from growing too large
        if (history.length > 20) {
          this.conversations.set(userId, history.slice(-20));
        }
        
        return {
          response: response,
          toolUsed: null,
          requiresFollowUp: false
        };
      }
    } catch (error) {
      console.error('Error processing chat message:', error);
      return {
        response: `I encountered an error processing your request: ${error.message}`,
        error: true
      };
    }
  }

  /**
   * Analyze message to determine if tools are needed
   */
  async analyzeForToolUsage(message, history) {
    // Simple pattern matching for demonstration
    // In a real implementation, this would use more sophisticated NLP
    
    // Check for file operations
    if (message.toLowerCase().includes('read file') || message.toLowerCase().includes('show me')) {
      // Extract file path from message
      const filePathMatch = message.match(/(?:file|path|at)\s+([^\s]+(?:\.[a-z]+)?)/i);
      if (filePathMatch) {
        return {
          needsTool: true,
          toolName: 'read',
          params: { filePath: filePathMatch[1] },
          requiresFollowUp: false
        };
      }
    }
    
    if (message.toLowerCase().includes('write') && message.toLowerCase().includes('file')) {
      // Extract file path and content from message
      const filePathMatch = message.match(/(?:to\s+|at\s+|in\s+)([^\s]+(?:\.[a-z]+)?)/i);
      const contentMatch = message.match(/(?:content|text|write)\s+(.+)/i);
      
      if (filePathMatch && contentMatch) {
        return {
          needsTool: true,
          toolName: 'write',
          params: { 
            filePath: filePathMatch[1],
            content: contentMatch[1]
          },
          requiresFollowUp: false
        };
      }
    }
    
    if (message.toLowerCase().includes('execute') || message.toLowerCase().includes('run ') || message.toLowerCase().includes('shell') || message.toLowerCase().includes('command')) {
      // Extract command from message
      const commandMatch = message.match(/(?:command|execute|run)\s+(.+)/i);
      if (commandMatch) {
        return {
          needsTool: true,
          toolName: 'exec',
          params: { command: commandMatch[1] },
          requiresFollowUp: false
        };
      }
    }
    
    if (message.toLowerCase().includes('search') || message.toLowerCase().includes('find') || message.toLowerCase().includes('web ')) {
      return {
        needsTool: true,
        toolName: 'web_search',
        params: { query: message.replace(/(search|find|web|online)\s+/i, '') },
        requiresFollowUp: false
      };
    }
    
    // Check for other tool usage patterns
    const toolPatterns = [
      { pattern: /memory\s+(search|find|look)/i, tool: 'memory_search', paramExtractor: (msg) => ({ query: msg }) },
      { pattern: /memory\s+get/i, tool: 'memory_get', paramExtractor: (msg) => ({ path: msg.match(/get\s+(.+)/i)?.[1] || '' }) },
      { pattern: /web\s+fetch|fetch\s+url/i, tool: 'web_fetch', paramExtractor: (msg) => ({ url: msg.match(/(?:url|fetch|get)\s+(https?:\/\/[^\s]+)/i)?.[1] || '' }) },
      { pattern: /sessions?\s+list/i, tool: 'sessions_list', paramExtractor: () => ({}) },
      { pattern: /session\s+status/i, tool: 'session_status', paramExtractor: () => ({}) },
      { pattern: /process\s+(list|manage|control)/i, tool: 'process', paramExtractor: (msg) => ({ action: msg.match(/process\s+(\w+)/i)?.[1] || 'list' }) },
      { pattern: /message\s+(send|broadcast)/i, tool: 'message', paramExtractor: (msg) => ({ action: 'send', message: msg }) }
    ];
    
    for (const { pattern, tool, paramExtractor } of toolPatterns) {
      if (pattern.test(message)) {
        return {
          needsTool: true,
          toolName: tool,
          params: paramExtractor(message),
          requiresFollowUp: false
        };
      }
    }
    
    // If no specific tool is identified, return false
    return {
      needsTool: false,
      toolName: null,
      params: {},
      requiresFollowUp: false
    };
  }

  /**
   * Generate response with tool results
   */
  async generateResponseWithTools(history) {
    if (!this.openai) {
      return "I processed your request using a tool and got results. However, I'm currently running in demo mode without an AI API key to generate a polished response. To enable full AI capabilities, please configure your AI API key in the environment variables.";
    }

    try {
      // Prepare the messages array for the API call
      const messages = [
        {
          role: 'system',
          content: `You are OpenBot, a helpful AI assistant with advanced capabilities. You can read files, write files, execute commands, perform web searches, and more. When a user asks for information, you can use these tools to get the information and then provide a helpful response based on the results. Always be helpful, concise, and professional.`
        }
      ];

      // Add conversation history
      messages.push(...history);

      // Call the OpenAI API
      const response = await this.openai.chat.completions.create({
        model: config.ai.openai.model,
        messages: messages,
        temperature: config.ai.openai.temperature,
        max_tokens: config.ai.openai.maxTokens,
      });

      // Extract and return the response
      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error generating response with tools:', error);
      return `I processed your request and used tools to get information, but encountered an error generating the final response: ${error.message}`;
    }
  }

  /**
   * Generate response without tools
   */
  async generateResponseWithoutTools(message, history) {
    if (!this.openai) {
      // Fallback response if no API key is configured
      return `I received your message: "${message}". This is OpenBot responding. Currently running in demo mode without an AI API key. To enable full AI capabilities, please configure your AI API key in the environment variables. I can help with various tasks including file operations, command execution, web searches, and more when properly configured.`;
    }

    try {
      // Prepare the messages array for the API call
      const messages = [
        {
          role: 'system',
          content: `You are OpenBot, a highly capable AI assistant. You can understand and respond to a wide variety of queries. Be helpful, concise, and professional.`
        }
      ];

      // Add conversation history if available
      messages.push(...history);

      // Call the OpenAI API
      const response = await this.openai.chat.completions.create({
        model: config.ai.openai.model,
        messages: messages,
        temperature: config.ai.openai.temperature,
        max_tokens: config.ai.openai.maxTokens,
      });

      // Extract and return the response
      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error generating response without tools:', error);
      return `I received your message but encountered an error generating a response: ${error.message}`;
    }
  }

  /**
   * Get available tools
   */
  getAvailableTools() {
    return this.toolManager.getAvailableTools();
  }

  /**
   * Reset conversation history for a user
   */
  resetConversation(userId = 'default') {
    this.conversations.delete(userId);
  }

  /**
   * Get conversation history for a user
   */
  getConversationHistory(userId = 'default') {
    return this.conversations.get(userId) || [];
  }

  /**
   * Check if AI is properly configured
   */
  isAIConfigured() {
    return !!this.openai;
  }
}

module.exports = EnhancedChatProcessor;