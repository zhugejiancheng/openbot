/**
 * Monitoring API for OpenBot
 * Provides system monitoring capabilities through the web interface
 */

const os = require('os');
const fs = require('fs').promises;
const path = require('path');

class MonitoringApi {
  constructor(monitoringService) {
    this.monitoringService = monitoringService;
  }

  /**
   * Get system information
   */
  async getSystemInfo() {
    try {
      const platform = os.platform();
      const arch = os.arch();
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;
      const cpuCount = os.cpus().length;
      const uptime = os.uptime();
      const loadAvg = os.loadavg();

      const userInfo = os.userInfo();

      return {
        success: true,
        system: {
          platform,
          arch,
          release: os.release(),
          hostname: os.hostname(),
          uptime: uptime,
          loadAverage: {
            '1min': loadAvg[0],
            '5min': loadAvg[1],
            '15min': loadAvg[2]
          },
          memory: {
            total: totalMemory,
            free: freeMemory,
            used: usedMemory,
            percentUsed: ((usedMemory / totalMemory) * 100).toFixed(2)
          },
          cpu: {
            count: cpuCount,
            model: os.cpus()[0].model,
            speed: os.cpus()[0].speed
          },
          user: {
            username: userInfo.username,
            homedir: userInfo.homedir,
            shell: userInfo.shell
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get system info: ${error.message}`
      };
    }
  }

  /**
   * Get process information
   */
  async getProcessInfo() {
    try {
      const pid = process.pid;
      const memoryUsage = process.memoryUsage();
      const uptime = process.uptime();
      const argv = process.argv;
      const env = Object.keys(process.env);

      return {
        success: true,
        process: {
          pid,
          uptime: uptime,
          memoryUsage: {
            rss: memoryUsage.rss,
            heapTotal: memoryUsage.heapTotal,
            heapUsed: memoryUsage.heapUsed,
            external: memoryUsage.external
          },
          argv: argv,
          env: env
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get process info: ${error.message}`
      };
    }
  }

  /**
   * Get disk usage
   */
  async getDiskUsage(directory = process.cwd()) {
    try {
      // On Unix-like systems, we can use statvfs to get disk usage
      // For cross-platform compatibility, we'll implement this differently
      const stats = await fs.stat(directory);
      const parentDir = path.dirname(directory);
      
      return {
        success: true,
        disk: {
          path: directory,
          accessed: stats.atime,
          modified: stats.mtime,
          created: stats.birthtime
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get disk usage: ${error.message}`
      };
    }
  }

  /**
   * Get network interfaces
   */
  async getNetworkInterfaces() {
    try {
      const interfaces = os.networkInterfaces();
      
      return {
        success: true,
        interfaces: interfaces
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get network interfaces: ${error.message}`
      };
    }
  }

  /**
   * Get monitoring status
   */
  async getMonitoringStatus() {
    try {
      const monitors = this.monitoringService.getMonitors();
      const alerts = this.monitoringService.getAlerts();
      
      return {
        success: true,
        monitoring: {
          initialized: !!this.monitoringService,
          monitors: monitors,
          alerts: alerts,
          alertCount: alerts.length,
          monitorCount: monitors.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get monitoring status: ${error.message}`
      };
    }
  }

  /**
   * Get CPU usage
   */
  async getCpuUsage() {
    try {
      const cpus = os.cpus();
      const cpuInfo = cpus.map(cpu => ({
        model: cpu.model,
        speed: cpu.speed,
        times: cpu.times
      }));

      return {
        success: true,
        cpu: {
          count: cpus.length,
          info: cpuInfo
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get CPU usage: ${error.message}`
      };
    }
  }

  /**
   * Get memory usage
   */
  async getMemoryUsage() {
    try {
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;
      const usagePercent = (usedMemory / totalMemory) * 100;

      return {
        success: true,
        memory: {
          total: totalMemory,
          free: freeMemory,
          used: usedMemory,
          usagePercent: usagePercent.toFixed(2)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get memory usage: ${error.message}`
      };
    }
  }

  /**
   * Get detailed system metrics
   */
  async getSystemMetrics() {
    try {
      const systemInfo = await this.getSystemInfo();
      const processInfo = await this.getProcessInfo();
      const cpuUsage = await this.getCpuUsage();
      const memoryUsage = await this.getMemoryUsage();
      const networkInterfaces = await this.getNetworkInterfaces();
      
      return {
        success: true,
        metrics: {
          system: systemInfo.system,
          process: processInfo.process,
          cpu: cpuUsage.cpu,
          memory: memoryUsage.memory,
          network: networkInterfaces.interfaces,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get system metrics: ${error.message}`
      };
    }
  }
}

module.exports = MonitoringApi;