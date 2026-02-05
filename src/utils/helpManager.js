/**
 * HelpManager - OpenBot帮助系统管理器
 */
class HelpManager {
  constructor() {
    this.commands = {
      general: [
        { command: 'help', description: '显示帮助信息' },
        { command: '帮助', description: '显示中文帮助信息' },
        { command: '/help', description: '显示详细帮助信息' },
        { command: '/tools', description: '显示可用工具列表' },
        { command: '/health', description: '显示系统健康状态' },
        { command: '/config', description: '显示系统配置' },
        { command: 'clear', description: '清空当前对话历史' },
        { command: '清空对话', description: '清空当前对话历史（中文）' },
        { command: 'history', description: '显示对话历史' },
        { command: '历史', description: '显示对话历史（中文）' }
      ],
      fileOperations: [
        { command: 'read', description: '读取文件内容' },
        { command: 'write', description: '写入内容到文件' },
        { command: 'edit', description: '编辑文件内容' },
        { command: 'exec', description: '执行系统命令' },
        { command: 'process', description: '管理后台进程' }
      ],
      network: [
        { command: 'web_search', description: '搜索网络' },
        { command: 'web_fetch', description: '抓取网页内容' },
        { command: 'browser', description: '控制浏览器' },
        { command: 'image', description: '分析图像' }
      ],
      dataManagement: [
        { command: 'feishu_doc', description: '飞书文档操作' },
        { command: 'feishu_wiki', description: '飞书知识库操作' },
        { command: 'feishu_drive', description: '飞书云文档操作' },
        { command: 'feishu_bitable', description: '飞书多维表格操作' }
      ],
      systemManagement: [
        { command: 'cron', description: '定时任务管理' },
        { command: 'message', description: '消息发送' },
        { command: 'memory_search', description: '搜索记忆' },
        { command: 'memory_get', description: '获取记忆片段' }
      ]
    };

    this.examples = {
      fileOperations: [
        { example: '请读取 README.md 文件', description: '读取指定文件内容' },
        { example: '创建一个名为 hello.txt 的文件，内容为 "Hello World"', description: '创建新文件' },
        { example: '将 "新的内容" 写入到 test.txt 文件中', description: '写入文件' },
        { example: '编辑 config.json 文件，将 "port" 改为 8080', description: '编辑文件' }
      ],
      systemCommands: [
        { example: '执行命令 ls -la', description: '列出当前目录内容' },
        { example: '运行 df -h 命令查看磁盘使用情况', description: '检查磁盘空间' },
        { example: '执行 ps aux 命令', description: '查看系统进程' }
      ],
      network: [
        { example: '搜索人工智能最新发展趋势', description: '搜索网络信息' },
        { example: '获取 https://example.com 页面内容', description: '抓取网页' },
        { example: '分析这张图片 [上传图片]', description: '图像分析' }
      ],
      onboard: [
        { example: '帮助', description: '获取一般帮助信息' },
        { example: '用户引导', description: '获取新用户引导信息' },
        { example: '入门帮助', description: '获取入门指导' },
        { example: 'onboard帮助', description: '获取onboard功能帮助' },
        { example: '引导帮助', description: '获取引导功能帮助' },
        { example: '新用户帮助', description: '获取新用户帮助信息' }
      ]
    };
  }

  /**
   * 获取完整帮助信息
   */
  getFullHelp() {
    return {
      title: '🤖 OpenBot 帮助中心',
      overview: 'OpenBot是一个功能强大的开源AI助手，能够执行各种任务，包括文件操作、系统命令执行、网络搜索等。通过自然语言与OpenBot交互，它可以理解和执行复杂的指令。',
      commands: this.commands,
      examples: this.examples,
      tips: [
        '您可以通过自然语言描述您的需求',
        'OpenBot会自动识别并执行相应的操作',
        '如果遇到问题，可以随时输入"帮助"获取更多信息'
      ],
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 获取特定类别的帮助信息
   */
  getCategoryHelp(category) {
    if (this.commands[category]) {
      return {
        category: category,
        commands: this.commands[category],
        timestamp: new Date().toISOString()
      };
    }
    return null;
  }

  /**
   * 获取命令描述
   */
  getCommandDescription(command) {
    for (const category in this.commands) {
      const cmd = this.commands[category].find(c => c.command === command);
      if (cmd) {
        return cmd.description;
      }
    }
    return null;
  }

  /**
   * 搜索相关命令
   */
  searchCommands(query) {
    const results = [];
    for (const category in this.commands) {
      const matches = this.commands[category].filter(cmd =>
        cmd.command.toLowerCase().includes(query.toLowerCase()) ||
        cmd.description.toLowerCase().includes(query.toLowerCase())
      );
      results.push(...matches.map(match => ({ ...match, category })));
    }
    return results;
  }

  /**
   * 获取快速帮助信息
   */
  getQuickHelp() {
    return {
      title: '快速帮助',
      quickCommands: [
        { command: 'help', description: '获取帮助信息' },
        { command: '工具列表', description: '查看可用工具' },
        { command: '系统状态', description: '查看系统健康状况' },
        { command: '读取文件 [路径]', description: '读取指定文件' },
        { command: '搜索 [关键词]', description: '搜索网络信息' },
        { command: '执行命令 [命令]', description: '执行系统命令' }
      ],
      tip: '您可以使用自然语言描述您的需求，例如："帮我读取README.md文件" 或 "搜索今天天气"'
    };
  }
}

module.exports = HelpManager;