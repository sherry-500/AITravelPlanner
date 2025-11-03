import React, { useEffect, useRef, useState } from 'react'
import { Card, Button, Space, Select, message, Spin } from 'antd'
import { EnvironmentOutlined, CarOutlined, SwapOutlined } from '@ant-design/icons'
import styled from 'styled-components'
import { TravelPlan } from '../types'

const MapContainer = styled.div`
  width: 100%;
  height: 500px;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
`

const MapControls = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`

const RouteInfo = styled.div`
  position: absolute;
  bottom: 16px;
  left: 16px;
  right: 16px;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
`

interface MapDisplayProps {
  plan: TravelPlan
}

declare global {
  interface Window {
    AMap: any
  }
}

const MapDisplay: React.FC<MapDisplayProps> = ({ plan }) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [routeType, setRouteType] = useState<'driving' | 'walking' | 'transit'>('driving')
  const [routeInfo, setRouteInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [markers, setMarkers] = useState<any[]>([])

  useEffect(() => {
    if (!mapRef.current || !window.AMap) return
    initMap()
  }, [])

  useEffect(() => {
    if (map && plan) {
      updateMapWithPlan()
    }
  }, [map, plan, routeType])

  const initMap = () => {
    setLoading(true)
    
    const mapInstance = new window.AMap.Map(mapRef.current, {
      zoom: 12,
      center: [116.397428, 39.90923], // 默认北京
      mapStyle: 'amap://styles/normal',
      viewMode: '3D',
      pitch: 30,
      features: ['bg', 'road', 'building', 'point']
    })

    // 添加地图控件
    mapInstance.addControl(new window.AMap.Scale())
    mapInstance.addControl(new window.AMap.ToolBar())
    mapInstance.addControl(new window.AMap.ControlBar())

    setMap(mapInstance)
    setLoading(false)
  }

  const updateMapWithPlan = async () => {
    if (!map || !plan) return

    try {
      setLoading(true)
      
      // 清除之前的标记和路线
      clearMapElements()

      // 获取所有地点
      const locations = await getLocationsFromPlan(plan)
      
      if (locations.length === 0) {
        message.warning('未找到有效的地理位置信息')
        setLoading(false)
        return
      }

      // 添加标记
      await addMarkersToMap(locations)

      // 规划路线
      if (locations.length > 1) {
        await planRoute(locations)
      }

      // 调整地图视野
      adjustMapView(locations)
      
    } catch (error) {
      console.error('地图更新失败:', error)
      message.error('地图加载失败，请检查网络连接')
    } finally {
      setLoading(false)
    }
  }

  const getLocationsFromPlan = async (plan: TravelPlan): Promise<any[]> => {
    const geocoder = new window.AMap.Geocoder()
    const locations: any[] = []

    // 添加出发地
    if (plan.origin) {
      try {
        const originResult = await geocodeLocation(geocoder, plan.origin)
        if (originResult) {
          locations.push({
            name: plan.origin,
            position: originResult,
            type: 'origin',
            icon: '🏠'
          })
        }
      } catch (error) {
        console.warn('出发地地理编码失败:', plan.origin)
      }
    }

    // 添加目的地
    try {
      const destResult = await geocodeLocation(geocoder, plan.destination)
      if (destResult) {
        locations.push({
          name: plan.destination,
          position: destResult,
          type: 'destination',
          icon: '🎯'
        })
      }
    } catch (error) {
      console.warn('目的地地理编码失败:', plan.destination)
    }

    // 添加行程中的景点
    for (const day of plan.itinerary) {
      for (const activity of day.activities) {
        if (activity.type === 'sightseeing' || activity.type === 'dining') {
          try {
            const locationStr = typeof activity.location === 'string' 
              ? activity.location 
              : (activity.location as Location).name || (activity.location as Location).address || ''
            
            if (!locationStr) continue
            
            const activityResult = await geocodeLocation(geocoder, locationStr)
            if (activityResult) {
              locations.push({
                name: activity.title || activity.name || locationStr,
                position: activityResult,
                type: 'activity',
                icon: activity.type === 'sightseeing' ? '🏛️' : '🍽️',
                day: day.day,
                activity: activity
              })
            }
          } catch (error) {
            console.warn('景点地理编码失败:', locationStr)
          }
        }
      }
    }

    return locations
  }

  const geocodeLocation = (geocoder: any, address: string): Promise<[number, number] | null> => {
    return new Promise((resolve) => {
      geocoder.getLocation(address, (status: string, result: any) => {
        if (status === 'complete' && result.geocodes.length > 0) {
          const location = result.geocodes[0].location
          resolve([location.lng, location.lat])
        } else {
          resolve(null)
        }
      })
    })
  }

  const addMarkersToMap = async (locations: any[]) => {
    const newMarkers: any[] = []

    for (const location of locations) {
      const marker = new window.AMap.Marker({
        position: location.position,
        title: location.name,
        content: createMarkerContent(location),
        anchor: 'bottom-center'
      })

      // 添加点击事件
      marker.on('click', () => {
        showLocationInfo(location)
      })

      map.add(marker)
      newMarkers.push(marker)
    }

    setMarkers(newMarkers)
  }

  const createMarkerContent = (location: any) => {
    const colors: Record<string, string> = {
      origin: '#52c41a',
      destination: '#1890ff',
      activity: '#fa8c16'
    }

    return `
      <div style="
        background: ${colors[location.type] || '#666'};
        color: white;
        padding: 8px 12px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        white-space: nowrap;
        position: relative;
      ">
        ${location.icon} ${location.name}
        <div style="
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 6px solid ${colors[location.type as keyof typeof colors] || '#666'};
        "></div>
      </div>
    `
  }

  const planRoute = async (locations: any[]) => {
    if (locations.length < 2) return

    const start = locations[0].position
    const end = locations[locations.length - 1].position
    const waypoints = locations.slice(1, -1).map(loc => loc.position)

    try {
      let routeService: any

      switch (routeType) {
        case 'driving':
          routeService = new window.AMap.Driving({
            map: map,
            showTraffic: true,
            hideMarkers: true,
            autoFitView: false
          })
          break
        case 'walking':
          routeService = new window.AMap.Walking({
            map: map,
            hideMarkers: true,
            autoFitView: false
          })
          break
        case 'transit':
          routeService = new window.AMap.Transfer({
            map: map,
            hideMarkers: true,
            autoFitView: false
          })
          break
      }

      routeService.search(start, end, {
        waypoints: waypoints
      }, (status: string, result: any) => {
        if (status === 'complete') {
          setRouteInfo(result)
        } else {
          message.warning('路线规划失败')
        }
      })

    } catch (error) {
      console.error('路线规划失败:', error)
    }
  }

  const adjustMapView = (locations: any[]) => {
    if (locations.length === 0) return

    if (locations.length === 1) {
      map.setCenter(locations[0].position)
      map.setZoom(15)
    } else {
      const bounds = new window.AMap.Bounds()
      locations.forEach(location => {
        bounds.extend(location.position)
      })
      map.setBounds(bounds, false, [50, 50, 50, 50])
    }
  }

  const clearMapElements = () => {
    // 清除标记
    markers.forEach(marker => {
      map.remove(marker)
    })
    setMarkers([])

    // 清除路线
    map.clearMap()
    setRouteInfo(null)
  }

  const showLocationInfo = (location: any) => {
    const infoWindow = new window.AMap.InfoWindow({
      content: `
        <div style="padding: 12px; min-width: 200px;">
          <h4 style="margin: 0 0 8px 0; color: #1890ff;">
            ${location.icon} ${location.name}
          </h4>
          ${location.activity ? `
            <p style="margin: 4px 0; color: #666;">
              <strong>时间:</strong> ${location.activity.time}
            </p>
            <p style="margin: 4px 0; color: #666;">
              <strong>预计费用:</strong> ¥${location.activity.estimatedCost || 0}
            </p>
            <p style="margin: 4px 0; color: #666;">
              <strong>描述:</strong> ${location.activity.description || '暂无描述'}
            </p>
          ` : ''}
          ${location.day ? `
            <p style="margin: 4px 0; color: #1890ff;">
              <strong>第${location.day}天行程</strong>
            </p>
          ` : ''}
        </div>
      `,
      anchor: 'bottom-center',
      offset: [0, -30]
    })

    infoWindow.open(map, location.position)
  }

  const getRouteTypeIcon = (type: string) => {
    switch (type) {
      case 'driving': return <CarOutlined />
      case 'walking': return '🚶'
      case 'transit': return <SwapOutlined />
      default: return <CarOutlined />
    }
  }

  const formatRouteInfo = (info: any) => {
    if (!info || !info.routes || info.routes.length === 0) return null

    const route = info.routes[0]
    const distance = (route.distance / 1000).toFixed(1)
    const time = Math.round(route.time / 60)

    return {
      distance: `${distance} 公里`,
      time: `${time} 分钟`,
      tolls: route.tolls ? `过路费: ¥${route.tolls}` : ''
    }
  }

  return (
    <Card title="🗺️ 行程地图" style={{ height: '100%' }}>
      <MapContainer ref={mapRef}>
        {loading && (
          <LoadingOverlay>
            <Spin size="large" tip="地图加载中..." />
          </LoadingOverlay>
        )}
        
        <MapControls>
          <Space direction="vertical" size="small">
            <Select
              value={routeType}
              onChange={setRouteType}
              style={{ width: 120 }}
              size="small"
            >
              <Select.Option value="driving">
                <CarOutlined /> 驾车
              </Select.Option>
              <Select.Option value="walking">
                🚶 步行
              </Select.Option>
              <Select.Option value="transit">
                <SwapOutlined /> 公交
              </Select.Option>
            </Select>
            
            <Button 
              size="small" 
              icon={<EnvironmentOutlined />}
              onClick={() => updateMapWithPlan()}
            >
              刷新
            </Button>
          </Space>
        </MapControls>

        {routeInfo && formatRouteInfo(routeInfo) && (
          <RouteInfo>
            <Space>
              {getRouteTypeIcon(routeType)}
              <span><strong>距离:</strong> {formatRouteInfo(routeInfo)?.distance}</span>
              <span><strong>时间:</strong> {formatRouteInfo(routeInfo)?.time}</span>
              {formatRouteInfo(routeInfo)?.tolls && (
                <span>{formatRouteInfo(routeInfo)?.tolls}</span>
              )}
            </Space>
          </RouteInfo>
        )}
      </MapContainer>
    </Card>
  )
}

export default MapDisplay