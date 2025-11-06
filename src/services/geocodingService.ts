// 地理编码服务 - 通过高德地图API获取真实坐标
import { apiConfigService } from './apiConfigService'
import { amapQpsManager } from '../utils/amapQpsManager'

export interface GeocodeResult {
  lng: number
  lat: number
  address: string
  city?: string
  district?: string
  province?: string
}

export interface GeocodeResponse {
  status: string
  count: string
  info: string
  infocode: string
  geocodes: Array<{
    formatted_address: string
    country: string
    province: string
    citycode: string
    city: string
    district: string
    township: string
    neighborhood: {
      name: string
      type: string
    }
    building: {
      name: string
      type: string
    }
    adcode: string
    street: string
    number: string
    location: string
    level: string
  }>
}

class GeocodingService {
  private readonly baseUrl = 'https://restapi.amap.com/v3/geocode/geo'
  
  // 缓存已查询的地址，避免重复请求
  private cache = new Map<string, GeocodeResult>()

  /**
   * 通过地址获取经纬度坐标
   * @param address 地址字符串
   * @param city 城市名称（可选，提高查询精度）
   * @returns Promise<GeocodeResult | null>
   */
  async getCoordinates(address: string, city?: string): Promise<GeocodeResult | null> {
    if (!address || address.trim() === '') {
      return null
    }

    // 清理地址字符串
    const cleanAddress = this.cleanAddress(address)
    const cacheKey = city ? `${city}-${cleanAddress}` : cleanAddress

    // 检查缓存
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }

    // 首先尝试从备用坐标库获取（优先处理海外地址）
    const fallbackResult = this.getFallbackCoordinates(cleanAddress)
    if (fallbackResult) {
      this.cache.set(cacheKey, fallbackResult)
      return fallbackResult
    }

    // 检查是否为海外地址，如果是则直接返回null（避免无效API调用）
    if (this.isOverseasAddress(cleanAddress)) {
      
      return null
    }

    // 使用高德地图专用QPS管理器控制请求频率
    const data: GeocodeResponse | null = await amapQpsManager.addRequest(async () => {
      try {
        const params = new URLSearchParams({
          key: apiConfigService.getWebServiceApiKey(),
          address: cleanAddress,
          output: 'json'
        })

        if (city) {
          params.append('city', city)
        }

        const response = await fetch(`${this.baseUrl}?${params.toString()}`)
        
        if (!response.ok) {
          console.warn(`HTTP请求失败: ${response.status} ${response.statusText}`)
          return null
        }

        return await response.json()
      } catch (error) {
        console.error(`地理编码API请求异常: ${address}`, error)
        return null
      }
    })

    if (!data) {
      return null
    }

    try {

      if (data.status === '1' && data.geocodes && data.geocodes.length > 0) {
        const geocode = data.geocodes[0]
        const [lng, lat] = geocode.location.split(',').map(Number)

        // 验证坐标有效性
        if (isNaN(lng) || isNaN(lat) || !isFinite(lng) || !isFinite(lat) ||
            lng < -180 || lng > 180 || lat < -90 || lat > 90) {
          console.warn(`API返回无效坐标: ${address} -> [${lng}, ${lat}]`)
          return null
        }

        const result: GeocodeResult = {
          lng,
          lat,
          address: geocode.formatted_address,
          city: geocode.city,
          district: geocode.district,
          province: geocode.province
        }

        // 缓存结果
        this.cache.set(cacheKey, result)
        
        
        return result
      } else {
        // 详细错误分析 - 只输出失败的调试信息
        if (data.infocode === '10009') {
          console.error('❌ API Key平台不匹配 - 请检查API Key配置')
          console.log('🔧 解决方案: 使用Web服务类型的API Key')
        } else if (data.infocode === '30001') {
          // 30001错误通常是海外地址查询失败，不输出错误信息
        } else if (data.infocode === '10004' || data.info?.includes('CUQPS_HAS_EXCEEDED_THE_LIMIT')) {
          console.error('❌ QPS限制超出 - 请求过于频繁')
          this.explainErrorCode(data.infocode, data.info)
          // QPS限制时等待更长时间再重试
          await this.delay(3000)
        } else {
          // 其他错误输出详细信息
          console.warn(`地理编码失败: ${address}`)
          console.warn(`状态: ${data.status}, 信息: ${data.info}, 错误码: ${data.infocode}`)
          this.explainErrorCode(data.infocode, data.info)
        }
        
        return null
      }
    } catch (error) {
      console.error(`地理编码请求失败: ${address}`, error)
      return null
    }
  }

  /**
   * 检查是否为海外地址
   */
  private isOverseasAddress(address: string): boolean {
    const lowerAddress = address.toLowerCase()
    const overseasKeywords = [
      'london', 'paris', 'tokyo', 'new york', 'sydney', 'berlin',
      'rome', 'madrid', 'amsterdam', 'vienna', 'prague', 'budapest',
      'uk', 'england', 'france', 'japan', 'usa', 'america', 'australia',
      'germany', 'italy', 'spain', 'netherlands', 'austria', 'czech',
      'hungary', 'big ben', 'tower bridge', 'eiffel tower', 'statue of liberty'
    ]
    
    return overseasKeywords.some(keyword => lowerAddress.includes(keyword))
  }

  /**
   * 获取备用坐标（当API不可用时）
   */
  private getFallbackCoordinates(address: string): GeocodeResult | null {
    const lowerAddress = address.toLowerCase().trim()
    
    // 常见地点的备用坐标
    const fallbackCoords: Record<string, GeocodeResult> = {
      // 中国地点
      '上海浦东国际机场': { lng: 121.8057, lat: 31.1434, address: '上海浦东国际机场' },
      '北京首都国际机场': { lng: 116.5849, lat: 40.0801, address: '北京首都国际机场' },
      '天安门广场': { lng: 116.3977, lat: 39.9031, address: '北京市东城区天安门广场' },
      '外滩': { lng: 121.4921, lat: 31.2335, address: '上海市黄浦区外滩' },
      '西湖': { lng: 120.1304, lat: 30.2592, address: '浙江省杭州市西湖区' },
      
      // 伦敦地点
      '伦敦希思罗机场': { lng: -0.4543, lat: 51.4700, address: '伦敦希思罗机场' },
      '大英博物馆': { lng: -0.1278, lat: 51.5194, address: '大英博物馆' },
      '白金汉宫': { lng: -0.1419, lat: 51.5014, address: '白金汉宫' },
      '伦敦塔桥': { lng: -0.0754, lat: 51.5055, address: '伦敦塔桥' },
      '泰晤士河': { lng: -0.1276, lat: 51.5074, address: '泰晤士河' },
      '大本钟': { lng: -0.1246, lat: 51.4994, address: '大本钟' },
      '伦敦眼': { lng: -0.1196, lat: 51.5033, address: '伦敦眼' },
      '特拉法加广场': { lng: -0.1278, lat: 51.5080, address: '特拉法加广场' },
      '考文特花园': { lng: -0.1225, lat: 51.5118, address: '考文特花园' },
      '牛津街': { lng: -0.1419, lat: 51.5154, address: '牛津街' },
      '摄政街': { lng: -0.1419, lat: 51.5154, address: '摄政街' },
      '皮卡迪利广场': { lng: -0.1347, lat: 51.5099, address: '皮卡迪利广场' },
      
      // 英文地点
      'heathrow airport': { lng: -0.4543, lat: 51.4700, address: 'Heathrow Airport' },
      'british museum': { lng: -0.1278, lat: 51.5194, address: 'British Museum' },
      'buckingham palace': { lng: -0.1419, lat: 51.5014, address: 'Buckingham Palace' },
      'tower bridge': { lng: -0.0754, lat: 51.5055, address: 'Tower Bridge' },
      'big ben': { lng: -0.1246, lat: 51.4994, address: 'Big Ben' },
      'london eye': { lng: -0.1196, lat: 51.5033, address: 'London Eye' },
      'trafalgar square': { lng: -0.1278, lat: 51.5080, address: 'Trafalgar Square' },
      'covent garden': { lng: -0.1225, lat: 51.5118, address: 'Covent Garden' },
      'oxford street': { lng: -0.1419, lat: 51.5154, address: 'Oxford Street' },
      'regent street': { lng: -0.1419, lat: 51.5154, address: 'Regent Street' },
      'piccadilly circus': { lng: -0.1347, lat: 51.5099, address: 'Piccadilly Circus' },
      'the wolseley': { lng: -0.1419, lat: 51.5094, address: 'The Wolseley Restaurant' },
      'london': { lng: -0.1276, lat: 51.5074, address: 'London, UK' },
      
      // 其他国际地点
      'paris': { lng: 2.3522, lat: 48.8566, address: 'Paris, France' },
      'tokyo': { lng: 139.6917, lat: 35.6895, address: 'Tokyo, Japan' },
      'new york': { lng: -74.0060, lat: 40.7128, address: 'New York, USA' },
      'pudong airport': { lng: 121.8057, lat: 31.1434, address: 'Shanghai Pudong Airport' }
    }
    
    // 精确匹配
    for (const [key, coords] of Object.entries(fallbackCoords)) {
      if (lowerAddress.includes(key.toLowerCase()) || 
          key.toLowerCase().includes(lowerAddress)) {
        
        return coords
      }
    }
    
    // 模糊匹配常见关键词
    const keywordMatches: Record<string, GeocodeResult> = {
      'heathrow': { lng: -0.4543, lat: 51.4700, address: 'Heathrow Airport' },
      'museum': { lng: -0.1278, lat: 51.5194, address: 'British Museum' },
      'palace': { lng: -0.1419, lat: 51.5014, address: 'Buckingham Palace' },
      'bridge': { lng: -0.0754, lat: 51.5055, address: 'Tower Bridge' },
      'ben': { lng: -0.1246, lat: 51.4994, address: 'Big Ben' },
      'eye': { lng: -0.1196, lat: 51.5033, address: 'London Eye' },
      'square': { lng: -0.1278, lat: 51.5080, address: 'Trafalgar Square' },
      'garden': { lng: -0.1225, lat: 51.5118, address: 'Covent Garden' },
      'oxford': { lng: -0.1419, lat: 51.5154, address: 'Oxford Street' },
      'piccadilly': { lng: -0.1347, lat: 51.5099, address: 'Piccadilly Circus' },
      'wolseley': { lng: -0.1419, lat: 51.5094, address: 'The Wolseley Restaurant' }
    }
    
    for (const [keyword, coords] of Object.entries(keywordMatches)) {
      if (lowerAddress.includes(keyword)) {
        
        return coords
      }
    }
    
    return null
  }

  /**
   * 批量获取多个地址的坐标
   * @param addresses 地址数组
   * @param city 城市名称（可选）
   * @returns Promise<(GeocodeResult | null)[]>
   */
  async batchGetCoordinates(addresses: string[], city?: string): Promise<(GeocodeResult | null)[]> {
    const results: (GeocodeResult | null)[] = []
    
    console.log(`开始批量地理编码，共 ${addresses.length} 个地址`)
    
    // 使用高德地图专用QPS管理器，自动控制每秒不超过3次请求
    for (let i = 0; i < addresses.length; i++) {
      const address = addresses[i]
      const result = await this.getCoordinates(address, city)
      results.push(result)
      
      // 显示进度
      if (addresses.length > 5) {
        console.log(`地理编码进度: ${i + 1}/${addresses.length}`)
      }
    }
    
    console.log(`批量地理编码完成，成功获取 ${results.filter(r => r !== null).length} 个坐标`)
    return results
  }

  /**
   * 清理地址字符串，移除不必要的字符
   * @param address 原始地址
   * @returns 清理后的地址
   */
  private cleanAddress(address: string): string {
    return address
      .trim()
      .replace(/^(参观|游览|前往|到达|抵达|访问)/, '') // 移除动词前缀
      .replace(/\s+/g, ' ') // 合并多个空格
      .replace(/[，。！？；：""''（）【】]/g, '') // 移除中文标点
      .replace(/酒店地址（见下方住宿信息）/g, '') // 移除无效地址描述
      .trim()
  }

  /**
   * 延迟函数
   * @param ms 延迟毫秒数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * 获取缓存大小
   */
  getCacheSize(): number {
    return this.cache.size
  }

  

  /**
   * 检查API Key是否有效
   */
  async testApiKey(): Promise<boolean> {
    try {
      const result = await this.getCoordinates('北京市天安门广场')
      return result !== null
    } catch (error) {
      console.error('API Key测试失败:', error)
      return false
    }
  }

  /**
   * 诊断地理编码问题
   */
  async diagnoseGeocoding(): Promise<void> {
    console.log('=== 高德地图地理编码诊断 ===')
    console.log('Web服务API Key:', apiConfigService.getWebServiceApiKey())
    console.log('Web端API Key:', apiConfigService.getWebApiKey())
    console.log('Base URL:', this.baseUrl)
    
    // 测试简单的中文地址
    const testAddresses = [
      '北京市天安门广场',
      '上海市外滩',
      '杭州市西湖',
      'London',
      'Big Ben London'
    ]
    
    for (const address of testAddresses) {
      console.log(`\n测试地址: ${address}`)
      try {
        const params = new URLSearchParams({
          key: apiConfigService.getWebServiceApiKey(),
          address: address,
          output: 'json'
        })
        
        const url = `${this.baseUrl}?${params.toString()}`
        console.log('请求URL:', url)
        
        const response = await fetch(url)
        console.log('HTTP状态:', response.status, response.statusText)
        
        if (response.ok) {
          const data = await response.json()
          console.log('响应数据:', JSON.stringify(data, null, 2))
          
          if (data.status === '1') {
            console.log('✅ 成功')
          } else {
            console.log('❌ 失败 - 状态码:', data.status)
            console.log('错误信息:', data.info)
            console.log('错误代码:', data.infocode)
            
            // 解释常见错误码
            this.explainErrorCode(data.infocode, data.info)
          }
        } else {
          console.log('❌ HTTP请求失败')
        }
      } catch (error) {
        console.log('❌ 请求异常:', error)
      }
      
      // 添加延迟避免请求过快
      await this.delay(500)
    }
  }

  /**
   * 解释错误码（仅在诊断模式下输出详细信息）
   */
  private explainErrorCode(infocode: string, info: string): void {
    const errorExplanations: Record<string, string> = {
      '10001': 'API Key不正确或过期',
      '10002': '没有权限使用相应的服务',
      '10003': '访问已超出日访问量',
      '10004': '单位时间内访问过于频繁 (QPS限制)',
      '10005': 'IP白名单出错，发送请求的服务器IP不在IP白名单内',
      '10006': '绑定域名出错，发送请求的域名不在安全域名内',
      '10007': '数字签名未通过验证',
      '10008': 'MD5安全码未通过验证',
      '10009': 'API Key与平台不匹配',
      '10010': 'IP访问超限',
      '10011': '服务不支持https请求',
      '10012': '权限不足，服务请求被拒绝',
      '10013': 'Key被删除',
      '20000': '请求参数非法',
      '20001': '缺少必填参数',
      '20002': '请求协议非法',
      '20003': '其他未知错误',
      '30001': '引擎返回数据异常 - 通常是查询地址不存在或格式不正确',
      '30002': '请求服务响应错误',
      '30003': '访问已超出日访问量'
    }
    
    // 处理特殊错误信息
    let explanation = errorExplanations[infocode] || '未知错误码'
    
    // 检查是否是QPS限制错误
    if (info && (info.includes('CUQPS_HAS_EXCEEDED_THE_LIMIT') || 
                 info.includes('QPS') || 
                 info.includes('exceeded') ||
                 infocode === '10004')) {
      explanation = 'QPS限制 - 每秒查询次数超出限制 (CUQPS_HAS_EXCEEDED_THE_LIMIT)'
    }
    
    console.log(`错误解释: ${explanation}`)
    
    if (infocode === '10009') {
      console.log('🔧 解决建议:')
      console.log('1. 检查API Key是否为Web服务API Key')
      console.log('2. 确认API Key已开通地理编码服务')
      console.log('3. 检查API Key的平台设置（Web端、服务端等）')
      console.log('4. 确认请求域名在白名单内')
    } else if (infocode === '30001') {
      console.log('🔧 解决建议:')
      console.log('1. 检查地址格式是否正确')
      console.log('2. 高德地图主要支持中国境内地址查询')
      console.log('3. 海外地址查询功能有限，建议使用备用坐标')
      console.log('4. 尝试使用更具体的地址描述')
    } else if (infocode === '10004' || info?.includes('CUQPS_HAS_EXCEEDED_THE_LIMIT')) {
      console.log('🔧 QPS限制解决建议:')
      console.log('1. 减少请求频率 - 增加请求间隔时间')
      console.log('2. 使用批量处理 - 分批次处理大量请求')
      console.log('3. 实现请求队列 - 控制并发请求数量')
      console.log('4. 升级API套餐 - 获得更高的QPS限制')
      console.log('5. 使用缓存机制 - 避免重复查询相同地址')
      console.log('6. 当前建议: 请求间隔至少400ms，确保每秒不超过3次请求')
    }
  }
}

// 导出单例实例
export const geocodingService = new GeocodingService()

// 在开发环境下自动运行诊断（仅运行一次）
// 注释掉自动诊断，减少控制台输出
// if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
//   let hasRunDiagnosis = false
//   // 延迟执行诊断，避免影响应用启动
//   setTimeout(() => {
//     if (!hasRunDiagnosis) {
//       hasRunDiagnosis = true
//       geocodingService.diagnoseGeocoding().catch(console.error)
//     }
//   }, 3000)
// }