/**
 * OpenClaw 集成模块
 * 将 OpenClaw 的功能集成到 OpenBot 中
 */

const OpenClawCliAdapter = require('../../utils/openclawCliAdapter');

class OpenClawIntegration {
  constructor(config = {}) {
    this.config = config;
    this.tools = {};
    this.cliAdapter = new OpenClawCliAdapter();
    this.initializeTools();
  }

  /**
   * 初始化所有 OpenClaw 工具
   */
  initializeTools() {
    // 文件操作工具
    this.tools.read = this.createReadTool();
    this.tools.write = this.createWriteTool();
    this.tools.edit = this.createEditTool();
    
    // 系统命令工具
    this.tools.exec = this.createExecTool();
    this.tools.process = this.createProcessTool();
    
    // 网络工具
    this.tools.web_search = this.createWebSearchTool();
    this.tools.web_fetch = this.createWebFetchTool();
    this.tools.browser = this.createBrowserTool();
    
    // AI 工具
    this.tools.image = this.createImageTool();
    
    // 飞书工具
    this.tools.feishu_doc = this.createFeishuDocTool();
    this.tools.feishu_wiki = this.createFeishuWikiTool();
    this.tools.feishu_drive = this.createFeishuDriveTool();
    this.tools.feishu_app_scopes = this.createFeishuAppScopesTool();
    this.tools.feishu_bitable_get_meta = this.createFeishuBitableGetMetaTool();
    this.tools.feishu_bitable_list_fields = this.createFeishuBitableListFieldsTool();
    this.tools.feishu_bitable_list_records = this.createFeishuBitableListRecordsTool();
    this.tools.feishu_bitable_get_record = this.createFeishuBitableGetRecordTool();
    this.tools.feishu_bitable_create_record = this.createFeishuBitableCreateRecordTool();
    this.tools.feishu_bitable_update_record = this.createFeishuBitableUpdateRecordTool();
    
    // 定时任务工具
    this.tools.cron = this.createCronTool();
    
    // 消息工具
    this.tools.message = this.createMessageTool();
    
    // 记忆工具
    this.tools.memory_search = this.createMemorySearchTool();
    this.tools.memory_get = this.createMemoryGetTool();
    
    // OpenClaw CLI 工具
    this.tools.openclaw_cli = this.createOpenClawCliTool();
    
    console.log('OpenClaw 工具已初始化完成，共加载', Object.keys(this.tools).length, '个工具');
  }

  /**
   * 创建文件读取工具
   */
  createReadTool() {
    return {
      name: "read",
      description: "读取文件内容，支持文本文件和图片",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "文件路径"
          }
        },
        required: ["path"]
      },
      handler: async (params) => {
        // 这里将集成真实的文件读取功能
        console.log(`执行 read 工具: ${params.path}`);
        return { success: true, content: "文件内容..." };
      }
    };
  }

  /**
   * 创建文件写入工具
   */
  createWriteTool() {
    return {
      name: "write",
      description: "写入内容到文件，创建或覆盖文件",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "文件路径"
          },
          content: {
            type: "string",
            description: "要写入的内容"
          }
        },
        required: ["path", "content"]
      },
      handler: async (params) => {
        console.log(`执行 write 工具: ${params.path}`);
        return { success: true, message: "文件写入成功" };
      }
    };
  }

  /**
   * 创建文件编辑工具
   */
  createEditTool() {
    return {
      name: "edit",
      description: "编辑文件，通过精确替换文本进行修改",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "文件路径"
          },
          oldText: {
            type: "string",
            description: "要被替换的原始文本"
          },
          newText: {
            type: "string",
            description: "替换后的新文本"
          }
        },
        required: ["path", "oldText", "newText"]
      },
      handler: async (params) => {
        console.log(`执行 edit 工具: ${params.path}`);
        return { success: true, message: "文件编辑成功" };
      }
    };
  }

  /**
   * 创建系统命令执行工具
   */
  createExecTool() {
    return {
      name: "exec",
      description: "执行系统命令，支持后台执行和PTY模式",
      parameters: {
        type: "object",
        properties: {
          command: {
            type: "string",
            description: "要执行的命令"
          },
          background: {
            type: "boolean",
            description: "是否后台执行"
          },
          pty: {
            type: "boolean",
            description: "是否使用伪终端"
          }
        },
        required: ["command"]
      },
      handler: async (params) => {
        console.log(`执行 exec 工具: ${params.command}`);
        return { success: true, output: "命令执行输出..." };
      }
    };
  }

  /**
   * 创建进程管理工具
   */
  createProcessTool() {
    return {
      name: "process",
      description: "管理正在运行的exec会话：列出、轮询、日志、写入、发送按键、提交、粘贴、终止",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            description: "操作动作",
            enum: ["list", "poll", "log", "write", "send-keys", "submit", "paste", "kill"]
          },
          sessionId: {
            type: "string",
            description: "会话ID（某些操作需要）"
          }
        },
        required: ["action"]
      },
      handler: async (params) => {
        console.log(`执行 process 工具: ${params.action}`);
        return { success: true, result: "操作结果..." };
      }
    };
  }

  /**
   * 创建网络搜索工具
   */
  createWebSearchTool() {
    return {
      name: "web_search",
      description: "使用Brave Search API搜索网络，支持地区和语言设置",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "搜索查询字符串"
          },
          count: {
            type: "number",
            description: "返回结果数量（1-10）"
          },
          country: {
            type: "string",
            description: "国家代码（如'US', 'DE', 'ALL'）"
          },
          language: {
            type: "string",
            description: "搜索语言代码（如'en', 'de', 'zh'）"
          }
        },
        required: ["query"]
      },
      handler: async (params) => {
        console.log(`执行 web_search 工具: ${params.query}`);
        return { success: true, results: [] };
      }
    };
  }

  /**
   * 创建网页抓取工具
   */
  createWebFetchTool() {
    return {
      name: "web_fetch",
      description: "从URL获取并提取可读内容（HTML→markdown/文本）",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "要获取的HTTP或HTTPS URL"
          },
          extractMode: {
            type: "string",
            description: "提取模式",
            enum: ["markdown", "text"]
          }
        },
        required: ["url"]
      },
      handler: async (params) => {
        console.log(`执行 web_fetch 工具: ${params.url}`);
        return { success: true, content: "提取的网页内容..." };
      }
    };
  }

  /**
   * 创建浏览器控制工具
   */
  createBrowserTool() {
    return {
      name: "browser",
      description: "通过OpenClaw浏览器控制服务器控制浏览器",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            description: "浏览器操作",
            enum: ["status", "start", "stop", "profiles", "tabs", "open", "focus", "close", "snapshot", "screenshot", "navigate", "console", "pdf", "upload", "dialog", "act"]
          },
          targetUrl: {
            type: "string",
            description: "目标URL（某些操作需要）"
          }
        },
        required: ["action"]
      },
      handler: async (params) => {
        console.log(`执行 browser 工具: ${params.action}`);
        return { success: true, result: "浏览器操作结果..." };
      }
    };
  }

  /**
   * 创建图像分析工具
   */
  createImageTool() {
    return {
      name: "image",
      description: "使用配置的图像模型分析图像",
      parameters: {
        type: "object",
        properties: {
          image: {
            type: "string",
            description: "图像路径或URL"
          },
          prompt: {
            type: "string",
            description: "分析提示"
          }
        },
        required: ["image"]
      },
      handler: async (params) => {
        console.log(`执行 image 工具: ${params.image}`);
        return { success: true, analysis: "图像分析结果..." };
      }
    };
  }

  /**
   * 创建飞书文档工具
   */
  createFeishuDocTool() {
    return {
      name: "feishu_doc",
      description: "飞书文档操作：读取、写入、追加、创建、列表块、获取块、更新块、删除块",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            description: "操作动作",
            enum: ["read", "write", "append", "create", "list_blocks", "get_block", "update_block", "delete_block"]
          },
          doc_token: {
            type: "string",
            description: "文档令牌"
          }
        },
        required: ["action"]
      },
      handler: async (params) => {
        console.log(`执行 feishu_doc 工具: ${params.action}`);
        return { success: true, result: "飞书文档操作结果..." };
      }
    };
  }

  /**
   * 创建飞书知识库工具
   */
  createFeishuWikiTool() {
    return {
      name: "feishu_wiki",
      description: "飞书知识库操作：空间、节点、获取、搜索、创建、移动、重命名",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            description: "操作动作",
            enum: ["spaces", "nodes", "get", "search", "create", "move", "rename"]
          },
          token: {
            type: "string",
            description: "节点令牌"
          }
        },
        required: ["action"]
      },
      handler: async (params) => {
        console.log(`执行 feishu_wiki 工具: ${params.action}`);
        return { success: true, result: "飞书知识库操作结果..." };
      }
    };
  }

  /**
   * 创建飞书云文档工具
   */
  createFeishuDriveTool() {
    return {
      name: "feishu_drive",
      description: "飞书云文档操作：列表、信息、创建文件夹、移动、删除",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            description: "操作动作",
            enum: ["list", "info", "create_folder", "move", "delete"]
          }
        },
        required: ["action"]
      },
      handler: async (params) => {
        console.log(`执行 feishu_drive 工具: ${params.action}`);
        return { success: true, result: "飞书云文档操作结果..." };
      }
    };
  }

  /**
   * 创建飞书应用权限工具
   */
  createFeishuAppScopesTool() {
    return {
      name: "feishu_app_scopes",
      description: "列出当前应用权限，用于调试权限问题",
      parameters: {
        type: "object",
        properties: {}
      },
      handler: async (params) => {
        console.log(`执行 feishu_app_scopes 工具`);
        return { success: true, scopes: [] };
      }
    };
  }

  /**
   * 创建飞书多维表格元数据工具
   */
  createFeishuBitableGetMetaTool() {
    return {
      name: "feishu_bitable_get_meta",
      description: "解析多维表格URL并获取app_token、table_id和表格列表",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "多维表格URL"
          }
        },
        required: ["url"]
      },
      handler: async (params) => {
        console.log(`执行 feishu_bitable_get_meta 工具: ${params.url}`);
        return { success: true, meta: {} };
      }
    };
  }

  /**
   * 创建飞书多维表格字段列表工具
   */
  createFeishuBitableListFieldsTool() {
    return {
      name: "feishu_bitable_list_fields",
      description: "列出多维表格中的所有字段（列）及其类型和属性",
      parameters: {
        type: "object",
        properties: {
          app_token: {
            type: "string",
            description: "多维表格应用令牌"
          },
          table_id: {
            type: "string",
            description: "表格ID"
          }
        },
        required: ["app_token", "table_id"]
      },
      handler: async (params) => {
        console.log(`执行 feishu_bitable_list_fields 工具`);
        return { success: true, fields: [] };
      }
    };
  }

  /**
   * 创建飞书多维表格记录列表工具
   */
  createFeishuBitableListRecordsTool() {
    return {
      name: "feishu_bitable_list_records",
      description: "从多维表格列出记录（行），支持分页",
      parameters: {
        type: "object",
        properties: {
          app_token: {
            type: "string",
            description: "多维表格应用令牌"
          },
          table_id: {
            type: "string",
            description: "表格ID"
          },
          page_size: {
            type: "number",
            description: "每页记录数（1-500，默认100）"
          }
        },
        required: ["app_token", "table_id"]
      },
      handler: async (params) => {
        console.log(`执行 feishu_bitable_list_records 工具`);
        return { success: true, records: [] };
      }
    };
  }

  /**
   * 创建飞书多维表格获取记录工具
   */
  createFeishuBitableGetRecordTool() {
    return {
      name: "feishu_bitable_get_record",
      description: "通过ID从多维表格获取单条记录",
      parameters: {
        type: "object",
        properties: {
          app_token: {
            type: "string",
            description: "多维表格应用令牌"
          },
          table_id: {
            type: "string",
            description: "表格ID"
          },
          record_id: {
            type: "string",
            description: "记录ID"
          }
        },
        required: ["app_token", "table_id", "record_id"]
      },
      handler: async (params) => {
        console.log(`执行 feishu_bitable_get_record 工具`);
        return { success: true, record: {} };
      }
    };
  }

  /**
   * 创建飞书多维表格创建记录工具
   */
  createFeishuBitableCreateRecordTool() {
    return {
      name: "feishu_bitable_create_record",
      description: "在多维表格中创建新记录（行）",
      parameters: {
        type: "object",
        properties: {
          app_token: {
            type: "string",
            description: "多维表格应用令牌"
          },
          table_id: {
            type: "string",
            description: "表格ID"
          },
          fields: {
            type: "object",
            description: "字段值，以字段名作为键"
          }
        },
        required: ["app_token", "table_id", "fields"]
      },
      handler: async (params) => {
        console.log(`执行 feishu_bitable_create_record 工具`);
        return { success: true, record_id: "new_record_id" };
      }
    };
  }

  /**
   * 创建飞书多维表格更新记录工具
   */
  createFeishuBitableUpdateRecordTool() {
    return {
      name: "feishu_bitable_update_record",
      description: "更新多维表格中的现有记录（行）",
      parameters: {
        type: "object",
        properties: {
          app_token: {
            type: "string",
            description: "多维表格应用令牌"
          },
          table_id: {
            type: "string",
            description: "表格ID"
          },
          record_id: {
            type: "string",
            description: "要更新的记录ID"
          },
          fields: {
            type: "object",
            description: "要更新的字段值，以字段名作为键"
          }
        },
        required: ["app_token", "table_id", "record_id", "fields"]
      },
      handler: async (params) => {
        console.log(`执行 feishu_bitable_update_record 工具`);
        return { success: true, result: "更新成功" };
      }
    };
  }

  /**
   * 创建定时任务工具
   */
  createCronTool() {
    return {
      name: "cron",
      description: "管理定时任务（状态/列表/添加/更新/删除/运行/历史）和发送唤醒事件",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            description: "操作动作",
            enum: ["status", "list", "add", "update", "remove", "run", "runs", "wake"]
          }
        },
        required: ["action"]
      },
      handler: async (params) => {
        console.log(`执行 cron 工具: ${params.action}`);
        return { success: true, result: "定时任务操作结果..." };
      }
    };
  }

  /**
   * 创建消息工具
   */
  createMessageTool() {
    return {
      name: "message",
      description: "通过通道插件发送、删除和管理消息",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            description: "操作动作",
            enum: ["send", "broadcast"]
          },
          message: {
            type: "string",
            description: "消息内容"
          }
        },
        required: ["action"]
      },
      handler: async (params) => {
        console.log(`执行 message 工具: ${params.action}`);
        return { success: true, result: "消息操作结果..." };
      }
    };
  }

  /**
   * 创建记忆搜索工具
   */
  createMemorySearchTool() {
    return {
      name: "memory_search",
      description: "在MEMORY.md和memory/*.md中语义搜索，回答关于过往工作、决策、日期、人物、偏好或待办事项的问题",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "搜索查询"
          }
        },
        required: ["query"]
      },
      handler: async (params) => {
        console.log(`执行 memory_search 工具: ${params.query}`);
        return { success: true, results: [] };
      }
    };
  }

  /**
   * 创建记忆获取工具
   */
  createMemoryGetTool() {
    return {
      name: "memory_get",
      description: "从MEMORY.md、memory/*.md安全读取片段",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "文件路径"
          },
          from: {
            type: "number",
            description: "起始行号"
          },
          lines: {
            type: "number",
            description: "获取行数"
          }
        },
        required: ["path"]
      },
      handler: async (params) => {
        console.log(`执行 memory_get 工具: ${params.path}`);
        return { success: true, content: "记忆内容..." };
      }
    };
  }

  /**
   * 获取所有可用工具
   */
  getAvailableTools() {
    return Object.values(this.tools);
  }

  /**
   * 执行指定工具
   */
  async executeTool(toolName, params) {
    const tool = this.tools[toolName];
    if (!tool) {
      throw new Error(`工具 "${toolName}" 不存在`);
    }
    
    try {
      console.log(`正在执行工具: ${toolName}`, params);
      const result = await tool.handler(params);
      console.log(`工具执行完成: ${toolName}`);
      return result;
    } catch (error) {
      console.error(`工具执行失败 ${toolName}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 创建OpenClaw CLI工具
   */
  createOpenClawCliTool() {
    return {
      name: "openclaw_cli",
      description: "执行OpenClaw CLI命令，支持setup, configure, config, doctor, dashboard, reset, uninstall, message, memory, agent, agents, acp, gateway, logs, system, models, approvals, nodes, devices, node, sandbox, tui, cron, dns, docs, hooks, webhooks, pairing, plugins, channels, directory, security, skills, update, completion, status, health, sessions, browser等命令",
      parameters: {
        type: "object",
        properties: {
          command: {
            type: "string",
            description: "要执行的OpenClaw CLI命令及参数"
          }
        },
        required: ["command"]
      },
      handler: async (params) => {
        console.log(`执行 openclaw_cli 工具: ${params.command}`);
        try {
          const result = await this.cliAdapter.handleCliInstruction(params.command);
          return result;
        } catch (error) {
          console.error(`OpenClaw CLI工具执行失败:`, error);
          return {
            success: false,
            error: error.message
          };
        }
      }
    };
  }

  /**
   * 获取工具描述，用于AI理解
   */
  getToolDescriptions() {
    const descriptions = {};
    for (const [name, tool] of Object.entries(this.tools)) {
      descriptions[name] = {
        description: tool.description,
        parameters: tool.parameters
      };
    }
    return descriptions;
  }
}

module.exports = OpenClawIntegration;