import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Button, Tag, Timeline, Descriptions, Space, Divider } from 'antd'
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined, EnvironmentOutlined, ClockCircleOutlined } from '@ant-design/icons'
import styled from 'styled-components'
import { usePlanningStore } from '../store/planningStore'
import { Activity } from '../types'

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
`

const ContentWrapper = styled.div`
  max-width: 1200px;
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

const ActivityItem = styled.div`
  padding: 16px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  margin-bottom: 12px;
  background: #fafafa;

  &:last-child {
    margin-bottom: 0;
  }
`

const ActivityHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`

const ActivityTitle = styled.h4`
  margin: 0;
  color: #1a1a1a;
  font-size: 16px;
  font-weight: 500;
`

const ActivityMeta = styled.div`
  display: flex;
  gap: 16px;
  color: #666;
  font-size: 14px;

  span {
    display: flex;
    align-items: center;
    gap: 4px;
  }
`

const CostBadge = styled.div`
  background: linear-gradient(90deg, #52c41a 0%, #73d13d 100%);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
`

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

const PlanDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { plans, deletePlan } = usePlanningStore()

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

        <StyledCard title="📋 行程概览">
          <Descriptions column={2} bordered>
            <Descriptions.Item label="目的地">{plan.destination}</Descriptions.Item>
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

        <StyledCard title="📅 详细行程">
          {plan.itinerary.map((day) => (
            <DayCard 
              key={day.day}
              title={`第 ${day.day} 天 - ${day.date}`}
              size="small"
            >
              {day.activities.map((activity) => (
                <ActivityItem key={activity.id}>
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
                  
                  <p style={{ margin: '8px 0', color: '#666' }}>
                    {activity.description}
                  </p>
                  
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
                </ActivityItem>
              ))}

              {day.accommodation && (
                <>
                  <Divider />
                  <ActivityItem>
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
                    
                    <div style={{ marginTop: '8px' }}>
                      <strong>设施：</strong>
                      {day.accommodation.amenities.map((amenity, index) => (
                        <Tag key={index} style={{ margin: '2px' }}>
                          {amenity}
                        </Tag>
                      ))}
                    </div>
                  </ActivityItem>
                </>
              )}
            </DayCard>
          ))}
        </StyledCard>
      </ContentWrapper>
    </Container>
  )
}

export default PlanDetail