import React from 'react'
import { Layout, Menu, Avatar, Dropdown, Button, Space } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  HomeOutlined, 
  CalendarOutlined, 
  DollarOutlined, 
  UserOutlined,
  LogoutOutlined,
  SettingOutlined
} from '@ant-design/icons'
import { useAuthStore } from '../store/authStore'
import styled from 'styled-components'

const { Header: AntHeader } = Layout

const StyledHeader = styled(AntHeader)`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`

const Logo = styled.div`
  color: white;
  font-size: 20px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8px;
`

const StyledMenu = styled(Menu)`
  background: transparent;
  border-bottom: none;
  flex: 1;
  margin: 0 40px;
  
  .ant-menu-item {
    color: rgba(255, 255, 255, 0.8);
    border-bottom: 2px solid transparent;
    
    &:hover {
      color: white;
      border-bottom-color: rgba(255, 255, 255, 0.5);
    }
    
    &.ant-menu-item-selected {
      color: white;
      border-bottom-color: white;
      background: transparent;
    }
  }
`

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const UserName = styled.span`
  color: white;
  font-weight: 500;
`

const Header: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
    },
    {
      key: '/planning',
      icon: <CalendarOutlined />,
      label: '行程规划',
    },
    {
      key: '/budget',
      icon: <DollarOutlined />,
      label: '费用管理',
    },
  ]

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: logout,
    },
  ]

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  return (
    <StyledHeader>
      <Logo>
        🧳 AI 旅行规划师
      </Logo>
      
      <StyledMenu
        mode="horizontal"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
      />
      
      <UserSection>
        <UserName>{user?.name}</UserName>
        <Dropdown
          menu={{ items: userMenuItems }}
          placement="bottomRight"
          trigger={['click']}
        >
          <Avatar
            src={user?.avatar}
            icon={<UserOutlined />}
            style={{ cursor: 'pointer' }}
          />
        </Dropdown>
      </UserSection>
    </StyledHeader>
  )
}

export default Header