// API配置管理服务
export interface ApiConfig {
  webServiceApiKey: string  // Web服务API Key (用于地理编码等REST API调用)
  webApiKey: string        // Web端API Key (用于地图显示和交互)
}

class ApiConfigService {
  private config: ApiConfig = {
    // Web服务API Key - 用于地理编码、路径规划等REST API调用
    webServiceApiKey: import.meta.env.VITE_AMAP_WEB_SERVICE_KEY || '75cdd5dc1caa1175a798205da7c478f0',
    // Web端API Key - 用于地图显示、标记、交互等JavaScript SDK功能
    webApiKey: import.meta.env.VITE_AMAP_WEB_KEY || '4de14f83dd2551db8d5797e35a6b0068'
  }

  /**
   * 获取Web服务API Key (用于REST API调用)
   */
  getWebServiceApiKey(): string {
    return this.config.webServiceApiKey
  }

  /**
   * 获取Web端API Key (用于JavaScript SDK)
   */
  getWebApiKey(): string {
    return this.config.webApiKey
  }

  /**
   * 更新API配置
   */
  updateConfig(newConfig: Partial<ApiConfig>): void {
    this.config = { ...this.config, ...newConfig }
    console.log('API配置已更新:', this.config)
  }

  /**
   * 验证API Key配置
   */
  validateConfig(): { isValid: boolean; issues: string[] } {
    const issues: string[] = []

    if (!this.config.webServiceApiKey || this.config.webServiceApiKey.length < 20) {
      issues.push('Web服务API Key无效或缺失')
    }

    if (!this.config.webApiKey || this.config.webApiKey.length < 20) {
      issues.push('Web端API Key无效或缺失')
    }

    if (this.config.webServiceApiKey === this.config.webApiKey) {
      issues.push('⚠️  警告: 两个API Key相同，请确认是否正确配置了不同平台的API Key')
    }

    // 验证API Key格式
    if (this.config.webServiceApiKey && !this.isValidApiKeyFormat(this.config.webServiceApiKey)) {
      issues.push('Web服务API Key格式不正确')
    }

    if (this.config.webApiKey && !this.isValidApiKeyFormat(this.config.webApiKey)) {
      issues.push('Web端API Key格式不正确')
    }

    return {
      isValid: issues.length === 0,
      issues
    }
  }

  /**
   * 验证API Key格式
   */
  private isValidApiKeyFormat(apiKey: string): boolean {
    // 高德API Key通常是32位十六进制字符串
    return /^[a-f0-9]{32}$/i.test(apiKey)
  }

  /**
   * 打印配置信息
   */
  printConfig(): void {
    console.log('=== 高德地图API配置 ===')
    console.log('Web服务API Key (地理编码):', this.config.webServiceApiKey)
    console.log('Web端API Key (地图显示):', this.config.webApiKey)
    console.log('环境变量来源:')
    console.log('  - VITE_AMAP_WEB_SERVICE_KEY:', import.meta.env.VITE_AMAP_WEB_SERVICE_KEY ? '✅ 已配置' : '❌ 未配置')
    console.log('  - VITE_AMAP_WEB_KEY:', import.meta.env.VITE_AMAP_WEB_KEY ? '✅ 已配置' : '❌ 未配置')
    
    const validation = this.validateConfig()
    if (validation.isValid) {
      console.log('✅ 配置验证通过')
    } else {
      console.log('❌ 配置问题:')
      validation.issues.forEach(issue => console.log(`  - ${issue}`))
    }

    console.log('\n📋 API Key使用说明:')
    console.log('1. Web服务API Key: 用于地理编码、路径规划等REST API调用')
    console.log('2. Web端API Key: 用于地图显示、标记、交互等JavaScript SDK功能')
    console.log('3. 两个API Key应该是不同平台类型，具有不同的权限和限制')
    
    console.log('\n🔧 当前配置:')
    console.log(`Web服务API Key: ${this.config.webServiceApiKey.substring(0, 8)}...`)
    console.log(`Web端API Key: ${this.config.webApiKey.substring(0, 8)}...`)
  }
}

// 导出单例实例
export const apiConfigService = new ApiConfigService()

// 在开发环境下打印配置信息
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  setTimeout(() => {
    apiConfigService.printConfig()
  }, 1000)
}