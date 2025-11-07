import { PlanningRequest } from '../types'
import { aiPlanningService } from './aiPlanningService'

// 语音识别智能解析服务
class VoiceRecognitionService {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY || ''
    this.baseUrl = import.meta.env.VITE_DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1'
  }

  /**
   * 使用大模型智能解析语音内容并生成表单数据
   */
  async parseVoiceInputWithAI(voiceText: string): Promise<Partial<PlanningRequest>> {
    try {
      if (!this.apiKey || this.apiKey === 'your_deepseek_api_key_here') {
        console.warn('DeepSeek API Key 未配置，使用基础解析')
        return this.parseVoiceInputBasic(voiceText)
      }

      const prompt = this.buildParsePrompt(voiceText)
      const response = await this.callDeepSeekAPI(prompt)
      
      if (response && typeof response === 'object') {
        console.log('✅ AI语音解析成功:', response)
        return response
      } else {
        console.warn('AI解析返回格式错误，使用基础解析')
        return this.parseVoiceInputBasic(voiceText)
      }
    } catch (error) {
      console.error('❌ AI语音解析失败:', error)
      return this.parseVoiceInputBasic(voiceText)
    }
  }

  /**
   * 构建AI解析提示词
   */
  private buildParsePrompt(voiceText: string): string {
    return `请分析以下语音识别内容，提取旅行计划表单所需的信息：

语音内容："${voiceText}"

请从语音内容中提取以下信息，并以JSON格式返回：
{
  "origin": "出发地（如果没有提到则为空字符串）",
  "destination": "目的地（如果没有提到则为空字符串）", 
  "transportMode": "出行方式（可选值：flight|train|car|bus|mixed，如果没有提到则为mixed）",
  "budget": "预算金额（如果没有提到则为0）",
  "travelers": "出行人数（如果没有提到则为2）",
  "preferences": ["旅行偏好数组，如：美食、购物、历史文化、自然风光等，如果没有则为空数组"],
  "additionalRequirements": "其他特殊要求（如带小孩、无障碍设施等，如果没有则为空字符串）"
}

提取规则：
1. 出发地：查找"从...出发"、"...出发"等关键词
2. 目的地：查找"去...、到..."等关键词  
3. 出行方式：查找"飞机、高铁、自驾、大巴"等关键词
4. 预算：查找"预算...元、...块钱"等关键词
5. 人数：查找"...个人、...人"等关键词
6. 偏好：从内容中识别旅游相关偏好关键词
7. 特殊要求：查找"小孩、老人、轮椅、素食"等特殊需求关键词

请确保提取的信息准确且完整，如果没有相关信息则使用默认值。`
  }

  /**
   * 调用DeepSeek API
   */
  private async callDeepSeekAPI(prompt: string): Promise<any> {
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
            content: '你是一个专业的语音内容分析助手，擅长从语音识别文本中提取结构化信息。请准确提取旅行计划相关的信息并返回JSON格式。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      })
    })

    if (!response.ok) {
      throw new Error(`DeepSeek API 请求失败: ${response.status}`)
    }

    const data = await response.json()
    const aiResponse = data.choices[0]?.message?.content

    if (!aiResponse) {
      throw new Error('DeepSeek API 返回空响应')
    }

    return JSON.parse(aiResponse)
  }

  /**
   * 基础语音解析（备用方案）
   */
  private parseVoiceInputBasic(text: string): Partial<PlanningRequest> {
    const result: Partial<PlanningRequest> = {}
    const lowerText = text.toLowerCase()

    // 解析出发地
    const originMatch = text.match(/从(.+?)(?:出发|到|去)/) || text.match(/(.+?)出发/)
    if (originMatch) {
      result.origin = originMatch[1].trim()
    }

    // 解析目的地
    const destinationMatch = text.match(/去(.+?)(?:，|,|。|\.|\s|$)/) || text.match(/到(.+?)(?:，|,|。|\.|\s|$)/)
    if (destinationMatch) {
      result.destination = destinationMatch[1].trim()
    }

    // 解析出行方式
    if (text.includes('飞机') || text.includes('坐飞机') || text.includes('航班')) {
      result.transportMode = 'flight'
    } else if (text.includes('火车') || text.includes('高铁') || text.includes('动车')) {
      result.transportMode = 'train'
    } else if (text.includes('自驾') || text.includes('开车') || text.includes('汽车')) {
      result.transportMode = 'car'
    } else if (text.includes('大巴') || text.includes('客车') || text.includes('巴士')) {
      result.transportMode = 'bus'
    } else {
      result.transportMode = 'mixed'
    }

    // 解析预算
    const budgetMatch = text.match(/预算(\d+)(?:元|块|万)/)
    if (budgetMatch) {
      const amount = parseInt(budgetMatch[1])
      result.budget = text.includes('万') ? amount * 10000 : amount
    } else {
      result.budget = 5000 // 默认预算
    }

    // 解析人数
    const peopleMatch = text.match(/(\d+)(?:个)?人/)
    if (peopleMatch) {
      result.travelers = parseInt(peopleMatch[1])
    } else {
      result.travelers = 2 // 默认2人
    }

    // 解析偏好
    const preferences: string[] = []
    const preferenceKeywords = [
      '美食', '吃饭', '餐厅', '小吃', '夜市', // 美食
      '购物', '商场', '逛街', '买买买', // 购物
      '文化', '历史', '博物馆', '古迹', '遗址', // 文化历史
      '自然', '风景', '山水', '森林', '海边', '海滩', // 自然风光
      '艺术', '美术馆', '展览', '演出', // 艺术
      '夜生活', '酒吧', '夜市', '夜景', // 夜生活
      '户外', '徒步', '登山', '骑行', '运动', // 户外运动
      '摄影', '拍照', '打卡', '网红', // 摄影
      '温泉', '泡汤', '养生', '按摩', // 温泉养生
      '主题公园', '游乐场', '迪士尼', '环球影城' // 主题公园
    ]

    preferenceKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        // 根据关键词映射到标准偏好
        if (['美食', '吃饭', '餐厅', '小吃', '夜市'].includes(keyword)) {
          if (!preferences.includes('美食')) preferences.push('美食')
        } else if (['购物', '商场', '逛街', '买买买'].includes(keyword)) {
          if (!preferences.includes('购物')) preferences.push('购物')
        } else if (['文化', '历史', '博物馆', '古迹', '遗址'].includes(keyword)) {
          if (!preferences.includes('历史文化')) preferences.push('历史文化')
        } else if (['自然', '风景', '山水', '森林', '海边', '海滩'].includes(keyword)) {
          if (!preferences.includes('自然风光')) preferences.push('自然风光')
        } else if (['艺术', '美术馆', '展览', '演出'].includes(keyword)) {
          if (!preferences.includes('艺术博物馆')) preferences.push('艺术博物馆')
        } else if (['夜生活', '酒吧', '夜市', '夜景'].includes(keyword)) {
          if (!preferences.includes('夜生活')) preferences.push('夜生活')
        } else if (['户外', '徒步', '登山', '骑行', '运动'].includes(keyword)) {
          if (!preferences.includes('户外运动')) preferences.push('户外运动')
        } else if (['摄影', '拍照', '打卡', '网红'].includes(keyword)) {
          if (!preferences.includes('摄影')) preferences.push('摄影')
        } else if (['温泉', '泡汤', '养生', '按摩'].includes(keyword)) {
          if (!preferences.includes('温泉')) preferences.push('温泉')
        } else if (['主题公园', '游乐场', '迪士尼', '环球影城'].includes(keyword)) {
          if (!preferences.includes('主题公园')) preferences.push('主题公园')
        }
      }
    })

    result.preferences = preferences

    // 解析特殊要求
    const specialRequirements: string[] = []
    const specialKeywords = [
      '小孩', '儿童', '宝宝', '婴儿', // 带小孩
      '老人', '长辈', '老人家', // 老人
      '轮椅', '无障碍', '残疾人', '行动不便', // 无障碍需求
      '素食', '清真', '不吃肉', '饮食禁忌', // 饮食要求
      '过敏', '药物', '药品', // 健康需求
      '紧急联系人', '保险', '医疗' // 安全需求
    ]

    specialKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        specialRequirements.push(keyword)
      }
    })

    result.additionalRequirements = specialRequirements.length > 0 
      ? `特殊需求: ${specialRequirements.join(', ')}` 
      : ''

    return result
  }
}

export const voiceRecognitionService = new VoiceRecognitionService()