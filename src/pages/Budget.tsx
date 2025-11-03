import React, { useState } from 'react'
import { Row, Col, Card, Form, Input, Button, Select, DatePicker, InputNumber, List, Tag, Modal, Space, Statistic } from 'antd'
import { PlusOutlined, DeleteOutlined, EditOutlined, AudioOutlined } from '@ant-design/icons'
import { Mic, MicOff } from 'lucide-react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'
import styled from 'styled-components'
import { useSpeechRecognition } from '../hooks/useSpeech'
import { usePlanningStore } from '../store/planningStore'
import { Expense } from '../types'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

const PageContainer = styled.div`
  min-height: calc(100vh - 64px);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 24px;
`

const StyledCard = styled(Card)`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 16px;
`

const VoiceButton = styled(Button)<{ $isListening: boolean }>`
  background: ${props => props.$isListening ? '#ff4d4f' : '#1890ff'};
  border-color: ${props => props.$isListening ? '#ff4d4f' : '#1890ff'};
  color: white;
  
  &:hover {
    background: ${props => props.$isListening ? '#ff7875' : '#40a9ff'};
    border-color: ${props => props.$isListening ? '#ff7875' : '#40a9ff'};
    color: white;
  }
`

const ExpenseCard = styled(Card)`
  background: #fafafa;
  border-radius: 8px;
  margin-bottom: 8px;
  border-left: 4px solid #1890ff;
`

const Budget: React.FC = () => {
  const [form] = Form.useForm()
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState<string>('')
  const [voiceInput, setVoiceInput] = useState('')
  
  const { plans, updatePlan } = usePlanningStore()

  const { listen, listening, stop } = useSpeechRecognition({
    onResult: (result: string) => {
      setVoiceInput(result)
      parseVoiceExpense(result)
      toast.success('语音识别完成')
    },
    onError: (error: any) => {
      toast.error('语音识别失败，请重试')
      console.error('Speech recognition error:', error)
    }
  })

  const parseVoiceExpense = (text: string) => {
    // 简单的语音解析逻辑
    const amountMatch = text.match(/(\d+)(?:元|块)/)
    if (amountMatch) {
      form.setFieldValue('amount', parseInt(amountMatch[1]))
    }

    // 解析类别
    const categories = {
      '住宿': 'accommodation',
      '酒店': 'accommodation',
      '交通': 'transportation',
      '打车': 'transportation',
      '飞机': 'transportation',
      '火车': 'transportation',
      '吃饭': 'food',
      '餐厅': 'food',
      '美食': 'food',
      '门票': 'attraction',
      '景点': 'attraction',
      '购物': 'shopping',
      '买': 'shopping',
    }

    for (const [keyword, category] of Object.entries(categories)) {
      if (text.includes(keyword)) {
        form.setFieldValue('category', category)
        break
      }
    }

    // 解析描述
    form.setFieldValue('description', text)
  }

  const handleVoiceToggle = () => {
    if (listening) {
      stop()
    } else {
      listen()
    }
  }

  const handleAddExpense = (values: any) => {
    if (!selectedPlanId) {
      toast.error('请先选择一个旅行计划')
      return
    }

    const expense: Expense = {
      id: editingExpense ? editingExpense.id : Date.now().toString(),
      planId: selectedPlanId,
      category: values.category,
      amount: values.amount,
      currency: 'CNY',
      description: values.description,
      date: values.date.format('YYYY-MM-DD'),
      location: values.location,
    }

    const plan = plans.find(p => p.id === selectedPlanId)
    if (plan) {
      let updatedExpenses
      if (editingExpense) {
        updatedExpenses = plan.expenses.map(e => e.id === editingExpense.id ? expense : e)
        toast.success('费用记录已更新')
      } else {
        updatedExpenses = [...plan.expenses, expense]
        toast.success('费用记录已添加')
      }
      
      updatePlan(selectedPlanId, { expenses: updatedExpenses })
      form.resetFields()
      setShowExpenseModal(false)
      setVoiceInput('')
      setEditingExpense(null)
    }
  }

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense)
    setSelectedPlanId(expense.planId)
    form.setFieldsValue({
      ...expense,
      date: dayjs(expense.date),
    })
    setShowExpenseModal(true)
  }

  const handleDeleteExpense = (planId: string, expenseId: string) => {
    const plan = plans.find(p => p.id === planId)
    if (plan) {
      const updatedExpenses = plan.expenses.filter(e => e.id !== expenseId)
      updatePlan(planId, { expenses: updatedExpenses })
      toast.success('费用记录已删除')
    }
  }

  const getCategoryColor = (category: Expense['category']) => {
    const colors = {
      accommodation: 'blue',
      transportation: 'green',
      food: 'orange',
      attraction: 'purple',
      shopping: 'pink',
      other: 'default',
    }
    return colors[category]
  }

  const getCategoryName = (category: Expense['category']) => {
    const names = {
      accommodation: '住宿',
      transportation: '交通',
      food: '餐饮',
      attraction: '景点',
      shopping: '购物',
      other: '其他',
    }
    return names[category]
  }

  // 计算统计数据
  const allExpenses = plans.flatMap(plan => plan.expenses)
  const totalExpenses = allExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const totalBudget = plans.reduce((sum, plan) => sum + plan.budget, 0)
  const remainingBudget = totalBudget - totalExpenses

  // 按类别统计
  const categoryStats = allExpenses.reduce((acc, expense) => {
    const category = getCategoryName(expense.category)
    acc[category] = (acc[category] || 0) + expense.amount
    return acc
  }, {} as Record<string, number>)

  const pieData = Object.entries(categoryStats).map(([name, value]) => ({
    name,
    value,
  }))

  // 按日期统计
  const dailyStats = allExpenses.reduce((acc, expense) => {
    const date = expense.date
    acc[date] = (acc[date] || 0) + expense.amount
    return acc
  }, {} as Record<string, number>)

  const barData = Object.entries(dailyStats)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => ({
      date: dayjs(date).format('MM-DD'),
      amount,
    }))

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

  return (
    <PageContainer>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* 统计概览 */}
        <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <StyledCard>
              <Statistic
                title="总预算"
                value={totalBudget}
                prefix="¥"
                valueStyle={{ color: '#1890ff' }}
              />
            </StyledCard>
          </Col>
          <Col xs={24} sm={8}>
            <StyledCard>
              <Statistic
                title="已花费"
                value={totalExpenses}
                prefix="¥"
                valueStyle={{ color: '#f5222d' }}
              />
            </StyledCard>
          </Col>
          <Col xs={24} sm={8}>
            <StyledCard>
              <Statistic
                title="剩余预算"
                value={remainingBudget}
                prefix="¥"
                valueStyle={{ color: remainingBudget >= 0 ? '#52c41a' : '#f5222d' }}
              />
            </StyledCard>
          </Col>
        </Row>

        <Row gutter={[24, 24]}>
          {/* 费用记录 */}
          <Col xs={24} lg={12}>
            <StyledCard
              title="💰 费用记录"
              extra={
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setEditingExpense(null)
                    setShowExpenseModal(true)
                    form.resetFields()
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                  }}
                >
                  添加费用
                </Button>
              }
            >
              {allExpenses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#666' }}>
                  <p>还没有费用记录</p>
                  <Button
                    type="primary"
                    onClick={() => setShowExpenseModal(true)}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                    }}
                  >
                    添加第一笔费用
                  </Button>
                </div>
              ) : (
                <List
                  dataSource={allExpenses.sort((a, b) => b.date.localeCompare(a.date))}
                  renderItem={(expense) => (
                    <List.Item>
                      <ExpenseCard
                        size="small"
                        style={{ width: '100%', borderLeftColor: getCategoryColor(expense.category) }}
                        actions={[
                          <Button
                            key="edit"
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => handleEditExpense(expense)}
                          />,
                          <Button
                            key="delete"
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDeleteExpense(expense.planId, expense.id)}
                          />,
                        ]}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <Tag color={getCategoryColor(expense.category)}>
                                {getCategoryName(expense.category)}
                              </Tag>
                              <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#f5222d' }}>
                                ¥{expense.amount}
                              </span>
                            </div>                        <p style={{ margin: '4px 0', color: '#333' }}>{expense.description}</p>
                     <div style={{ fontSize: '12px', color: '#666' }}>
                              <span>📅 {dayjs(expense.date).format('YYYY-MM-DD')}</span>
                              {expense.location && (
                                <span style={{ marginLeft: 16 }}>📍 {expense.location}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </ExpenseCard>
                    </List.Item>
                  )}
              />
              )}
            </StyledCard>
          </Col>

          {/* 统计图表 */}
          <Col xs={24} lg={12}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {/* 分类饼图 */}
              <StyledCard title="📊 支出分类统计" size="small">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#666' }}>
                    暂无数据
                  </div>
                )}
              </StyledCard>

              {/* 日期柱状图 */}
              <StyledCard title="📈 每日支出趋势" size="small">
                {barData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="amount" fill="#1890ff" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#666' }}>
                    暂无数据
                  </div>
                )}
              </StyledCard>
            </Space>
          </Col>
        </Row>

        {/* 添加费用模态框 */}
        <Modal
          title={editingExpense ? "编辑费用" : "添加费用"}
          open={showExpenseModal}
          onCancel={() => {
            setShowExpenseModal(false)
            setEditingExpense(null)
            form.resetFields()
            setVoiceInput('')
          }}
          footer={null}
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleAddExpense}
            initialValues={{
              date: dayjs(),
              currency: 'CNY',
            }}
          >
            <Form.Item
              name="planId"
              label="选择旅行计划"
              rules={[{ required: true, message: '请选择旅行计划' }]}
            >
              <Select
                placeholder="选择一个旅行计划"
                value={selectedPlanId}
                onChange={setSelectedPlanId}
              >
                {plans.map(plan => (
                  <Select.Option key={plan.id} value={plan.id}>
                    {plan.title} - {plan.destination}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            {/* 语音输入 */}
            <div style={{ marginBottom: 16 }}>
              <Space align="center">
                <VoiceButton
                  $isListening={listening}
                  onClick={handleVoiceToggle}
                >
                  {listening ? <MicOff size={16} /> : <Mic size={16} />}
                  {listening ? '停止录音' : '语音输入'}
                </VoiceButton>
                <span style={{ color: '#666' }}>
                  {listening ? '正在听取费用信息...' : '说出费用信息，如："打车50元"'}
                </span>
              </Space>
              {voiceInput && (
                <Input.TextArea
                  value={voiceInput}
                  onChange={(e) => setVoiceInput(e.target.value)}
                  placeholder="语音识别结果..."
                  rows={2}
                  style={{ marginTop: 8 }}
                />
              )}
            </div>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="category"
                  label="费用类别"
                  rules={[{ required: true, message: '请选择费用类别' }]}
                >
                  <Select placeholder="选择类别">
                    <Select.Option value="accommodation">住宿</Select.Option>
                    <Select.Option value="transportation">交通</Select.Option>
                    <Select.Option value="food">餐饮</Select.Option>
                    <Select.Option value="attraction">景点</Select.Option>
                    <Select.Option value="shopping">购物</Select.Option>
                    <Select.Option value="other">其他</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="amount"
                  label="金额"
                  rules={[{ required: true, message: '请输入金额' }]}
                >
                  <InputNumber
                    min={0}
                    placeholder="0"
                    style={{ width: '100%' }}
                    formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="description"
              label="描述"
              rules={[{ required: true, message: '请输入费用描述' }]}
            >
              <Input placeholder="例如：午餐、出租车费、门票等" />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="date"
                  label="日期"
                  rules={[{ required: true, message: '请选择日期' }]}
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="location" label="地点">
                  <Input placeholder="消费地点（可选）" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Space>
                <Button onClick={() => {
                  setShowExpenseModal(false)
                  setEditingExpense(null)
                  form.resetFields()
                  setVoiceInput('')
                }}>
                  取消
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                  }}
                >
                  {editingExpense ? '更新' : '添加'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </motion.div>
    </PageContainer>
  )
}

export default Budget