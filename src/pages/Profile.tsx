import React, { useState } from 'react'
import { Card, Form, Input, Button, Upload, Avatar, Row, Col, Divider, Switch, Select, message } from 'antd'
import { UserOutlined, CameraOutlined, SaveOutlined } from '@ant-design/icons'
import { motion } from 'framer-motion'
import styled from 'styled-components'
import { useAuthStore } from '../store/authStore'
import { TravelPreferences } from '../types'

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
  margin-bottom: 24px;
`

const AvatarSection = styled.div`
  text-align: center;
  margin-bottom: 24px;
`

const Profile: React.FC = () => {
  const [form] = Form.useForm()
  const [preferencesForm] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const { user, updateUser } = useAuthStore()

  const handleUpdateProfile = async (values: any) => {
    setLoading(true)
    try {
      // 模拟 API 调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      updateUser({
        name: values.name,
        email: values.email,
      })
      
      message.success('个人信息更新成功')
    } catch (error) {
      message.error('更新失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePreferences = async (values: any) => {
    setLoading(true)
    try {
      // 模拟 API 调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const preferences: TravelPreferences = {
        budgetRange: [values.minBudget, values.maxBudget],
        travelStyle: values.travelStyle,
        interests: values.interests || [],
        accommodationType: values.accommodationType,
        transportPreference: values.transportPreference,
      }
      
      updateUser({ preferences })
      message.success('旅行偏好更新成功')
    } catch (error) {
      message.error('更新失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarChange = (info: any) => {
    if (info.file.status === 'done') {
      // 这里应该上传到服务器并获取URL
      const avatarUrl = URL.createObjectURL(info.file.originFileObj)
      updateUser({ avatar: avatarUrl })
      message.success('头像更新成功')
    }
  }

  const interestOptions = [
    '美食', '购物', '历史文化', '自然风光', '艺术博物馆',
    '夜生活', '户外运动', '摄影', '动漫', '温泉',
    '海滩', '山景', '城市观光', '乡村体验', '主题公园',
    '建筑', '音乐', '电影', '科技', '宗教文化'
  ]

  return (
    <PageContainer>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            {/* 个人信息 */}
            <StyledCard title="👤 个人信息">
              <AvatarSection>
                <Avatar
                  size={120}
                  src={user?.avatar}
                  icon={<UserOutlined />}
                  style={{ marginBottom: 16 }}
                />
                <div>
                  <Upload
                    showUploadList={false}
                    beforeUpload={() => false}
                    onChange={handleAvatarChange}
                  >
                    <Button icon={<CameraOutlined />}>更换头像</Button>
                  </Upload>
                </div>
              </AvatarSection>

              <Form
                form={form}
                layout="vertical"
                onFinish={handleUpdateProfile}
                initialValues={{
                  name: user?.name,
                  email: user?.email,
                }}
              >
                <Form.Item
                  name="name"
                  label="姓名"
                  rules={[{ required: true, message: '请输入姓名' }]}
                >
                  <Input placeholder="请输入您的姓名" />
                </Form.Item>

                <Form.Item
                  name="email"
                  label="邮箱"
                  rules={[
                    { required: true, message: '请邮箱' },
                    { type: 'email', message: '请输入有效的邮箱地址' }
                  ]}
                >
                  <Input placeholder="请输入您的邮箱" />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    icon={<SaveOutlined />}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                    }}
                  >
                    保存个人信息
                  </Button>
                </Form.Item>
              </Form>
            </StyledCard>
          </Col>

          <Col xs={24} lg={12}>
            {/* 旅行偏好 */}
            <StyledCard title="🎯 旅行偏好设置">
              <Form
                form={preferencesForm}
                layout="vertical"
                onFinish={handleUpdatePreferences}
                initialValues={{
                  minBudget: user?.preferences?.budgetRange?.[0] || 1000,
                  maxBudget: user?.preferences?.budgetRange?.[1] || 10000,
                  travelStyle: user?.preferences?.travelStyle || 'comfort',
                  interests: user?.preferences?.interests || [],
                  accommodationType: user?.preferences?.accommodationType || 'hotel',
                  transportPreference: user?.preferences?.transportPreference || 'flight',
                }}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="minBudget"
                      label="最低预算 (元)"
                      rules={[{ required: true, message: '请输入最低预算' }]}
                    >
                      <Input type="number" placeholder="1000" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="maxBudget"
                      label="最高预算 (元)"
                      rules={[{ required: true, message: '请输入最高预算' }]}
                    >
                      <Input type="number" placeholder="10000" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="travelStyle"
                  label="旅行风格"
                  rules={[{ required: true, message: '请选择旅行风格' }]}
                >
                  <Select placeholder="选择您的旅行风格">
                    <Select.Option value="luxury">豪华游</Select.Option>
                    <Select.Option value="comfort">舒适游</Select.Option>
                    <Select.Option value="budget">经济游</Select.Option>
                    <Select.Option value="backpacker">背包游</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name="accommodationType"
                  label="住宿偏好"
                  rules={[{ required: true, message: '请选择住宿偏好' }]}
                >
                  <Select placeholder="选择住宿类型">
                    <Select.Option value="hotel">酒店</Select.Option>
                    <Select.Option value="hostel">青年旅社</Select.Option>
                    <Select.Option value="apartment">公寓</Select.Option>
                    <Select.Option value="resort">度假村</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name="transportPreference"
                  label="交通偏好"
                  rules={[{ required: true, message: '请选择交通偏好' }]}
                >
                  <Select placeholder="选择交通方式">
                    <Select.Option value="flight">飞机</Select.Option>
                    <Select.Option value="train">火车</Select.Option>
                    <Select.Option value="car">自驾</Select.Option>
                    <Select.Option value="bus">大巴</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name="interests"
                  label="兴趣爱好"
                >
                  <Select
                    mode="multiple"
                    placeholder="选择您的兴趣爱好"
                    options={interestOptions.map(interest => ({
                      label: interest,
                      value: interest,
                    }))}
                  />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    icon={<SaveOutlined />}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                    }}
                  >
                    保存旅行偏好
                  </Button>
                </Form.Item>
              </Form>
            </StyledCard>
          </Col>
        </Row>

        {/* 账户设置 */}
        <StyledCard title="⚙️ 账户设置">
          <Row gutter={[24, 24]}>
            <Col xs={24} md={8}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0 }}>语音识别</h4>
                  <p style={{ margin: 0, color: '#666', fontSize: '12px' }}>启用语音输入功能</p>
                </div>
                <Switch defaultChecked />
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0 }}>推送通知</h4>
                  <p style={{ margin: 0, color: '#666', fontSize: '12px' }}>接收旅行提醒和更新</p>
                </div>
                <Switch defaultChecked />
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0 }}>数据同步</h4>
                  <p style={{ margin: 0, color: '#666', fontSize: '12px' }}>云端同步旅行数据</p>
                </div>
                <Switch defaultChecked />
              </div>
            </Col>
          </Row>

          <Divider />

          <Row gutter={[16, 16]}>
            <Col>
              <Button>修改密码</Button>
            </Col>
            <Col>
              <Button>导出数据</Button>
            </Col>
            <Col>
              <Button danger>删除账户</Button>
            </Col>
          </Row>
        </StyledCard>
      </motion.div>
    </PageContainer>
  )
}

export default Profile