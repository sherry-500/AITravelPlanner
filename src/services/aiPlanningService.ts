import { PlanningRequest, TravelPlan, DayItinerary, Activity, Accommodation } from '../types'

// 模拟 AI 规划服务
class AIPlanningService {
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async generateItinerary(request: PlanningRequest): Promise<TravelPlan> {
    // 模拟 API 调用延迟
    await this.delay(3000)

    // 生成模拟数据
    const plan = this.generateMockPlan(request)
    
    return plan
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