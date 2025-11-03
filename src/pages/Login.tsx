import React, { useState } from 'react'
import { Card, Form, Input, Button, Tabs, Divider, Typography, Space } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons'
import { motion } from 'framer-motion'
import styled from 'styled-components'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

const { Title, Paragraph } = Typography
const { TabPane } = Tabs

const LoginContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`

const LoginCard = styled(Card)`
  width: 100%;
  max-width: 400px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
`

const Logo = styled.div`
  text-align: center;
  margin-bottom: 32px;
  
  .logo-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }
  
  .logo-text {
    color: #1890ff;
    margin: 0;
  }
  
  .logo-subtitle {
    color: #666;
    margin: 8px 0 0 0;
  }
`

const StyledButton = styled(Button)`
  width: 100%;
  height: 48px;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  font-size: 16px;
  font-weight: 500;
  
  &:hover {
    background: linear-gradient(135deg, #5a6fd8 0%, #6b4190 100%);
  }
`

const Login: React.FC = () => {
  const [loginForm] = Form.useForm()
  const [registerForm] = Form.useForm()
  const [activeTab, setActiveTab] = useState('login')
  const { login, register, isLoading } = useAuthStore()

  const handleLogin = async (values: any) => {
    try {
      await login(values.email, values.password)
      toast.success('登录成功！')
    } catch (error) {
      toast.error('登录失败，请检查邮箱和密码')
    }
  }

  const handleRegister = async (values: any) => {
    if (values.password !== values.confirmPassword) {
      toast.error('两次输入的密码不一致')
      return
    }

    try {
      await register(values.email, values.password, values.name)
      toast.success('注册成功！')
    } catch (error) {
      toast.error('注册失败，请重试')
    }
  }

  const handleDemoLogin = async () => {
    try {
      await login('demo@example.com', 'demo123')
      toast.success('体验账户登录成功！')
    } catch (error) {
      toast.error('登录失败，请重试')
    }
  }

  return (
    <LoginContainer>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <LoginCard>
          <Logo>
            <div className="logo-icon">🧳</div>
            <Title level={2} className="logo-text">AI 旅行规划师</Title>
            <Paragraph className="logo-subtitle">
              让 AI 为您规划完美的旅行体验
            </Paragraph>
          </Logo>

          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            centered
            size="large"
          >
            <TabPane tab="登录" key="login">
              <Form
                form={loginForm}
                layout="vertical"
                onFinish={handleLogin}
                size="large"
              >
                <Form.Item
                  name="email"
                  rules={[
                    { required: true, message: '请输入邮箱' },
                    { type: 'email', message: '请输入有效的邮箱地址' }
                  ]}
                >
                  <Input
                    prefix={<MailOutlined />}
                    placeholder="邮箱地址"
                    style={{ borderRadius: 8 }}
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  rules={[{ required: true, message: '请输入密码' }]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="密码"
                    style={{ borderRadius: 8 }}
                  />
                </Form.Item>

                <Form.Item>
                  <StyledButton
                    type="primary"
                    htmlType="submit"
                    loading={isLoading}
                  >
                    登录
                  </StyledButton>
                </Form.Item>
              </Form>

              <Divider>或</Divider>

              <Button
                block
                size="large"
                onClick={handleDemoLogin}
                loading={isLoading}
                style={{
                  borderRadius: 8,
                  height: 48,
                  borderColor: '#1890ff',
                  color: '#1890ff'
                }}
              >
                🚀 体验演示账户
              </Button>

              <div style={{ textAlign: 'center', marginTop: 16, color: '#666' }}>
                <small>
                  体验账户：demo@example.com / demo123
                </small>
              </div>
            </TabPane>

            <TabPane tab="注册" key="register">
              <Form
                form={registerForm}
                layout="vertical"
                onFinish={handleRegister}
                size="large"
              >
                <Form.Item
                  name="name"
                  rules={[{ required: true, message: '请输入姓名' }]}
                >
                  <Input
                    prefix={<UserOutlined />}
                    placeholder="姓名"
                    style={{ borderRadius: 8 }}
                  />
                </Form.Item>

                <Form.Item
                  name="email"
                  rules={[
                    { required: true, message: '请输入邮箱' },
                    { type: 'email', message: '请输入有效的邮箱地址' }
                  ]}
                >
                  <Input
                    prefix={<MailOutlined />}
                    placeholder="邮箱地址"
                    style={{ borderRadius: 8 }}
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  rules={[
                    { required: true, message: '请输入密码' },
                    { min: 6, message: '密码至少6位' }
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="密码"
                    style={{ borderRadius: 8 }}
                  />
                </Form.Item>

                <Form.Item
                  name="confirmPassword"
                  rules={[{ required: true, message: '请确认密码' }]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="确认密码"
                    style={{ borderRadius: 8 }}
                  />
                </Form.Item>

                <Form.Item>
                  <StyledButton
                    type="primary"
                    htmlType="submit"
                    loading={isLoading}
                  >
                    注册
                  </StyledButton>
                </Form.Item>
              </Form>
            </TabPane>
          </Tabs>

          <Divider />

          <div style={{ textAlign: 'center', color: '#666' }}>
            <Space direction="vertical" size="small">
              <div>
                <strong>✨ 主要功能</strong>
              </div>
              <div>🎯 AI 智能行程规划</div>
              <div>🎤 语音输入识别</div>
              <div>💰 费用预算管理</div>
              <div>🗺️ 地图导航集成</div>
              <div>☁️ 云端数据同步</div>
            </Space>
          </div>
        </LoginCard>
      </motion.div>
    </LoginContainer>
  )
}

export default Login