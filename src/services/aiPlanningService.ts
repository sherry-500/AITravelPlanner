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
      title: `${request.destination}${days}日游`,
      destination: request.destination,
      startDate: request.startDate,
      endDate: request.endDate,
      budget: request.budget,
      travelers: request.travelers,
      preferences: request.preferences,
      itinerary,
      expenses: [],
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  private generateDayItinerary(day: number, date: Date, request: PlanningRequest): DayItinerary {
    const activities: Activity[] = []
    
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
    if (activities.length === 0) {
      activities.push(
        {
          id: `${day}-default-1`,
          time: '09:00',
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
}

export const aiPlanningService = new AIPlanningService()