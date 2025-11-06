// QPS限制管理器
export class QpsLimitManager {
  private requestQueue: Array<() => Promise<any>> = []
  private isProcessing = false
  private lastRequestTime = 0
  private readonly minInterval = 300 // 最小请求间隔（毫秒）
  private readonly maxConcurrent = 2 // 最大并发数
  private activeRequests = 0

  /**
   * 添加请求到队列
   */
  async addRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await requestFn()
          resolve(result)
        } catch (error) {
          reject(error)
        }
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

    while (this.requestQueue.length > 0 && this.activeRequests < this.maxConcurrent) {
      const request = this.requestQueue.shift()
      if (!request) continue

      // 确保请求间隔
      const now = Date.now()
      const timeSinceLastRequest = now - this.lastRequestTime
      if (timeSinceLastRequest < this.minInterval) {
        await this.delay(this.minInterval - timeSinceLastRequest)
      }

      this.activeRequests++
      this.lastRequestTime = Date.now()

      // 执行请求
      request().finally(() => {
        this.activeRequests--
        // 继续处理队列
        setTimeout(() => this.processQueue(), 0)
      })
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
   * 获取队列状态
   */
  getStatus(): { queueLength: number; activeRequests: number } {
    return {
      queueLength: this.requestQueue.length,
      activeRequests: this.activeRequests
    }
  }

  /**
   * 清空队列
   */
  clearQueue(): void {
    this.requestQueue = []
  }
}

// 导出单例实例
export const qpsManager = new QpsLimitManager()