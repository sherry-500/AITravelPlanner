// 高德地图QPS限制管理器 - 专门针对每秒3次的限制
export class AmapQpsManager {
  private requestQueue: Array<{ request: () => Promise<any>, resolve: (value: any) => void, reject: (error: any) => void }> = []
  private isProcessing = false
  private requestTimes: number[] = [] // 记录最近的请求时间
  private readonly maxQps = 3 // 每秒最大3次请求
  private readonly timeWindow = 1000 // 时间窗口1秒

  /**
   * 添加请求到队列
   */
  async addRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        request: requestFn,
        resolve,
        reject
      })
      
      this.processQueue()
    })
  }

  /**
   * 处理请求队列
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return
    }

    this.isProcessing = true

    while (this.requestQueue.length > 0) {
      // 清理过期的请求时间记录
      const now = Date.now()
      this.requestTimes = this.requestTimes.filter(time => now - time < this.timeWindow)

      // 检查是否可以发送请求
      if (this.requestTimes.length >= this.maxQps) {
        // 等待到最早的请求时间过期
        const oldestRequestTime = this.requestTimes[0]
        const waitTime = this.timeWindow - (now - oldestRequestTime) + 50 // 额外50ms缓冲
        console.log(`QPS限制：等待 ${waitTime}ms 后继续处理请求`)
        await this.delay(waitTime)
        continue
      }

      // 执行请求
      const { request, resolve, reject } = this.requestQueue.shift()!
      this.requestTimes.push(Date.now())

      try {
        const result = await request()
        resolve(result)
      } catch (error) {
        reject(error)
      }

      // 请求间最小间隔，确保不会瞬间发送多个请求
      await this.delay(100)
    }

    this.isProcessing = false
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 获取当前QPS状态
   */
  getQpsStatus(): { currentQps: number; queueLength: number; canSendRequest: boolean } {
    const now = Date.now()
    const recentRequests = this.requestTimes.filter(time => now - time < this.timeWindow)
    
    return {
      currentQps: recentRequests.length,
      queueLength: this.requestQueue.length,
      canSendRequest: recentRequests.length < this.maxQps
    }
  }

  /**
   * 清空队列
   */
  clearQueue(): void {
    this.requestQueue.forEach(({ reject }) => {
      reject(new Error('Queue cleared'))
    })
    this.requestQueue = []
    this.requestTimes = []
  }

  /**
   * 重置QPS计数器
   */
  resetQpsCounter(): void {
    this.requestTimes = []
  }
}

// 导出高德地图专用的QPS管理器实例
export const amapQpsManager = new AmapQpsManager()