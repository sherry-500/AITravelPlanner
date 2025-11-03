import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Layout } from 'antd'
import Header from './components/Header'
import Home from './pages/Home'
import Planning from './pages/Planning'
import Budget from './pages/Budget'
import Profile from './pages/Profile'
import Login from './pages/Login'
import PlanDetail from './pages/PlanDetail'
import { useAuthStore } from './store/authStore'

const { Content } = Layout

function App() {
  const { user } = useAuthStore()

  if (!user) {
    return <Login />
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header />
      <Content style={{ padding: '0' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/planning" element={<Planning />} />
          <Route path="/plan/:id" element={<PlanDetail />} />
          <Route path="/budget" element={<Budget />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Content>
    </Layout>
  )
}

export default App