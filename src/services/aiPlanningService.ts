import { PlanningRequest, TravelPlan, DayItinerary, Activity, Accommodation } from '../types'
import { LocationValidator } from '../utils/locationValidator'

// DeepSeek AI 规划服务
class AIPlanningService {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY || ''
    this.baseUrl = import.meta.env.VITE_DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1'
    
    // 调试信息
    console.log('DeepSeek API 配置:')
    console.log('API Key:', this.apiKey)
    console.log('Base URL:', this.baseUrl)
  }

  async generateItinerary(request: PlanningRequest): Promise<TravelPlan> {
    try {
      // 如果没有 API Key，使用模拟数据
      if (!this.apiKey || this.apiKey === 'your_deepseek_api_key_here') {
        console.warn('DeepSeek API Key 未配置，使用模拟数据')
        // return this.generateMockPlan(request)
        this.apiKey = 'sk-627a03d5a8ed441c966e0f58e610f58e'
      }

      // 调用 DeepSeek API 生成行程
      const aiGeneratedPlan = await this.callDeepSeekAPI(request)
      return aiGeneratedPlan
    } catch (error) {
      console.error('AI 行程生成失败，使用模拟数据:', error)
      return this.generateMockPlan(request)
    }
  }

  private async callDeepSeekAPI(request: PlanningRequest): Promise<TravelPlan> {
    const prompt = this.buildPrompt(request)
    
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的旅行规划师，擅长根据用户需求制定详细的旅行计划。请以JSON格式返回旅行计划，确保数据结构完整且实用。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: 'json_object' }
      })
    })

    if (!response.ok) {
      throw new Error(`DeepSeek API 请求失败: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const aiResponse = data.choices[0]?.message?.content

    if (!aiResponse) {
      throw new Error('DeepSeek API 返回空响应')
    }

    // 解析 AI 返回的 JSON 并转换为我们的数据格式
    const parsedPlan = JSON.parse(aiResponse)
    return this.convertAIResponseToPlan(parsedPlan, request)
  }

  private buildPrompt(request: PlanningRequest): string {
    const startDate = new Date(request.startDate)
    const endDate = new Date(request.endDate)
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

    return `请为我制定一个详细的旅行计划，要求如下：

**基本信息：**
- 出发地：${request.origin}
- 目的地：${request.destination}
- 出发日期：${request.startDate}
- 结束日期：${request.endDate}
- 旅行天数：${days}天
- 人数：${request.travelers}人
- 预算：${request.budget}元
- 交通方式：${this.getTransportModeText(request.transportMode)}
- 偏好：${request.preferences.join('、')}

**重要要求：**
1. 制定每天的详细行程安排，包括时间、地点、活动内容
2. 推荐具体的景点、餐厅、住宿
3. 估算各项费用，确保总费用在预算范围内
4. 考虑交通时间和实际可行性
5. 根据偏好推荐相应的活动类型

**地点命名规范（非常重要）：**
- 所有地点必须使用具体、准确的名称，能够在地图API中查询到坐标
- ✅ 正确示例：
  * "大英博物馆"、"British Museum"
  * "白金汉宫"、"Buckingham Palace"
  * "伦敦塔桥"、"Tower Bridge"
  * "上海外滩"、"外滩观光隧道"
  * "北京故宫博物院"、"天安门广场"
  * "杭州西湖风景名胜区"
  * "The Wolseley餐厅"、"Piccadilly Circus"
- ❌ 禁止使用模糊地点：
  * "酒店附近餐厅"、"景区内餐厅"
  * "市中心商场"、"当地特色餐厅"
  * "附近公园"、"周边景点"
  * "酒店地址（见下方住宿信息）"
  * "目的地火车站"、"机场附近"

**地址格式要求：**
- 中国境内地点：使用完整的中文地址，包含省市区和具体地点名称
- 海外地点：使用英文正式名称，包含城市和国家信息
- 餐厅：必须是真实存在的餐厅名称，不能使用等模糊描述
- 酒店：必须是具体的酒店名称和地址，不能使用"市中心酒店"等模糊描述
- 景点：使用官方正式名称，包含完整地址信息

**返回格式（JSON）：**
{
  "title": "行程标题",
  "summary": "行程概述",
  "itinerary": [
    {
      "day": 1,
      "date": "2024-01-01",
      "theme": "第一天主题",
      "activities": [
        {
          "time": "09:00",
          "title": "活动标题",
          "description": "详细描述",
          "location": "具体地址（必须是真实可查询的地点名称）",
          "type": "sightseeing|dining|transport|leisure|shopping",
          "estimatedCost": 100,
          "duration": 120,
          "tips": "实用建议"
        }
      ],
      "accommodation": {
        "name": "具体酒店名称（必须是真实酒店）",
        "address": "完整酒店地址",
        "estimatedCost": 300,
        "rating": 4.5,
        "amenities": ["WiFi", "早餐"]
      }
    }
  ],
  "totalEstimatedCost": 2000,
  "tips": ["旅行建议1", "旅行建议2"]
}

**特别提醒：**
- 每个location字段必须是可以在高德地图API中查询到坐标的真实地点
- 不要使用任何相对位置描述（如"附近"、"周边"、"当地"等）
- 所有地点名称必须准确、具体、可定位
- 如果不确定具体地点名称，请选择该城市的知名地标作为替代

请确保返回的是有效的JSON格式，所有费用估算要合理且符合当地实际情况。`
  }

  private getTransportModeText(mode: string): string {
    const modeMap = {
      flight: '飞机',
      train: '火车/高铁',
      car: '自驾',
      bus: '大巴',
      mixed: '多种交通方式'
    }
    return modeMap[mode as keyof typeof modeMap] || mode
  }

  /**
   * 验证和清理AI返回的行程数据
   */
  private validateAndCleanPlan(plan: any): any {
    // 确保基本结构存在
    if (!plan.itinerary || !Array.isArray(plan.itinerary)) {
      throw new Error('行程数据格式错误：缺少itinerary数组')
    }

    // 清理和验证每天的行程
    const cleanedItinerary = plan.itinerary.map((day: any, index: number) => {
      const dayNumber = day.day || index + 1
      const activities = Array.isArray(day.activities) ? day.activities : []

      // 清理活动数据
      const cleanedActivities = activities.map((activity: any) => {
        const cleanedLocation = this.cleanAndValidateLocation(activity.location)
        
        return {
          time: activity.time || '09:00',
          title: activity.title || activity.name || '未命名活动',
          description: activity.description || '',
          location: cleanedLocation,
          type: this.validateActivityType(activity.type),
          estimatedCost: this.parseNumber(activity.estimatedCost) || 0,
          duration: this.parseNumber(activity.duration) || 60,
          tips: activity.tips || ''
        }
      }).filter(activity => activity.location && activity.location !== '地址待定') // 过滤掉无效地址的活动

      return {
        day: dayNumber,
        date: day.date || this.calculateDate(dayNumber),
        theme: day.theme || `第${dayNumber}天`,
        activities: cleanedActivities,
        accommodation: day.accommodation ? {
          name: day.accommodation.name || '待定酒店',
          address: this.cleanAndValidateLocation(day.accommodation.address),
          estimatedCost: this.parseNumber(day.accommodation.estimatedCost) || 0,
          rating: this.parseNumber(day.accommodation.rating) || 0,
          amenities: Array.isArray(day.accommodation.amenities) ? day.accommodation.amenities : []
        } : undefined
      }
    })

    return {
      title: plan.title || '旅行计划',
      summary: plan.summary || '',
      itinerary: cleanedItinerary,
      totalEstimatedCost: this.parseNumber(plan.totalEstimatedCost) || 0,
      tips: Array.isArray(plan.tips) ? plan.tips : []
    }
  }

  /**
   * 清理和验证地点信息
   */
  private cleanAndValidateLocation(location: any): string {
    const validLocation = LocationValidator.cleanAndValidate(location)
    return validLocation || '地址待定'
  }

  private convertAIResponseToPlan(aiResponse: any, request: PlanningRequest): TravelPlan {
    // 首先验证和清理AI返回的数据
    const validatedPlan = this.validateAndCleanPlan(aiResponse)
    
    const plan: TravelPlan = {
      id: Date.now().toString(),
      userId: 'current-user',
      title: validatedPlan.title || `${request.origin}到${request.destination}之旅`,
      origin: request.origin,
      destination: request.destination,
      startDate: request.startDate,
      endDate: request.endDate,
      budget: request.budget,
      travelers: request.travelers,
      preferences: request.preferences,
      transportMode: request.transportMode,
      itinerary: [],
      expenses: [],
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // 转换验证后的行程数据
    if (validatedPlan.itinerary && Array.isArray(validatedPlan.itinerary)) {
      plan.itinerary = validatedPlan.itinerary.map((day: any, index: number) => {
        const dayItinerary: DayItinerary = {
          day: day.day || index + 1,
          date: day.date || this.getDateString(request.startDate, index),
          activities: []
        }

        // 转换活动数据（已经过验证和清理）
        if (day.activities && Array.isArray(day.activities)) {
          dayItinerary.activities = day.activities
            .filter((activity: any) => activity.location && activity.location !== '地址待定') // 过滤无效地址
            .map((activity: any, actIndex: number) => ({
              id: `${dayItinerary.day}-${actIndex + 1}`,
              time: activity.time || '09:00',
              title: activity.title || '活动',
              description: activity.description || '',
              location: activity.location,
              type: activity.type || 'sightseeing',
              estimatedCost: activity.estimatedCost || 0,
              duration: activity.duration || 120,
              tips: activity.tips
            }))
        }

        // 转换住宿数据（已经过验证和清理）
        if (day.accommodation && day.accommodation.address && day.accommodation.address !== '地址待定') {
          dayItinerary.accommodation = {
            id: `hotel-${dayItinerary.day}`,
            name: day.accommodation.name || `${request.destination}酒店`,
            address: day.accommodation.address,
            checkIn: '15:00',
            checkOut: '12:00',
            estimatedCost: day.accommodation.estimatedCost || 300,
            rating: day.accommodation.rating || 4.0,
            amenities: day.accommodation.amenities || ['WiFi']
          }
        }

        return dayItinerary
      })
    }

    // 检查是否有有效的活动
    const totalActivities = plan.itinerary.reduce((sum, day) => sum + day.activities.length, 0)
    if (totalActivities === 0) {
      console.warn('AI 返回的行程数据中没有有效的活动，使用备用方案')
      return this.generateMockPlan(request)
    }

    // 生成地点验证报告
    const allLocations: string[] = []
    plan.itinerary.forEach(day => {
      day.activities.forEach(activity => {
        if (activity.location) allLocations.push(activity.location)
      })
      if (day.accommodation?.address) {
        allLocations.push(day.accommodation.address)
      }
    })

    if (allLocations.length > 0) {
      const report = LocationValidator.generateValidationReport(allLocations)
      console.log(report)
    }

    console.log(`✅ AI行程验证通过，共 ${plan.itinerary.length} 天，${totalActivities} 个有效活动`)
    return plan
  }

  /**
   * 验证活动类型
   */
  private validateActivityType(type: any): string {
    const validTypes = ['sightseeing', 'dining', 'transport', 'leisure', 'shopping']
    return validTypes.includes(type) ? type : 'sightseeing'
  }

  /**
   * 解析数字
   */
  private parseNumber(value: any): number {
    const num = parseFloat(value)
    return isNaN(num) ? 0 : num
  }

  /**
   * 计算日期
   */
  private calculateDate(dayNumber: number): string {
    const date = new Date()
    date.setDate(date.getDate() + dayNumber - 1)
    return date.toISOString().split('T')[0]
  }

  private getDateString(startDate: string, dayOffset: number): string {
    const date = new Date(startDate)
    date.setDate(date.getDate() + dayOffset)
    return date.toISOString().split('T')[0]
  }

  private generateMockPlan(request: PlanningRequest): TravelPlan {
    const startDate = new Date(request.startDate)
    const endDate = new Date(request.endDate)
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

    const itinerary: DayItinerary[] = []
    
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate)
      currentDate.setDate(startDate.getDate() + i)
      
      const dayItinerary = this.generateDayItinerary(i + 1, currentDate, request)
      itinerary.push(dayItinerary)
    }

    return {
      id: Date.now().toString(),
      userId: 'current-user',
      title: `${request.origin}到${request.destination}${days}日游`,
      origin: request.origin,
      destination: request.destination,
      startDate: request.startDate,
      endDate: request.endDate,
      budget: request.budget,
      travelers: request.travelers,
      preferences: request.preferences,
      transportMode: request.transportMode,
      itinerary,
      expenses: [],
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  private generateDayItinerary(day: number, date: Date, request: PlanningRequest): DayItinerary {
    const activities: Activity[] = []
    
    // 第一天添加交通活动
    if (day === 1) {
      const transportActivity = this.generateTransportActivity(request)
      activities.push(transportActivity)
    }
    
    // 根据偏好生成活动
    if (request.preferences.includes('美食')) {
      activities.push({
        id: `${day}-food-1`,
        time: '12:00',
        title: '当地特色餐厅',
        description: '品尝当地特色美食',
        location: `${request.destination}美食街`,
        type: 'dining',
        estimatedCost: Math.floor(request.budget * 0.15 / request.travelers),
        duration: 90,
      })
    }
    
    if (request.preferences.includes('文化')) {
      activities.push({
        id: `${day}-culture-1`,
        time: '09:00',
        title: '历史文化景点',
        description: '探索当地历史文化',
        location: `${request.destination}博物馆`,
        type: 'sightseeing',
        estimatedCost: Math.floor(request.budget * 0.1 / request.travelers),
        duration: 180,
      })
    }
    
    if (request.preferences.includes('自然')) {
      activities.push({
        id: `${day}-nature-1`,
        time: '14:30',
        title: '自然风光',
        description: '欣赏自然美景',
        location: `${request.destination}公园`,
        type: 'sightseeing',
        estimatedCost: Math.floor(request.budget * 0.05 / request.travelers),
        duration: 120,
      })
    }

    // 默认活动
    if (activities.length === (day === 1 ? 1 : 0)) {
      activities.push(
        {
          id: `${day}-default-1`,
          time: day === 1 ? '10:00' : '09:00',
          title: '景点游览',
          description: '游览当地著名景点',
          location: `${request.destination}景区`,
          type: 'sightseeing',
          estimatedCost: Math.floor(request.budget * 0.2 / request.travelers),
          duration: 180,
        },
        {
          id: `${day}-default-2`,
          time: '14:00',
          title: '休闲时光',
          description: '自由活动时间',
          location: `${request.destination}市中心`,
          type: 'leisure',
          estimatedCost: Math.floor(request.budget * 0.1 / request.travelers),
          duration: 120,
        }
      )
    }

    return {
      day,
      date: date.toISOString().split('T')[0],
      activities,
      accommodation: day === 1 ? {
        id: `hotel-${day}`,
        name: `${request.destination}精品酒店`,
        address: `${request.destination}市中心`,
        checkIn: '15:00',
        checkOut: '12:00',
        estimatedCost: Math.floor(request.budget * 0.3 / request.travelers),
        rating: 4.5,
        amenities: ['WiFi', '早餐', '健身房'],
      } : undefined,
    }
  }

  private generateTransportActivity(request: PlanningRequest): Activity {
    const transportInfo = {
      flight: {
        title: `${request.origin} ✈️ ${request.destination}`,
        description: `乘坐航班从${request.origin}飞往${request.destination}`,
        cost: Math.floor(request.budget * 0.25 / request.travelers),
        duration: 180,
        time: '08:00'
      },
      train: {
        title: `${request.origin} 🚄 ${request.destination}`,
        description: `乘坐高铁/火车从${request.origin}前往${request.destination}`,
        cost: Math.floor(request.budget * 0.15 / request.travelers),
        duration: 300,
        time: '07:30'
      },
      car: {
        title: `${request.origin} 🚗 ${request.destination}`,
        description: `自驾从${request.origin}前往${request.destination}`,
        cost: Math.floor(request.budget * 0.1 / request.travelers),
        duration: 480,
        time: '06:00'
      },
      bus: {
        title: `${request.origin} 🚌 ${request.destination}`,
        description: `乘坐大巴从${request.origin}前往${request.destination}`,
        cost: Math.floor(request.budget * 0.08 / request.travelers),
        duration: 420,
        time: '07:00'
      },
      mixed: {
        title: `${request.origin} 🔄 ${request.destination}`,
        description: `多种交通方式组合前往${request.destination}`,
        cost: Math.floor(request.budget * 0.18 / request.travelers),
        duration: 240,
        time: '08:00'
      }
    }

    const transport = transportInfo[request.transportMode]
    
    return {
      id: '1-transport-1',
      time: transport.time,
      title: transport.title,
      description: transport.description,
      location: `${request.origin} → ${request.destination}`,
      type: 'transport',
      estimatedCost: transport.cost,
      duration: transport.duration,
    }
  }
}

export const aiPlanningService = new AIPlanningService()