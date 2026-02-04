/**
 * 监控和提醒服务
 * 提供主动监测和提醒功能，增强自主决策能力
 */

class MonitoringService {
  constructor() {
    this.monitors = new Map(); // 存储监控器
    this.alerts = []; // 存储警报
    this.isRunning = false;
    this.checkInterval = 30000; // 默认30秒检查一次
  }

  /**
   * 添加监控器
   */
  addMonitor(name, checkFunction, intervalMs = 60000, options = {}) {
    const monitor = {
      name,
      checkFunction,
      intervalMs,
      options,
      lastCheck: null,
      isActive: true,
      createdAt: new Date()
    };

    this.monitors.set(name, monitor);
    console.log(`✅ 监控器 '${name}' 已添加，检查间隔: ${intervalMs}ms`);
  }

  /**
   * 移除监控器
   */
  removeMonitor(name) {
    if (this.monitors.has(name)) {
      const monitor = this.monitors.get(name);
      monitor.isActive = false;
      this.monitors.delete(name);
      console.log(`❌ 监控器 '${name}' 已移除`);
    }
  }

  /**
   * 开始监控
   */
  async start() {
    if (this.isRunning) {
      console.log('监控服务已在运行中');
      return;
    }

    this.isRunning = true;
    console.log('🚀 监控服务已启动');

    // 立即执行一次检查
    await this.performCheck();

    // 设置定期检查
    this.intervalId = setInterval(async () => {
      await this.performCheck();
    }, this.checkInterval);
  }

  /**
   * 停止监控
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('🛑 监控服务已停止');
  }

  /**
   * 执行检查
   */
  async performCheck() {
    if (this.monitors.size === 0) {
      return;
    }

    const now = new Date();
    
    for (const [name, monitor] of this.monitors) {
      if (!monitor.isActive) {
        continue;
      }

      // 检查是否到达下次检查时间
      const timeSinceLastCheck = monitor.lastCheck 
        ? now - monitor.lastCheck 
        : Infinity;

      if (timeSinceLastCheck >= monitor.intervalMs) {
        try {
          const result = await monitor.checkFunction();
          
          if (result !== null && result !== undefined) {
            // 根据结果决定是否产生警报
            if (this.shouldAlert(result, monitor.options)) {
              const alert = {
                id: Date.now() + '_' + name,
                name,
                timestamp: new Date(),
                result,
                type: result.type || 'info',
                priority: result.priority || 'medium'
              };
              
              this.alerts.push(alert);
              console.log(`🔔 警报: ${name}`, result);
              
              // 触发警报回调
              if (monitor.options.onAlert) {
                await monitor.options.onAlert(alert);
              }
            }
          }
          
          monitor.lastCheck = now;
        } catch (error) {
          console.error(`❌ 监控器 '${name}' 执行错误:`, error);
          
          // 错误警报
          const errorAlert = {
            id: Date.now() + '_' + name + '_error',
            name: name,
            timestamp: new Date(),
            result: { error: error.message, type: 'error', priority: 'high' },
            type: 'error',
            priority: 'high'
          };
          
          this.alerts.push(errorAlert);
          if (monitor.options.onError) {
            await monitor.options.onError(errorAlert);
          }
        }
      }
    }

    // 清理旧警报（保留最近100个）
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
  }

  /**
   * 判断是否需要发出警报
   */
  shouldAlert(result, options = {}) {
    // 如果结果包含alert字段且为true，则发出警报
    if (result.alert === true) {
      return true;
    }

    // 如果结果包含error字段，则发出警报
    if (result.error) {
      return true;
    }

    // 如果设置了阈值比较
    if (options.threshold && typeof result.value !== 'undefined') {
      const { threshold, condition = 'gt' } = options.threshold;
      switch (condition) {
        case 'gt': // greater than
          return result.value > threshold;
        case 'lt': // less than
          return result.value < threshold;
        case 'eq': // equal
          return result.value === threshold;
        case 'ne': // not equal
          return result.value !== threshold;
        default:
          return false;
      }
    }

    // 默认情况下，如果有message或warning字段则发出警报
    return !!(result.message || result.warning || result.critical);
  }

  /**
   * 获取所有警报
   */
  getAlerts(priority = null, limit = 50) {
    let filteredAlerts = this.alerts;

    if (priority) {
      filteredAlerts = filteredAlerts.filter(alert => alert.priority === priority);
    }

    return filteredAlerts.slice(-limit);
  }

  /**
   * 清空警报
   */
  clearAlerts() {
    this.alerts = [];
    console.log('🗑️ 警报已清空');
  }

  /**
   * 获取监控器状态
   */
  getStatus() {
    const activeMonitors = Array.from(this.monitors.values()).filter(m => m.isActive);
    const inactiveMonitors = Array.from(this.monitors.values()).filter(m => !m.isActive);
    
    return {
      isRunning: this.isRunning,
      totalMonitors: this.monitors.size,
      activeMonitors: activeMonitors.length,
      inactiveMonitors: inactiveMonitors.length,
      alertsCount: this.alerts.length,
      monitors: Array.from(this.monitors.entries()).map(([name, monitor]) => ({
        name: monitor.name,
        isActive: monitor.isActive,
        lastCheck: monitor.lastCheck,
        intervalMs: monitor.intervalMs,
        createdAt: monitor.createdAt
      }))
    };
  }

  /**
   * 等待特定条件满足
   */
  async waitForCondition(checkFunction, timeoutMs = 60000, intervalMs = 1000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const interval = setInterval(async () => {
        try {
          const result = await checkFunction();
          if (result) {
            clearInterval(interval);
            resolve(result);
          } else if (Date.now() - startTime > timeoutMs) {
            clearInterval(interval);
            reject(new Error('等待条件超时'));
          }
        } catch (error) {
          clearInterval(interval);
          reject(error);
        }
      }, intervalMs);
    });
  }

  /**
   * 延迟执行
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = MonitoringService;