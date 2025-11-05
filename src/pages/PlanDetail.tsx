import React, { useState } from 'react'
import { Card, Row, Col, Button, Space, Tag, Timeline, Descriptions, Image, Carousel } from 'antd'
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined, EnvironmentOutlined, ClockCircleOutlined, CarOutlined, EyeOutlined } from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { usePlanningStore } from '../store/planningStore'
import { Activity } from '../types'
import RealMapDisplay from '../components/SimpleMapDisplay'

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
`

const ContentWrapper = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`

const StyledCard = styled(Card)`
  margin-bottom: 20px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.95);

  .ant-card-head {
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: 16px 16px 0 0;
  }

  .ant-card-body {
    padding: 24px;
  }
`

const MapCard = styled(StyledCard)`
  height: 600px;
  
  .ant-card-body {
    height: calc(100% - 57px);
    padding: 0;
  }
`

const PlanHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`

const PlanTitle = styled.h1`
  margin: 0;
  color: #1a1a1a;
  font-size: 28px;
  font-weight: 600;
`

const ActionButtons = styled(Space)`
  .ant-btn {
    border-radius: 8px;
    height: 40px;
    padding: 0 20px;
    font-weight: 500;
  }
`

const DayCard = styled(Card)`
  margin-bottom: 16px;
  border-radius: 12px;
  border: 1px solid #e8e8e8;

  .ant-card-head {
    background: linear-gradient(90deg, #f0f9ff 0%, #e0f2fe 100%);
    border-radius: 12px 12px 0 0;
  }
`

const ActivityItem = styled(motion.div)`
  padding: 20px;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  }

  &:last-child {
    margin-bottom: 0;
  }
`

const ActivityHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`

const ActivityTitle = styled.h4`
  margin: 0;
  color: #1a1a1a;
  font-size: 18px;
  font-weight: 600;
`

const ActivityMeta = styled.div`
  display: flex;
  gap: 20px;
  color: #666;
  font-size: 14px;
  margin-bottom: 12px;

  span {
    display: flex;
    align-items: center;
    gap: 6px;
  }
`

const CostBadge = styled.div`
  background: linear-gradient(90deg, #52c41a 0%, #73d13d 100%);
  color: white;
  padding: 6px 16px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(82, 196, 26, 0.3);
`

const ActivityDescription = styled.p`
  margin: 0;
  color: #666;
  line-height: 1.6;
  font-size: 15px;
`

const ImageGallery = styled.div`
  margin-top: 16px;
  
  .ant-carousel {
    border-radius: 8px;
    overflow: hidden;
  }
  
  .ant-image {
    width: 100%;
    height: 200px;
    object-fit: cover;
  }
`

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`

const StatCard = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
`

const StatValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 4px;
`

const StatLabel = styled.div`
  font-size: 14px;
  opacity: 0.9;
`

// 模拟景点图片数据
const getActivityImages = (activity: Activity) => {
  const imageMap: Record<string, string[]> = {
    'sightseeing': [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&auto=format&fit=crop'
    ],
    'dining': [
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&auto=format&fit=crop'
    ],
    'shopping': [
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&auto=format&fit=crop'
    ],
    'entertainment': [
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop'
    ],
    'leisure': [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&auto=format&fit=crop'
    ]
  }
  
  return imageMap[activity.type] || imageMap['sightseeing']
}

const getActivityTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    sightseeing: 'blue',
    dining: 'orange',
    shopping: 'purple',
    entertainment: 'green',
    leisure: 'cyan',
    accommodation: 'gold',
    transport: 'red',
  }
  return colors[type] || 'default'
}

const getActivityTypeIcon = (type: string) => {
  const icons: Record<string, string> = {
    sightseeing: '🏛️',
    dining: '🍽️',
    shopping: '🛍️',
    entertainment: '🎭',
    leisure: '🌸',
    accommodation: '🏨',
    transport: '🚗',
  }
  return icons[type] || '📍'
}

const getTransportModeColor = (mode: string) => {
  const colors: Record<string, string> = {
    flight: 'blue',
    train: 'green',
    car: 'orange',
    bus: 'purple',
    mixed: 'cyan',
  }
  return colors[mode] || 'default'
}

const getTransportModeText = (mode: string) => {
  const texts: Record<string, string> = {
    flight: '✈️ 飞机',
    train: '🚄 火车/高铁',
    car: '🚗 自驾',
    bus: '🚌 大巴',
    mixed: '🔄 混合出行',
  }
  return texts[mode] || '🔄 混合出行'
}

const PlanDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { plans, deletePlan } = usePlanningStore()
  const [showMap, setShowMap] = useState(true)

  const plan = plans.find(p => p.id === id)

  console.log('Current plans:', plans)
  console.log('Looking for plan ID:', id)
  console.log('Found plan:', plan)

  if (!plan) {
    return (
      <Container>
        <ContentWrapper>
          <StyledCard>
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <h3>行程不存在</h3>
              <p>行程 ID: {id}</p>
              <p>当前存储的行程数量: {plans.length}</p>
              <Button type="primary" onClick={() => navigate('/')}>
                返回首页
              </Button>
            </div>
          </StyledCard>
        </ContentWrapper>
      </Container>
    )
  }

  const handleDelete = () => {
    deletePlan(plan.id)
    navigate('/')
  }

  const totalCost = plan.itinerary.reduce((sum, day) => 
    sum + day.activities.reduce((daySum, activity) => daySum + (activity.estimatedCost || activity.cost || 0), 0) +
    (day.accommodation ? (day.accommodation.estimatedCost || day.accommodation.cost || 0) : 0), 0)

  const totalDays = plan.itinerary.length
  const totalActivities = plan.itinerary.reduce((sum, day) => sum + day.activities.length, 0)

  return (
    <Container>
      <ContentWrapper>
        <PlanHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate('/')}
              size="large"
            >
              返回
            </Button>
            <PlanTitle>{plan.title}</PlanTitle>
          </div>
          <ActionButtons>
            <Button 
              icon={<EyeOutlined />}
              onClick={() => setShowMap(!showMap)}
            >
              {showMap ? '隐藏地图' : '显示地图'}
            </Button>
            <Button 
              type="primary" 
              icon={<EditOutlined />}
              onClick={() => navigate('/planning')}
            >
              编辑行程
            </Button>
            <Button 
              danger 
              icon={<DeleteOutlined />}
              onClick={handleDelete}
            >
              删除行程
            </Button>
          </ActionButtons>
        </PlanHeader>

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={showMap ? 14 : 24}>
            {/* 统计概览 */}
            <StatsGrid>
              <StatCard>
                <StatValue>{totalDays}</StatValue>
                <StatLabel>总天数</StatLabel>
              </StatCard>
              <StatCard>
                <StatValue>{totalActivities}</StatValue>
                <StatLabel>活动数量</StatLabel>
              </StatCard>
              <StatCard>
                <StatValue>¥{totalCost.toLocaleString()}</StatValue>
                <StatLabel>预估费用</StatLabel>
              </StatCard>
              <StatCard>
                <StatValue>{plan.travelers}</StatValue>
                <StatLabel>出行人数</StatLabel>
              </StatCard>
            </StatsGrid>

            {/* 行程概览 */}
            <StyledCard title="📋 行程概览">
          <Descriptions column={2} bordered>
            {plan.origin && (
              <Descriptions.Item label="出发地">{plan.origin}</Descriptions.Item>
            )}
            <Descriptions.Item label="目的地">{plan.destination}</Descriptions.Item>
            {plan.transportMode && (
              <Descriptions.Item label="出行方式">
                <Tag color={getTransportModeColor(plan.transportMode)}>
                  {getTransportModeText(plan.transportMode)}
                </Tag>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="出行日期">
              {plan.startDate} 至 {plan.endDate}
            </Descriptions.Item>
            <Descriptions.Item label="出行人数">{plan.travelers} 人</Descriptions.Item>
            <Descriptions.Item label="预算">¥{plan.budget.toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="预估费用">¥{totalCost.toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={plan.status === 'confirmed' ? 'green' : 'blue'}>
                {plan.status === 'confirmed' ? '已确认' : '草稿'}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
              
              {plan.preferences.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <strong>旅行偏好：</strong>
                  <div style={{ marginTop: '8px' }}>
                    {plan.preferences.map((pref, index) => (
                      <Tag key={index} color="blue" style={{ margin: '2px' }}>
                        {pref}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}
            </StyledCard>

            {/* 详细行程 */}
            <StyledCard title="📅 详细行程">
              {plan.itinerary.map((day) => (
                <DayCard 
                  key={day.day}
                  title={`第 ${day.day} 天 - ${day.date}`}
                  size="small"
                >
                  {day.activities.map((activity, index) => (
                    <ActivityItem
                      key={activity.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <ActivityHeader>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <ActivityTitle>
                            {getActivityTypeIcon(activity.type)} {activity.title || activity.name}
                          </ActivityTitle>
                          <Tag color={getActivityTypeColor(activity.type)}>
                            {activity.type}
                          </Tag>
                        </div>
                        <CostBadge>¥{activity.estimatedCost || activity.cost || 0}</CostBadge>
                      </ActivityHeader>
                      
                      <ActivityDescription>
                        {activity.description}
                      </ActivityDescription>
                      
                      <ActivityMeta>
                        <span>
                          <ClockCircleOutlined /> {activity.time || activity.startTime}
                        </span>
                        <span>
                          <EnvironmentOutlined /> {
                            typeof activity.location === 'string' 
                              ? activity.location 
                              : activity.location?.name || activity.location?.address || '未知地点'
                          }
                        </span>
                        <span>⏱️ {activity.duration} 分钟</span>
                        {activity.rating && (
                          <span>⭐ {activity.rating}/5</span>
                        )}
                      </ActivityMeta>

                      {/* 活动图片 */}
                      <ImageGallery>
                        <Carousel autoplay dots={false}>
                        {getActivityImages(activity).map((img, imgIndex) => (
                            <div key={imgIndex}>
                              <Image
                                src={img}
                                alt={activity.title || activity.name}
                                style={{ 
                                  width: '100%', 
                                  height: '200px', 
                                  objectFit: 'cover',
                                  borderRadius: '8px'
                                }}
                                preview={{
                                  mask: <EyeOutlined style={{ fontSize: '20px' }} />
                                }}
                                fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDQwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPuWbvueJh+WKoOi9veS4rS4uLjwvdGV4dD4KPHN2Zz4K"
                              />
                            </div>
                          ))}
                        </Carousel>
                      </ImageGallery>
                    </ActivityItem>
                  ))}

                  {day.accommodation && (
                  <ActivityItem
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: day.activities.length * 0.1 }}
                    >
                      <ActivityHeader>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <ActivityTitle>🏨 {day.accommodation.name}</ActivityTitle>
                          <Tag color="gold">住宿</Tag>
                        </div>
                        <CostBadge>¥{day.accommodation.estimatedCost || day.accommodation.cost || 0}</CostBadge>
                      </ActivityHeader>
                      
                      <ActivityMeta>
                        <span>
                          <EnvironmentOutlined /> {
                            day.accommodation.address || 
                            (typeof day.accommodation.location === 'string' 
                              ? day.accommodation.location 
                              : day.accommodation.location?.address || day.accommodation.location?.name || '未知地址')
                          }
                        </span>
                        <span>入住: {day.accommodation.checkIn}</span>
                        <span>退房: {day.accommodation.checkOut}</span>
                        <span>⭐ {day.accommodation.rating}/5</span>
                      </ActivityMeta>
                      
                      <div style={{ marginTop: '12px' }}>
                        <strong>设施：</strong>
                        {day.accommodation.amenities.map((amenity, index) => (
                          <Tag key={index} style={{ margin: '2px' }}>
                            {amenity}
                          </Tag>
                        ))}
                      </div>
                    </ActivityItem>
                  )}
                </DayCard>
              ))}
            </StyledCard>
          </Col>

          {showMap && (
            <Col xs={24} lg={10}>
              <MapCard>
                <RealMapDisplay plan={plan} />
              </MapCard>
            </Col>
          )}
        </Row>
      </ContentWrapper>
    </Container>
  )
}

export default PlanDetail