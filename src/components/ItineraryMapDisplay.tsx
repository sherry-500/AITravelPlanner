import React, { useEffect, useRef, useState } from 'react'
import { Card, Tabs, Button, Space, Typography, Tag, Spin, Alert } from 'antd'
import { ClockCircleOutlined, CarOutlined, WalkingOutlined, EnvironmentOutlined } from '@ant-design/icons'
import type { TravelPlan, DayItinerary, Activity } from '../types'
import { geocodingService } from '../services/geocodingService'
import { apiConfigService } from '../services/apiConfigService'

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
  const convertActivitiesToMapPoints = async (activities: Activity[]): Promise<MapPoint[]> => {
    const mapPoints: MapPoint[] = []
    
    for (let index = 0; index < activities.length; index++) {
      const activity = activities[index]
      let lng: number = 120.1551 // 默认杭州坐标
      let lat: number = 30.2741
      let address = '地址待定'
      
      if (activity.location) {
        if (typeof activity.location === 'object') {
          // 确保坐标是有效的数字，支持多种坐标字段名
          const locLng = parseFloat(String(activity.location.lng || activity.location.longitude || 0))
          const locLat = parseFloat(String(activity.location.lat || activity.location.latitude || 0))
          
          if (!isNaN(locLng) && !isNaN(locLat) && 
              isFinite(locLng) && isFinite(locLat) &&
              locLng >= -180 && locLng <= 180 &&
              locLat >= -90 && locLat <= 90 &&
              locLng !== 0 && locLat !== 0) { // 排除 (0,0) 坐标
            lng = locLng
            lat = locLat
          }
          
          address = activity.location.address || activity.location.name || address
        } else {
          address = activity.location
        }
      }
      
      // 如果没有有效坐标，尝试通过地理编码获取真实坐标
      if (lng === 120.1551 && lat === 30.2741) {
        const searchAddress = activity.location?.address || activity.location || activity.name || ''
        
        if (searchAddress && searchAddress !== '地址待定' && searchAddress.trim() !== '') {
          try {
            // 根据目的地确定城市参数
            let city = ''
            const locationText = searchAddress.toLowerCase()
            
            if (locationText.includes('伦敦') || locationText.includes('london')) {
              city = 'London'
            } else if (locationText.includes('巴黎') || locationText.includes('paris')) {
              city = 'Paris'
            } else if (locationText.includes('东京') || locationText.includes('tokyo')) {
              city = 'Tokyo'
            } else if (locationText.includes('纽约') || locationText.includes('new york')) {
              city = 'New York'
            } else if (locationText.includes('上海')) {
              city = '上海'
            } else if (locationText.includes('北京')) {
              city = '北京'
            }
            
            const geocodeResult = await geocodingService.getCoordinates(searchAddress, city)
            
            if (geocodeResult) {
              lng = geocodeResult.lng
              lat = geocodeResult.lat
              address = geocodeResult.address
              console.log(`获取到真实坐标: ${searchAddress} -> [${lng}, ${lat}]`)
            } else {
              // 地理编码失败，使用基于城市的默认坐标
              if (locationText.includes('伦敦') || locationText.includes('london')) {
                lng = -0.1276 + (Math.random() - 0.5) * 0.05
                lat = 51.5074 + (Math.random() - 0.5) * 0.05
              } else if (locationText.includes('巴黎') || locationText.includes('paris')) {
                lng = 2.3522 + (Math.random() - 0.5) * 0.05
                lat = 48.8566 + (Math.random() - 0.5) * 0.05
              } else if (locationText.includes('东京') || locationText.includes('tokyo')) {
                lng = 139.6917 + (Math.random() - 0.5) * 0.05
                lat = 35.6895 + (Math.random() - 0.5) * 0.05
              } else if (locationText.includes('纽约') || locationText.includes('new york')) {
                lng = -74.0060 + (Math.random() - 0.5) * 0.05
                lat = 40.7128 + (Math.random() - 0.5) * 0.05
              } else {
                // 保持默认杭州坐标，添加小的随机偏移
                lng = 120.1551 + (Math.random() - 0.5) * 0.05
                lat = 30.2741 + (Math.random() - 0.5) * 0.05
              }
              console.warn(`地理编码失败，使用默认坐标: ${searchAddress}`)
            }
          } catch (geocodeError) {
            console.error(`地理编码服务调用失败: ${searchAddress}`, geocodeError)
            // 使用基于城市的默认坐标
            const locationText = searchAddress.toLowerCase()
            if (locationText.includes('伦敦') || locationText.includes('london')) {
              lng = -0.1276 + (Math.random() - 0.5) * 0.05
              lat = 51.5074 + (Math.random() - 0.5) * 0.05
            } else if (locationText.includes('巴黎') || locationText.includes('paris')) {
              lng = 2.3522 + (Math.random() - 0.5) * 0.05
              lat = 48.8566 + (Math.random() - 0.5) * 0.05
            } else if (locationText.includes('东京') || locationText.includes('tokyo')) {
              lng = 139.6917 + (Math.random() - 0.5) * 0.05
              lat = 35.6895 + (Math.random() - 0.5) * 0.05
            } else if (locationText.includes('纽约') || locationText.includes('new york')) {
              lng = -74.0060 + (Math.random() - 0.5) * 0.05
              lat = 40.7128 + (Math.random() - 0.5) * 0.05
            }
          }
        }
      }
      
      // 最终验证坐标
      if (isNaN(lng) || isNaN(lat) || !isFinite(lng) || !isFinite(lat) ||
          lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        console.warn('坐标验证失败，使用默认坐标:', { activity: activity.name, lng, lat })
        lng = 120.1551 + (Math.random() - 0.5) * 0.05
        lat = 30.2741 + (Math.random() - 0.5) * 0.05
      }
      
      // 确保坐标是有效数字
      const validLng = Number(lng)
      const validLat = Number(lat)
      
      if (isNaN(validLng) || isNaN(validLat) || !isFinite(validLng) || !isFinite(validLat)) {
        console.warn('坐标转换失败，跳过此活动:', { activity: activity.name, lng, lat })
        continue // 跳过无效坐标的活动
      }
      
      mapPoints.push({
        lng: validLng,
        lat: validLat,
        name: activity.name || activity.title || '未知活动',
        address,
        activity,
        index: index + 1
      })
    }
    
    return mapPoints
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
  const updateMapDisplay = async () => {
    const dayItinerary = getCurrentDayItinerary()
    if (!dayItinerary || !dayItinerary.activities) return

    clearMapElements()
    
    try {
      const mapPoints = await convertActivitiesToMapPoints(dayItinerary.activities)
      if (mapPoints.length > 0) {
        // 更新地图中心点
        const center = calculateMapCenter(mapPoints)
        if (map) {
          map.setCenter(center)
          
          // 根据点的数量调整缩放级别
          if (mapPoints.length === 1) {
            map.setZoom(15)
          } else if (mapPoints.length <= 3) {
            map.setZoom(13)
          } else {
            map.setZoom(12)
          }
        }
        
        addMarkers(mapPoints)
        drawRoute(mapPoints)
      }
    } catch (error) {
      console.error('更新地图显示失败:', error)
    }
  }

  // 计算地图中心点
  const calculateMapCenter = (points: MapPoint[]): [number, number] => {
    if (points.length === 0) return [120.1551, 30.2741]
    
    const validPoints = points.filter(point => {
      const lng = Number(point.lng)
      const lat = Number(point.lat)
      return !isNaN(lng) && !isNaN(lat) && 
             lng >= -180 && lng <= 180 && 
             lat >= -90 && lat <= 90
    })
    
    if (validPoints.length === 0) return [120.1551, 30.2741]
    
    const avgLng = validPoints.reduce((sum, point) => sum + Number(point.lng), 0) / validPoints.length
    const avgLat = validPoints.reduce((sum, point) => sum + Number(point.lat), 0) / validPoints.length
    
    return [avgLng, avgLat]
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