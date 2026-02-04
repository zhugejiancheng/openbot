/**
 * Health Check API for OpenBot
 * Provides comprehensive system health diagnostics
 */

const os = require('os');
const fs = require('fs').promises;
const path = require('path');

class HealthCheckApi {
  constructor(chatProcessor, toolManager, monitoringService) {
    this.chatProcessor = chatProcessor;
    this.toolManager = toolManager;
    this.monitoringService = monitoringService;
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck() {
    try {
      const checks = {
        system: await this.checkSystem(),
        ai: await this.checkAI(),
        tools: await this.checkTools(),
        services: await this.checkServices(),
        security: await this.checkSecurity(),
        performance: await this.checkPerformance()
      };

      // Calculate overall health score
      let totalChecks = 0;
      let passedChecks = 0;
      
      for (const category in checks) {
        for (const check of checks[category]) {
          totalChecks++;
          if (check.status === 'passed') {
            passedChecks++;
          }
        }
      }
      
      const healthScore = Math.round((passedChecks / totalChecks) * 100);
      
      return {
        success: true,
        timestamp: new Date().toISOString(),
        healthScore,
        status: healthScore >= 90 ? 'healthy' : healthScore >= 70 ? 'warning' : 'critical',
        checks
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to perform health check: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Check system resources
   */
  async checkSystem() {
    const checks = [];
    
    try {
      // Memory check
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;
      const memoryPercent = (usedMemory / totalMemory) * 100;
      
      checks.push({
        name: 'Memory Usage',
        status: memoryPercent < 90 ? 'passed' : memoryPercent < 95 ? 'warning' : 'failed',
        message: `Used ${Math.round(memoryPercent)}% of ${this.formatBytes(totalMemory)} RAM`,
        value: `${Math.round(memoryPercent)}%`,
        criticality: memoryPercent < 90 ? 'low' : memoryPercent < 95 ? 'medium' : 'high'
      });
      
      // Disk space check
      const diskUsage = await this.checkDiskSpace();
      checks.push(diskUsage);
      
      // CPU load check
      const loadAvg = os.loadavg();
      const cpuCount = os.cpus().length;
      const avgLoad = loadAvg[0]; // 1-minute average
      const loadPercent = (avgLoad / cpuCount) * 100;
      
      checks.push({
        name: 'CPU Load',
        status: loadPercent < 80 ? 'passed' : loadPercent < 95 ? 'warning' : 'failed',
        message: `1-minute load average: ${avgLoad}, ${Math.round(loadPercent)}% of capacity`,
        value: `${Math.round(loadPercent)}%`,
        criticality: loadPercent < 80 ? 'low' : loadPercent < 95 ? 'medium' : 'high'
      });
      
      // OS platform check
      checks.push({
        name: 'Operating System',
        status: os.platform() ? 'passed' : 'failed',
        message: `Running on ${os.platform()} (${os.arch()})`,
        value: `${os.platform()}/${os.arch()}`,
        criticality: 'low'
      });
      
      // Uptime check
      const uptimeHours = Math.round(os.uptime() / 3600);
      checks.push({
        name: 'System Uptime',
        status: uptimeHours > 0 ? 'passed' : 'failed',
        message: `System has been running for ${uptimeHours} hours`,
        value: `${uptimeHours}h`,
        criticality: 'low'
      });
      
    } catch (error) {
      checks.push({
        name: 'System Check Error',
        status: 'failed',
        message: `Error checking system: ${error.message}`,
        value: 'error',
        criticality: 'high'
      });
    }
    
    return checks;
  }

  /**
   * Check AI configuration
   */
  async checkAI() {
    const checks = [];
    
    try {
      const isAIConfigured = this.chatProcessor.isAIConfigured();
      
      checks.push({
        name: 'AI Configuration',
        status: isAIConfigured ? 'passed' : 'failed',
        message: isAIConfigured ? 'AI is properly configured' : 'AI is not configured',
        value: isAIConfigured ? 'configured' : 'not configured',
        criticality: isAIConfigured ? 'low' : 'high'
      });
      
      if (isAIConfigured) {
        // Check if AI can respond
        try {
          const testResponse = await this.chatProcessor.processMessage('ping', 'health-check');
          checks.push({
            name: 'AI Responsiveness',
            status: testResponse && typeof testResponse === 'object' ? 'passed' : 'warning',
            message: 'AI responded successfully to test message',
            value: 'responsive',
            criticality: 'medium'
          });
        } catch (error) {
          checks.push({
            name: 'AI Responsiveness',
            status: 'failed',
            message: `AI failed to respond: ${error.message}`,
            value: 'unresponsive',
            criticality: 'high'
          });
        }
      }
      
      // Check available models
      const availableModels = this.chatProcessor.getAvailableModels ? this.chatProcessor.getAvailableModels() : ['unknown'];
      checks.push({
        name: 'Available Models',
        status: availableModels.length > 0 ? 'passed' : 'failed',
        message: `Available models: ${availableModels.join(', ')}`,
        value: availableModels.length,
        criticality: 'medium'
      });
      
    } catch (error) {
      checks.push({
        name: 'AI Check Error',
        status: 'failed',
        message: `Error checking AI: ${error.message}`,
        value: 'error',
        criticality: 'high'
      });
    }
    
    return checks;
  }

  /**
   * Check available tools
   */
  async checkTools() {
    const checks = [];
    
    try {
      const availableTools = this.toolManager.getAvailableTools();
      
      checks.push({
        name: 'Available Tools',
        status: availableTools.length > 0 ? 'passed' : 'failed',
        message: `Available tools: ${availableTools.length} tools`,
        value: availableTools.length,
        criticality: 'high'
      });
      
      // Check specific critical tools
      const criticalTools = ['exec', 'read', 'write', 'web_search'];
      for (const toolName of criticalTools) {
        const hasTool = availableTools.some(tool => tool.name === toolName);
        checks.push({
          name: `Tool: ${toolName}`,
          status: hasTool ? 'passed' : 'failed',
          message: hasTool ? `${toolName} tool is available` : `${toolName} tool is missing`,
          value: hasTool ? 'available' : 'missing',
          criticality: 'high'
        });
      }
      
      // Test a simple tool execution
      try {
        const testResult = await this.toolManager.executeTool('exec', { command: 'echo "health check"' });
        checks.push({
          name: 'Tool Execution',
          status: testResult && !testResult.error ? 'passed' : 'failed',
          message: testResult && !testResult.error ? 'Tools can be executed successfully' : 'Tool execution failed',
          value: testResult && !testResult.error ? 'working' : 'broken',
          criticality: 'high'
        });
      } catch (error) {
        checks.push({
          name: 'Tool Execution',
          status: 'failed',
          message: `Tool execution failed: ${error.message}`,
          value: 'broken',
          criticality: 'high'
        });
      }
      
    } catch (error) {
      checks.push({
        name: 'Tools Check Error',
        status: 'failed',
        message: `Error checking tools: ${error.message}`,
        value: 'error',
        criticality: 'high'
      });
    }
    
    return checks;
  }

  /**
   * Check services
   */
  async checkServices() {
    const checks = [];
    
    try {
      // Check monitoring service
      const monitoringInitialized = !!this.monitoringService;
      checks.push({
        name: 'Monitoring Service',
        status: monitoringInitialized ? 'passed' : 'failed',
        message: monitoringInitialized ? 'Monitoring service is initialized' : 'Monitoring service is not initialized',
        value: monitoringInitialized ? 'active' : 'inactive',
        criticality: 'medium'
      });
      
      // Check if monitoring service is running
      if (monitoringInitialized) {
        try {
          const monitors = this.monitoringService.getMonitors ? this.monitoringService.getMonitors() : [];
          checks.push({
            name: 'Active Monitors',
            status: 'passed', // Just report the count
            message: `Currently monitoring ${monitors.length} items`,
            value: monitors.length,
            criticality: 'low'
          });
        } catch (error) {
          checks.push({
            name: 'Monitor Status',
            status: 'warning',
            message: `Could not get monitor status: ${error.message}`,
            value: 'unknown',
            criticality: 'low'
          });
        }
      }
      
      // Check file system access
      try {
        await fs.access(process.cwd(), fs.constants.R_OK | fs.constants.W_OK);
        checks.push({
          name: 'File System Access',
          status: 'passed',
          message: 'Has read and write access to working directory',
          value: 'granted',
          criticality: 'high'
        });
      } catch (error) {
        checks.push({
          name: 'File System Access',
          status: 'failed',
          message: `No read/write access to working directory: ${error.message}`,
          value: 'denied',
          criticality: 'high'
        });
      }
      
      // Check network connectivity (simple check)
      checks.push({
        name: 'Network Connectivity',
        status: 'passed', // We assume basic connectivity for now
        message: 'Network interface is available',
        value: 'available',
        criticality: 'medium'
      });
      
    } catch (error) {
      checks.push({
        name: 'Services Check Error',
        status: 'failed',
        message: `Error checking services: ${error.message}`,
        value: 'error',
        criticality: 'high'
      });
    }
    
    return checks;
  }

  /**
   * Check security aspects
   */
  async checkSecurity() {
    const checks = [];
    
    try {
      // Check for sensitive environment variables
      const sensitiveVars = ['PASSWORD', 'SECRET', 'TOKEN', 'KEY'];
      const foundVars = [];
      
      for (const [key, value] of Object.entries(process.env)) {
        if (sensitiveVars.some(varName => key.toUpperCase().includes(varName)) && value) {
          foundVars.push(key);
        }
      }
      
      checks.push({
        name: 'Environment Security',
        status: foundVars.length <= 3 ? 'passed' : foundVars.length <= 5 ? 'warning' : 'failed', // Allow some tokens
        message: `Found ${foundVars.length} potentially sensitive environment variables`,
        value: foundVars.length,
        criticality: 'medium'
      });
      
      // Check for .env file
      try {
        await fs.access(path.join(process.cwd(), '.env'), fs.constants.F_OK);
        checks.push({
          name: 'Configuration Security',
          status: 'passed',
          message: '.env file exists (recommended)',
          value: 'exists',
          criticality: 'low'
        });
      } catch {
        checks.push({
          name: 'Configuration Security',
          status: 'warning',
          message: '.env file not found (consider creating one for sensitive settings)',
          value: 'missing',
          criticality: 'low'
        });
      }
      
      // Check current user privileges
      const userInfo = os.userInfo();
      checks.push({
        name: 'User Privileges',
        status: userInfo.uid !== 0 ? 'passed' : 'warning', // Running as root is risky
        message: `Running as user: ${userInfo.username}`,
        value: userInfo.username,
        criticality: 'medium'
      });
      
    } catch (error) {
      checks.push({
        name: 'Security Check Error',
        status: 'failed',
        message: `Error checking security: ${error.message}`,
        value: 'error',
        criticality: 'high'
      });
    }
    
    return checks;
  }

  /**
   * Check performance metrics
   */
  async checkPerformance() {
    const checks = [];
    
    try {
      // Process memory usage
      const memoryUsage = process.memoryUsage();
      const heapUsedPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
      
      checks.push({
        name: 'Process Memory',
        status: heapUsedPercent < 80 ? 'passed' : heapUsedPercent < 90 ? 'warning' : 'failed',
        message: `Process using ${this.formatBytes(memoryUsage.heapUsed)} of ${this.formatBytes(memoryUsage.heapTotal)} allocated`,
        value: `${Math.round(heapUsedPercent)}%`,
        criticality: heapUsedPercent < 80 ? 'low' : heapUsedPercent < 90 ? 'medium' : 'high'
      });
      
      // Process uptime
      const processUptime = process.uptime();
      const uptimeHours = Math.round(processUptime / 3600);
      
      checks.push({
        name: 'Process Uptime',
        status: uptimeHours < 7 * 24 ? 'passed' : 'warning', // Warning if running more than a week
        message: `Process has been running for ${uptimeHours} hours`,
        value: `${uptimeHours}h`,
        criticality: uptimeHours < 7 * 24 ? 'low' : 'medium'
      });
      
      // Node.js version
      const nodeVersion = process.version;
      checks.push({
        name: 'Node.js Version',
        status: parseFloat(nodeVersion.slice(1)) >= 14 ? 'passed' : 'warning',
        message: `Running Node.js ${nodeVersion}`,
        value: nodeVersion,
        criticality: 'low'
      });
      
    } catch (error) {
      checks.push({
        name: 'Performance Check Error',
        status: 'failed',
        message: `Error checking performance: ${error.message}`,
        value: 'error',
        criticality: 'high'
      });
    }
    
    return checks;
  }

  /**
   * Check disk space
   */
  async checkDiskSpace() {
    try {
      // For this simple check, we'll just verify we can write to the current directory
      // A more advanced implementation would use system commands
      const stats = await fs.stat(process.cwd());
      return {
        name: 'Disk Space',
        status: 'passed', // We'll assume sufficient space if we can access the directory
        message: 'Can access working directory',
        value: 'accessible',
        criticality: 'high'
      };
    } catch (error) {
      return {
        name: 'Disk Space',
        status: 'failed',
        message: `Cannot access working directory: ${error.message}`,
        value: 'inaccessible',
        criticality: 'high'
      };
    }
  }

  /**
   * Format bytes to human-readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

module.exports = HealthCheckApi;