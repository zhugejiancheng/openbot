/**
 * 企业微信（WeChat Work）集成模块
 * 提供企业微信机器人的消息收发、事件处理等功能
 */

const axios = require('axios');
const crypto = require('crypto');

class WeChatWorkIntegration {
  constructor(config) {
    this.corpId = config.corpId;
    this.corpSecret = config.corpSecret;
    this.agentId = config.agentId;
    this.appSecret = config.appSecret;
    this.token = config.token;
    this.encodingAESKey = config.encodingAESKey;
    
    this.accessToken = null;
    this.lastTokenRefresh = 0;
  }

  /**
   * 获取访问令牌
   */
  async getAccessToken() {
    const now = Date.now();
    // 如果令牌未过期，直接返回
    if (this.accessToken && (now - this.lastTokenRefresh) < 7200000) { // 2小时有效
      return this.accessToken;
    }

    try {
      const response = await axios.get('https://qyapi.weixin.qq.com/cgi-bin/gettoken', {
        params: {
          corpid: this.corpId,
          corpsecret: this.appSecret
        }
      });

      if (response.data.errcode === 0) {
        this.accessToken = response.data.access_token;
        this.lastTokenRefresh = now;
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
   * 发送消息到用户
   */
  async sendMessage(toUser, msgType, content, options = {}) {
    const accessToken = await this.getAccessToken();
    
    const messageData = {
      touser: toUser,
      msgtype: msgType,
      agentid: this.agentId,
      safe: options.safe || 0,
      enable_id_trans: options.enableIdTrans || 0,
      enable_duplicate_check: options.enableDuplicateCheck || 0,
      duplicate_check_interval: options.duplicateCheckInterval || 1800
    };

    // 根据消息类型设置内容
    switch (msgType) {
      case 'text':
        messageData.text = { content };
        break;
      case 'image':
        messageData.image = { media_id: content };
        break;
      case 'voice':
        messageData.voice = { media_id: content };
        break;
      case 'video':
        messageData.video = content; // { media_id, title, description }
        break;
      case 'file':
        messageData.file = { media_id: content };
        break;
      case 'textcard':
        messageData.textcard = content; // { title, description, url, btntxt }
        break;
      case 'news':
        messageData.news = content; // { articles: [{ title, description, url, picurl }] }
        break;
      case 'mpnews':
        messageData.mpnews = content; // { articles: [{ title, thumb_media_id, author, content_source_url, content, digest }] }
        break;
      default:
        throw new Error(`不支持的消息类型: ${msgType}`);
    }

    try {
      const response = await axios.post(
        `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${accessToken}`,
        messageData
      );

      if (response.data.errcode === 0) {
        return response.data;
      } else {
        throw new Error(`发送消息失败: ${response.data.errmsg}`);
      }
    } catch (error) {
      console.error('发送消息失败:', error.message);
      throw error;
    }
  }

  /**
   * 发送文本消息
   */
  async sendTextMessage(toUser, content, options = {}) {
    return await this.sendMessage(toUser, 'text', content, options);
  }

  /**
   * 发送图片消息
   */
  async sendImageMessage(toUser, mediaId, options = {}) {
    return await this.sendMessage(toUser, 'image', mediaId, options);
  }

  /**
   * 发送文件消息
   */
  async sendFileMessage(toUser, mediaId, options = {}) {
    return await this.sendMessage(toUser, 'file', mediaId, options);
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
        `https://qyapi.weixin.qq.com/cgi-bin/media/upload?access_token=${accessToken}&type=${mediaType}`,
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
  async getUserDetail(userId) {
    const accessToken = await this.getAccessToken();
    
    try {
      const response = await axios.get(
        `https://qyapi.weixin.qq.com/cgi-bin/user/get?access_token=${accessToken}&userid=${userId}`
      );

      if (response.data.errcode === 0) {
        return response.data;
      } else {
        throw new Error(`获取用户详情失败: ${response.data.errmsg}`);
      }
    } catch (error) {
      console.error('获取用户详情失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取部门成员列表
   */
  async getUserSimpleList(departmentId, fetchChild = 0) {
    const accessToken = await this.getAccessToken();
    
    try {
      const response = await axios.get(
        `https://qyapi.weixin.qq.com/cgi-bin/user/simplelist?access_token=${accessToken}&department_id=${departmentId}&fetch_child=${fetchChild}`
      );

      if (response.data.errcode === 0) {
        return response.data.userlist;
      } else {
        throw new Error(`获取部门成员列表失败: ${response.data.errmsg}`);
      }
    } catch (error) {
      console.error('获取部门成员列表失败:', error.message);
      throw error;
    }
  }

  /**
   * 处理企业微信事件回调
   */
  handleEvent(requestBody, headers) {
    // 验证消息签名
    if (!this.verifySignature(requestBody, headers)) {
      throw new Error('Invalid signature');
    }

    // 解密消息
    let decryptedMsg = requestBody;
    if (requestBody.encrypt) {
      decryptedMsg = this.decryptMessage(requestBody.encrypt);
    }

    // 解析事件类型
    const eventType = decryptedMsg.Event;
    
    switch (eventType) {
      case 'subscribe':
        return this.handleSubscribe(decryptedMsg);
      case 'unsubscribe':
        return this.handleUnsubscribe(decryptedMsg);
      case 'CLICK':
        return this.handleClick(decryptedMsg);
      case 'VIEW':
        return this.handleView(decryptedMsg);
      case 'LOCATION':
        return this.handleLocation(decryptedMsg);
      case 'scancode_push':
      case 'scancode_waitmsg':
        return this.handleScanCode(decryptedMsg);
      case 'pic_sysphoto':
      case 'pic_photo_or_album':
      case 'pic_weixin':
        return this.handlePicture(decryptedMsg);
      case 'location_select':
        return this.handleLocationSelect(decryptedMsg);
      default:
        if (decryptedMsg.MsgType === 'text') {
          return this.handleTextMessage(decryptedMsg);
        } else if (decryptedMsg.MsgType === 'image') {
          return this.handleImageMessage(decryptedMsg);
        } else if (decryptedMsg.MsgType === 'voice') {
          return this.handleVoiceMessage(decryptedMsg);
        } else if (decryptedMsg.MsgType === 'video') {
          return this.handleVideoMessage(decryptedMsg);
        } else if (decryptedMsg.MsgType === 'shortvideo') {
          return this.handleShortVideoMessage(decryptedMsg);
        } else if (decryptedMsg.MsgType === 'location') {
          return this.handleLocationMessage(decryptedMsg);
        } else if (decryptedMsg.MsgType === 'link') {
          return this.handleLinkMessage(decryptedMsg);
        } else {
          console.log(`未知消息类型: ${decryptedMsg.MsgType}`);
          return this.buildResponse('');
        }
    }
  }

  /**
   * 验证请求签名
   */
  verifySignature(requestBody, headers) {
    if (!this.token) {
      // 如果没有配置token，则跳过验证（仅用于开发环境）
      return true;
    }

    const { msg_signature, timestamp, nonce } = headers;
    
    // 验证签名
    const sortedParams = [this.token, timestamp, nonce].sort().join('');
    const expectedSignature = crypto
      .createSHA1()
      .update(sortedParams)
      .digest('hex');

    return expectedSignature === msg_signature;
  }

  /**
   * 解密消息
   */
  decryptMessage(encryptedMsg) {
    if (!this.encodingAESKey) {
      return encryptedMsg;
    }

    try {
      // 使用AES解密消息
      const aesKey = Buffer.from(this.encodingAESKey + '=', 'base64');
      const encryptedBuffer = Buffer.from(encryptedMsg, 'base64');
      
      const iv = aesKey.slice(0, 16);
      const decipher = crypto.createDecipheriv('aes-256-cbc', aesKey, iv);
      
      let decrypted = decipher.update(encryptedBuffer, undefined, 'binary');
      decrypted += decipher.final('binary');
      
      // 移除PKCS#7填充
      const pad = decrypted.charCodeAt(decrypted.length - 1);
      decrypted = decrypted.slice(0, decrypted.length - pad);
      
      // 解析XML消息
      return this.parseXml(decrypted);
    } catch (error) {
      console.error('解密消息失败:', error.message);
      throw error;
    }
  }

  /**
   * 解析XML
   */
  parseXml(xmlString) {
    // 简单的XML解析，实际实现需要使用专业的XML解析库
    const result = {};
    
    // 提取XML标签内容
    xmlString.replace(/<(\w+)>(.*?)<\/\1>/g, (match, tagName, tagContent) => {
      result[tagName] = tagContent;
    });
    
    return result;
  }

  /**
   * 构建响应消息
   */
  buildResponse(content, msgType = 'text') {
    const response = {
      xml: {
        ToUserName: '', // 填充接收方账号
        FromUserName: '', // 填充开发者账号
        CreateTime: Math.floor(Date.now() / 1000),
        MsgType: msgType
      }
    };

    if (msgType === 'text') {
      response.xml.Content = content;
    }

    return response;
  }

  /**
   * 处理文本消息
   */
  handleTextMessage(msgData) {
    return {
      success: true,
      fromUser: msgData.FromUserName,
      content: msgData.Content,
      messageId: msgData.MsgId
    };
  }

  /**
   * 处理图片消息
   */
  handleImageMessage(msgData) {
    return {
      success: true,
      fromUser: msgData.FromUserName,
      picUrl: msgData.PicUrl,
      mediaId: msgData.MediaId,
      messageId: msgData.MsgId
    };
  }

  /**
   * 处理语音消息
   */
  handleVoiceMessage(msgData) {
    return {
      success: true,
      fromUser: msgData.FromUserName,
      format: msgData.Format,
      mediaId: msgData.MediaId,
      messageId: msgData.MsgId
    };
  }

  /**
   * 处理视频消息
   */
  handleVideoMessage(msgData) {
    return {
      success: true,
      fromUser: msgData.FromUserName,
      mediaId: msgData.MediaId,
      thumbMediaId: msgData.ThumbMediaId,
      messageId: msgData.MsgId
    };
  }

  /**
   * 处理短视频消息
   */
  handleShortVideoMessage(msgData) {
    return {
      success: true,
      fromUser: msgData.FromUserName,
      mediaId: msgData.MediaId,
      thumbMediaId: msgData.ThumbMediaId,
      messageId: msgData.MsgId
    };
  }

  /**
   * 处理地理位置消息
   */
  handleLocationMessage(msgData) {
    return {
      success: true,
      fromUser: msgData.FromUserName,
      locationX: parseFloat(msgData.Location_X),
      locationY: parseFloat(msgData.Location_Y),
      scale: parseInt(msgData.Scale),
      label: msgData.Label,
      messageId: msgData.MsgId
    };
  }

  /**
   * 处理链接消息
   */
  handleLinkMessage(msgData) {
    return {
      success: true,
      fromUser: msgData.FromUserName,
      title: msgData.Title,
      description: msgData.Description,
      url: msgData.Url,
      messageId: msgData.MsgId
    };
  }

  /**
   * 处理关注事件
   */
  handleSubscribe(msgData) {
    return {
      success: true,
      fromUser: msgData.FromUserName,
      eventType: 'subscribe',
      eventKey: msgData.EventKey
    };
  }

  /**
   * 处理取消关注事件
   */
  handleUnsubscribe(msgData) {
    return {
      success: true,
      fromUser: msgData.FromUserName,
      eventType: 'unsubscribe'
    };
  }

  /**
   * 处理菜单点击事件
   */
  handleClick(msgData) {
    return {
      success: true,
      fromUser: msgData.FromUserName,
      eventType: 'CLICK',
      eventKey: msgData.EventKey
    };
  }

  /**
   * 处理菜单跳转事件
   */
  handleView(msgData) {
    return {
      success: true,
      fromUser: msgData.FromUserName,
      eventType: 'VIEW',
      eventKey: msgData.EventKey
    };
  }

  /**
   * 处理扫码事件
   */
  handleScanCode(msgData) {
    return {
      success: true,
      fromUser: msgData.FromUserName,
      eventType: msgData.Event,
      scanType: msgData.ScanCodeInfo?.ScanType,
      scanResult: msgData.ScanCodeInfo?.ScanResult
    };
  }

  /**
   * 处理图片事件
   */
  handlePicture(msgData) {
    return {
      success: true,
      fromUser: msgData.FromUserName,
      eventType: msgData.Event,
      picList: msgData.SendPicsInfo?.PicList
    };
  }

  /**
   * 处理地理位置选择事件
   */
  handleLocationSelect(msgData) {
    return {
      success: true,
      fromUser: msgData.FromUserName,
      eventType: msgData.Event,
      locationX: parseFloat(msgData.SendLocationInfo?.Location_X),
      locationY: parseFloat(msgData.SendLocationInfo?.Location_Y),
      scale: parseInt(msgData.SendLocationInfo?.Scale),
      label: msgData.SendLocationInfo?.Label,
      poiName: msgData.SendLocationInfo?.Poiname
    };
  }

  /**
   * 处理地理位置上报事件
   */
  handleLocation(msgData) {
    return {
      success: true,
      fromUser: msgData.FromUserName,
      latitude: parseFloat(msgData.Latitude),
      longitude: parseFloat(msgData.Longitude),
      precision: parseFloat(msgData.Precision)
    };
  }
}

module.exports = WeChatWorkIntegration;