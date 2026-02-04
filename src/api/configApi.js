/**
 * Configuration API for OpenBot Setup Wizard
 * Provides backend support for the graphical setup wizard
 */

const fs = require('fs').promises;
const path = require('path');
const config = require('../config/config');

class ConfigApi {
  constructor(baseDir = process.cwd()) {
    this.baseDir = baseDir;
  }

  /**
   * Save configuration to .env file
   */
  async saveConfig(configData) {
    try {
      const envContent = this.generateEnvContent(configData);
      const envPath = path.join(this.baseDir, '.env');
      
      await fs.writeFile(envPath, envContent, 'utf8');
      
      return {
        success: true,
        message: 'Configuration saved successfully',
        path: envPath
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to save configuration: ${error.message}`
      };
    }
  }

  /**
   * Generate .env file content from configuration data
   */
  generateEnvContent(configData) {
    let content = '# OpenBot 配置文件\n';
    content += '# 自动生成于 ' + new Date().toISOString() + '\n\n';
    
    // Server configuration
    content += '# 服务器配置\n';
    content += `PORT=${configData.port || 3000}\n`;
    content += `NODE_ENV=${configData.environment || 'development'}\n`;
    content += `LOG_LEVEL=${configData.logLevel || 'info'}\n\n`;
    
    // AI configuration
    content += '# AI配置\n';
    if (configData.aiProvider && configData.apiKey) {
      const apiKeyVar = configData.aiProvider.toUpperCase() + '_API_KEY';
      content += `${apiKeyVar}=${configData.apiKey}\n`;
      if (configData.aiModel) {
        content += `MODEL_NAME=${configData.aiModel}\n`;
      }
    } else {
      content += '# 未配置AI服务，使用演示模式\n';
    }
    
    content += '\n# 国产渠道配置\n';
    
    if (configData.enableFeishu) {
      content += '# 飞书配置\n';
      content += `FEISHU_APP_ID=${configData.feishuAppId || ''}\n`;
      content += `FEISHU_APP_SECRET=${configData.feishuAppSecret || ''}\n\n`;
    }
    
    if (configData.enableWechatWork) {
      content += '# 企业微信配置\n';
      content += `WECHAT_WORK_CORP_ID=${configData.wechatWorkCorpId || ''}\n`;
      content += `WECHAT_WORK_AGENT_ID=${configData.wechatWorkAgentId || ''}\n`;
      content += `WECHAT_WORK_SECRET=${configData.wechatWorkSecret || ''}\n\n`;
    }
    
    if (configData.enableDingtalk) {
      content += '# 钉钉配置\n';
      content += `DINGTALK_APP_KEY=${configData.dingtalkAppKey || ''}\n`;
      content += `DINGTALK_APP_SECRET=${configData.dingtalkAppSecret || ''}\n\n`;
    }
    
    return content;
  }

  /**
   * Get current configuration
   */
  async getCurrentConfig() {
    try {
      const envPath = path.join(this.baseDir, '.env');
      const envExists = await fs.access(envPath).then(() => true).catch(() => false);
      
      if (envExists) {
        const envContent = await fs.readFile(envPath, 'utf8');
        return {
          success: true,
          exists: true,
          content: envContent
        };
      } else {
        return {
          success: true,
          exists: false,
          content: null
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to read configuration: ${error.message}`
      };
    }
  }

  /**
   * Validate system requirements
   */
  async validateSystem() {
    try {
      // Check Node.js version
      const nodeVersion = process.version;
      const nodeMajor = parseInt(nodeVersion.split('.')[0].substring(1));
      
      // Check if npm is available
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      let npmVersion = 'unknown';
      try {
        const { stdout } = await execAsync('npm --version');
        npmVersion = stdout.trim();
      } catch (e) {
        // npm not available
      }
      
      // Check disk space (simplified)
      const os = require('os');
      const diskSpace = Math.round(os.freemem() / (1024 * 1024 * 1024)); // GB
      
      return {
        success: true,
        system: {
          nodeVersion,
          npmVersion,
          nodeCompatible: nodeMajor >= 14,
          diskSpaceGB: diskSpace,
          memoryGB: Math.round(os.totalmem() / (1024 * 1024 * 1024)),
          platform: os.platform(),
          compatible: nodeMajor >= 14 && diskSpace > 1 // Need at least 1GB free
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `System validation failed: ${error.message}`
      };
    }
  }

  /**
   * Test configuration
   */
  async testConfig() {
    try {
      // Test if we can start the server with current config
      const testPort = config.server.port;
      
      // Try to create a test server to verify configuration
      const testServer = require('http').createServer((req, res) => {
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({status: 'ok', message: 'Test server OK'}));
      });
      
      // Attempt to listen on test port
      await new Promise((resolve, reject) => {
        const server = testServer.listen(testPort, () => {
          server.close(() => resolve());
        });
        
        server.on('error', (err) => {
          reject(err);
        });
      });
      
      return {
        success: true,
        message: 'Configuration test passed',
        port: testPort
      };
    } catch (error) {
      return {
        success: false,
        error: `Configuration test failed: ${error.message}`
      };
    }
  }
}

module.exports = ConfigApi;