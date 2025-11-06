// 地点验证工具类
export class LocationValidator {
  // 模糊地址模式
  private static readonly INVALID_PATTERNS = [
    /酒店附近/i,
    /景区内/i,
    /市中心(?!.*路|.*街|.*广场|.*大厦|.*商场)/i, // 允许具体的市中心地址
    /当地/i,
    /附近/i,
    /周边/i,
    /见下方/i,
    /目的地/i,
    /机场附近/i,
    /火车站附近/i,
    /^餐厅$/i,
    /^酒店$/i,
    /^商场$/i,
    /^公园$/i,
    /待定/i,
    /^景点$/i,
    /^博物馆$/i,
    /^广场$/i,
    /^车站$/i,
    /^机场$/i,
    /地址不详/i,
    /具体地址/i,
    /详细地址/i
  ]

  // 通用词汇（单独出现时无效）
  private static readonly GENERIC_TERMS = [
    '餐厅', '酒店', '商场', '公园', '景点', '博物馆', '广场', 
    '车站', '机场', '码头', '港口', '市场', '超市', '银行',
    'restaurant', 'hotel', 'mall', 'park', 'museum', 'square',
    'station', 'airport', 'market', 'bank'
  ]

  /**
   * 验证地点名称是否有效
   */
  static isValidLocation(location: string): boolean {
    if (!location || typeof location !== 'string') {
      return false
    }

    const cleanedLocation = location.trim()

    // 检查长度
    if (cleanedLocation.length < 3) {
      return false
    }

    // 检查是否匹配无效模式
    for (const pattern of this.INVALID_PATTERNS) {
      if (pattern.test(cleanedLocation)) {
        return false
      }
    }

    // 检查是否只包含通用词汇
    if (this.GENERIC_TERMS.includes(cleanedLocation.toLowerCase())) {
      return false
    }

    return true
  }

  /**
   * 清理和验证地点信息
   */
  static cleanAndValidate(location: any): string | null {
    if (!location || typeof location !== 'string') {
      return null
    }

    const cleanedLocation = location.trim()
    
    if (this.isValidLocation(cleanedLocation)) {
      return cleanedLocation
    }

    console.warn(`检测到无效地址: "${cleanedLocation}"`)
    return null
  }

  /**
   * 批量验证地点列表
   */
  static validateLocationList(locations: string[]): { valid: string[]; invalid: string[] } {
    const valid: string[] = []
    const invalid: string[] = []

    locations.forEach(location => {
      if (this.isValidLocation(location)) {
        valid.push(location)
      } else {
        invalid.push(location)
      }
    })

    return { valid, invalid }
  }

  /**
   * 生成地点验证报告
   */
  static generateValidationReport(locations: string[]): string {
    const { valid, invalid } = this.validateLocationList(locations)
    
    let report = `地点验证报告:\n`
    report += `✅ 有效地点 (${valid.length}个):\n`
    valid.forEach(loc => report += `  - ${loc}\n`)
    
    if (invalid.length > 0) {
      report += `❌ 无效地点 (${invalid.length}个):\n`
      invalid.forEach(loc => report += `  - ${loc}\n`)
    }

    return report
  }
}