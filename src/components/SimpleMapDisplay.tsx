import React, { useEffect, useRef, useState } from 'react'
import { Card, Button, Space, Spin, message, Select } from 'antd'
import { FullscreenOutlined, ReloadOutlined, CarOutlined, UserOutlined } from '@ant-design/icons'
import styled from 'styled-components'
import { TravelPlan, Activity } from '../types'

interface RealMapDisplayProps {
  plan: TravelPlan
}

const MapContainer = styled.div`
  width: 100%;
  height: 500px;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  background: #f5f5f5;
`

const MapControls = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const RouteControls = styled.div`
  position: absolute;
  bottom: 16px;
  left: 16px;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  padding: 8px;
`

const LoadingContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.8);
  z-index: 999;
`

const MapElement = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 12px;
`

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
  text-align: center;
`

interface Location {
  name: string
  address?: string
  coords?: [number, number]
}

const RealMapDisplay: React.FC<RealMapDisplayProps> = ({ plan }) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [loading, setLoading] = useState(true)
  const [routeMode, setRouteMode] = useState<'driving' | 'walking'>('driving')
  const [locations, setLocations] = useState<Location[]>([])
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (!window.AMap) {
      setError('高德地图API未加载，请检查网络连接')
      setLoading(false)
      return
    }
    
    initMap()
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy()
      }
    }
  }, [])

  useEffect(() => {
    if (mapInstanceRef.current && locations.length > 0) {
      updateMapWithPlanData()
    }
  }, [plan, routeMode, locations])

  const initMap = async () => {
    setLoading(true)
    setError('')
    
    try {
      if (!mapRef.current) {
        throw new Error('地图容器未找到')
      }

      // 创建地图实例
      const map = new window.AMap.Map(mapRef.current, {
        zoom: 12,
        center: [116.397428, 39.90923], // 默认北京
        mapStyle: 'amap://styles/normal',
        viewMode: '2D',
        features: ['bg', 'road', 'building', 'point'],
        showLabel: true
      })

      // 添加地图控件
      map.addControl(new window.AMap.Scale())
      map.addControl(new window.AMap.ToolBar({
        locate: true,
        noIpLocate: true,
        locateTimeout: 3000,
        useNative: true
      }))

      mapInstanceRef.current = map

      // 等待地图加载完成
      map.on('complete', () => {
        console.log('地图加载完成')
        extractLocationsFromPlan()
      })

      map.on('error', (error: any) => {
        console.error('地图加载失败:', error)
        setError('地图加载失败，请刷新重试')
        setLoading(false)
      })

    } catch (error) {
      console.error('地图初始化失败:', error)
      setError('地图初始化失败')
      setLoading(false)
    }
  }

  const extractLocationsFromPlan = () => {
    const extractedLocations: Location[] = []
    
    // 添加出发地
    if (plan.origin) {
      extractedLocations.push({
        name: '出发地',
        address: plan.origin
      })
    }

    // 从行程中提取地点
    plan.itinerary.forEach((day, dayIndex) => {
      day.activities.forEach((activity: Activity) => {
        if (activity.location) {
          extractedLocations.push({
            name: activity.title || activity.name,
            address: activity.location
          })
        }
      })
    })

    // 添加目的地（如果与其他地点不重复）
    if (plan.destination && !extractedLocations.some(loc => 
      loc.address?.includes(plan.destination) || loc.name.includes(plan.destination)
    )) {
      extractedLocations.push({
        name: '目的地',
        address: plan.destination
      })
    }

    console.log('提取的地点:', extractedLocations)
    setLocations(extractedLocations)
    
    if (extractedLocations.length > 0) {
      geocodeLocations(extractedLocations)
    } else {
      setError('未找到有效的地点信息')
      setLoading(false)
    }
  }

  const geocodeLocations = async (locationList: Location[]) => {
    if (!window.AMap || !mapInstanceRef.current) return

    try {
      const geocoder = new window.AMap.Geocoder({
        city: plan.destination || '全国'
      })

      const geocodedLocations: Location[] = []
      
      for (const location of locationList) {
        try {
          const result = await new Promise<any>((resolve, reject) => {
            geocoder.getLocation(location.address || location.name, (status: string, result: any) => {
              if (status === 'complete' && result.geocodes && result.geocodes.length > 0) {
                resolve(result.geocodes[0])
              } else {
                reject(new Error(`地理编码失败: ${location.name}`))
              }
            })
          })

          geocodedLocations.push({
            ...location,
            coords: [result.location.lng, result.location.lat]
          })
        } catch (error) {
          console.warn(`地点 ${location.name} 地理编码失败:`, error)
          // 继续处理其他地点
        }
      }

      console.log('地理编码结果:', geocodedLocations)
      setLocations(geocodedLocations)
      
      if (geocodedLocations.length > 0) {
        displayLocationsOnMap(geocodedLocations)
      } else {
        setError('无法获取地点坐标信息')
        setLoading(false)
      }
    } catch (error) {
      console.error('地理编码过程失败:', error)
      setError('地点解析失败')
      setLoading(false)
    }
  }

  const displayLocationsOnMap = (locationList: Location[]) => {
    if (!mapInstanceRef.current) return

    const map = mapInstanceRef.current
    
    // 清除之前的标记和路线
    map.clearMap()

    const validLocations = locationList.filter(loc => loc.coords)
    if (validLocations.length === 0) {
      setError('没有有效的地点坐标')
      setLoading(false)
      return
    }

    // 添加标记
    const markers: any[] = []
    validLocations.forEach((location, index) => {
      if (!location.coords) return

      const marker = new window.AMap.Marker({
        position: location.coords,
        title: location.name,
        label: {
          content: `<div style="background: #ff69b4; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">${index + 1}</div>`,
          offset: new window.AMap.Pixel(0, -30)
        }
      })

      // 添加信息窗口
      const infoWindow = new window.AMap.InfoWindow({
        content: `
          <div style="padding: 10px;">
            <h4 style="margin: 0 0 8px 0; color: #333;">${location.name}</h4>
            <p style="margin: 0; color: #666; font-size: 12px;">${location.address || '详细地址未知'}</p>
          </div>
        `,
        offset: new window.AMap.Pixel(0, -30)
      })

      marker.on('click', () => {
        infoWindow.open(map, marker.getPosition())
      })

      map.add(marker)
      markers.push(marker)
    })

    // 调整地图视野以包含所有标记
    if (validLocations.length > 1) {
      const bounds = new window.AMap.Bounds()
      validLocations.forEach(location => {
        if (location.coords) {
          bounds.extend(location.coords)
        }
      })
      map.setBounds(bounds, false, [50, 50, 50, 50])
    } else if (validLocations.length === 1 && validLocations[0].coords) {
      map.setCenter(validLocations[0].coords)
      map.setZoom(15)
    }

    // 绘制路线
    if (validLocations.length > 1) {
      drawRoute(validLocations)
    }

    setLoading(false)
  }

  const drawRoute = (locationList: Location[]) => {
    if (!mapInstanceRef.current || locationList.length < 2) return

    const map = mapInstanceRef.current
    const waypoints = locationList
      .filter(loc => loc.coords)
      .map(loc => loc.coords!)

    if (waypoints.length < 2) return

    // 根据路线模式选择不同的路径规划服务
    if (routeMode === 'driving') {
      const driving = new window.AMap.Driving({
        map: map,
        panel: null,
        hideMarkers: true,
        polyOptions: {
          strokeColor: '#ff69b4',
          strokeWeight: 6,
          strokeOpacity: 0.8
        }
      })

      // 规划多点路线
      if (waypoints.length === 2) {
        driving.search(waypoints[0], waypoints[1])
      } else {
        // 多个点的情况，分段规划
        for (let i = 0; i < waypoints.length - 1; i++) {
          driving.search(waypoints[i], waypoints[i + 1])
        }
      }
    } else {
      const walking = new window.AMap.Walking({
        map: map,
        panel: null,
        hideMarkers: true,
        polyOptions: {
          strokeColor: '#ff69b4',
          strokeWeight: 4,
          strokeOpacity: 0.8,
          strokeStyle: 'dashed'
        }
      })

      // 步行路线规划
      for (let i = 0; i < waypoints.length - 1; i++) {
        walking.search(waypoints[i], waypoints[i + 1])
      }
    }
  }

  const updateMapWithPlanData = () => {
    if (locations.length > 0) {
      displayLocationsOnMap(locations)
    }
  }

  const handleFullscreen = () => {
    if (mapRef.current) {
      mapRef.current.requestFullscreen?.()
    }
  }

  const handleRefresh = () => {
    setError('')
    initMap()
    message.success('地图已刷新')
  }

  const handleRouteModeChange = (mode: 'driving' | 'walking') => {
    setRouteMode(mode)
    if (mapInstanceRef.current && locations.length > 1) {
      // 清除当前路线
      mapInstanceRef.current.clearMap()
      // 重新显示地点和路线
      displayLocationsOnMap(locations)
    }
  }

  if (error) {
    return (
      <Card title="🗺️ 行程地图">
        <ErrorContainer>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗺️</div>
          <h3>地图加载失败</h3>
          <p>{error}</p>
          <Button type="primary" onClick={handleRefresh} style={{ marginTop: '16px' }}>
            重新加载
          </Button>
        </ErrorContainer>
      </Card>
    )
  }

  return (
    <Card title="🗺️ 行程地图">
      <MapContainer>
        {loading && (
          <LoadingContainer>
            <Spin size="large" tip="正在加载地图和路线..." />
          </LoadingContainer>
        )}
        
        <MapElement ref={mapRef} />

        <MapControls>
          <Button
            type="primary"
            icon={<FullscreenOutlined />}
            onClick={handleFullscreen}
            title="全屏显示"
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            title="刷新地图"
          />
        </MapControls>

        <RouteControls>
          <Space>
            <Button
              type={routeMode === 'driving' ? 'primary' : 'default'}
              icon={<CarOutlined />}
              onClick={() => handleRouteModeChange('driving')}
              size="small"
            >
              驾车
            </Button>
            <Button
              type={routeMode === 'walking' ? 'primary' : 'default'}
              icon={<UserOutlined />}
              onClick={() => handleRouteModeChange('walking')}
              size="small"
            >
              步行
            </Button>
          </Space>
        </RouteControls>
      </MapContainer>
    </Card>
  )
}

export default RealMapDisplay