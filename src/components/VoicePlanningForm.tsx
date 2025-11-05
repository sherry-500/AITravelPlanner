import React, { useState } from 'react'
import { Card, Form, Input, Button, Select, DatePicker, InputNumber, Tag, Space, message, Row, Col } from 'antd'
import { Mic, MicOff } from 'lucide-react'
import { useSpeechSynthesis, useSpeechRecognition } from '../hooks/useSpeech'
import { motion } from 'framer-motion'
import styled from 'styled-components'
import { PlanningRequest } from '../types'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker
const { TextArea } = Input

const StyledCard = styled(Card)`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
`

const VoiceButton = styled(Button)<{ $isListening: boolean }>`
  background: ${props => props.$isListening ? '#ff4d4f' : '#1890ff'};
  border-color: ${props => props.$isListening ? '#ff4d4f' : '#1890ff'};
  color: white;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background: ${props => props.$isListening ? '#ff7875' : '#40a9ff'};
    border-color: ${props => props.$isListening ? '#ff7875' : '#40a9ff'};
    color: white;
  }
`

const PreferenceTag = styled(Tag)`
  margin: 4px;
  padding: 4px 12px;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`

interface VoicePlanningFormProps {
  onSubmit: (request: PlanningRequest) => void
  onCancel?: () => void
  loading?: boolean
}

const VoicePlanningForm: React.FC<VoicePlanningFormProps> = ({ onSubmit, onCancel, loading }) => {
  const [form] = Form.useForm()
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([])
  const [voiceInput, setVoiceInput] = useState('')
  
  const { speak } = useSpeechSynthesis()
  const { listen, listening, stop } = useSpeechRecognition({
    onResult: (result: string) => {
      setVoiceInput(result)
      parseVoiceInput(result)
      message.success('语音识别完成')
    },
    onError: (error: any) => {
      message.error('语音识别失败，请重试')
      console.error('Speech recognition error:', error)
    }
  })

  const commonPreferences = [
    '美食', '购物', '历史文化', '自然风光', '艺术博物馆', 
    '夜生活', '户外运动', '摄影', '动漫', '温泉',
    '海滩', '山景', '城市观光', '乡村体验', '主题公园'
  ]

  const parseVoiceInput = (text: string) => {
    // 简单的语音解析逻辑
    const lowerText = text.toLowerCase()
    
    // 解析出发地
    const originMatch = text.match(/从(.+?)(?:出发|到|去)/) || text.match(/(.+?)出发/)
    if (originMatch) {
      form.setFieldValue('origin', originMatch[1])
    }
    
    // 解析目的地
    const destinationMatch = text.match(/去(.+?)(?:，|,|。|\.|\s|$)/) || text.match(/到(.+?)(?:，|,|。|\.|\s|$)/)
    if (destinationMatch) {
      form.setFieldValue('destination', destinationMatch[1])
    }
    
    // 解析出行方式
    if (text.includes('飞机') || text.includes('坐飞机') || text.includes('航班')) {
      form.setFieldValue('transportMode', 'flight')
    } else if (text.includes('火车') || text.includes('高铁') || text.includes('动车')) {
      form.setFieldValue('transportMode', 'train')
    } else if (text.includes('自驾') || text.includes('开车') || text.includes('汽车')) {
      form.setFieldValue('transportMode', 'car')
    } else if (text.includes('大巴') || text.includes('客车') || text.includes('巴士')) {
      form.setFieldValue('transportMode', 'bus')
    }
    
    // 解析天数
    const daysMatch = text.match(/(\d+)天/)
    if (daysMatch) {
      const days = parseInt(daysMatch[1])
      const startDate = dayjs()
      const endDate = startDate.add(days - 1, 'day')
      form.setFieldValue('dateRange', [startDate, endDate])
    }
    
    // 解析预算
    const budgetMatch = text.match(/预算(\d+)(?:元|万)/)
    if (budgetMatch) {
      const amount = parseInt(budgetMatch[1])
      const budget = text.includes('万') ? amount * 10000 : amount
      form.setFieldValue('budget', budget)
    }
    
    // 解析人数
    const peopleMatch = text.match(/(\d+)(?:个)?人/)
    if (peopleMatch) {
      form.setFieldValue('travelers', parseInt(peopleMatch[1]))
    }
    
    // 解析偏好
    const preferences: string[] = []
    commonPreferences.forEach(pref => {
      if (text.includes(pref)) {
        preferences.push(pref)
      }
    })
    if (preferences.length > 0) {
      setSelectedPreferences(prev => [...new Set([...prev, ...preferences])])
    }
  }

  const handleVoiceToggle = () => {
    if (listening) {
      stop()
    } else {
      listen()
      speak({ text: '请说出您的旅行需求' })
    }
  }

  const handlePreferenceToggle = (preference: string) => {
    setSelectedPreferences(prev => 
      prev.includes(preference)
        ? prev.filter(p => p !== preference)
        : [...prev, preference]
    )
  }

  const handleSubmit = (values: any) => {
    const request: PlanningRequest = {
      origin: values.origin,
      destination: values.destination,
      startDate: values.dateRange[0].format('YYYY-MM-DD'),
      endDate: values.dateRange[1].format('YYYY-MM-DD'),
      budget: values.budget,
      travelers: values.travelers,
      preferences: selectedPreferences,
      transportMode: values.transportMode,
      additionalRequirements: values.additionalRequirements,
    }
    onSubmit(request)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <StyledCard title="🎯 智能行程规划" size="small">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            travelers: 2,
            budget: 5000,
          }}
        >
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* 语音输入区域 */}
            <div>
              <Space align="center" style={{ marginBottom: 16 }}>
                <VoiceButton
                  $isListening={listening}
                  onClick={handleVoiceToggle}
                  size="large"
                >
                  {listening ? <MicOff size={16} /> : <Mic size={16} />}
                  {listening ? '停止录音' : '语音输入'}
                </VoiceButton>
                <span style={{ color: '#666' }}>
                  {listening ? '正在听取您的需求...' : '点击开始语音输入旅行需求'}
                </span>
              </Space>
              {voiceInput && (
                <TextArea
                  value={voiceInput}
                  onChange={(e) => setVoiceInput(e.target.value)}
                  placeholder="语音识别结果将显示在这里..."
                  rows={3}
                  style={{ marginBottom: 16 }}
                />
              )}
            </div>

            {/* 表单字段 */}
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="origin"
                  label="出发地"
                  rules={[{ required: true, message: '请输入出发地' }]}
                >
                  <Input placeholder="例如：北京、上海、广州" size="large" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="destination"
                  label="目的地"
                  rules={[{ required: true, message: '请输入目的地' }]}
                >
                  <Input placeholder="例如：日本、巴黎、三亚" size="large" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="transportMode"
              label="出行方式"
              rules={[{ required: true, message: '请选择出行方式' }]}
            >
              <Select placeholder="选择出行方式" size="large">
                <Select.Option value="flight">
                  ✈️ 飞机 - 快速便捷，适合长途旅行
                </Select.Option>
                <Select.Option value="train">
                  🚄 火车/高铁 - 舒适安全，风景优美
                </Select.Option>
                <Select.Option value="car">
                  🚗 自驾 - 自由灵活，深度体验
                </Select.Option>
                <Select.Option value="bus">
                  🚌 大巴 - 经济实惠，适合短途
                </Select.Option>
                <Select.Option value="mixed">
                  🔄 混合出行 - 根据行程灵活选择
                </Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="dateRange"
              label="出行日期"
              rules={[{ required: true, message: '请选择出行日期' }]}
            >
              <RangePicker size="large" style={{ width: '100%' }} />
            </Form.Item>

            <Space style={{ width: '100%' }}>
              <Form.Item
                name="budget"
                label="预算 (元)"
                rules={[{ required: true, message: '请输入预算' }]}
              >
                <InputNumber
                  min={0}
                  placeholder="5000"
                  size="large"
                  style={{ width: 150 }}
                  formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                />
              </Form.Item>

              <Form.Item
                name="travelers"
                label="出行人数"
                rules={[{ required: true, message: '请输入出行人数' }]}
              >
                <InputNumber min={1} max={20} size="large" style={{ width: 120 }} />
              </Form.Item>
            </Space>

            {/* 偏好选择 */}
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                旅行偏好
              </label>
              <div>
                {commonPreferences.map(preference => (
                  <PreferenceTag
                    key={preference}
                    color={selectedPreferences.includes(preference) ? 'blue' : 'default'}
                    onClick={() => handlePreferenceToggle(preference)}
                  >
                    {preference}
                  </PreferenceTag>
                ))}
              </div>
            </div>

            <Form.Item
              name="additionalRequirements"
              label="其他要求"
            >
              <TextArea
                placeholder="例如：带小孩、无障碍设施、素食餐厅等特殊需求..."
                rows={3}
              />
            </Form.Item>

            <Form.Item>
              <Space style={{ width: '100%' }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={loading}
                  style={{
                    flex: 1,
                    height: 48,
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                  }}
                >
                  🚀 生成智能行程
                </Button>
                {onCancel && (
                  <Button
                    size="large"
                    onClick={onCancel}
                    style={{
                      height: 48,
                      borderRadius: 8,
                    }}
                  >
                    取消
                  </Button>
                )}
              </Space>
            </Form.Item>
          </Space>
        </Form>
      </StyledCard>
    </motion.div>
  )
}

export default VoicePlanningForm