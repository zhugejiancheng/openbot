/**
 * 任务调度和自动化系统
 * 提供任务编排、自动化触发和流程管理功能
 */

class TaskScheduler {
  constructor() {
    this.tasks = new Map(); // 存储任务
    this.scheduledJobs = new Map(); // 存储定时任务
    this.runningTasks = new Map(); // 存储正在运行的任务
    this.taskHistory = []; // 存储任务执行历史
    this.maxHistory = 1000; // 最大历史记录数
  }

  /**
   * 添加一次性任务
   */
  addTask(taskId, taskFunction, options = {}) {
    const task = {
      id: taskId,
      function: taskFunction,
      options,
      createdAt: new Date(),
      status: 'pending',
      retries: 0,
      maxRetries: options.maxRetries || 3
    };

    this.tasks.set(taskId, task);
    console.log(`✅ 任务 '${taskId}' 已添加`);
    return taskId;
  }

  /**
   * 添加定时任务
   */
  scheduleTask(taskId, taskFunction, schedule, options = {}) {
    const job = {
      id: taskId,
      function: taskFunction,
      schedule, // 可以是时间戳、cron表达式或延迟毫秒数
      options,
      createdAt: new Date(),
      lastRun: null,
      nextRun: this.calculateNextRun(schedule),
      isActive: true,
      isRunning: false
    };

    this.scheduledJobs.set(taskId, job);
    console.log(`✅ 定时任务 '${taskId}' 已安排，下次运行: ${job.nextRun}`);
    return taskId;
  }

  /**
   * 计算下次运行时间
   */
  calculateNextRun(schedule) {
    if (typeof schedule === 'number') {
      // 延迟毫秒数
      return new Date(Date.now() + schedule);
    } else if (schedule instanceof Date) {
      // 具体时间
      return schedule;
    } else if (typeof schedule === 'string') {
      // 假设是延迟字符串如 '5m', '1h', '2d' 等
      const match = schedule.match(/^(\d+)([smhd])$/);
      if (match) {
        const [, amount, unit] = match;
        const multiplier = {
          's': 1000,
          'm': 60 * 1000,
          'h': 60 * 60 * 1000,
          'd': 24 * 60 * 60 * 1000
        }[unit];
        
        return new Date(Date.now() + (parseInt(amount) * multiplier));
      }
    }
    
    // 默认1分钟后运行
    return new Date(Date.now() + 60000);
  }

  /**
   * 立即执行任务
   */
  async executeTask(taskId) {
    if (!this.tasks.has(taskId)) {
      throw new Error(`任务 '${taskId}' 不存在`);
    }

    const task = this.tasks.get(taskId);
    if (task.status === 'running') {
      throw new Error(`任务 '${taskId}' 正在运行中`);
    }

    task.status = 'running';
    task.startedAt = new Date();
    this.runningTasks.set(taskId, task);

    try {
      const result = await task.function();
      
      task.status = 'completed';
      task.completedAt = new Date();
      task.result = result;
      
      // 添加到历史记录
      this.addToHistory(task);
      
      console.log(`✅ 任务 '${taskId}' 执行完成`);
      return result;
    } catch (error) {
      task.status = 'failed';
      task.failedAt = new Date();
      task.error = error.message;
      
      // 检查是否需要重试
      if (task.retries < task.maxRetries) {
        task.retries++;
        console.log(`⚠️ 任务 '${taskId}' 执行失败，准备第 ${task.retries} 次重试`);
        
        // 延迟后重试
        setTimeout(() => {
          this.executeTask(taskId).catch(console.error);
        }, 1000 * task.retries); // 递增延迟
      } else {
        console.error(`❌ 任务 '${taskId}' 执行失败，已达到最大重试次数`);
      }
      
      // 添加到历史记录
      this.addToHistory(task);
      
      throw error;
    } finally {
      this.runningTasks.delete(taskId);
      this.tasks.set(taskId, task);
    }
  }

  /**
   * 执行定时任务
   */
  async executeScheduledTask(jobId) {
    if (!this.scheduledJobs.has(jobId)) {
      throw new Error(`定时任务 '${jobId}' 不存在`);
    }

    const job = this.scheduledJobs.get(jobId);
    if (!job.isActive) {
      throw new Error(`定时任务 '${jobId}' 已停用`);
    }

    if (job.isRunning) {
      console.log(`⚠️ 定时任务 '${jobId}' 正在运行中，跳过本次执行`);
      return;
    }

    job.isRunning = true;
    job.lastRun = new Date();
    job.nextRun = this.calculateNextRun(job.schedule);

    try {
      const result = await job.function();
      
      job.lastResult = result;
      job.successCount = (job.successCount || 0) + 1;
      
      console.log(`✅ 定时任务 '${jobId}' 执行完成`);
      
      // 添加到历史记录
      this.addToHistory({
        id: `${jobId}_${Date.now()}`,
        type: 'scheduled',
        jobId,
        startedAt: job.lastRun,
        completedAt: new Date(),
        result,
        status: 'completed'
      });
      
      return result;
    } catch (error) {
      job.lastError = error.message;
      job.failureCount = (job.failureCount || 0) + 1;
      
      console.error(`❌ 定时任务 '${jobId}' 执行失败:`, error.message);
      
      // 添加到历史记录
      this.addToHistory({
        id: `${jobId}_${Date.now()}`,
        type: 'scheduled',
        jobId,
        startedAt: job.lastRun,
        completedAt: new Date(),
        error: error.message,
        status: 'failed'
      });
      
      throw error;
    } finally {
      job.isRunning = false;
      this.scheduledJobs.set(jobId, job);
    }
  }

  /**
   * 添加到历史记录
   */
  addToHistory(record) {
    this.taskHistory.push(record);
    
    // 保持历史记录在限制范围内
    if (this.taskHistory.length > this.maxHistory) {
      this.taskHistory = this.taskHistory.slice(-this.maxHistory);
    }
  }

  /**
   * 获取任务历史
   */
  getHistory(limit = 50, filter = {}) {
    let filteredHistory = [...this.taskHistory];

    if (filter.status) {
      filteredHistory = filteredHistory.filter(item => item.status === filter.status);
    }

    if (filter.type) {
      filteredHistory = filteredHistory.filter(item => item.type === filter.type);
    }

    if (filter.taskId) {
      filteredHistory = filteredHistory.filter(item => 
        item.id.startsWith(filter.taskId) || item.jobId === filter.taskId
      );
    }

    return filteredHistory.slice(-limit).reverse();
  }

  /**
   * 获取任务状态
   */
  getStatus(taskId) {
    if (this.tasks.has(taskId)) {
      return this.tasks.get(taskId);
    }
    
    if (this.scheduledJobs.has(taskId)) {
      return this.scheduledJobs.get(taskId);
    }
    
    if (this.runningTasks.has(taskId)) {
      return this.runningTasks.get(taskId);
    }

    return null;
  }

  /**
   * 获取所有任务状态
   */
  getAllStatus() {
    return {
      pendingTasks: Array.from(this.tasks.values()).filter(t => t.status === 'pending'),
      runningTasks: Array.from(this.runningTasks.values()),
      scheduledJobs: Array.from(this.scheduledJobs.values()),
      taskHistoryCount: this.taskHistory.length
    };
  }

  /**
   * 取消任务
   */
  cancelTask(taskId) {
    if (this.tasks.has(taskId)) {
      const task = this.tasks.get(taskId);
      task.status = 'cancelled';
      task.cancelledAt = new Date();
      
      // 添加到历史记录
      this.addToHistory(task);
      
      this.tasks.delete(taskId);
      console.log(`❌ 任务 '${taskId}' 已取消`);
      return true;
    }

    if (this.runningTasks.has(taskId)) {
      // 注意：无法真正取消正在运行的任务，只能标记为取消
      console.warn(`⚠️ 无法取消正在运行的任务 '${taskId}'，请等待其完成`);
      return false;
    }

    return false;
  }

  /**
   * 停用定时任务
   */
  disableSchedule(taskId) {
    if (this.scheduledJobs.has(taskId)) {
      const job = this.scheduledJobs.get(taskId);
      job.isActive = false;
      console.log(`⏸️ 定时任务 '${taskId}' 已停用`);
      return true;
    }
    return false;
  }

  /**
   * 启用定时任务
   */
  enableSchedule(taskId) {
    if (this.scheduledJobs.has(taskId)) {
      const job = this.scheduledJobs.get(taskId);
      job.isActive = true;
      job.nextRun = this.calculateNextRun(job.schedule);
      console.log(`▶️ 定时任务 '${taskId}' 已启用，下次运行: ${job.nextRun}`);
      return true;
    }
    return false;
  }

  /**
   * 条件触发执行
   */
  async conditionalExecute(conditionFunction, taskFunction, options = {}) {
    const shouldExecute = await conditionFunction();
    
    if (shouldExecute) {
      console.log('✅ 条件满足，执行任务');
      return await taskFunction();
    } else {
      console.log('⏭️ 条件不满足，跳过任务');
      return null;
    }
  }

  /**
   * 串行执行任务序列
   */
  async executeSequence(tasks) {
    const results = [];
    
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      console.log(`🔄 执行序列任务 ${i + 1}/${tasks.length}: ${task.id}`);
      
      try {
        const result = await task.execute();
        results.push({
          taskId: task.id,
          result,
          status: 'success'
        });
      } catch (error) {
        results.push({
          taskId: task.id,
          error: error.message,
          status: 'failed'
        });
        
        if (task.options?.failFast) {
          console.log(`❌ 任务序列因 '${task.id}' 失败而中断`);
          break;
        }
      }
    }
    
    return results;
  }

  /**
   * 并行执行任务
   */
  async executeParallel(tasks, concurrency = 3) {
    const results = [];
    const taskQueue = [...tasks];
    
    while (taskQueue.length > 0) {
      const batch = taskQueue.splice(0, concurrency);
      const promises = batch.map(async (task) => {
        try {
          const result = await task.execute();
          return {
            taskId: task.id,
            result,
            status: 'success'
          };
        } catch (error) {
          return {
            taskId: task.id,
            error: error.message,
            status: 'failed'
          };
        }
      });
      
      const batchResults = await Promise.all(promises);
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * 清空所有任务
   */
  clearAll() {
    this.tasks.clear();
    this.scheduledJobs.clear();
    this.runningTasks.clear();
    this.taskHistory = [];
    console.log('🗑️ 所有任务已清空');
  }
}

module.exports = TaskScheduler;