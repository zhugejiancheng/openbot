/**
 * OpenClaw CLI适配器
 * 用于将自然语言指令转换为OpenClaw CLI命令并执行
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class OpenClawCliAdapter {
  constructor() {
    this.cliCommands = {
      'setup': {
        keywords: ['初始化', 'setup', '初始化配置'],
        description: '初始化 ~/.openclaw/openclaw.json 和代理工作区',
        handler: this.handleSetup.bind(this)
      },
      'configure': {
        keywords: ['配置', 'configure', '设置向导'],
        description: '交互式提示设置凭据、设备和代理默认值',
        handler: this.handleConfigure.bind(this)
      },
      'config': {
        keywords: ['配置管理', 'config', '配置助手'],
        description: '配置助手 (get/set/unset)，不带子命令运行以使用向导',
        handler: this.handleConfig.bind(this)
      },
      'doctor': {
        keywords: ['诊断', 'doctor', '健康检查'],
        description: '网关和通道的健康检查 + 快速修复',
        handler: this.handleDoctor.bind(this)
      },
      'dashboard': {
        keywords: ['控制台', 'dashboard', '控制面板'],
        description: '使用当前令牌打开控制UI',
        handler: this.handleDashboard.bind(this)
      },
      'reset': {
        keywords: ['重置', 'reset', '重置配置'],
        description: '重置本地配置/状态 (保留CLI)',
        handler: this.handleReset.bind(this)
      },
      'uninstall': {
        keywords: ['卸载', 'uninstall', '删除安装'],
        description: '卸载网关服务 + 本地数据 (CLI保留)',
        handler: this.handleUninstall.bind(this)
      },
      'message': {
        keywords: ['消息', 'message', '发送消息'],
        description: '发送消息和通道操作',
        handler: this.handleMessage.bind(this)
      },
      'memory': {
        keywords: ['记忆', 'memory', '记忆工具'],
        description: '记忆搜索工具',
        handler: this.handleMemory.bind(this)
      },
      'agent': {
        keywords: ['代理', 'agent', '运行代理'],
        description: '通过网关运行代理回合 (使用--local表示嵌入式)',
        handler: this.handleAgent.bind(this)
      },
      'agents': {
        keywords: ['代理管理', 'agents', '管理代理'],
        description: '管理隔离代理 (工作区 + 认证 + 路由)',
        handler: this.handleAgents.bind(this)
      },
      'acp': {
        keywords: ['acp', '代理控制协议'],
        description: '代理控制协议工具',
        handler: this.handleAcp.bind(this)
      },
      'gateway': {
        keywords: ['网关', 'gateway', '网关控制'],
        description: '网关控制守护进程',
        handler: this.handleGateway.bind(this)
      },
      'logs': {
        keywords: ['日志', 'logs', '网关日志'],
        description: '网关日志',
        handler: this.handleLogs.bind(this)
      },
      'system': {
        keywords: ['系统', 'system', '系统事件'],
        description: '系统事件、心跳和存在状态',
        handler: this.handleSystem.bind(this)
      },
      'models': {
        keywords: ['模型', 'models', '模型配置'],
        description: '模型配置',
        handler: this.handleModels.bind(this)
      },
      'approvals': {
        keywords: ['批准', 'approvals', '执行批准'],
        description: '执行批准',
        handler: this.handleApprovals.bind(this)
      },
      'nodes': {
        keywords: ['节点', 'nodes', '节点命令'],
        description: '节点命令',
        handler: this.handleNodes.bind(this)
      },
      'devices': {
        keywords: ['设备', 'devices', '设备配对'],
        description: '设备配对 + 令牌管理',
        handler: this.handleDevices.bind(this)
      },
      'node': {
        keywords: ['节点控制', 'node', '节点管理'],
        description: '节点控制',
        handler: this.handleNode.bind(this)
      },
      'sandbox': {
        keywords: ['沙箱', 'sandbox', '沙箱工具'],
        description: '沙箱工具',
        handler: this.handleSandbox.bind(this)
      },
      'tui': {
        keywords: ['终端界面', 'tui', '终端UI'],
        description: '终端UI',
        handler: this.handleTui.bind(this)
      },
      'cron': {
        keywords: ['定时任务', 'cron', '定时调度'],
        description: '定时调度器',
        handler: this.handleCron.bind(this)
      },
      'dns': {
        keywords: ['dns', 'DNS助手'],
        description: 'DNS助手',
        handler: this.handleDns.bind(this)
      },
      'docs': {
        keywords: ['文档', 'docs', '文档助手'],
        description: '文档助手',
        handler: this.handleDocs.bind(this)
      },
      'hooks': {
        keywords: ['钩子', 'hooks', '钩子工具'],
        description: '钩子工具',
        handler: this.handleHooks.bind(this)
      },
      'webhooks': {
        keywords: ['webhook', 'webhooks', 'webhook助手'],
        description: 'Webhook助手',
        handler: this.handleWebhooks.bind(this)
      },
      'pairing': {
        keywords: ['配对', 'pairing', '配对助手'],
        description: '配对助手',
        handler: this.handlePairing.bind(this)
      },
      'plugins': {
        keywords: ['插件', 'plugins', '插件管理'],
        description: '插件管理',
        handler: this.handlePlugins.bind(this)
      },
      'channels': {
        keywords: ['通道', 'channels', '通道管理'],
        description: '通道管理',
        handler: this.handleChannels.bind(this)
      },
      'directory': {
        keywords: ['目录', 'directory', '目录命令'],
        description: '目录命令',
        handler: this.handleDirectory.bind(this)
      },
      'security': {
        keywords: ['安全', 'security', '安全助手'],
        description: '安全助手',
        handler: this.handleSecurity.bind(this)
      },
      'skills': {
        keywords: ['技能', 'skills', '技能管理'],
        description: '技能管理',
        handler: this.handleSkills.bind(this)
      },
      'update': {
        keywords: ['更新', 'update', '更新助手'],
        description: 'CLI更新助手',
        handler: this.handleUpdate.bind(this)
      },
      'completion': {
        keywords: ['补全', 'completion', 'shell补全'],
        description: '生成shell补全脚本',
        handler: this.handleCompletion.bind(this)
      },
      'status': {
        keywords: ['状态', 'status', '健康状态'],
        description: '显示通道健康状况和最近会话接收者',
        handler: this.handleStatus.bind(this)
      },
      'health': {
        keywords: ['健康', 'health', '健康检查'],
        description: '从运行的网关获取健康状态',
        handler: this.handleHealth.bind(this)
      },
      'sessions': {
        keywords: ['会话', 'sessions', '会话列表'],
        description: '列出存储的对话会话',
        handler: this.handleSessions.bind(this)
      },
      'browser': {
        keywords: ['浏览器', 'browser', '浏览器管理'],
        description: '管理OpenClaw的专用浏览器 (Chrome/Chromium)',
        handler: this.handleBrowser.bind(this)
      }
    };
  }

  /**
   * 检查OpenClaw CLI是否可用
   */
  async isOpenClawAvailable() {
    try {
      const { stdout } = await execAsync('which openclaw');
      return !!stdout.trim();
    } catch (error) {
      return false;
    }
  }

  /**
   * 执行OpenClaw命令
   */
  async executeOpenClawCommand(command) {
    if (!(await this.isOpenClawAvailable())) {
      throw new Error('OpenClaw CLI not found. Please install OpenClaw first.');
    }

    try {
      // 执行命令，设置适当的环境变量
      const result = await execAsync(`openclaw ${command}`, {
        timeout: 30000, // 30秒超时
        env: {
          ...process.env,
          // 设置一些常用的环境变量
        }
      });
      return {
        success: true,
        stdout: result.stdout,
        stderr: result.stderr
      };
    } catch (error) {
      return {
        success: false,
        stdout: error.stdout || '',
        stderr: error.stderr || error.message,
        code: error.code
      };
    }
  }

  /**
   * 解析用户指令并匹配到相应的CLI命令
   */
  parseInstruction(instruction) {
    const lowerInstruction = instruction.toLowerCase();
    
    // 首先尝试精确匹配
    for (const [command, config] of Object.entries(this.cliCommands)) {
      if (config.keywords.some(keyword => 
        lowerInstruction.includes(keyword.toLowerCase())
      )) {
        // 提取可能的参数
        let remainingInstruction = instruction;
        config.keywords.forEach(keyword => {
          remainingInstruction = remainingInstruction.replace(new RegExp(keyword, 'gi'), '');
        });
        
        const params = remainingInstruction.trim();
        
        return {
          command,
          params,
          description: config.description
        };
      }
    }
    
    // 如果没有找到精确匹配，返回null
    return null;
  }

  /**
   * 处理CLI指令
   */
  async handleCliInstruction(instruction) {
    console.log(`处理OpenClaw CLI指令: ${instruction}`);
    
    const parsed = this.parseInstruction(instruction);
    if (!parsed) {
      return {
        success: false,
        message: "无法识别的OpenClaw命令。请输入更具体的命令，如'状态检查'、'配置设置'、'初始化'等。",
        availableCommands: Object.values(this.cliCommands).map(cmd => ({
          keywords: cmd.keywords,
          description: cmd.description
        }))
      };
    }
    
    console.log(`匹配到命令: ${parsed.command}, 参数: ${parsed.params}`);
    
    // 执行相应的处理函数
    try {
      const result = await this.cliCommands[parsed.command].handler(parsed.params);
      return result;
    } catch (error) {
      console.error(`执行CLI命令时出错:`, error);
      return {
        success: false,
        error: error.message,
        command: parsed.command
      };
    }
  }

  // 各种命令的处理函数
  
  async handleSetup(params) {
    const command = `setup ${params}`.trim();
    const result = await this.executeOpenClawCommand(command);
    
    if (result.success) {
      return {
        success: true,
        message: `初始化命令已执行完成。\n输出:\n${result.stdout}`,
        command: 'setup',
        result: result
      };
    } else {
      return {
        success: false,
        message: `初始化命令执行失败: ${result.stderr}`,
        command: 'setup',
        result: result
      };
    }
  }

  async handleConfigure(params) {
    const message = "配置向导需要交互式界面，无法通过API执行。请在终端中运行 'openclaw configure' 命令进行配置。";
    return {
      success: true,
      message: message,
      command: 'configure'
    };
  }

  async handleConfig(params) {
    let command = 'config';
    if (params) {
      command += ` ${params}`;
    }
    
    const result = await this.executeOpenClawCommand(command);
    
    if (result.success) {
      return {
        success: true,
        message: `配置命令执行结果:\n${result.stdout}`,
        command: 'config',
        result: result
      };
    } else {
      return {
        success: false,
        message: `配置命令执行失败: ${result.stderr}`,
        command: 'config',
        result: result
      };
    }
  }

  async handleDoctor(params) {
    const command = `doctor ${params}`.trim();
    const result = await this.executeOpenClawCommand(command);
    
    if (result.success) {
      return {
        success: true,
        message: `健康检查结果:\n${result.stdout}`,
        command: 'doctor',
        result: result
      };
    } else {
      return {
        success: false,
        message: `健康检查失败: ${result.stderr}`,
        command: 'doctor',
        result: result
      };
    }
  }

  async handleDashboard(params) {
    const message = "控制面板需要打开浏览器，无法通过API直接执行。通常会在默认浏览器中打开控制界面。";
    return {
      success: true,
      message: message,
      command: 'dashboard'
    };
  }

  async handleReset(params) {
    const command = `reset ${params}`.trim();
    const result = await this.executeOpenClawCommand(command);
    
    if (result.success) {
      return {
        success: true,
        message: `重置命令执行结果:\n${result.stdout}`,
        command: 'reset',
        result: result
      };
    } else {
      return {
        success: false,
        message: `重置命令执行失败: ${result.stderr}`,
        command: 'reset',
        result: result
      };
    }
  }

  async handleUninstall(params) {
    const message = "卸载操作非常敏感，为了安全起见，建议在终端中手动执行 'openclaw uninstall' 命令。";
    return {
      success: false,
      message: message,
      command: 'uninstall'
    };
  }

  async handleMessage(params) {
    if (!params) {
      return {
        success: false,
        message: "请提供消息参数，例如：'发送消息 你好世界 到 telegram'",
        command: 'message'
      };
    }
    
    const command = `message ${params}`;
    const result = await this.executeOpenClawCommand(command);
    
    if (result.success) {
      return {
        success: true,
        message: `消息命令执行结果:\n${result.stdout}`,
        command: 'message',
        result: result
      };
    } else {
      return {
        success: false,
        message: `消息命令执行失败: ${result.stderr}`,
        command: 'message',
        result: result
      };
    }
  }

  async handleMemory(params) {
    if (!params) {
      return {
        success: false,
        message: "请提供记忆操作参数，例如：'搜索 我的笔记' 或 '获取 最近记录'",
        command: 'memory'
      };
    }
    
    const command = `memory ${params}`;
    const result = await this.executeOpenClawCommand(command);
    
    if (result.success) {
      return {
        success: true,
        message: `记忆操作结果:\n${result.stdout}`,
        command: 'memory',
        result: result
      };
    } else {
      return {
        success: false,
        message: `记忆操作失败: ${result.stderr}`,
        command: 'memory',
        result: result
      };
    }
  }

  async handleAgent(params) {
    if (!params) {
      return {
        success: false,
        message: "请提供代理操作参数，例如：'运行 你好 通过 local' 或 '列表'",
        command: 'agent'
      };
    }
    
    const command = `agent ${params}`;
    const result = await this.executeOpenClawCommand(command);
    
    if (result.success) {
      return {
        success: true,
        message: `代理操作结果:\n${result.stdout}`,
        command: 'agent',
        result: result
      };
    } else {
      return {
        success: false,
        message: `代理操作失败: ${result.stderr}`,
        command: 'agent',
        result: result
      };
    }
  }

  async handleAgents(params) {
    const command = `agents ${params}`.trim();
    const result = await this.executeOpenClawCommand(command);
    
    if (result.success) {
      return {
        success: true,
        message: `代理管理结果:\n${result.stdout}`,
        command: 'agents',
        result: result
      };
    } else {
      return {
        success: false,
        message: `代理管理失败: ${result.stderr}`,
        command: 'agents',
        result: result
      };
    }
  }

  // 为其他命令添加类似的处理函数...
  async handleAcp(params) {
    const command = `acp ${params}`.trim();
    const result = await this.executeOpenClawCommand(command);
    
    if (result.success) {
      return {
        success: true,
        message: `ACP操作结果:\n${result.stdout}`,
        command: 'acp',
        result: result
      };
    } else {
      return {
        success: false,
        message: `ACP操作失败: ${result.stderr}`,
        command: 'acp',
        result: result
      };
    }
  }

  async handleGateway(params) {
    const command = `gateway ${params}`.trim();
    const result = await this.executeOpenClawCommand(command);
    
    if (result.success) {
      return {
        success: true,
        message: `网关操作结果:\n${result.stdout}`,
        command: 'gateway',
        result: result
      };
    } else {
      return {
        success: false,
        message: `网关操作失败: ${result.stderr}`,
        command: 'gateway',
        result: result
      };
    }
  }

  async handleLogs(params) {
    const command = `logs ${params}`.trim();
    const result = await this.executeOpenClawCommand(command);
    
    if (result.success) {
      return {
        success: true,
        message: `日志结果:\n${result.stdout}`,
        command: 'logs',
        result: result
      };
    } else {
      return {
        success: false,
        message: `日志操作失败: ${result.stderr}`,
        command: 'logs',
        result: result
      };
    }
  }

  async handleSystem(params) {
    const command = `system ${params}`.trim();
    const result = await this.executeOpenClawCommand(command);
    
    if (result.success) {
      return {
        success: true,
        message: `系统操作结果:\n${result.stdout}`,
        command: 'system',
        result: result
      };
    } else {
      return {
        success: false,
        message: `系统操作失败: ${result.stderr}`,
        command: 'system',
        result: result
      };
    }
  }

  async handleModels(params) {
    const command = `models ${params}`.trim();
    const result = await this.executeOpenClawCommand(command);
    
    if (result.success) {
      return {
        success: true,
        message: `模型配置结果:\n${result.stdout}`,
        command: 'models',
        result: result
      };
    } else {
      return {
        success: false,
        message: `模型配置失败: ${result.stderr}`,
        command: 'models',
        result: result
      };
    }
  }

  async handleApprovals(params) {
    const command = `approvals ${params}`.trim();
    const result = await this.executeOpenClawCommand(command);
    
    if (result.success) {
      return {
        success: true,
        message: `批准操作结果:\n${result.stdout}`,
        command: 'approvals',
        result: result
      };
    } else {
      return {
        success: false,
        message: `批准操作失败: ${result.stderr}`,
        command: 'approvals',
        result: result
      };
    }
  }

  async handleNodes(params) {
    const command = `nodes ${params}`.trim();
    const result = await this.executeOpenClawCommand(command);
    
    if (result.success) {
      return {
        success: true,
        message: `节点操作结果:\n${result.stdout}`,
        command: 'nodes',
        result: result
      };
    } else {
      return {
        success: false,
        message: `节点操作失败: ${result.stderr}`,
        command: 'nodes',
        result: result
      };
    }
  }

  async handleDevices(params) {
    const command = `devices ${params}`.trim();
    const result = await this.executeOpenClawCommand(command);
    
    if (result.success) {
      return {
        success: true,
        message: `设备操作结果:\n${result.stdout}`,
        command: 'devices',
        result: result
      };
    } else {
      return {
        success: false,
        message: `设备操作失败: ${result.stderr}`,
        command: 'devices',
        result: result
      };
    }
  }

  async handleNode(params) {
    const command = `node ${params}`.trim();
    const result = await this.executeOpenClawCommand(command);
    
    if (result.success) {
      return {
        success: true,
        message: `节点控制结果:\n${result.stdout}`,
        command: 'node',
        result: result
      };
    } else {
      return {
        success: false,
        message: `节点控制失败: ${result.stderr}`,
        command: 'node',
        result: result
      };
    }
  }

  async handleSandbox(params) {
    const command = `sandbox ${params}`.trim();
    const result = await this.executeOpenClawCommand(command);
    
    if (result.success) {
      return {
        success: true,
        message: `沙箱操作结果:\n${result.stdout}`,
        command: 'sandbox',
        result: result
      };
    } else {
      return {
        success: false,
        message: `沙箱操作失败: ${result.stderr}`,
        command: 'sandbox',
        result: result
      };
    }
  }

  async handleTui(params) {
    const message = "终端UI需要交互式界面，无法通过API执行。请在终端中运行 'openclaw tui' 命令。";
    return {
      success: true,
      message: message,
      command: 'tui'
    };
  }

  async handleCron(params) {
    const command = `cron ${params}`.trim();
    const result = await this.executeOpenClawCommand(command);
    
    if (result.success) {
      return {
        success: true,
        message: `定时任务操作结果:\n${result.stdout}`,
        command: 'cron',
        result: result
      };
    } else {
      return {
        success: false,
        message: `定时任务操作失败: ${result.stderr}`,
        command: 'cron',
        result: result
      };
    }
  }

  async handleDns(params) {
    const command = `dns ${params}`.trim();
    const result = await this.executeOpenClawCommand(command);
    
    if (result.success) {
      return {
        success: true,
        message: `DNS操作结果:\n${result.stdout}`,
        command: 'dns',
        result: result
      };
    } else {
      return {
        success: false,
        message: `DNS操作失败: ${result.stderr}`,
        command: 'dns',
        result: result
      };
    }
  }

  async handleDocs(params) {
    const command = `docs ${params}`.trim();
    const result = await this.executeOpenClawCommand(command);
    
    if (result.success) {
      return {
        success: true,
        message: `文档操作结果:\n${result.stdout}`,
        command: 'docs',
        result: result
      };
    } else {
      return {
        success: false,
        message: `文档操作失败: ${result.stderr}`,
        command: 'docs',
        result: result
      };
    }
  }

  async handleHooks(params) {
    const command = `hooks ${params}`.trim();
    const result = await this.executeOpenClawCommand(command);
    
    if (result.success) {
      return {
        success: true,
        message: `钩子操作结果:\n${result.stdout}`,
        command: 'hooks',
        result: result
      };
    } else {
      return {
        success: false,
        message: `钩子操作失败: ${result.stderr}`,
        command: 'hooks',
        result: result
      };
    }
  }

  async handleWebhooks(params) {
    const command = `webhooks ${params}`.trim();
    const result = await this.executeOpenClawCommand(command);
    
    if (result.success) {
      return {
        success: true,
        message: `Webhook操作结果:\n${result.stdout}`,
        command: 'webhooks',
        result: result
      };
    } else {
      return {
        success: false,
        message: `Webhook操作失败: ${result.stderr}`,
        command: 'webhooks',
        result: result
      };
    }
  }

  async handlePairing(params) {
    const command = `pairing ${params}`.trim();
    const result = await this.executeOpenClawCommand(command);
    
    if (result.success) {
      return {
        success: true,
        message: `配对操作结果:\n${result.stdout}`,
        command: 'pairing',
        result: result
      };
    } else {
      return {
        success: false,
        message: `配对操作失败: ${result.stderr}`,
        command: 'pairing',
        result: result
      };
    }
  }

  async handlePlugins(params) {
    const command = `plugins ${params}`.trim();
    const result = await this.executeOpenClawCommand(command);
    
    if (result.success) {
      return {
        success: true,
        message: `插件操作结果:\n${result.stdout}`,
        command: 'plugins',
        result: result
      };
    } else {
      return {
        success: false,
        message: `插件操作失败: ${result.stderr}`,
        command: 'plugins',
        result: result
      };
    }
  }

  async handleChannels(params) {
    const command = `channels ${params}`.trim();
    const result = await this.executeOpenClawCommand(command);
    
    if (result.success) {
      return {
        success: true,
        message: `通道操作结果:\n${result.stdout}`,
        command: 'channels',
        result: result
      };
    } else {
      return {
        success: false,
        message: `通道操作失败: ${result.stderr}`,
        command: 'channels',
        result: result
      };
    }
  }

  async handleDirectory(params) {
    const command = `directory ${params}`.trim();
    const result = await this.executeOpenClawCommand(command);
    
    if (result.success) {
      return {
        success: true,
        message: `目录操作结果:\n${result.stdout}`,
        command: 'directory',
        result: result
      };
    } else {
      return {
        success: false,
        message: `目录操作失败: ${result.stderr}`,
        command: 'directory',
        result: result
      };
    }
  }

  async handleSecurity(params) {
    const command = `security ${params}`.trim();
    const result = await this.executeOpenClawCommand(command);
    
    if (result.success) {
      return {
        success: true,
        message: `安全操作结果:\n${result.stdout}`,
        command: 'security',
        result: result
      };
    } else {
      return {
        success: false,
        message: `安全操作失败: ${result.stderr}`,
        command: 'security',
        result: result
      };
    }
  }

  async handleSkills(params) {
    const command = `skills ${params}`.trim();
    const result = await this.executeOpenClawCommand(command);
    
    if (result.success) {
      return {
        success: true,
        message: `技能操作结果:\n${result.stdout}`,
        command: 'skills',
        result: result
      };
    } else {
      return {
        success: false,
        message: `技能操作失败: ${result.stderr}`,
        command: 'skills',
        result: result
      };
    }
  }

  async handleUpdate(params) {
    const command = `update ${params}`.trim();
    const result = await this.executeOpenClawCommand(command);
    
    if (result.success) {
      return {
        success: true,
        message: `更新操作结果:\n${result.stdout}`,
        command: 'update',
        result: result
      };
    } else {
      return {
        success: false,
        message: `更新操作失败: ${result.stderr}`,
        command: 'update',
        result: result
      };
    }
  }

  async handleCompletion(params) {
    const command = `completion ${params}`.trim();
    const result = await this.executeOpenClawCommand(command);
    
    if (result.success) {
      return {
        success: true,
        message: `补全脚本:\n${result.stdout}`,
        command: 'completion',
        result: result
      };
    } else {
      return {
        success: false,
        message: `补全操作失败: ${result.stderr}`,
        command: 'completion',
        result: result
      };
    }
  }

  async handleStatus(params) {
    const command = `status ${params}`.trim();
    const result = await this.executeOpenClawCommand(command);
    
    if (result.success) {
      return {
        success: true,
        message: `状态检查结果:\n${result.stdout}`,
        command: 'status',
        result: result
      };
    } else {
      return {
        success: false,
        message: `状态检查失败: ${result.stderr}`,
        command: 'status',
        result: result
      };
    }
  }

  async handleHealth(params) {
    const command = `health ${params}`.trim();
    const result = await this.executeOpenClawCommand(command);
    
    if (result.success) {
      return {
        success: true,
        message: `健康检查结果:\n${result.stdout}`,
        command: 'health',
        result: result
      };
    } else {
      return {
        success: false,
        message: `健康检查失败: ${result.stderr}`,
        command: 'health',
        result: result
      };
    }
  }

  async handleSessions(params) {
    const command = `sessions ${params}`.trim();
    const result = await this.executeOpenClawCommand(command);
    
    if (result.success) {
      return {
        success: true,
        message: `会话列表:\n${result.stdout}`,
        command: 'sessions',
        result: result
      };
    } else {
      return {
        success: false,
        message: `会话操作失败: ${result.stderr}`,
        command: 'sessions',
        result: result
      };
    }
  }

  async handleBrowser(params) {
    const command = `browser ${params}`.trim();
    const result = await this.executeOpenClawCommand(command);
    
    if (result.success) {
      return {
        success: true,
        message: `浏览器操作结果:\n${result.stdout}`,
        command: 'browser',
        result: result
      };
    } else {
      return {
        success: false,
        message: `浏览器操作失败: ${result.stderr}`,
        command: 'browser',
        result: result
      };
    }
  }
}

module.exports = OpenClawCliAdapter;