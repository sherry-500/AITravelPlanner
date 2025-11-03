// 用户相关类型
export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  preferences?: TravelPreferences
  createdAt: string
  updatedAt: string
}

// 旅行偏好
export interface TravelPreferences {
  budgetRange: [number, number]
  travelStyle: 'luxury' | 'comfort' | 'budget' | 'backpacker'
  interests: string[]
  accommodationType: 'hotel' | 'hostel' | 'apartment' | 'resort'
  transportPreference: 'flight' | 'train' | 'car' | 'bus'
}

// 旅行计划
export interface TravelPlan {
  id: string
  userId: string
  title: string
  origin: string
  destination: string
  startDate: string
  endDate: string
  budget: number
  travelers: number
  preferences: string[]
  transportMode: 'flight' | 'train' | 'car' | 'bus' | 'mixed'
  itinerary: DayItinerary[]
  expenses: Expense[]
  status: 'draft' | 'confirmed' | 'completed'
  createdAt: string
  updatedAt: string
}

// 每日行程
export interface DayItinerary {
  day: number
  date: string
  activities: Activity[]
  accommodation?: Accommodation
  transportation?: Transportation[]
}

// 活动
export interface Activity {
  id: string
  title: string
  time: string
  type: 'sightseeing' | 'dining' | 'shopping' | 'entertainment' | 'leisure' | 'accommodation' | 'transport'
  location: string
  duration: number
  estimatedCost: number
  description: string
  rating?: number
  images?: string[]
  tips?: string[]
}

// 住宿
export interface Accommodation {
  id: string
  name: string
  address: string
  checkIn: string
  checkOut: string
  estimatedCost: number
  rating: number
  amenities: string[]
}

// 交通
export interface Transportation {
  id: string
  type: 'flight' | 'train' | 'bus' | 'taxi' | 'metro' | 'walk'
  from: Location
  to: Location
  departureTime: string
  arrivalTime: string
  cost: number
  duration: number
  provider?: string
  bookingInfo?: string
}

// 位置信息
export interface Location {
  name: string
  address: string
  latitude: number
  longitude: number
  city: string
  country: string
}

// 费用记录
export interface Expense {
  id: string
  planId: string
  category: 'accommodation' | 'transportation' | 'food' | 'attraction' | 'shopping' | 'other'
  amount: number
  currency: string
  description: string
  date: string
  location?: string
  receipt?: string
}

// 语音识别结果
export interface VoiceRecognitionResult {
  text: string
  confidence: number
  timestamp: string
}

// AI 规划请求
export interface PlanningRequest {
  origin: string
  destination: string
  startDate: string
  endDate: string
  budget: number
  travelers: number
  preferences: string[]
  transportMode: 'flight' | 'train' | 'car' | 'bus' | 'mixed'
  additionalRequirements?: string
}

// AI 规划响应
export interface PlanningResponse {
  plan: TravelPlan
  suggestions: string[]
  alternatives?: Partial<TravelPlan>[]
}