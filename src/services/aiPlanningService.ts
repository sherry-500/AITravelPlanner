import { PlanningRequest, TravelPlan, DayItinerary, Activity, Accommodation } from '../types'

// DeepSeek AI 规划服务
class AIPlanningService {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY || ''
    this.baseUrl = import.meta.env.VITE_DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1'
    
    // 调试信息
    console.log('DeepSeek API 配置 [UPDATED]:')
    console.log('API Key:', this.apiKey ? `${this.apiKey.substring(0, 10)}...` : '未配置')
    console.log('Base URL:', this.baseUrl)
    console.log('Full API Key for debug:', this.apiKey)
  }

  async generateItinerary(request: PlanningRequest): Promise<TravelPlan> {
    try {
      // 如果没有 API Key，使用模拟数据
      if (!this.apiKey || this.apiKey === 'your_deepseek_api_key_here') {
        console.warn('DeepSeek API Key 未配置，使用模拟数据')
        return this.generateMockPlan(request)
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

**要求：**
1. 制定每天的详细行程安排，包括时间、地点、活动内容
2. 推荐具体的景点、餐厅、住宿
3. 估算各项费用，确保总费用在预算范围内
4. 考虑交通时间和实际可行性
5. 根据偏好推荐相应的活动类型

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
          "location": "具体地址",
          "type": "sightseeing|dining|transport|leisure|shopping",
          "estimatedCost": 100,
          "duration": 120,
          "tips": "实用建议"
        }
      ],
      "accommodation": {
        "name": "酒店名称",
        "address": "酒店地址",
        "estimatedCost": 300,
        "rating": 4.5,
        "amenities": ["WiFi", "早餐"]
      }
    }
  ],
  "totalEstimatedCost": 2000,
  "tips": ["旅行建议1", "旅行建议2"]
}

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

  private convertAIResponseToPlan(aiResponse: any, request: PlanningRequest): TravelPlan {
    const plan: TravelPlan = {
      id: Date.now().toString(),
      userId: 'current-user',
      title: aiResponse.title || `${request.origin}到${request.destination}之旅`,
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

    // 转换行程数据
    if (aiResponse.itinerary && Array.isArray(aiResponse.itinerary)) {
      plan.itinerary = aiResponse.itinerary.map((day: any, index: number) => {
        const dayItinerary: DayItinerary = {
          day: day.day || index + 1,
          date: day.date || this.getDateString(request.startDate, index),
          activities: []
        }

        // 转换活动数据
        if (day.activities && Array.isArray(day.activities)) {
          dayItinerary.activities = day.activities.map((activity: any, actIndex: number) => ({
            id: `${dayItinerary.day}-${actIndex + 1}`,
            time: activity.time || '09:00',
            title: activity.title || '活动',
            description: activity.description || '',
            location: activity.location || request.destination,
            type: activity.type || 'sightseeing',
            estimatedCost: activity.estimatedCost || 0,
            duration: activity.duration || 120,
            tips: activity.tips
          }))
        }

        // 转换住宿数据
        if (day.accommodation) {
          dayItinerary.accommodation = {
            id: `hotel-${dayItinerary.day}`,
            name: day.accommodation.name || `${request.destination}酒店`,
            address: day.accommodation.address || request.destination,
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

    // 如果 AI 没有返回有效的行程数据，使用备用方案
    if (plan.itinerary.length === 0) {
      console.warn('AI 返回的行程数据无效，使用备用方案')
      return this.generateMockPlan(request)
    }

    return plan
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