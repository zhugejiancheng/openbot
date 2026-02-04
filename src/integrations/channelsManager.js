/**
 * 国产渠道集成管理器
 * 统一管理飞书、企业微信、钉钉等国产渠道
 */

const FeishuIntegration = require('./feishuIntegration');
const WeChatWorkIntegration = require('./wechatWorkIntegration');
const DingTalkIntegration = require('./dingtalkIntegration');

class ChannelsManager {
  constructor(config) {
    this.config = config || {};
    this.channels = new Map();
    
    // 初始化各个渠道
    this.initChannels();
  }

  /**
   * 初始化各个渠道
   */
  initChannels() {
    // 初始化飞书集成
    if (this.config.feishu) {
      this.channels.set('feishu', new FeishuIntegration(this.config.feishu));
      console.log('✅ 飞书集成已初始化');
    }

    // 初始化企业微信集成
    if (this.config.wechatWork) {
      this.channels.set('wechatWork', new WeChatWorkIntegration(this.config.wechatWork));
      console.log('✅ 企业微信集成已初始化');
    }

    // 初始化钉钉集成
    if (this.config.dingtalk) {
      this.channels.set('dingtalk', new DingTalkIntegration(this.config.dingtalk));
      console.log('✅ 钉钉集成已初始化');
    }
  }

  /**
   * 获取渠道实例
   */
  getChannel(channelName) {
    return this.channels.get(channelName);
  }

  /**
   * 检查渠道是否可用
   */
  isChannelAvailable(channelName) {
    return this.channels.has(channelName);
  }

  /**
   * 发送消息到指定渠道
   */
  async sendMessage(channelName, recipientId, message, options = {}) {
    if (!this.isChannelAvailable(channelName)) {
      throw new Error(`渠道 ${channelName} 未初始化或不可用`);
    }

    const channel = this.getChannel(channelName);
    
    switch (channelName) {
      case 'feishu':
        // 飞书支持不同的接收类型
        const receiveType = options.receiveType || 'user_id';
        return await channel.sendTextMessage(recipientId, message, receiveType);
        
      case 'wechatWork':
        // 企业微信发送消息
        return await channel.sendTextMessage(recipientId, message, options);
        
      case 'dingtalk':
        // 钉钉发送消息
        const atUsers = options.atUsers || [];
        const isAtAll = options.isAtAll || false;
        return await channel.sendTextMessage(message, atUsers, isAtAll);
        
      default:
        throw new Error(`不支持的渠道: ${channelName}`);
    }
  }

  /**
   * 发送富文本消息到指定渠道
   */
  async sendRichMessage(channelName, recipientId, title, content, options = {}) {
    if (!this.isChannelAvailable(channelName)) {
      throw new Error(`渠道 ${channelName} 未初始化或不可用`);
    }

    const channel = this.getChannel(channelName);
    
    switch (channelName) {
      case 'feishu':
        return await channel.sendRichTextMessage(recipientId, title, content, options.receiveType || 'user_id');
        
      case 'wechatWork':
        // 企业微信富文本消息
        const newsArticles = [{
          title: title,
          description: content,
          url: options.url || '',
          picurl: options.picUrl || ''
        }];
        return await channel.sendMessage(recipientId, 'news', { articles: newsArticles }, options);
        
      case 'dingtalk':
        // 钉钉Markdown消息
        const markdownContent = `# ${title}\n\n${content}`;
        const atUsers = options.atUsers || [];
        const isAtAll = options.isAtAll || false;
        return await channel.sendMarkdownMessage(title, content, atUsers, isAtAll);
        
      default:
        throw new Error(`不支持的渠道: ${channelName}`);
    }
  }

  /**
   * 处理来自渠道的事件
   */
  async handleChannelEvent(channelName, eventData, headers) {
    if (!this.isChannelAvailable(channelName)) {
      throw new Error(`渠道 ${channelName} 未初始化或不可用`);
    }

    const channel = this.getChannel(channelName);
    
    switch (channelName) {
      case 'feishu':
        return channel.handleEvent(eventData, headers);
        
      case 'wechatWork':
        return channel.handleEvent(eventData, headers);
        
      case 'dingtalk':
        return await channel.handleEvent(eventData, headers);
        
      default:
        throw new Error(`不支持的渠道: ${channelName}`);
    }
  }

  /**
   * 获取用户信息
   */
  async getUserInfo(channelName, userId, options = {}) {
    if (!this.isChannelAvailable(channelName)) {
      throw new Error(`渠道 ${channelName} 未初始化或不可用`);
    }

    const channel = this.getChannel(channelName);
    
    switch (channelName) {
      case 'feishu':
        return await channel.getUserInfo(userId, options.userIdType || 'user_id');
        
      case 'wechatWork':
        return await channel.getUserDetail(userId);
        
      case 'dingtalk':
        return await channel.getUserInfo(userId);
        
      default:
        throw new Error(`不支持的渠道: ${channelName}`);
    }
  }

  /**
   * 获取渠道列表
   */
  getAvailableChannels() {
    return Array.from(this.channels.keys());
  }

  /**
   * 获取渠道信息
   */
  getChannelInfo(channelName) {
    if (!this.isChannelAvailable(channelName)) {
      return null;
    }

    const channelInstance = this.getChannel(channelName);
    
    // 根据不同渠道返回相关信息
    switch (channelName) {
      case 'feishu':
        return {
          name: '飞书',
          initialized: !!channelInstance.appId,
          capabilities: ['消息发送', '事件处理', '用户信息查询']
        };
        
      case 'wechatWork':
        return {
          name: '企业微信',
          initialized: !!channelInstance.corpId,
          capabilities: ['消息发送', '事件处理', '用户信息查询', '媒体上传']
        };
        
      case 'dingtalk':
        return {
          name: '钉钉',
          initialized: !!(channelInstance.appKey || channelInstance.webhookUrl),
          capabilities: ['机器人消息', '应用消息', '事件处理', '用户信息查询']
        };
        
      default:
        return null;
    }
  }

  /**
   * 批量发送消息到多个渠道
   */
  async sendToMultipleChannels(channels, recipientId, message, options = {}) {
    const results = {};
    
    for (const channelName of channels) {
      try {
        results[channelName] = await this.sendMessage(channelName, recipientId, message, options);
      } catch (error) {
        console.error(`发送到 ${channelName} 失败:`, error.message);
        results[channelName] = { error: error.message };
      }
    }
    
    return results;
  }

  /**
   * 获取所有已初始化渠道的统计信息
   */
  getStats() {
    const stats = {
      totalChannels: this.channels.size,
      availableChannels: [],
      channelDetails: {}
    };

    for (const [channelName, channelInstance] of this.channels) {
      const info = this.getChannelInfo(channelName);
      stats.availableChannels.push(channelName);
      stats.channelDetails[channelName] = info;
    }

    return stats;
  }
}

module.exports = ChannelsManager;