/**
 * 飞书（Lark/Feishu）集成模块
 * 提供飞书机器人的消息收发、事件处理等功能
 */

const axios = require('axios');
const crypto = require('crypto');

class FeishuIntegration {
  constructor(config) {
    this.appId = config.appId;
    this.appSecret = config.appSecret;
    this.verificationToken = config.verificationToken;
    this.baseUrl = config.baseUrl || 'https://open.feishu.cn/open-apis';
    
    // 初始化认证信息
    this.accessToken = null;
    this.tenantAccessToken = null;
    this.lastTokenRefresh = 0;
  }

  /**
   * 获取租户访问令牌
   */
  async getTenantAccessToken() {
    const now = Date.now();
    // 如果令牌未过期，直接返回
    if (this.tenantAccessToken && (now - this.lastTokenRefresh) < 1200000) { // 20分钟内有效
      return this.tenantAccessToken;
    }

    try {
      const response = await axios.post(`${this.baseUrl}/auth/v3/tenant_access_token/internal/`, {
        app_id: this.appId,
        app_secret: this.appSecret
      });

      this.tenantAccessToken = response.data.tenant_access_token;
      this.lastTokenRefresh = now;
      
      return this.tenantAccessToken;
    } catch (error) {
      console.error('获取租户访问令牌失败:', error.message);
      throw error;
    }
  }

  /**
   * 发送文本消息到指定用户或群组
   */
  async sendMessage(receiverId, msgType, content, receiveType = 'user_id') {
    const accessToken = await this.getTenantAccessToken();
    
    const messageData = {
      msg_type: msgType,
      content: JSON.stringify(content),
      [receiveType]: receiverId
    };

    try {
      const response = await axios.post(
        `${this.baseUrl}/im/v1/messages?receive_id_type=${receiveType}`,
        messageData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('发送消息失败:', error.message);
      throw error;
    }
  }

  /**
   * 发送文本消息
   */
  async sendTextMessage(userId, text, receiveType = 'user_id') {
    const content = { text };
    return await this.sendMessage(userId, 'text', content, receiveType);
  }

  /**
   * 发送富文本消息
   */
  async sendRichTextMessage(userId, title, content, receiveType = 'user_id') {
    const messageContent = {
      rich_text: [
        [{
          tag: 'text',
          text: content
        }]
      ],
      title: title
    };
    
    return await this.sendMessage(userId, 'post', messageContent, receiveType);
  }

  /**
   * 获取用户信息
   */
  async getUserInfo(userId, userIdType = 'user_id') {
    const accessToken = await this.getTenantAccessToken();
    
    try {
      const response = await axios.get(
        `${this.baseUrl}/contact/v3/users/${userId}?user_id_type=${userIdType}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      return response.data.data.user;
    } catch (error) {
      console.error('获取用户信息失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取群组列表
   */
  async getChatList(pageSize = 20) {
    const accessToken = await this.getTenantAccessToken();
    
    try {
      const response = await axios.get(
        `${this.baseUrl}/im/v1/chats`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          },
          params: {
            page_size: pageSize
          }
        }
      );

      return response.data.data;
    } catch (error) {
      console.error('获取群组列表失败:', error.message);
      throw error;
    }
  }

  /**
   * 处理飞书事件回调
   */
  handleEvent(requestBody, headers) {
    // 验证签名
    if (!this.verifySignature(requestBody, headers)) {
      throw new Error('Invalid signature');
    }

    const { header, event } = requestBody;
    
    switch (header.event_type) {
      case 'im.message.receive_v1':
        return this.handleMessageReceive(event);
      case 'im.chat.member.bot.added_v1':
        return this.handleBotAdded(event);
      case 'im.chat.member.bot.deleted_v1':
        return this.handleBotRemoved(event);
      default:
        console.log(`未知事件类型: ${header.event_type}`);
        return { code: 0, message: 'Success' };
    }
  }

  /**
   * 验证请求签名
   */
  verifySignature(requestBody, headers) {
    if (!this.verificationToken) {
      // 如果没有配置验证令牌，则跳过验证（仅用于开发环境）
      return true;
    }

    const { signature, timestamp, nonce } = headers;
    
    if (!signature) {
      return this.verificationToken === requestBody.token;
    }

    // 实现签名验证逻辑
    const signStr = `${timestamp}${nonce}${JSON.stringify(requestBody)}`;
    const expectedSign = crypto
      .createHmac('sha256', this.appSecret)
      .update(signStr)
      .digest('base64');

    return expectedSign === signature;
  }

  /**
   * 处理消息接收事件
   */
  async handleMessageReceive(event) {
    const { sender, message } = event;
    
    // 解析消息内容
    const messageContent = this.parseMessageContent(message);
    
    // 返回成功的响应
    return {
      success: true,
      sender: sender.sender_id.user_id,
      content: messageContent,
      message_id: message.message_id
    };
  }

  /**
   * 解析消息内容
   */
  parseMessageContent(message) {
    const content = JSON.parse(message.content);
    
    switch (message.msg_type) {
      case 'text':
        return content.text;
      case 'image':
        return `[图片消息] ${content.image_key}`;
      case 'audio':
        return `[语音消息] ${content.file_key}`;
      case 'media':
        return `[视频/文件消息] ${content.file_key}`;
      case 'file':
        return `[文件消息] ${content.file_key}`;
      case 'sticker':
        return `[表情消息] ${content.file_key}`;
      case 'post':
        // 富文本消息解析
        return this.parseRichText(content.post);
      default:
        return `不支持的消息类型: ${message.msg_type}`;
    }
  }

  /**
   * 解析富文本内容
   */
  parseRichText(postContent) {
    let text = '';
    
    // 遍历不同语言的富文本内容
    for (const lang in postContent) {
      const contentBlocks = postContent[lang];
      
      for (const block of contentBlocks) {
        for (const item of block) {
          switch (item.tag) {
            case 'text':
              text += item.text;
              break;
            case 'a':
              text += `[${item.text}](${item.href})`;
              break;
            case 'at':
              text += `@${item.display_text}`;
              break;
            case 'img':
              text += `[图片:${item.image_key}]`;
              break;
            default:
              text += `[${item.tag}]`;
          }
        }
        text += '\n';
      }
    }
    
    return text.trim();
  }

  /**
   * 处理机器人被添加到群聊事件
   */
  handleBotAdded(event) {
    console.log(`机器人被添加到群聊: ${event.chat_id}`);
    return { code: 0, message: 'Success' };
  }

  /**
   * 处理机器人被移出群聊事件
   */
  handleBotRemoved(event) {
    console.log(`机器人被移出群聊: ${event.chat_id}`);
    return { code: 0, message: 'Success' };
  }

  /**
   * 获取机器人信息
   */
  async getBotInfo() {
    const accessToken = await this.getTenantAccessToken();
    
    try {
      const response = await axios.get(
        `${this.baseUrl}/bot/v3/info/`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('获取机器人信息失败:', error.message);
      throw error;
    }
  }

  /**
   * 回复消息
   */
  async replyMessage(messageId, content, msgType = 'text') {
    const accessToken = await this.getTenantAccessToken();
    
    const messageData = {
      msg_type: msgType,
      content: JSON.stringify(msgType === 'text' ? { text: content } : content),
      reply_in_thread: false
    };

    try {
      const response = await axios.post(
        `${this.baseUrl}/im/v1/messages/${messageId}/reply`,
        messageData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('回复消息失败:', error.message);
      throw error;
    }
  }
}

module.exports = FeishuIntegration;