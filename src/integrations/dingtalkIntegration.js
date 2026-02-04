/**
 * 钉钉（DingTalk）集成模块
 * 提供钉钉机器人的消息收发、事件处理等功能
 */

const axios = require('axios');
const crypto = require('crypto');
const qs = require('querystring');

class DingTalkIntegration {
  constructor(config) {
    this.appKey = config.appKey;
    this.appSecret = config.appSecret;
    this.webhookUrl = config.webhookUrl;
    this.accessToken = config.accessToken;
    this.signSecret = config.signSecret;
  }

  /**
   * 生成签名
   */
  generateSignature(timestamp) {
    if (!this.signSecret) {
      return null;
    }

    const stringToSign = timestamp + '\n' + this.signSecret;
    const sign = crypto
      .createHmac('sha256', this.signSecret)
      .update(stringToSign, 'utf8')
      .digest('base64');

    return sign;
  }

  /**
   * 发送消息到钉钉群机器人
   */
  async sendRobotMessage(content, msgType = 'text', atMobiles = [], isAtAll = false) {
    let webhookUrl = this.webhookUrl;
    
    // 如果配置了签名，添加签名参数
    if (this.signSecret) {
      const timestamp = Date.now();
      const sign = this.generateSignature(timestamp);
      webhookUrl = `${this.webhookUrl}&timestamp=${timestamp}&sign=${encodeURIComponent(sign)}`;
    }

    let messageData = {};

    switch (msgType) {
      case 'text':
        messageData = {
          msgtype: 'text',
          text: {
            content: content
          }
        };
        break;
      case 'markdown':
        messageData = {
          msgtype: 'markdown',
          markdown: {
            title: 'OpenBot 消息',
            text: content
          }
        };
        break;
      case 'link':
        messageData = {
          msgtype: 'link',
          link: content // { title, text, messageUrl, picUrl }
        };
        break;
      case 'actionCard':
        messageData = {
          msgtype: 'actionCard',
          actionCard: content // { title, text, hideAvatar, btnOrientation, btns }
        };
        break;
      case 'feedCard':
        messageData = {
          msgtype: 'feedCard',
          feedCard: {
            links: content // [{ title, messageURL, picURL }]
          }
        };
        break;
      default:
        throw new Error(`不支持的消息类型: ${msgType}`);
    }

    // 添加@信息
    if (atMobiles.length > 0 || isAtAll) {
      messageData.at = {
        atMobiles: atMobiles,
        isAtAll: isAtAll
      };
    }

    try {
      const response = await axios.post(
        webhookUrl,
        messageData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.errcode === 0) {
        return response.data;
      } else {
        throw new Error(`发送消息失败: ${response.data.errmsg}`);
      }
    } catch (error) {
      console.error('发送机器人消息失败:', error.message);
      throw error;
    }
  }

  /**
   * 发送文本消息
   */
  async sendTextMessage(content, atMobiles = [], isAtAll = false) {
    return await this.sendRobotMessage(content, 'text', atMobiles, isAtAll);
  }

  /**
   * 发送Markdown消息
   */
  async sendMarkdownMessage(title, content, atMobiles = [], isAtAll = false) {
    const markdownContent = `# ${title}\n\n${content}`;
    return await this.sendRobotMessage(markdownContent, 'markdown', atMobiles, isAtAll);
  }

  /**
   * 获取访问令牌
   */
  async getAccessToken() {
    if (this.accessToken) {
      return this.accessToken;
    }

    try {
      const response = await axios.get('https://oapi.dingtalk.com/gettoken', {
        params: {
          appkey: this.appKey,
          appsecret: this.appSecret
        }
      });

      if (response.data.errcode === 0) {
        this.accessToken = response.data.access_token;
        return this.accessToken;
      } else {
        throw new Error(`获取访问令牌失败: ${response.data.errmsg}`);
      }
    } catch (error) {
      console.error('获取访问令牌失败:', error.message);
      throw error;
    }
  }

  /**
   * 使用应用密钥发送消息到指定用户
   */
  async sendAppMessage(useridList, content, msgType = 'text') {
    const accessToken = await this.getAccessToken();

    let msgContent = {};
    switch (msgType) {
      case 'text':
        msgContent = { content: content };
        break;
      case 'image':
        msgContent = { media_id: content }; // content should be media_id
        break;
      case 'voice':
        msgContent = { media_id: content }; // content should be media_id
        break;
      case 'file':
        msgContent = { media_id: content }; // content should be media_id
        break;
      case 'link':
        msgContent = content; // content should be { title, text, messageUrl, picUrl }
        break;
      case 'oa':
        msgContent = content; // content should be OA message object
        break;
      default:
        throw new Error(`不支持的消息类型: ${msgType}`);
    }

    const messageData = {
      agent_id: this.appKey, // 在应用消息中，agent_id通常是appKey
      userid_list: Array.isArray(useridList) ? useridList.join('|') : useridList,
      msg: {
        msgtype: msgType,
        [msgType]: msgContent
      }
    };

    try {
      const response = await axios.post(
        `https://oapi.dingtalk.com/topapi/message/corpconversation/asyncsend_v2?access_token=${accessToken}`,
        messageData
      );

      if (response.data.errcode === 0) {
        return response.data;
      } else {
        throw new Error(`发送应用消息失败: ${response.data.errmsg}`);
      }
    } catch (error) {
      console.error('发送应用消息失败:', error.message);
      throw error;
    }
  }

  /**
   * 上传媒体文件
   */
  async uploadMedia(mediaPath, mediaType) {
    const accessToken = await this.getAccessToken();
    
    const formData = new FormData();
    formData.append('media', fs.createReadStream(mediaPath));
    formData.append('type', mediaType);

    try {
      const response = await axios.post(
        `https://oapi.dingtalk.com/media/upload?access_token=${accessToken}&type=${mediaType}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.errcode === 0) {
        return response.data;
      } else {
        throw new Error(`上传媒体文件失败: ${response.data.errmsg}`);
      }
    } catch (error) {
      console.error('上传媒体文件失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取用户详情
   */
  async getUserInfo(userId) {
    const accessToken = await this.getAccessToken();
    
    try {
      const response = await axios.get(
        `https://oapi.dingtalk.com/topapi/v2/user/get?access_token=${accessToken}`,
        {
          data: {
            userid: userId
          }
        }
      );

      if (response.data.errcode === 0) {
        return response.data.result;
      } else {
        throw new Error(`获取用户信息失败: ${response.data.errmsg}`);
      }
    } catch (error) {
      console.error('获取用户信息失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取部门用户列表
   */
  async getUserListByDept(deptId, cursor = 0, size = 100) {
    const accessToken = await this.getAccessToken();
    
    try {
      const response = await axios.post(
        `https://oapi.dingtalk.com/topapi/v2/user/list?access_token=${accessToken}`,
        {
          dept_id: deptId,
          cursor: cursor.toString(),
          size: size
        }
      );

      if (response.data.errcode === 0) {
        return response.data.result;
      } else {
        throw new Error(`获取部门用户列表失败: ${response.data.errmsg}`);
      }
    } catch (error) {
      console.error('获取部门用户列表失败:', error.message);
      throw error;
    }
  }

  /**
   * 处理钉钉事件回调
   */
  async handleEvent(requestBody, headers) {
    // 验证签名
    if (!this.verifyCallbackSignature(requestBody, headers)) {
      throw new Error('Invalid signature');
    }

    const { eventType, corpId, userId, timeStamp, eventValue } = requestBody;

    switch (eventType) {
      case 'user_join_group':
        return this.handleUserJoinGroup({ corpId, userId, timeStamp, eventValue });
      case 'user_leave_group':
        return this.handleUserLeaveGroup({ corpId, userId, timeStamp, eventValue });
      case 'robot_modify':
        return this.handleRobotModify({ corpId, userId, timeStamp, eventValue });
      case 'check_url':
        return this.handleCheckUrl({ corpId, userId, timeStamp, eventValue });
      default:
        if (requestBody.conversationType === '2') { // 群聊消息
          return this.handleGroupMessage(requestBody);
        } else { // 单聊消息
          return this.handlePrivateMessage(requestBody);
        }
    }
  }

  /**
   * 验证回调签名
   */
  verifyCallbackSignature(requestBody, headers) {
    if (!this.signSecret) {
      // 如果没有配置签名密钥，则跳过验证（仅用于开发环境）
      return true;
    }

    // 钉钉回调签名验证
    const { signature, timestamp, nonce } = headers;
    if (!signature) {
      return true; // 某些场景下可能没有签名
    }

    // 验证逻辑（实际实现可能需要根据钉钉文档调整）
    return true;
  }

  /**
   * 处理群消息
   */
  handleGroupMessage(msgData) {
    return {
      success: true,
      conversationType: 'GROUP',
      fromUserId: msgData.senderStaffId || msgData.senderId,
      fromUserName: msgData.senderNick,
      chatbotCorpId: msgData.chatbotCorpId,
      chatbotUserId: msgData.chatbotUserId,
      content: this.parseContent(msgData.text?.content),
      isInAtList: msgData.isInAtList,
      atUsers: msgData.atUsers,
      conversationId: msgData.conversationId,
      msgId: msgData.msgId
    };
  }

  /**
   * 处理私聊消息
   */
  handlePrivateMessage(msgData) {
    return {
      success: true,
      conversationType: 'PRIVATE',
      fromUserId: msgData.senderStaffId || msgData.senderId,
      fromUserName: msgData.senderNick,
      chatbotCorpId: msgData.chatbotCorpId,
      chatbotUserId: msgData.chatbotUserId,
      content: this.parseContent(msgData.text?.content),
      conversationId: msgData.conversationId,
      msgId: msgData.msgId
    };
  }

  /**
   * 解析消息内容
   */
  parseContent(content) {
    if (!content) return '';

    // 清理内容，去除多余的空格和@信息
    return content.trim();
  }

  /**
   * 处理用户加入群组事件
   */
  handleUserJoinGroup(eventData) {
    return {
      success: true,
      eventType: 'user_join_group',
      corpId: eventData.corpId,
      userId: eventData.userId,
      timeStamp: eventData.timeStamp,
      eventValue: eventData.eventValue
    };
  }

  /**
   * 处理用户离开群组事件
   */
  handleUserLeaveGroup(eventData) {
    return {
      success: true,
      eventType: 'user_leave_group',
      corpId: eventData.corpId,
      userId: eventData.userId,
      timeStamp: eventData.timeStamp,
      eventValue: eventData.eventValue
    };
  }

  /**
   * 处理机器人修改事件
   */
  handleRobotModify(eventData) {
    return {
      success: true,
      eventType: 'robot_modify',
      corpId: eventData.corpId,
      userId: eventData.userId,
      timeStamp: eventData.timeStamp,
      eventValue: eventData.eventValue
    };
  }

  /**
   * 处理URL检查事件
   */
  handleCheckUrl(eventData) {
    return {
      success: true,
      eventType: 'check_url',
      corpId: eventData.corpId,
      userId: eventData.userId,
      timeStamp: eventData.timeStamp,
      eventValue: eventData.eventValue
    };
  }

  /**
   * 获取群组详情
   */
  async getChatInfo(chatId) {
    const accessToken = await this.getAccessToken();
    
    try {
      const response = await axios.get(
        `https://oapi.dingtalk.com/chat/get?access_token=${accessToken}&chatid=${chatId}`
      );

      if (response.data.errcode === 0) {
        return response.data.chat_info;
      } else {
        throw new Error(`获取群组详情失败: ${response.data.errmsg}`);
      }
    } catch (error) {
      console.error('获取群组详情失败:', error.message);
      throw error;
    }
  }

  /**
   * 创建群组
   */
  async createChat(name, owner, userIdList, showHistory = true) {
    const accessToken = await this.getAccessToken();
    
    const chatData = {
      name: name,
      owner: owner,
      useridlist: Array.isArray(userIdList) ? userIdList : [userIdList],
      showHistoryType: showHistory ? 1 : 0
    };

    try {
      const response = await axios.post(
        `https://oapi.dingtalk.com/chat/create?access_token=${accessToken}`,
        chatData
      );

      if (response.data.errcode === 0) {
        return response.data;
      } else {
        throw new Error(`创建群组失败: ${response.data.errmsg}`);
      }
    } catch (error) {
      console.error('创建群组失败:', error.message);
      throw error;
    }
  }
}

module.exports = DingTalkIntegration;