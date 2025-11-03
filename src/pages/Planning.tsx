import React, { useState } from 'react'
import { Row, Col, Card, List, Button, Space, Tag, Modal, Empty } from 'antd'
import { EditOutlined, DeleteOutlined, EyeOutlined, CalendarOutlined } from '@ant-design/icons'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import VoicePlanningForm from '../components/VoicePlanningForm'
import ItineraryDisplay from '../components/ItineraryDisplay'
import MapDisplay from '../components/MapDisplay'
import { usePlanningStore } from '../store/planningStore'
import { aiPlanningService } from '../services/aiPlanningService'
import { PlanningRequest, TravelPlan } from '../types'
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
`

const PlanCard = styled(Card)`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 16px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }
`

const Planning: React.FC = () => {
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  
  const { 
    plans, 
    currentPlan, 
    isGenerating, 
    addPlan, 
    updatePlan, 
    deletePlan, 
    setCurrentPlan, 
    setGenerating 
  } = usePlanningStore()

  const handleCreatePlan = async (request: PlanningRequest) => {
    setGenerating(true)
    try {
      const plan = await aiPlanningService.generateItinerary(request)
      addPlan(plan)
      setCurrentPlan(plan)
      toast.success('行程规划生成成功！')
      setShowForm(false)
    } catch (error) {
      toast.error('生成行程失败，请重试')
      console.error('Planning error:', error)
    } finally {
      setGenerating(false)
    }
  }

  const handleViewPlan = (plan: TravelPlan) => {
    navigate(`/plan/${plan.id}`)
  }

  const handleEditPlan = (plan: TravelPlan) => {
    setCurrentPlan(plan)
    setShowForm(true)
  }

  const handleDeletePlan = (planId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个旅行计划吗？此操作不可恢复。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        deletePlan(planId)
        toast.success('行程已删除')
      },
    })
  }

  const handleSavePlan = () => {
    if (currentPlan) {
      updatePlan(currentPlan.id, { status: 'confirmed' })
      toast.success('行程已保存')
    }
  }

  const getStatusColor = (status: TravelPlan['status']) => {
    const colors = {
      draft: 'orange',
      confirmed: 'blue',
      completed: 'green',
    }
    return colors[status]
  }

  const getStatusText = (status: TravelPlan['status']) => {
    const texts = {
      draft: '草稿',
      confirmed: '已确认',
      completed: '已完成',
    }
    return texts[status]
  }

  if (showForm) {
    return (
      <PageContainer>
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <VoicePlanningForm onSubmit={handleCreatePlan} loading={isGenerating} />
            <Button 
              style={{ marginTop: 16 }} 
              onClick={() => setShowForm(false)}
            >
              返回列表
            </Button>
          </Col>
          <Col xs={24} lg={12}>
            {currentPlan ? (
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <ItineraryDisplay 
                  plan={currentPlan} 
                  onSave={handleSavePlan}
                />
                <MapDisplay plan={currentPlan} />
              </Space>
            ) : (
              <StyledCard style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', color: '#666' }}>
                  <CalendarOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                  <p>填写左侧表单开始规划您的旅行</p>
                </div>
              </StyledCard>
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
        transition={{ duration: 0.5 }}
      >
        <StyledCard
          title="📋 我的旅行计划"
          extra={
            <Button 
              type="primary" 
              onClick={() => setShowForm(true)}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
              }}
            >
              创建新计划
            </Button>
          }
        >
          {plans.length === 0 ? (
            <Empty
              description="还没有旅行计划"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button 
                type="primary" 
                onClick={() => setShowForm(true)}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                }}
              >
                创建第一个计划
              </Button>
            </Empty>
          ) : (
            <List
              grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 3 }}
              dataSource={plans}
              renderItem={(plan) => (
                <List.Item>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <PlanCard
                      hoverable
                      actions={[
                        <Button
                          key="view"
                          type="text"
                          icon={<EyeOutlined />}
                          onClick={() => handleViewPlan(plan)}
                        >
                          查看
                        </Button>,
                        <Button
                          key="edit"
                          type="text"
                          icon={<EditOutlined />}
                          onClick={() => handleEditPlan(plan)}
                        >
                          编辑
                        </Button>,
                        <Button
                          key="delete"
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleDeletePlan(plan.id)}
                        >
                          删除
                        </Button>,
                      ]}
                    >
                      <Card.Meta
                        title={
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{plan.title}</span>
                            <Tag color={getStatusColor(plan.status)}>
                              {getStatusText(plan.status)}
                            </Tag>
                          </div>
                        }
                        description={
                          <Space direction="vertical" size="small" style={{ width: '100%' }}>
                            <div>
                              <span style={{ color: '#666' }}>📍 目的地：</span>
                              <span>{plan.destination}</span>
                            </div>
                            <div>
                              <span style={{ color: '#666' }}>📅 日期：</span>
                              <span>
                                {dayjs(plan.startDate).format('MM-DD')} 至 {dayjs(plan.endDate).format('MM-DD')}
                              </span>
                            </div>
                            <div>
                              <span style={{ color: '#666' }}>💰 预算：</span>
                              <span>¥{plan.budget.toLocaleString()}</span>
                            </div>
                            <div>
                              <span style={{ color: '#666' }}>👥 人数：</span>
                              <span>{plan.travelers} 人</span>
                            </div>
                            <div>
                              <span style={{ color: '#666' }}>🏷️ 偏好：</span>
                              <div style={{ marginTop: 4 }}>
                                {plan.preferences.slice(0, 3).map((pref, index) => (
                                  <Tag key={index} style={{ margin: '2px' }}>
                                    {pref}
                                  </Tag>
                                ))}
                                {plan.preferences.length > 3 && (
                                  <Tag style={{ margin: '2px' }}>
                                    +{plan.preferences.length - 3}
                                  </Tag>
                                )}
                              </div>
                            </div>
                          </Space>
                        }
                      />
                    </PlanCard>
                  </motion.div>
                </List.Item>
              )}
            />
          )}
        </StyledCard>
      </motion.div>
    </PageContainer>
  )
}

export default Planning