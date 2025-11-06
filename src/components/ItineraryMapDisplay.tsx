import React, { useEffect, useRef, useState } from 'react'
import { Card, Tabs, Button, Space, Typography, Tag, Spin, Alert } from 'antd'
import { ClockCircleOutlined, CarOutlined, WalkingOutlined, EnvironmentOutlined } from '@ant-design/icons'
import type { TravelPlan, DayItinerary, Activity } from '../types'

const { Title, Text, Paragraph } = Typography
const { TabPane } = Tabs

interface ItineraryMapDisplayProps {
  plan: TravelPlan
  selectedDay?: number
  onDayChange?: (day: number) => void
}

interface MapPoint {
  lng: number
  lat: number
  name: string
  address: string
  activity: Activity
  index: number
}

const ItineraryMapDisplay: React.FC<ItineraryMapDisplayProps> = ({
  plan,
  selectedDay = 1,
  onDayChange
}) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentDay, setCurrentDay] = useState(selectedDay)
  const [markers, setMarkers] = useState<any[]>([])
  const [polylines, setPolylines] = useState<any[]>([])

  // 获取当前日程的活动
  const getCurrentDayItinerary = (): DayItinerary | undefined => {
    return plan.itinerary?.find(day => day.day === currentDay)
  }

  // 将活动转换为地图点位
  const convertActivitiesToMapPoints = (activities: Activity[]): MapPoint[] => {
    return activities.map((activity, index) => ({
      lng: activity.location?.lng || 120.1551 + Math.random() * 0.01, // 默认杭州坐标
      lat: activity.location?.lat || 30.2741 + Math.random() * 0.01,
      name: activity.name,
      address: activity.location?.address || '地址待定',
      activity,
      index: index + 1
    }))
  }

  // 初始化地图
  const initMap = async () => {
    setLoading(true)
    setError('')

    try {
      if (!mapRef.current) {
        throw new Error('地图容器未找到')
      }

      if (!window.AMap) {
        throw new Error('高德地图API未加载')
      }

      // 创建地图实例
      const mapInstance = new window.AMap.Map(mapRef.current, {
        zoom: 13,
        center: [120.1551, 30.2741], // 默认杭州
        mapStyle: 'amap://styles/light',
        viewMode: '2D',
        features: ['bg', 'road', 'building', 'point'],
        showLabel: true,
        resizeEnable: true
      })

      // 添加地图控件
      try {
        mapInstance.addControl(new window.AMap.Scale({
          position: 'LB'
        }))
        mapInstance.addControl(new window.AMap.ToolBar({
          position: 'RT',
          locate: false
        }))
      } catch (controlError) {
        console.warn('地图控件添加失败:', controlError)
      }

      setMap(mapInstance)
      setLoading(false)
    } catch (err) {
      console.error('地图初始化失败:', err)
      setError(err instanceof Error ? err.message : '地图初始化失败')
      setLoading(false)
    }
  }

  // 清除地图上的标记和路线
  const clearMapElements = () => {
    if (map) {
      // 清除标记
      markers.forEach(marker => map.remove(marker))
      setMarkers([])
      
      // 清除路线
      polylines.forEach(polyline => map.remove(polyline))
      setPolylines([])
    }
  }

  // 添加景点标记
  const addMarkers = (points: MapPoint[]) => {
    if (!map || !window.AMap) return

    const newMarkers: any[] = []

    points.forEach((point, index) => {
      // 创建自定义标记图标
      const markerContent = `
        <div style="
          width: 32px;
          height: 32px;
          background: #ff4d6d;
          border: 3px solid #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 14px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">
          ${point.index}
        </div>
      `

      const marker = new window.AMap.Marker({
        position: [point.lng, point.lat],
        content: markerContent,
        anchor: 'center',
        offset: new window.AMap.Pixel(0, 0)
      })

      // 添加点击事件
      marker.on('click', () => {
        const infoWindow = new window.AMap.InfoWindow({
          content: `
            <div style="padding: 10px; min-width: 200px;">
              <h4 style="margin: 0 0 8px 0; color: #333;">${point.name}</h4>
              <p style="margin: 0 0 5px 0; color: #666; font-size: 12px;">
                <span style="color: #999;">📍</span> ${point.address}
              </p>
              <p style="margin: 0 0 5px 0; color: #666; font-size: 12px;">
                <span style="color: #999;">⏰</span> ${point.activity.startTime} - ${point.activity.endTime}
              </p>
              ${point.activity.description ? `
                <p style="margin: 5px 0 0 0; color: #666; font-size: 12px;">
                  ${point.activity.description}
                </p>
              ` : ''}
            </div>
          `,
          anchor: 'bottom-center',
          offset: new window.AMap.Pixel(0, -35)
        })
        infoWindow.open(map, marker.getPosition())
      })

      map.add(marker)
      newMarkers.push(marker)
    })

    setMarkers(newMarkers)
  }

  // 绘制路线
  const drawRoute = (points: MapPoint[]) => {
    if (!map || !window.AMap || points.length < 2) return

    const newPolylines: any[] = []

    // 创建路径点数组
    const path = points.map(point => [point.lng, point.lat])

    // 绘制虚线路径
    const polyline = new window.AMap.Polyline({
      path: path,
      strokeColor: '#ff4d6d',
      strokeWeight: 4,
      strokeStyle: 'dashed',
      strokeOpacity: 0.8,
      strokeDasharray: [10, 5],
      lineJoin: 'round',
      lineCap: 'round'
    })

    map.add(polyline)
    newPolylines.push(polyline)
    setPolylines(newPolylines)

    // 调整地图视野以包含所有点
    if (points.length > 0) {
      const bounds = new window.AMap.Bounds()
      points.forEach(point => {
        bounds.extend([point.lng, point.lat])
      })
      map.setBounds(bounds, false, [50, 50, 50, 50])
    }
  }

  // 更新地图显示
  const updateMapDisplay = () => {
    const dayItinerary = getCurrentDayItinerary()
    if (!dayItinerary || !dayItinerary.activities) return

    clearMapElements()
    
    const mapPoints = convertActivitiesToMapPoints(dayItinerary.activities)
    if (mapPoints.length > 0) {
      addMarkers(mapPoints)
      drawRoute(mapPoints)
    }
  }

  // 处理日程切换
  const handleDayChange = (day: string) => {
    const dayNumber = parseInt(day)
    setCurrentDay(dayNumber)
    onDayChange?.(dayNumber)
  }

  // 初始化地图
  useEffect(() => {
    initMap()
  }, [])

  // 更新地图显示
  useEffect(() => {
    if (map) {
      updateMapDisplay()
    }
  }, [map, currentDay, plan])

  // 渲染活动列表
  const renderActivityList = (activities: Activity[]) => {
    return activities.map((activity, index) => (
      <Card 
        key={index}
        size="small" 
        style={{ marginBottom: 16 }}
        bodyStyle={{ padding: '12px 16px' }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          {/* 序号标记 */}
          <div style={{
            width: 24,
            height: 24,
            background: '#ff4d6d',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold',
            flexShrink: 0,
            marginTop: 2
          }}>
            {index + 1}
          </div>

          {/* 活动信息 */}
          <div style={{ flex: 1 }}>
            <Title level={5} style={{ margin: '0 0 8px 0', fontSize: '16px' }}>
              {activity.name}
            </Title>
            
            {activity.description && (
              <Paragraph 
                style={{ margin: '0 0 8px 0', color: '#666', fontSize: '13px' }}
                ellipsis={{ rows: 2, expandable: true }}
              >
                {activity.description}
              </Paragraph>
            )}

            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Space size={16}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  <ClockCircleOutlined /> {activity.startTime} - {activity.endTime}
                </Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  <EnvironmentOutlined /> {activity.duration || '2小时'}
                </Text>
              </Space>

              {activity.location?.address && (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  📍 {activity.location.address}
                </Text>
              )}

              {activity.transportation && (
                <Space>
                  <Tag icon={<CarOutlined />} color="blue" style={{ fontSize: '11px' }}>
                    {activity.transportation.mode}
                  </Tag>
                  {activity.transportation.duration && (
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                      约 {activity.transportation.duration}
                    </Text>
                  )}
                </Space>
              )}
            </Space>
          </div>
        </div>
      </Card>
    ))
  }

  if (!plan.itinerary || plan.itinerary.length === 0) {
    return (
      <Alert
        message="暂无行程安排"
        description="请先创建行程计划"
        type="info"
        showIcon
      />
    )
  }

  return (
    <div style={{ display: 'flex', height: '600px', background: '#f5f5f5' }}>
      {/* 左侧行程列表 */}
      <div style={{ width: '400px', background: 'white', overflow: 'hidden' }}>
        <div style={{ padding: '16px 16px 0 16px' }}>
          <Title level={4} style={{ margin: '0 0 16px 0' }}>
            {plan.title}
          </Title>
          <Space style={{ marginBottom: 16 }}>
            <Text type="secondary">📅 {plan.itinerary.length}天</Text>
            <Text type="secondary">📍 {plan.destination}</Text>
          </Space>
        </div>

        <Tabs
          activeKey={currentDay.toString()}
          onChange={handleDayChange}
          style={{ height: 'calc(100% - 80px)' }}
          tabBarStyle={{ paddingLeft: 16, paddingRight: 16, marginBottom: 0 }}
        >
          {plan.itinerary.map((dayItinerary) => (
            <TabPane tab={`第 ${dayItinerary.day} 天`} key={dayItinerary.day.toString()}>
              <div style={{ 
                height: 'calc(100vh - 200px)', 
                overflowY: 'auto', 
                padding: '16px' 
              }}>
                <Title level={5} style={{ margin: '0 0 16px 0' }}>
                  Day {dayItinerary.day} · {dayItinerary.location || plan.destination}
                </Title>
                <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                  {dayItinerary.theme || '探索当地文化与美景'}
                </Text>
                
                {dayItinerary.activities && dayItinerary.activities.length > 0 ? (
                  renderActivityList(dayItinerary.activities)
                ) : (
                  <Alert
                    message="暂无活动安排"
                    type="info"
                    showIcon
                    style={{ margin: '20px 0' }}
                  />
                )}
              </div>
            </TabPane>
          ))}
        </Tabs>
      </div>

      {/* 右侧地图 */}
      <div style={{ flex: 1, position: 'relative' }}>
        {loading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255, 255, 255, 0.8)',
            zIndex: 1000
          }}>
            <Spin size="large" tip="地图加载中..." />
          </div>
        )}

        {error && (
          <div style={{
            position: 'absolute',
            top: 20,
            left: 20,
            right: 20,
            zIndex: 1000
          }}>
            <Alert
              message="地图加载失败"
              description={error}
              type="error"
              showIcon              action={
                <Button size="small" onClick={initMap}>
                  重试
                </Button>
              }
            />
          </div>
        )}

        <div
          ref={mapRef}
          style={{
            width: '100%',
            height: '100%',
            background: '#f0f0f0'
          }}
        />
      </div>
    </div>
  )
}

export default ItineraryMapDisplay