import axios from 'axios'
import { PlanningRequest, PlanningResponse, TravelPlan, DayItinerary, Activity, Accommodation } from '../types'

// 模拟 AI 规划服务
class AIPlanningService {
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async generateItinerary(request: PlanningRequest): Promise<PlanningResponse> {
    // 模拟 API 调用延迟
    await this.delay(3000)

    // 生成模拟数据
    const plan = this.generateMockPlan(request)
    
    return {
      plan,
      suggestions: [
        '建议提前预订热门景点门票',
        '当地交通建议使用地铁或公交',
        '推荐下载当地地图和翻译应用',
        '注意当地天气变化，准备合适衣物',
      ],
      alternatives: [
        {
          ...plan,
          id: plan.id + '_alt1',
          title: plan.title + ' (经济版)',
          budget: plan.budget * 0.7,
        },
        {
          ...plan,
          id: plan.id + '_alt2',
          title: plan.title + ' (豪华版)',
          budget: plan.budget * 1.5,
        },
      ],
    }
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
    const activities = this.generateActivities(day, request)
    const accommodation = day < 7 ? this.generateAccommodation(request) : undefined
    
    const totalCost = activities.reduce((sum, activity) => sum + activity.cost, 0) + 
                     (accommodation ? accommodation.cost : 0)

    return {
      day,
      date: date.toISOString().split('T')[0],
      activities,
      accommodation,
      transportation: [],
      totalCost,
    }
  }

  private generateActivities(day: number, request: PlanningRequest): Activity[] {
    const baseActivities = this.getBaseActivities(request.destination)
    const preferenceActivities = this.getPreferenceActivities(request.preferences, request.destination)
    
    // 每天3-4个活动
    const dayActivities = [...baseActivities, ...preferenceActivities]
      .slice((day - 1) * 3, day * 3)
      .map((activity, index) => ({
        ...activity,
        id: `${day}-${index + 1}`,
        startTime: this.getActivityTime(index),
        endTime: this.getActivityTime(index + 1),
      }))

    return dayActivities
  }

  private getActivityTime(index: number): string {
    const times = ['09:00', '12:00', '15:00', '18:00', '21:00']
    return times[index] || '21:00'
  }

  private getBaseActivities(destination: string): Omit<Activity, 'id' | 'startTime' | 'endTime'>[] {
    const activities: Record<string, Omit<Activity, 'id' | 'startTime' | 'endTime'>[]> = {
      '日本': [
        {
          name: '浅草寺',
          type: 'attraction',
          location: {
            name: '浅草寺',
            address: '东京都台东区浅草2-3-1',
            latitude: 35.7148,
            longitude: 139.7967,
            city: '东京',
            country: '日本',
          },
          duration: 2,
          cost: 0,
          description: '东京最古老的寺庙，感受传统日本文化',
          rating: 4.5,
          tips: ['建议早上参观，人较少', '可以求签祈福', '附近有很多传统小吃'],
          images: ['https://example.com/sensoji1.jpg'],
        },
        {
          name: '银座购物',
          type: 'shopping',
          location: {
            name: '银座',
            address: '东京都中央区银座',
            latitude: 35.6762,
            longitude: 139.7653,
            city: '东京',
            country: '日本',
          },
          duration: 3,
          cost: 2000,
          description: '东京最繁华的购物区，各种品牌应有尽有',
          rating: 4.3,
          tips: ['周末有步行街', '可以免税购物', '有很多百货公司'],
        },
        {
          name: '筑地市场',
          type: 'restaurant',
          location: {
            name: '筑地市场',
            address: '东京都中央区筑地5-2-1',
            latitude: 35.6654,
            longitude: 139.7707,
            city: '东京',
            country: '日本',
          },
          duration: 2,
          cost: 800,
          description: '品尝最新鲜的寿司和海鲜',
          rating: 4.7,
          tips: ['早上5点开始营业', '推荐金枪鱼寿司', '需要排队'],
        },
      ],
      '巴黎': [
        {
          name: '埃菲尔铁塔',
          type: 'attraction',
          location: {
            name: '埃菲尔铁塔',
            address: 'Champ de Mars, 5 Avenue Anatole France, 75007 Paris',
            latitude: 48.8584,
            longitude: 2.2945,
            city: '巴黎',
            country: '法国',
          },
          duration: 2,
          cost: 150,
          description: '巴黎的标志性建筑，登顶俯瞰巴黎全景',
          rating: 4.6,
          tips: ['建议提前预订门票', '日落时分最美', '可以在塞纳河边拍照'],
        },
        {
          name: '卢浮宫',
          type: 'attraction',
          location: {
            name: '卢浮宫',
            address: 'Rue de Rivoli, 75001 Paris',
            latitude: 48.8606,
            longitude: 2.3376,
            city: '巴黎',
            country: '法国',
          },
          duration: 4,
          cost: 200,
          description: '世界最大的艺术博物馆，收藏无数珍品',
          rating: 4.8,
          tips: ['建议预留半天时间', '必看蒙娜丽莎', '可以租借语音导览'],
        },
      ],
      '三亚': [
        {
          name: '亚龙湾',
          type: 'attraction',
          location: {
            name: '亚龙湾',
            address: '海南省三亚市吉阳区亚龙湾',
            latitude: 18.2317,
            longitude: 109.6358,
            city: '三亚',
            country: '中国',
          },
          duration: 4,
          cost: 0,
          description: '被誉为"天下第一湾"的美丽海滩',
          rating: 4.5,
          tips: ['适合游泳和日光浴', '有各种水上运动', '注意防晒'],
        },
        {
          name: '天涯海角',
          type: 'attraction',
          location: {
            name: '天涯海角',
            address: '海南省三亚市天涯区天涯海角',
            latitude: 18.2985,
            longitude: 109.3933,
            city: '三亚',
            country: '中国',
          },
          duration: 3,
          cost: 95,
          description: '著名的爱情圣地，有"天涯"、"海角"巨石',
          rating: 4.2,
          tips: ['适合情侣游览', '可以看日落', '有很多纪念品店'],
        },
      ],
    }

    return activities[destination] || activities['日本']
  }

  private getPreferenceActivities(preferences: string[], destination: string): Omit<Activity, 'id' | 'startTime' | 'endTime'>[] {
    const preferenceMap: Record<string, Omit<Activity, 'id' | 'startTime' | 'endTime'>[]> = {
      '美食': [
        {
          name: '当地特色餐厅',
          type: 'restaurant',
          location: {
            name: '特色餐厅',
            address: '当地美食街',
            latitude: 35.6762,
            longitude: 139.7653,
            city: destination,
            country: '当地',
          },
          duration: 1.5,
          cost: 300,
          description: '品尝地道的当地美食',
          rating: 4.4,
        },
      ],
      '购物': [
        {
          name: '当地购物中心',
          type: 'shopping',
          location: {
            name: '购物中心',
            address: '商业区',
            latitude: 35.6762,
            longitude: 139.7653,
            city: destination,
            country: '当地',
          },
          duration: 3,
          cost: 1000,
          description: '购买当地特产和纪念品',
          rating: 4.2,
        },
      ],
      '动漫': [
        {
          name: '动漫主题公园',
          type: 'entertainment',
          location: {
            name: '动漫公园',
            address: '娱乐区',
            latitude: 35.6762,
            longitude: 139.7653,
            city: destination,
            country: '当地',
          },
          duration: 4,
          cost: 500,
          description: '体验动漫文化，适合动漫爱好者',
          rating: 4.6,
        },
      ],
    }

    const activities: Omit<Activity, 'id' | 'startTime' | 'endTime'>[] = []
    preferences.forEach(pref => {
      if (preferenceMap[pref]) {
        activities.push(...preferenceMap[pref])
      }
    })

    return activities
  }

  private generateAccommodation(request: PlanningRequest): Accommodation {
    const budgetLevel = request.budget > 8000 ? 'luxury' : request.budget > 3000 ? 'comfort' : 'budget'
    
    const accommodations = {
      luxury: {
        name: '豪华酒店',
        type: 'hotel' as const,
        cost: 800,
        rating: 4.8,
        amenities: ['免费WiFi', '健身房', '游泳池', '水疗中心', '24小时客房服务'],
      },
      comfort: {
        name: '舒适酒店',
        type: 'hotel' as const,
        cost: 400,
        rating: 4.3,
        amenities: ['免费WiFi', '健身房', '早餐', '24小时前台'],
      },
      budget: {
        name: '经济型酒店',
        type: 'hostel' as const,
        cost: 150,
        rating: 3.8,
        amenities: ['免费WiFi', '24小时前台'],
      },
    }

    const baseAccommodation = accommodations[budgetLevel]

    return {
      id: Date.now().toString(),
      ...baseAccommodation,
      location: {
        name: baseAccommodation.name,
        address: `${request.destination}市中心`,
        latitude: 35.6762,
        longitude: 139.7653,
        city: request.destination,
        country: '当地',
      },
      checkIn: '15:00',
      checkOut: '11:00',
    }
  }
}

export const aiPlanningService = new AIPlanningService()