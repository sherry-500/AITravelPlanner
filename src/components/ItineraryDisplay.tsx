import React from 'react'
import { Card, Timeline, Tag, Button, Space, Divider, Image } from 'antd'
import { ClockCircleOutlined, EnvironmentOutlined, DollarOutlined } from '@ant-design/icons'
import { motion } from 'framer-motion'
import styled from 'styled-components'
import { TravelPlan, Activity } from '../types'
import dayjs from 'dayjs'

const StyledCard = styled(Card)`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 16px;
`

const DayHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 16px;
`

const ActivityCard = styled.div`
  background: #fafafa;
  border-radius: 8px;
  padding: 16px;
  margin: 8px 0;
  border-left: 4px solid #1890ff;
`

const ActivityHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
`

const ActivityTitle = styled.h4`
  margin: 0;
  color: #262626;
  font-size: 16px;
`

const ActivityMeta = styled.div`
  display: flex;
  gap: 16px;
  margin: 8px 0;
  color: #666;
  font-size: 14px;
`

const CostBadge = styled.span`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
`

interface ItineraryDisplayProps {
  plan: TravelPlan
  onEdit?: () => void
  onSave?: () => void
}

const ItineraryDisplay: React.FC<ItineraryDisplayProps> = ({ plan, onEdit, onSave }) => {
  const getActivityTypeColor = (type: Activity['type']) => {
    const colors = {
      attraction: 'blue',
      restaurant: 'orange',
      shopping: 'purple',
      entertainment: 'green',
      other: 'default',
    }
    return colors[type] || 'default'
  }

  const getActivityTypeIcon = (type: Activity['type']) => {
    const icons = {
      attraction: '🏛️',
      restaurant: '🍽️',
      shopping: '🛍️',
      entertainment: '🎭',
      other: '📍',
    }
    return icons[type] || '📍'
  }

  const totalCost = plan.itinerary.reduce((sum, day) => {
    const dayCost = day.totalCost || 0;
    return sum + (typeof dayCost === 'number' ? dayCost : 0);
  }, 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <StyledCard
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>📋 {plan.title}</span>
            <Space>
              <Tag color="blue">{plan.destination}</Tag>
              <Tag color="green">¥{(totalCost || 0).toLocaleString()}</Tag>
            </Space>
          </div>
        }
        extra={
          <Space>
            {onEdit && (
              <Button type="default" onClick={onEdit}>
                编辑
              </Button>
            )}
            {onSave && (
              <Button type="primary" onClick={onSave}>
                保存行程
              </Button>
            )}
          </Space>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Space size="large">
            <span>
              <ClockCircleOutlined /> {dayjs(plan.startDate).format('MM月DD日')} - {dayjs(plan.endDate).format('MM月DD日')}
            </span>
            <span>
              <EnvironmentOutlined /> {plan.destination}
            </span>
            <span>
              <DollarOutlined /> 预算 ¥{(plan.budget || 0).toLocaleString()}
            </span>
            <span>👥 {plan.travelers} 人</span>
          </Space>
        </div>

        <Divider />

        {plan.itinerary.map((day, index) => (
          <StyledCard
            key={day.day}
            size="small"
            title={
              <DayHeader>
                <div>
                  <h3 style={{ margin: 0, color: '#1890ff' }}>
                    第 {day.day} 天 - {dayjs(day.date).format('MM月DD日 dddd')}
                  </h3>
                </div>
                <CostBadge>
                  当日费用: ¥{(day.totalCost || 0).toLocaleString()}
                </CostBadge>
              </DayHeader>
            }
          >
            <Timeline>
              {day.activities.map((activity, actIndex) => (
                <Timeline.Item
                  key={activity.id}
                  dot={<span style={{ fontSize: '16px' }}>{getActivityTypeIcon(activity.type)}</span>}
                >
                  <ActivityCard>
                    <ActivityHeader>
                      <div>
                        <ActivityTitle>{activity.title || activity.name}</ActivityTitle>
                        <Tag color={getActivityTypeColor(activity.type)} size="small">
                          {activity.type === 'attraction' && '景点'}
                          {activity.type === 'restaurant' && '餐厅'}
                          {activity.type === 'shopping' && '购物'}
                          {activity.type === 'entertainment' && '娱乐'}
                          {activity.type === 'other' && '其他'}
                        </Tag>
                      </div>
                      <CostBadge>¥{(activity.cost || activity.estimatedCost || 0).toLocaleString()}</CostBadge>
                    </ActivityHeader>
                    
                    <ActivityMeta>
                      <span>
                        <ClockCircleOutlined /> {activity.startTime} - {activity.endTime}
                      </span>
                      <span>
                        <EnvironmentOutlined /> {typeof activity.location === 'string' ? activity.location : activity.location?.name || '未知地点'}
                      </span>
                      <span>⏱️ {activity.duration} 小时</span>
                      {activity.rating && (
                        <span>⭐ {activity.rating}/5</span>
                      )}
                    </ActivityMeta>
                    
                    {activity.description && (
                      <p style={{ margin: '8px 0', color: '#666', fontSize: '14px' }}>
                        {activity.description}
                      </p>
                    )}
                    
                    {activity.tips && (
                      <div style={{ marginTop: 8 }}>
                        <strong style={{ fontSize: '12px', color: '#1890ff' }}>💡 小贴士：</strong>
                        <div style={{ margin: '4px 0', fontSize: '12px', color: '#666' }}>
                          {Array.isArray(activity.tips) ? (
                            <ul style={{ paddingLeft: '16px' }}>
                              {activity.tips.map((tip, tipIndex) => (
                                <li key={tipIndex}>{tip}</li>
                              ))}
                            </ul>
                          ) : (
                            <p style={{ margin: '4px 0' }}>{activity.tips}</p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {activity.images && activity.images.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <Image.PreviewGroup>
                          {activity.images.slice(0, 3).map((image, imgIndex) => (
                            <Image
                              key={imgIndex}
                              src={image}
                              width={60}
                              height={60}
                              style={{ 
                                borderRadius: 4, 
                                marginRight: 8,
                                objectFit: 'cover'
                              }}
                            />
                          ))}
                        </Image.PreviewGroup>
                      </div>
                    )}
                  </ActivityCard>
                </Timeline.Item>
              ))}
              
              {day.accommodation && (
                <Timeline.Item
                  dot={<span style={{ fontSize: '16px' }}>🏨</span>}
                >
                  <ActivityCard style={{ borderLeftColor: '#52c41a' }}>
                    <ActivityHeader>
                      <div>
                        <ActivityTitle>{day.accommodation.name}</ActivityTitle>
                        <Tag color="green" size="small">住宿</Tag>
                      </div>
                      <CostBadge>¥{(day.accommodation.cost || day.accommodation.estimatedCost || 0).toLocaleString()}</CostBadge>
                    </ActivityHeader>
                    
                    <ActivityMeta>
                      <span>
                        <EnvironmentOutlined /> {day.accommodation.address || (typeof day.accommodation.location === 'string' ? day.accommodation.location : day.accommodation.location?.name) || '未知地址'}
                      </span>
                      <span>
                        📅 {day.accommodation.checkIn} - {day.accommodation.checkOut}
                      </span>
                      {day.accommodation.rating && (
                        <span>⭐ {day.accommodation.rating}/5</span>
                      )}
                    </ActivityMeta>
                    
                    {day.accommodation.amenities && day.accommodation.amenities.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <strong style={{ fontSize: '12px', color: '#52c41a' }}>🏨 设施：</strong>
                        <div style={{ marginTop: 4 }}>
                          {day.accommodation.amenities.map((amenity, amenityIndex) => (
                            <Tag key={amenityIndex} size="small" style={{ margin: '2px' }}>
                              {amenity}
                            </Tag>
                          ))}
                        </div>
                      </div>
                    )}
                  </ActivityCard>
                </Timeline.Item>
              )}
            </Timeline>
          </StyledCard>
        ))}
      </StyledCard>
    </motion.div>
  )
}

export default ItineraryDisplay