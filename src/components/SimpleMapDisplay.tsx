import React from 'react'
import { Card } from 'antd'
import styled from 'styled-components'

const MapContainer = styled.div`
  width: 100%;
  height: 500px;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
`

const ErrorMessage = styled.div`
  text-align: center;
  color: #666;
  padding: 40px 20px;
`

const ErrorIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
  color: #ccc;
`

const ErrorTitle = styled.h3`
  margin-bottom: 8px;
  color: #333;
`

const ErrorDescription = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
`

const SimpleMapDisplay: React.FC = () => {
  return (
    <Card title="🗺️ 行程地图">
      <MapContainer>
        <ErrorMessage>
          <ErrorIcon>🗺️</ErrorIcon>
          <ErrorTitle>地图功能暂时不可用</ErrorTitle>
          <ErrorDescription>
            地图服务正在维护中，请稍后再试。<br />
            您仍可以查看详细的行程安排信息。
          </ErrorDescription>
        </ErrorMessage>
      </MapContainer>
    </Card>
  )
}

export default SimpleMapDisplay