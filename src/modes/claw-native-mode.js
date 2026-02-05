/**
 * OpenClaw 原生模式
 * 保持 OpenClaw 的原有特性和交互方式
 */

const OpenClawIntegration = require('../integrations/openclaw/openclaw-integration');
const ChineseNLPProcessor = require('../utils/chinese-nlp');

class ClawNativeMode {
  constructor(app) {
    this.app = app;
    this.openClawIntegration = new OpenClawIntegration();
    this.chineseNLPProcessor = new ChineseNLPProcessor(this.openClawIntegration);
    this.sessionManager = new Map();
    
    this.initializeRoutes();
  }

  /**
   * 初始化原生模式路由
   */
  initializeRoutes() {
    // 原生 OpenClaw 接口
    this.app.post('/claw/native', this.handleNativeRequest.bind(this));
    
    // 中文化的 OpenClaw 接口
    this.app.post('/claw/chinese', this.handleChineseRequest.bind(this));
    
    // 工具列表
    this.app.get('/claw/tools', this.getToolsList.bind(this));
    
    // 会话管理
    this.app.get('/claw/session/:userId', this.getSession.bind(this));
    this.app.post('/claw/session/reset/:userId', this.resetSession.bind(this));
    
    // 原生工具直接访问
    this.setupDirectToolAccess();
  }

  /**
   * 设置直接工具访问
   */
  setupDirectToolAccess() {
    const tools = this.openClawIntegration.getAvailableTools();
    
    for (const tool of tools) {
      this.app.post(`/claw/tool/${tool.name}`, async (req, res) => {
        try {
          const result = await this.openClawIntegration.executeTool(tool.name, req.body);
          res.json({
            success: true,
            tool: tool.name,
            result: result,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            error: error.message,
            tool: tool.name,
            timestamp: new Date().toISOString()
          });
        }
      });
    }
  }

  /**
   * 处理原生 OpenClaw 请求
   */
  async handleNativeRequest(req, res) {
    const { tool, arguments: args, userId = 'default' } = req.body;
    
    if (!tool) {
      return res.status(400).json({
        error: 'Tool name is required',
        timestamp: new Date().toISOString()
      });
    }

    try {
      // 初始化会话
      this.initSession(userId);
      const session = this.sessionManager.get(userId);
      
      // 记录请求
      session.history.push({
        type: 'native_request',
        tool: tool,
        params: args,
        timestamp: new Date()
      });

      // 执行工具
      const result = await this.openClawIntegration.executeTool(tool, args);

      // 记录响应
      session.history.push({
        type: 'response',
        tool: tool,
        result: result,
        timestamp: new Date()
      });

      // 限制历史长度
      if (session.history.length > 20) {
        session.history = session.history.slice(-20);
      }

      res.json({
        success: true,
        tool: tool,
        result: result,
        userId: userId,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error in native mode:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        tool: tool,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * 处理中文请求
   */
  async handleChineseRequest(req, res) {
    const { command, params = {}, userId = 'default' } = req.body;
    
    if (!command) {
      return res.status(400).json({
        error: 'Command is required',
        timestamp: new Date().toISOString()
      });
    }

    try {
      // 初始化会话
      this.initSession(userId);
      const session = this.sessionManager.get(userId);
      
      // 记录请求
      session.history.push({
        type: 'chinese_request',
        command: command,
        params: params,
        timestamp: new Date()
      });

      // 如果 command 是工具名，直接执行
      if (this.isValidTool(command)) {
        const result = await this.openClawIntegration.executeTool(command, params);
        
        // 记录响应
        session.history.push({
          type: 'response',
          tool: command,
          result: result,
          timestamp: new Date()
        });

        // 限制历史长度
        if (session.history.length > 20) {
          session.history = session.history.slice(-20);
        }

        res.json({
          success: true,
          tool: command,
          result: result,
          userId: userId,
          timestamp: new Date().toISOString()
        });
        return;
      }

      // 否则尝试解析中文指令
      const instruction = command;
      const parsed = this.chineseNLPProcessor.parseChineseInstruction(instruction);
      
      if (!parsed) {
        res.json({
          success: false,
          message: "无法理解的指令",
          timestamp: new Date().toISOString()
        });
        return;
      }

      // 提取参数（如果未在params中提供）
      let finalParams = params;
      if (Object.keys(finalParams).length === 0) {
        finalParams = this.chineseNLPProcessor.extractParameters(instruction, parsed.toolName);
      }

      // 执行工具
      const result = await this.openClawIntegration.executeTool(parsed.toolName, finalParams);

      // 记录响应
      session.history.push({
        type: 'response',
        tool: parsed.toolName,
        result: result,
        timestamp: new Date()
      });

      // 限制历史长度
      if (session.history.length > 20) {
        session.history = session.history.slice(-20);
      }

      res.json({
        success: true,
        tool: parsed.toolName,
        result: result,
        userId: userId,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error in chinese mode:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * 检查是否为有效工具
   */
  isValidTool(toolName) {
    const tools = this.openClawIntegration.getAvailableTools();
    return tools.some(tool => tool.name === toolName);
  }

  /**
   * 获取工具列表
   */
  getToolsList(req, res) {
    const tools = this.openClawIntegration.getAvailableTools();
    const toolDescriptions = this.openClawIntegration.getToolDescriptions();
    
    res.json({
      toolCount: tools.length,
      tools: tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      })),
      descriptions: toolDescriptions,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 获取会话
   */
  getSession(req, res) {
    const { userId } = req.params;
    
    if (!this.sessionManager.has(userId)) {
      return res.json({
        userId: userId,
        history: [],
        message: 'No session found for this user'
      });
    }

    const session = this.sessionManager.get(userId);
    res.json({
      userId: userId,
      history: session.history,
      lastInteraction: session.lastInteraction,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 重置会话
   */
  resetSession(req, res) {
    const { userId } = req.params;
    
    if (this.sessionManager.has(userId)) {
      this.sessionManager.delete(userId);
    }
    
    res.json({
      message: `Session for user ${userId} has been reset`,
      userId: userId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 初始化会话
   */
  initSession(userId) {
    if (!this.sessionManager.has(userId)) {
      this.sessionManager.set(userId, {
        history: [],
        lastInteraction: new Date()
      });
    }
  }
}

module.exports = ClawNativeMode;