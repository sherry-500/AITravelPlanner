import React, { useState } from 'react'
import { Row, Col, Typography, Button, Space, Card, Statistic } from 'antd'
import { PlusOutlined, CalendarOutlined, DollarOutlined, EnvironmentOutlined, EyeOutlined } from '@ant-design/icons'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import VoicePlanningForm from '../components/VoicePlanningForm'
import ItineraryDisplay from '../components/ItineraryDisplay'
import MapDisplay from '../components/MapDisplay'
import { usePlanningStore } from '../store/planningStore'
import { useAuthStore } from '../store/authStore'
import { aiPlanningService } from '../services/aiPlanningService'
import { PlanningRequest } from '../types'
import toast from 'react-hot-toast'

const { Title, Paragraph } = Typography

const PageContainer = styled.div`
  min-height: calc(100vh - 64px);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 24px;
`

const WelcomeSection = styled.div`
  text-align: center;
  margin-bottom: 32px;
  color: white;
`

const StatsCard = styled(Card)`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  text-align: center;
`

const QuickActionCard = styled(Card)`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  }
`

const Home: React.FC = () => {
  const navigate = useNavigate()
  const [showPlanningForm, setShowPlanningForm] = useState(false)
  const { user } = useAuthStore()
  const { plans, currentPlan, isGenerating, addPlan, setCurrentPlan, setGenerating } = usePlanningStore()

  const handleCreatePlan = async (request: PlanningRequest) => {
    setGenerating(true)
    try {
      const response = await aiPlanningService.generateItinerary(request)
      addPlan(response.plan)
      setCurrentPlan(response.plan)
      toast.success('行程规划生成成功！')
      setShowPlanningForm(false)
    } catch (error) {
      toast.error('生成行程失败，请重试')
      console.error('Planning error:', error)
    } finally {
      setGenerating(false)
    }
  }

  const handleSavePlan = () => {
    if (currentPlan) {
      toast.success('行程已保存到您的计划列表')
    }
  }

  const totalBudget = plans.reduce((sum, plan) => sum + plan.budget, 0)
  const totalTrips = plans.length
  const completedTrips = plans.filter(plan => plan.status === 'completed').length

  if (showPlanningForm) {
    return (
      <PageContainer>
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <VoicePlanningForm onSubmit={handleCreatePlan} loading={isGenerating} />
          </Col>
          <Col xs={24} lg={12}>
            {currentPlan ? (
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <ItineraryDisplay 
                  plan={currentPlan} 
                  onSave={handleSavePlan}
                  onEdit={() => setShowPlanningForm(true)}
                />
                <MapDisplay plan={currentPlan} />
              </Space>
            ) : (
              <Card 
                style={{ 
                  height: '400px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '16px',
                }}
              >
                <div style={{ textAlign: 'center', color: '#666' }}>
                  <CalendarOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                  <p>填写左侧表单开始规划您的旅行</p>
                </div>
              </Card>
            )}
          </Col>
        </Row>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <WelcomeSection>
          <Title level={1} style={{ color: 'white', marginBottom: 16 }}>
            🧳 欢迎使用 AI 旅行规划师
          </Title>
          <Paragraph style={{ fontSize: '18px', color: 'rgba(255, 255, 255, 0.9)' }}>
            让 AI 为您规划完美的旅行体验，只需语音描述您的需求
          </Paragraph>
        </WelcomeSection>

        {/* 统计卡片 */}
        <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
          <Col xs={24} sm={8}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <StatsCard 
                hoverable
                onClick={() => navigate('/planning')}
                style={{ cursor: 'pointer' }}
              >
                <Statistic
                  title="总旅行计划"
                  value={totalTrips}
                  suffix="个"
                  valueStyle={{ color: '#1890ff' }}
                  prefix={<CalendarOutlined />}
                />
              </StatsCard>
            </motion.div>
          </Col>
          <Col xs={24} sm={8}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <StatsCard>
                <Statistic
                  title="总预算"
                  value={totalBudget}
                  prefix="¥"
                  valueStyle={{ color: '#52c41a' }}
                  precision={0}
                />
              </StatsCard>
            </motion.div>
          </Col>
          <Col xs={24} sm={8}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <StatsCard>
                <Statistic
                  title="已完成旅行"
                  value={completedTrips}
                  suffix="次"
                  valueStyle={{ color: '#722ed1' }}
                  prefix={<EnvironmentOutlined />}
                />
              </StatsCard>
            </motion.div>
          </Col>
        </Row>

        {/* 快速操作 */}
        <Row gutter={[24, 24]}>
          <Col xs={24} md={8}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <QuickActionCard
                onClick={() => setShowPlanningForm(true)}
                hoverable
              >
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <PlusOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: 16 }} />
                  <Title level={4} style={{ margin: 0 }}>创建新行程</Title>
                  <Paragraph style={{ color: '#666', margin: '8px 0 0 0' }}>
                    使用 AI 智能规划您的下一次旅行
                  </Paragraph>
                </div>
              </QuickActionCard>
            </motion.div>
          </Col>
          
          <Col xs={24} md={8}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <QuickActionCard 
                hoverable
                onClick={() => navigate('/planning')}
              >
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <CalendarOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: 16 }} />
                  <Title level={4} style={{ margin: 0 }}>我的行程</Title>
                  <Paragraph style={{ color: '#666', margin: '8px 0 0 0' }}>
                    查看和管理已创建的旅行计划
                  </Paragraph>
                </div>
              </QuickActionCard>
            </motion.div>
          </Col>
          
          <Col xs={24} md={8}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <QuickActionCard hoverable>
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <DollarOutlined style={{ fontSize: '48px', color: '#fa8c16', marginBottom: 16 }} />
                  <Title level={4} style={{ margin: 0 }}>费用管理</Title>
                  <Paragraph style={{ color: '#666', margin: '8px 0 0 0' }}>
                    记录和分析旅行开销
                  </Paragraph>
                </div>
              </QuickActionCard>
            </motion.div>
          </Col>
        </Row>

        {/* 最近的行程 */}
        {plans.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            style={{ marginTop: 32 }}
          >
            <Title level={3} style={{ color: 'white', marginBottom: 24 }}>
              📋 最近的行程
            </Title>
            <Row gutter={[16, 16]}>
              {plans.slice(0, 3).map((plan) => (
                <Col xs={24} md={8} key={plan.id}>
                  <Card
                    hoverable
                    style={{
                      background: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: '12px',
                    }}
                    onClick={() => navigate(`/plan/${plan.id}`)}
                  >
                    <Card.Meta
                      title={plan.title}
                      description={
                        <Space direction="vertical" size="small">
                          <span>📍 {plan.destination}</span>
                          <span>💰 ¥{plan.budget.toLocaleString()}</span>
                          <span>👥 {plan.travelers} 人</span>
                        </Space>
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          </motion.div>
        )}
      </motion.div>
    </PageContainer>
  )
}

export default Home