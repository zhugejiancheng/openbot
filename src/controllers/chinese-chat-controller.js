/**
 * 中文聊天控制器
 * 处理中文用户的聊天请求
 */

const ChineseNLPProcessor = require('../utils/chinese-nlp');
const OpenClawIntegration = require('../integrations/openclaw/openclaw-integration');

class ChineseChatController {
  constructor() {
    this.openClawIntegration = new OpenClawIntegration();
    this.chineseNLPProcessor = new ChineseNLPProcessor(this.openClawIntegration);
    this.userSessions = new Map(); // 存储用户会话状态
  }

  /**
   * 处理中文聊天消息
   */
  async handleChatMessage(req, res) {
    const { message, userId = 'default', context = {} } = req.body;
    
    if (!message) {
      return res.status(400).json({
        error: '消息内容不能为空',
        timestamp: new Date().toISOString()
      });
    }

    try {
      // 初始化用户会话（如果不存在）
      if (!this.userSessions.has(userId)) {
        this.userSessions.set(userId, {
          history: [],
          lastInteraction: new Date()
        });
      }

      const session = this.userSessions.get(userId);
      
      // 记录当前交互
      session.lastInteraction = new Date();
      session.history.push({
        role: 'user',
        content: message,
        timestamp: new Date()
      });

      console.log(`处理用户 ${userId} 的中文消息: ${message}`);

      // 使用中文NLP处理器处理指令
      const result = await this.chineseNLPProcessor.processInstruction(message);

      // 根据结果生成响应
      let response;
      if (result.success) {
        response = this.formatSuccessResponse(result);
      } else {
        response = this.formatErrorResponse(result);
      }

      // 将AI响应添加到会话历史
      session.history.push({
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        toolUsed: result.tool
      });

      // 限制会话历史长度
      if (session.history.length > 20) {
        session.history = session.history.slice(-20);
      }

      // 返回响应
      res.json({
        success: true,
        message: response.message,
        tool_used: result.tool,
        result: result.result,
        timestamp: new Date().toISOString(),
        userId: userId
      });

    } catch (error) {
      console.error('处理聊天消息时出错:', error);
      res.status(500).json({
        error: '处理消息时发生错误',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * 格式化成功响应
   */
  formatSuccessResponse(result) {
    let message = '';

    switch (result.tool) {
      case 'read':
        if (result.result.content && result.result.content.length > 100) {
          message = `已读取文件内容，长度为 ${result.result.content.length} 字符。`;
        } else {
          message = `文件内容：\n${result.result.content || '未获取到内容'}`;
        }
        break;
        
      case 'write':
        message = result.result.message || '文件写入操作完成';
        break;
        
      case 'exec':
        message = `命令执行结果：\n${result.result.output || '命令已执行'}`;
        break;
        
      case 'web_search':
        const results = result.result.results || [];
        if (results.length > 0) {
          message = `搜索结果：\n`;
          results.slice(0, 3).forEach((item, index) => {
            message += `${index + 1}. ${item.title}\n   ${item.snippet || item.description}\n   链接: ${item.url}\n\n`;
          });
        } else {
          message = '未找到相关搜索结果';
        }
        break;
        
      case 'web_fetch':
        message = `网页内容：\n${result.result.content || '未能提取网页内容'}`;
        break;
        
      case 'message':
        message = '消息已发送';
        break;
        
      case 'memory_search':
        const searchResults = result.result.results || [];
        if (searchResults.length > 0) {
          message = `找到相关记忆记录：\n`;
          searchResults.forEach((item, index) => {
            message += `${index + 1}. ${item.content}\n`;
          });
        } else {
          message = '未找到相关记忆记录';
        }
        break;
        
      default:
        message = result.result.message || '操作已完成';
        if (result.result.success === false) {
          message = `操作可能未成功: ${result.result.error || '未知错误'}`;
        }
        break;
    }

    return { message };
  }

  /**
   * 格式化错误响应
   */
  formatErrorResponse(result) {
    let message = result.message || '操作失败';
    
    if (result.error) {
      message = `错误: ${result.error}`;
    }
    
    return { message };
  }

  /**
   * 获取会话历史
   */
  getSessionHistory(req, res) {
    const { userId } = req.params;
    
    if (!this.userSessions.has(userId)) {
      return res.json({
        userId: userId,
        history: [],
        message: '该用户暂无会话历史'
      });
    }

    const session = this.userSessions.get(userId);
    res.json({
      userId: userId,
      history: session.history,
      lastInteraction: session.lastInteraction
    });
  }

  /**
   * 重置用户会话
   */
  resetSession(req, res) {
    const { userId } = req.params;
    
    if (this.userSessions.has(userId)) {
      this.userSessions.delete(userId);
    }
    
    res.json({
      message: `用户 ${userId} 的会话已重置`,
      userId: userId
    });
  }

  /**
   * 获取可用工具列表
   */
  getAvailableTools(req, res) {
    const tools = this.openClawIntegration.getToolDescriptions();
    res.json({
      toolCount: Object.keys(tools).length,
      tools: tools,
      message: `共提供 ${Object.keys(tools).length} 个工具`
    });
  }

  /**
   * 获取中文帮助
   */
  getHelp(req, res) {
    const help = this.chineseNLPProcessor.getHelp();
    res.json({
      help: help,
      message: '中文指令帮助'
    });
  }
}

module.exports = ChineseChatController;