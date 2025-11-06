import React, { useState } from 'react'
import { Row, Col, Card, Button, Space, Statistic, Image, Carousel } from 'antd'
import { PlusOutlined, CalendarOutlined, DollarOutlined, EyeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import VoicePlanningForm from '../components/VoicePlanningForm'
import { usePlanningStore } from '../store/planningStore'
import { useBudgetStore } from '../store/budgetStore'
import { aiPlanningService } from '../services/aiPlanningService'
import { PlanningRequest } from '../types'
import toast from 'react-hot-toast'

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
`

const ContentWrapper = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`

const HeroSection = styled.div`
  text-align: center;
  margin-bottom: 40px;
  color: white;
`

const HeroTitle = styled.h1`
  font-size: 48px;
  font-weight: 700;
  margin-bottom: 16px;
  background: linear-gradient(45deg, #fff, #e0e7ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`

const HeroSubtitle = styled.p`
  font-size: 20px;
  opacity: 0.9;
  margin-bottom: 32px;
`

const StyledCard = styled(Card)`
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.95);
  margin-bottom: 24px;

  .ant-card-head {
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: 16px 16px 0 0;
  }
`

const StatCard = styled(motion.div)`
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  }
`

const QuickActionCard = styled(motion.div)`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(102, 126, 234, 0.4);
  }
`

const PlanCard = styled(motion.div)`
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #f0f0f0;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }
`

const PlanHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`

const PlanTitle = styled.h4`
  margin: 0;
  color: #1a1a1a;
  font-size: 18px;
  font-weight: 600;
`

const PlanMeta = styled.div`
  color: #666;
  font-size: 14px;
  margin-bottom: 12px;
`

const ImageGallery = styled.div`
  margin-top: 12px;
  
  .ant-carousel {
    border-radius: 8px;
    overflow: hidden;
  }
`

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
`

const FeatureCard = styled.div`
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 32px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.3);
`

const FeatureIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`

const FeatureTitle = styled.h3`
  color: #1a1a1a;
  margin-bottom: 12px;
  font-size: 20px;
  font-weight: 600;
`

const FeatureDescription = styled.p`
  color: #666;
  line-height: 1.6;
  margin: 0;
`

// 模拟旅行图片
const getTravelImages = () => [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&auto=format&fit=crop'
]

const Home: React.FC = () => {
  const navigate = useNavigate()
  const { plans, addPlan, setCurrentPlan } = usePlanningStore()
  const { expenses } = useBudgetStore()
  const [showPlanningForm, setShowPlanningForm] = useState(false)
  const [generating, setGenerating] = useState(false)

  const handleCreatePlan = async (request: PlanningRequest) => {
    setGenerating(true)
    try {
      const plan = await aiPlanningService.generateItinerary(request)
      addPlan(plan)
      setCurrentPlan(plan)
      toast.success('行程规划生成成功！')
      setShowPlanningForm(false)
    } catch (error) {
      toast.error('生成行程失败，请重试')
      console.error('Planning error:', error)
    } finally {
      setGenerating(false)
    }
  }

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const recentPlans = plans.slice(0, 3)

  return (
    <Container>
      <ContentWrapper>
        {/* Hero Section */}
        <HeroSection>
          <HeroTitle>AI 智能旅行规划师</HeroTitle>
          <HeroSubtitle>让人工智能为您规划完美的旅行体验</HeroSubtitle>
          
          {/* 旅行图片轮播 */}
          <div style={{ maxWidth: '800px', margin: '0 auto', marginBottom: '32px' }}>
            <Carousel autoplay effect="fade" dots={false}>
              {getTravelImages().map((img, index) => (
                <div key={index}>
                  <Image
                    src={img}
                    alt={`旅行图片 ${index + 1}`}
                    style={{ 
                      width: '100%', 
                      height: '300px', 
                      objectFit: 'cover',
                      borderRadius: '16px'
                    }}
                    preview={false}
                    fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDgwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjVGNUY1Ci8+Cjx0ZXh0IHg9IjQwMCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPuaXheihjOWbvueJhzwvdGV4dD4KPHN2Zz4K"
                  />
                </div>
              ))}
            </Carousel>
          </div>
        </HeroSection>

        {/* 功能特色 */}
        <FeatureGrid>
          <FeatureCard>
            <FeatureIcon>🎤</FeatureIcon>
            <FeatureTitle>语音智能规划</FeatureTitle>
            <FeatureDescription>
              只需说出您的旅行需求，AI 将为您生成详细的行程安排
            </FeatureDescription>
          </FeatureCard>
          
          <FeatureCard>
            <FeatureIcon>🗺️</FeatureIcon>
            <FeatureTitle>地图导航</FeatureTitle>
            <FeatureDescription>
              基于高德地图的精准定位和路线规划，让您的旅行更加便捷
            </FeatureDescription>
          </FeatureCard>
          
          <FeatureCard>
            <FeatureIcon>💰</FeatureIcon>
            <FeatureTitle>智能费用管理</FeatureTitle>
            <FeatureDescription>
              实时记录和分析旅行费用，帮您控制预算，享受经济实惠的旅行
            </FeatureDescription>
          </FeatureCard>
        </FeatureGrid>

        <Row gutter={[24, 24]}>
          {/* 左侧：统计和快捷操作 */}
          <Col xs={24} lg={8}>
            {/* 统计卡片 */}
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
              <Col span={24}>
                <StatCard
                  whileHover={{ scale: 1.02 }}
                  onClick={() => navigate('/planning')}
                >
                  <Statistic
                    title="总行程规划"
                    value={plans.length}
                    prefix={<CalendarOutlined />}
                    valueStyle={{ color: '#1890ff', fontSize: '32px', fontWeight: 'bold' }}
                  />
                </StatCard>
              </Col>
              
              <Col span={24}>
                <StatCard
                  whileHover={{ scale: 1.02 }}
                  onClick={() => navigate('/budget')}
                >
                  <Statistic
                    title="总费用支出"
                    value={totalExpenses}
                    prefix={<DollarOutlined />}
                    suffix="元"
                    valueStyle={{ color: '#52c41a', fontSize: '32px', fontWeight: 'bold' }}
                  />
                </StatCard>
              </Col>
            </Row>

            {/* 快捷操作 */}
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <QuickActionCard
                whileHover={{ scale: 1.02 }}
                onClick={() => setShowPlanningForm(true)}
              >
                <PlusOutlined style={{ fontSize: '32px', marginBottom: '12px' }} />
                <h3 style={{ color: 'white', margin: '0 0 8px 0' }}>创建新行程</h3>
                <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0 }}>
                  使用 AI 智能规划您的下一次旅行
                </p>
              </QuickActionCard>

              <QuickActionCard
                whileHover={{ scale: 1.02 }}
                onClick={() => navigate('/planning')}
              >
                <CalendarOutlined style={{ fontSize: '32px', marginBottom: '12px' }} />
                <h3 style={{ color: 'white', margin: '0 0 8px 0' }}>我的行程</h3>
                <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0 }}>
                  查看和管理所有旅行计划
                </p>
              </QuickActionCard>

              <QuickActionCard
                whileHover={{ scale: 1.02 }}
                onClick={() => navigate('/budget')}
              >
                <DollarOutlined style={{ fontSize: '32px', marginBottom: '12px' }} />
                <h3 style={{ color: 'white', margin: '0 0 8px 0' }}>费用管理</h3>
                <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0 }}>
                  记录和分析旅行支出
                </p>
              </QuickActionCard>
            </Space>
          </Col>

          {/* 右侧：最近的行程 */}
          <Col xs={24} lg={16}>
            <StyledCard 
              title="🌟 最近的行程" 
              extra={
                <Button 
                  type="link" 
                  onClick={() => navigate('/planning')}
                  icon={<EyeOutlined />}
                >
                  查看全部
                </Button>
              }
            >
              {recentPlans.length > 0 ? (
                recentPlans.filter(plan => plan && plan.title).map((plan, index) => (
                  <PlanCard
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => navigate(`/plan/${plan.id}`)}
                  >
                    <PlanHeader>
                      <PlanTitle>{plan.title}</PlanTitle>
                      <Space>
                        <span style={{ color: '#1890ff', fontWeight: 'bold' }}>
                          ¥{plan.budget.toLocaleString()}
                        </span>
                      </Space>
                    </PlanHeader>
                    
                    <PlanMeta>
                      📍 {plan.origin || '未设置'} → {plan.destination} | 
                      📅 {plan.startDate} 至 {plan.endDate} | 
                      👥 {plan.travelers} 人
                      {plan.transportMode && (
                        <span>
                          {' | 🚗 '}
                          {plan.transportMode === 'flight' ? '飞机' : 
                           plan.transportMode === 'train' ? '火车' :
                           plan.transportMode === 'car' ? '自驾' :
                           plan.transportMode === 'bus' ? '大巴' : '混合'}
                        </span>
                      )}
                    </PlanMeta>
                    
                    {plan.preferences.length > 0 && (
                      <div style={{ marginBottom: '12px' }}>
                        {plan.preferences.slice(0, 3).map((pref, prefIndex) => (
                          <span
                            key={prefIndex}
                            style={{
                              background: '#f0f9ff',
                              color: '#1890ff',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              marginRight: '6px'
                            }}
                          >
                            {pref}
                          </span>
                        ))}
                        {plan.preferences.length > 3 && (
                          <span style={{ color: '#666', fontSize: '12px' }}>
                            +{plan.preferences.length - 3} 更多
                          </span>
                        )}
                      </div>
                    )}

                    <ImageGallery>
                      <Carousel autoplay dots={false} arrows={false}>
                        {getTravelImages().slice(0, 3).map((img, imgIndex) => (
                          <div key={imgIndex}>
                            <Image
                              src={img}
                              alt={`${plan.destination} 风景`}
                              style={{ 
                                width: '100%', 
                                height: '150px', 
                                objectFit: 'cover',
                                borderRadius: '8px'
                              }}
                              preview={false}
                              fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDQwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjVGNUY1Ci8+Cjx0ZXh0IHg9IjIwMCIgeT0iNzUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+5Zu+54mH5Yqg6L295Lit...</text+Cjwvc3ZnPgo="
                            />
                          </div>
                        ))}
                      </Carousel>
                    </ImageGallery>
                  </PlanCard>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#666' }}>
                  <CalendarOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                  <h3>还没有旅行计划</h3>
                  <p>点击"创建新行程"开始您的第一次 AI 旅行规划</p>
                </div>
              )}
            </StyledCard>
          </Col>
        </Row>

        {/* 语音规划表单模态框 */}
        {showPlanningForm && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}>
            <div style={{ 
              background: 'white', 
              borderRadius: '16px', 
              maxWidth: '800px', 
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}>
              <VoicePlanningForm
                onSubmit={handleCreatePlan}
                onCancel={() => setShowPlanningForm(false)}
                loading={generating}
              />
            </div>
          </div>
        )}
      </ContentWrapper>
    </Container>
  )
}

export default Home