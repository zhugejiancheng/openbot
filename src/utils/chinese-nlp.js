/**
 * 中文自然语言处理模块
 * 用于处理中文用户的指令并映射到相应的工具调用
 */

class ChineseNLPProcessor {
  constructor(openClawIntegration) {
    this.openClawIntegration = openClawIntegration;
    this.toolMappings = this.initializeToolMappings();
    this.helpManager = new (require('./helpManager'))();
  }

  /**
   * 初始化中文指令到工具的映射
   */
  initializeToolMappings() {
    return {
      // 文件操作相关
      '读取文件': 'read',
      '查看文件': 'read',
      '打开文件': 'read',
      '写入文件': 'write',
      '创建文件': 'write',
      '编辑文件': 'edit',
      '修改文件': 'edit',
      
      // 系统命令相关
      '执行命令': 'exec',
      '运行命令': 'exec',
      '系统命令': 'exec',
      '命令执行': 'exec',
      '进程管理': 'process',
      '管理进程': 'process',
      
      // 网络相关
      '搜索': 'web_search',
      '网络搜索': 'web_search',
      '查找': 'web_search',
      '上网搜索': 'web_search',
      '获取网页': 'web_fetch',
      '抓取网页': 'web_fetch',
      '浏览网页': 'browser',
      '打开浏览器': 'browser',
      
      // AI相关
      '分析图片': 'image',
      '识别图片': 'image',
      '图片识别': 'image',
      '图像分析': 'image',
      
      // 飞书相关
      '飞书文档': 'feishu_doc',
      '文档操作': 'feishu_doc',
      '知识库': 'feishu_wiki',
      '飞书知识库': 'feishu_wiki',
      '云文档': 'feishu_drive',
      '飞书云文档': 'feishu_drive',
      '多维表格': 'feishu_bitable_list_records',
      '表格记录': 'feishu_bitable_list_records',
      '创建表格记录': 'feishu_bitable_create_record',
      '更新表格记录': 'feishu_bitable_update_record',
      
      // 定时任务相关
      '定时任务': 'cron',
      '计划任务': 'cron',
      '任务调度': 'cron',
      '设置提醒': 'cron',
      '安排任务': 'cron',
      
      // 消息相关
      '发送消息': 'message',
      '发消息': 'message',
      '推送消息': 'message',
      '通知': 'message',
      
      // 记忆相关
      '查找记录': 'memory_search',
      '搜索记录': 'memory_search',
      '回忆': 'memory_search',
      '查看记忆': 'memory_get',
      '获取记忆': 'memory_get',
      
      // OpenClaw CLI相关
      '初始化配置': 'openclaw_cli',
      '配置设置': 'openclaw_cli',
      '系统诊断': 'openclaw_cli',
      '健康检查': 'openclaw_cli',
      '状态检查': 'openclaw_cli',
      '重置配置': 'openclaw_cli',
      '系统状态': 'openclaw_cli',
      '网关控制': 'openclaw_cli',
      '定时任务': 'openclaw_cli',
      '插件管理': 'openclaw_cli',
      '通道管理': 'openclaw_cli',
      '设备配对': 'openclaw_cli',
      '节点管理': 'openclaw_cli',
      '安全设置': 'openclaw_cli',
      '安全检查': 'openclaw_cli',
      '安全审计': 'openclaw_cli',
      '技能管理': 'openclaw_cli',
      '系统更新': 'openclaw_cli',
      '浏览器管理': 'openclaw_cli',
      '会话管理': 'openclaw_cli',
      // Onboard相关
      '引导帮助': 'help',
      'onboard帮助': 'help',
      '新用户帮助': 'help',
      '入门帮助': 'help',
      '用户引导': 'help'
    };
  }

  /**
   * 解析中文指令
   */
  parseChineseInstruction(instruction) {
    // 移除空白字符
    instruction = instruction.trim();
    
    // 尝试匹配工具
    for (const [key, toolName] of Object.entries(this.toolMappings)) {
      if (instruction.includes(key)) {
        return {
          toolName,
          instruction,
          matchedKeyword: key
        };
      }
    }
    
    // 如果没有直接匹配，尝试更宽松的匹配
    return this.fuzzyMatch(instruction);
  }

  /**
   * 模糊匹配指令
   */
  fuzzyMatch(instruction) {
    const lowerInstruction = instruction.toLowerCase();
    
    // 按关键词权重匹配
    const keywordWeights = {
      // 文件操作
      '读': { tool: 'read', weight: 1 },
      '看': { tool: 'read', weight: 1 },
      '查': { tool: 'read', weight: 1 },
      '写': { tool: 'write', weight: 1 },
      '存': { tool: 'write', weight: 1 },
      '编辑': { tool: 'edit', weight: 1 },
      '改': { tool: 'edit', weight: 1 },
      
      // 系统操作
      '执行': { tool: 'exec', weight: 1 },
      '运行': { tool: 'exec', weight: 1 },
      '命令': { tool: 'exec', weight: 1 },
      '进程': { tool: 'process', weight: 1 },
      '任务管理': { tool: 'process', weight: 1 },
      
      // 网络操作
      '搜': { tool: 'web_search', weight: 1 },
      '找': { tool: 'web_search', weight: 1 },
      '网络': { tool: 'web_search', weight: 0.8 },
      '网页': { tool: 'web_fetch', weight: 1 },
      '浏览': { tool: 'browser', weight: 1 },
      '打开': { tool: 'browser', weight: 0.8 },
      
      // AI操作
      '图片': { tool: 'image', weight: 0.8 },
      '照片': { tool: 'image', weight: 0.8 },
      '相片': { tool: 'image', weight: 0.8 },
      
      // 消息操作
      '发': { tool: 'message', weight: 1 },
      '发送': { tool: 'message', weight: 1 },
      '通知': { tool: 'message', weight: 1 },
      
      // 记忆操作
      '记': { tool: 'memory_search', weight: 0.8 },
      '忆': { tool: 'memory_search', weight: 0.8 },
      '想': { tool: 'memory_search', weight: 0.8 }
    };
    
    let bestMatch = null;
    let highestWeight = 0;
    
    for (const [keyword, data] of Object.entries(keywordWeights)) {
      if (lowerInstruction.includes(keyword) && data.weight > highestWeight) {
        bestMatch = data.tool;
        highestWeight = data.weight;
      }
    }
    
    if (bestMatch) {
      return {
        toolName: bestMatch,
        instruction,
        matchedKeyword: bestMatch,
        confidence: highestWeight
      };
    }
    
    // 如果还是没有匹配到，返回null表示无法识别
    return null;
  }

  /**
   * 从中文指令中提取参数
   */
  extractParameters(instruction, toolName) {
    const params = {};
    
    switch (toolName) {
      case 'read':
      case 'write':
      case 'edit':
        // 提取文件路径
        const pathRegex = /(?:文件|路径|到)["']?([^"',\n]+)["']?/;
        const pathMatch = instruction.match(pathRegex);
        if (pathMatch) {
          params.path = pathMatch[1].trim();
        }
        
        // 如果是写入或编辑操作，提取内容
        if (toolName === 'write' || toolName === 'edit') {
          const contentRegex = /(?:内容|是)["']?([\s\S]+?)["'](?=\s|$|[，。！])/;
          const contentMatch = instruction.match(contentRegex);
          if (contentMatch) {
            params.content = contentMatch[1].trim();
          }
        }
        
        // 如果是编辑操作，提取旧文本和新文本
        if (toolName === 'edit') {
          const oldTextRegex = /(?:原文|旧文)["']?([\s\S]+?)["'](?=\s|$|[，。！])/;
          const newTextRegex = /(?:新文|改为)["']?([\s\S]+?)["'](?=\s|$|[，。！])/;
          
          const oldMatch = instruction.match(oldTextRegex);
          const newMatch = instruction.match(newTextRegex);
          
          if (oldMatch) params.oldText = oldMatch[1].trim();
          if (newMatch) params.newText = newMatch[1].trim();
        }
        break;
        
      case 'exec':
        // 提取命令
        const cmdRegex = /(?:命令|执行|运行)["']?([\s\S]+?)["'](?=\s|$|[，。！])/;
        const cmdMatch = instruction.match(cmdRegex);
        if (cmdMatch) {
          params.command = cmdMatch[1].trim();
        } else {
          // 如果没有引号包围，尝试提取整个指令中的命令部分
          params.command = instruction.replace(/^(?:请|帮我)?(?:执行|运行|命令|系统)\s*/i, '').trim();
        }
        break;
        
      case 'web_search':
        // 提取搜索关键词
        const searchRegex = /(?:搜索|查找|搜)["']?([\s\S]+?)["']?(?:信息|内容|资料|结果)?(?=\s|$|[，。！])/;
        const searchMatch = instruction.match(searchRegex);
        if (searchMatch) {
          params.query = searchMatch[1].trim();
        } else {
          params.query = instruction.replace(/^(?:请|帮我)?(?:搜索|查找|搜|网上查)\s*/i, '').trim();
        }
        break;
        
      case 'web_fetch':
        // 提取URL
        const urlRegex = /(https?:\/\/[^\s，。！]+)/;
        const urlMatch = instruction.match(urlRegex);
        if (urlMatch) {
          params.url = urlMatch[1];
        }
        break;
        
      case 'message':
        // 提取消息内容
        const msgRegex = /(?:消息|内容|说)["']?([\s\S]+?)["'](?=\s|$|[，。！])/;
        const msgMatch = instruction.match(msgRegex);
        if (msgMatch) {
          params.message = msgMatch[1].trim();
          params.action = 'send';
        }
        break;
        
      case 'image':
        // 提取图片路径或URL
        const imgRegex = /(?:图片|照片|相片)["']?([\s\S]+?)["']?(?=\s|$|[，。！])/;
        const imgMatch = instruction.match(imgRegex);
        if (imgMatch) {
          params.image = imgMatch[1].trim();
        }
        break;
        
      case 'memory_search':
        // 提取搜索查询
        const memRegex = /(?:记录|记忆|历史|过去)["']?([\s\S]+?)["']?(?=\s|$|[，。！])/;
        const memMatch = instruction.match(memRegex);
        if (memMatch) {
          params.query = memMatch[1].trim();
        } else {
          params.query = instruction.replace(/^(?:请|帮我)?(?:查找|搜索|回忆|查看)\s*(?:记录|记忆|历史|过去)?\s*/i, '').trim();
        }
        break;
        
      case 'openclaw_cli':
        // 提取CLI命令，移除常见的前置词汇
        let cliInstruction = instruction.replace(/^(?:请|帮我)?(?:执行|运行|openclaw|cli|系统|命令)\s*/i, '').trim();
        
        // 特殊处理一些常见的命令映射
        if (cliInstruction.toLowerCase().includes('诊断') || cliInstruction.toLowerCase().includes('doctor')) {
          params.command = 'doctor';
        } else if (cliInstruction.toLowerCase().includes('状态检查') || cliInstruction.toLowerCase().includes('status')) {
          params.command = 'status';
        } else if (cliInstruction.toLowerCase().includes('健康检查') || cliInstruction.toLowerCase().includes('health')) {
          params.command = 'health';
        } else if (cliInstruction.toLowerCase().includes('配置设置') || cliInstruction.toLowerCase().includes('configure')) {
          params.command = 'configure';
        } else if (cliInstruction.toLowerCase().includes('配置管理') || (cliInstruction.toLowerCase().includes('config'))) {
          params.command = 'config';
        } else if (cliInstruction.toLowerCase().includes('tui')) {
          params.command = 'tui';
        } else if (cliInstruction.toLowerCase().includes('dashboard')) {
          params.command = 'dashboard';
        } else if (cliInstruction.toLowerCase().includes('日志') || cliInstruction.toLowerCase().includes('logs')) {
          params.command = 'logs';
        } else if (cliInstruction.toLowerCase().includes('会话') || cliInstruction.toLowerCase().includes('sessions')) {
          params.command = 'sessions';
        } else if (cliInstruction.toLowerCase().includes('定时任务列表') || (cliInstruction.toLowerCase().includes('cron') && cliInstruction.toLowerCase().includes('list'))) {
          params.command = 'cron list';
        } else if (cliInstruction.toLowerCase().includes('定时任务状态') || cliInstruction.toLowerCase().includes('cron status')) {
          params.command = 'cron status';
        } else if (cliInstruction.toLowerCase().includes('定时任务') || cliInstruction.toLowerCase().includes('cron')) {
          // 如果只有"定时任务"而没有具体操作，就只用cron命令
          params.command = 'cron';
        } else if (cliInstruction.toLowerCase().includes('插件') || cliInstruction.toLowerCase().includes('plugins')) {
          params.command = 'plugins';
        } else if (cliInstruction.toLowerCase().includes('通道') || cliInstruction.toLowerCase().includes('channels')) {
          params.command = 'channels';
        } else if (cliInstruction.toLowerCase().includes('设备') || cliInstruction.toLowerCase().includes('devices')) {
          params.command = 'devices';
        } else if (cliInstruction.toLowerCase().includes('节点') || cliInstruction.toLowerCase().includes('nodes')) {
          params.command = 'nodes';
        } else if (cliInstruction.toLowerCase().includes('安全审计') || (cliInstruction.toLowerCase().includes('安全') && cliInstruction.toLowerCase().includes('audit'))) {
          params.command = 'security audit';
        } else if (cliInstruction.toLowerCase().includes('安全') || cliInstruction.toLowerCase().includes('security')) {
          params.command = 'security';
        } else if (cliInstruction.toLowerCase().includes('技能') || cliInstruction.toLowerCase().includes('skills')) {
          params.command = 'skills';
        } else if (cliInstruction.toLowerCase().includes('更新') || cliInstruction.toLowerCase().includes('update')) {
          params.command = 'update';
        } else if (cliInstruction.toLowerCase().includes('浏览器') || cliInstruction.toLowerCase().includes('browser')) {
          params.command = 'browser';
        } else {
          // 默认情况下使用整个指令
          params.command = cliInstruction;
        }
        
        if (!params.command) {
          params.command = instruction.trim();
        }
        break;
        
      default:
        // 对于其他工具，尝试通用参数提取
        break;
    }
    
    return params;
  }

  /**
   * 处理中文指令
   */
  async processInstruction(instruction) {
    console.log(`处理中文指令: ${instruction}`);
    
    // 检查是否是帮助请求
    if (this.isHelpRequest(instruction)) {
      return this.handleHelpRequest(instruction);
    }
    
    // 解析指令
    const parsed = this.parseChineseInstruction(instruction);
    if (!parsed) {
      return {
        success: false,
        message: "抱歉，我无法理解您的指令。请使用更明确的中文表达。您也可以输入'帮助'来获取使用指南。"
      };
    }
    
    console.log(`匹配到工具: ${parsed.toolName}, 关键词: ${parsed.matchedKeyword}`);
    
    // 提取参数
    const params = this.extractParameters(instruction, parsed.toolName);
    console.log(`提取参数:`, params);
    
    // 验证必需参数
    if (this.requiresParams(parsed.toolName) && Object.keys(params).length === 0) {
      return {
        success: false,
        message: `工具 "${parsed.toolName}" 需要更多参数。请提供详细信息。`
      };
    }
    
    // 执行工具
    try {
      const result = await this.openClawIntegration.executeTool(parsed.toolName, params);
      console.log(`工具执行结果:`, result);
      
      return {
        success: true,
        tool: parsed.toolName,
        result: result,
        originalInstruction: instruction
      };
    } catch (error) {
      console.error(`执行工具时出错:`, error);
      return {
        success: false,
        error: error.message,
        tool: parsed.toolName
      };
    }
  }

  /**
   * 判断是否是帮助请求
   */
  isHelpRequest(instruction) {
    const helpKeywords = ['help', '帮助', 'HELP', '？', '?', 'help!', '帮助!', '求助', '怎么用', '如何使用', '使用方法', '教程', '指南', '使用说明', 'onboard', '引导', '入门', '用户引导', '新用户', 'onboard帮助', '引导帮助', '入门帮助'];
    const trimmedInstruction = instruction.trim().toLowerCase();
    
    return helpKeywords.some(keyword => 
      trimmedInstruction.includes(keyword.toLowerCase())
    );
  }

  /**
   * 处理帮助请求
   */
  handleHelpRequest(instruction) {
    try {
      // 根据具体帮助请求类型返回相应信息
      if (instruction.toLowerCase().includes('工具') || instruction.toLowerCase().includes('tool')) {
        // 如果请求工具相关帮助
        const tools = this.openClawIntegration.getToolDescriptions();
        let toolHelp = "可用工具列表：\n";
        Object.entries(tools).forEach(([name, desc], index) => {
          toolHelp += `${index + 1}. ${name}: ${desc.description || '无描述'}\n`;
        });
        return {
          success: true,
          tool: 'help',
          result: { message: toolHelp },
          originalInstruction: instruction
        };
      } else if (instruction.toLowerCase().includes('命令') || instruction.toLowerCase().includes('指令')) {
        // 如果请求命令相关帮助
        const quickHelp = this.helpManager.getQuickHelp();
        let commandHelp = "常用命令示例：\n";
        quickHelp.quickCommands.forEach((cmd, index) => {
          commandHelp += `${index + 1}. ${cmd.command} - ${cmd.description}\n`;
        });
        commandHelp += `\n提示: ${quickHelp.tip}`;
        return {
          success: true,
          tool: 'help',
          result: { message: commandHelp },
          originalInstruction: instruction
        };
      } else {
        // 一般帮助请求
        const fullHelp = this.helpManager.getFullHelp();
        let helpText = `${fullHelp.title}\n\n`;
        helpText += `概述: ${fullHelp.overview}\n\n`;
        helpText += "您可以使用自然语言描述您的需求，例如：\n";
        helpText += "- '请读取 README.md 文件'\n";
        helpText += "- '搜索今天天气情况'\n";
        helpText += "- '执行命令 ls -la'\n";
        helpText += "- '创建一个名为 test.txt 的文件，内容为 Hello World'\n\n";
        helpText += "输入'工具列表'查看所有可用工具，或输入'命令示例'查看具体用法。";
        
        return {
          success: true,
          tool: 'help',
          result: { message: helpText },
          originalInstruction: instruction
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        tool: 'help'
      };
    }
  }

  /**
   * 判断工具是否需要参数
   */
  requiresParams(toolName) {
    const noParamTools = ['feishu_app_scopes', 'cron_status', 'message_broadcast'];
    return !noParamTools.includes(toolName);
  }

  /**
   * 获取中文指令帮助
   */
  getHelp() {
    return `
    OpenBot 中文指令帮助：
    
    文件操作：
    - "读取文件 /path/to/file" - 读取文件内容
    - "写入文件 /path/to/file 内容是 'Hello World'" - 写入文件
    - "编辑文件 /path/to/file 原文 'old text' 新文 'new text'" - 编辑文件
    
    系统命令：
    - "执行命令 ls -la" - 执行系统命令
    
    网络操作：
    - "搜索 '人工智能最新发展'" - 搜索网络
    - "获取网页 https://example.com" - 获取网页内容
    
    消息操作：
    - "发送消息 'Hello' 到频道" - 发送消息
    
    记忆操作：
    - "查找记录 项目进展" - 搜索记忆记录
    
    帮助功能：
    - "帮助" - 获取一般帮助信息
    - "工具帮助" - 查看可用工具列表
    - "命令帮助" - 查看命令示例
    
    更多指令请参考具体工具文档。
    `;
  }
}

module.exports = ChineseNLPProcessor;