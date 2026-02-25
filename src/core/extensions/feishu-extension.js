/**
 * Feishu 深度集成扩展
 * 提供完整的飞书功能支持
 */

const https = require('https');
const http = require('http');

class FeishuExtension {
  constructor(config = {}) {
    this.appId = config.appId || process.env.FEISHU_APP_ID;
    this.appSecret = config.appSecret || process.env.FEISHU_APP_SECRET;
    this.accessToken = null;
    this.tokenExpireTime = null;
  }

  /**
   * 获取访问令牌
   */
  async getAccessToken() {
    if (this.accessToken && this.tokenExpireTime && Date.now() < this.tokenExpireTime) {
      return this.accessToken;
    }

    return new Promise((resolve, reject) => {
      const data = JSON.stringify({
        app_id: this.appId,
        app_secret: this.appSecret
      });

      const options = {
        hostname: 'open.feishu.cn',
        port: 443,
        path: '/open-apis/auth/v3/tenant_access_token/internal',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length
        }
      };

      const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => responseData += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(responseData);
            if (result.code === 0) {
              this.accessToken = result.tenant_access_token;
              this.tokenExpireTime = Date.now() + (result.expire - 300) * 1000; // 提前 5 分钟刷新
              resolve(this.accessToken);
            } else {
              reject(new Error(`获取令牌失败：${result.msg}`));
            }
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  /**
   * 发送消息
   */
  async sendMessage(receiveId, msgType, content, receiveIdType = 'open_id') {
    const token = await this.getAccessToken();

    return new Promise((resolve, reject) => {
      const data = JSON.stringify({
        receive_id: receiveId,
        msg_type: msgType,
        content: JSON.stringify(content)
      });

      const options = {
        hostname: 'open.feishu.cn',
        port: 443,
        path: `/open-apis/im/v1/messages?receive_id_type=${receiveIdType}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length,
          'Authorization': `Bearer ${token}`
        }
      };

      const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => responseData += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(responseData);
            if (result.code === 0) {
              resolve(result);
            } else {
              reject(new Error(`发送消息失败：${result.msg}`));
            }
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  /**
   * 发送文本消息
   */
  async sendTextMessage(receiveId, text, receiveIdType = 'open_id') {
    return this.sendMessage(receiveId, 'text', { text }, receiveIdType);
  }

  /**
   * 发送富文本消息
   */
  async sendPostMessage(receiveId, elements, receiveIdType = 'open_id') {
    return this.sendMessage(receiveId, 'post', {
      post: {
        zh_cn: {
          title: '消息',
          content: [elements]
        }
      }
    }, receiveIdType);
  }

  /**
   * 发送文件
   */
  async sendFile(receiveId, fileKey, fileType = 'file', receiveIdType = 'open_id') {
    return this.sendMessage(receiveId, fileType, {
      file_key: fileKey
    }, receiveIdType);
  }

  /**
   * 上传文件
   */
  async uploadFile(filePath, fileName) {
    const token = await this.getAccessToken();
    const fs = require('fs');

    return new Promise((resolve, reject) => {
      const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
      const fileContent = fs.readFileSync(filePath);

      const body = [
        `--${boundary}`,
        'Content-Disposition: form-data; name="file"; filename="' + fileName + '"',
        'Content-Type: application/octet-stream',
        '',
        fileContent,
        `--${boundary}--`,
        ''
      ].join('\r\n');

      const options = {
        hostname: 'open.feishu.cn',
        port: 443,
        path: '/open-apis/im/v1/images',
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': Buffer.byteLength(body),
          'Authorization': `Bearer ${token}`
        }
      };

      const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => responseData += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(responseData);
            if (result.code === 0) {
              resolve(result);
            } else {
              reject(new Error(`上传文件失败：${result.msg}`));
            }
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }

  /**
   * 获取用户信息
   */
  async getUserInfo(userId, userIdType = 'open_id') {
    const token = await this.getAccessToken();

    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'open.feishu.cn',
        port: 443,
        path: `/open-apis/contact/v3/users/${userIdType === 'open_id' ? userId : ':' + userId}`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => responseData += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(responseData);
            if (result.code === 0) {
              resolve(result.data);
            } else {
              reject(new Error(`获取用户信息失败：${result.msg}`));
            }
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }

  /**
   * 获取机器人信息
   */
  async getBotInfo() {
    const token = await this.getAccessToken();

    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'open.feishu.cn',
        port: 443,
        path: '/open-apis/auth/v3/app_access_token',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => responseData += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(responseData);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }
}

module.exports = FeishuExtension;
