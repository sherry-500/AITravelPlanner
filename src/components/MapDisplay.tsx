import React, { useEffect, useRef, useState, useCallback } from 'react'
import styled from 'styled-components'
import { Button, Select, message } from 'antd'
import { EnvironmentOutlined } from '@ant-design/icons'
import { TravelPlan } from '../types'
import { useAuthStore } from '../store/authStore'
import { useAmapLoader } from '../utils/useAmapLoader'

const { Option } = Select

interface MapDisplayProps {
  planId?: string
  locations?: any[]
  onLocationsChange?: (locations: any[]) => void
}

const StyledMapContainer = styled.div`
  position: relative;
  width: 100%;
  height: 600px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`

const MapContainer = styled.div`
  width: 100%;
  height: 100%;
  z-index: 1;
`

const ControlPanel = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: white;
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`

const RouteTypeSelector = styled.div`
  margin-bottom: 8px;
`

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  flex-direction: column;
`

const RouteInfoPanel = styled.div`
  position: absolute;
  bottom: 16px;
  left: 16px;
  background: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-width: 300px;
  z-index: 10;
`

const RouteInfoHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  
  h4 {
    margin: 0;
    color: #1890ff;
  }
`

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: #666;
  }
`

const RouteDetails = styled.div`
  font-size: 14px;
  
  p {
    margin: 8px 0;
    color: #333;
  }
  
  strong {
    color: #1890ff;
  }
`

const StyledSpin = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 5;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`

const MapDisplay: React.FC<MapDisplayProps> = ({ planId, locations = [], onLocationsChange }) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const routeInfoRef = useRef<any>(null)
  const [loading, setLoading] = useState(true)
  const [routeType, setRouteType] = useState<'driving' | 'walking' | 'transit'>('driving')
  const [routeInfo, setRouteInfo] = useState<any>(null)
  const [isMapReady, setIsMapReady] = useState(false)

  const { user } = useAuthStore()
  const isAuthenticated = !!user
  
  // 模拟获取行程数据（暂时注释掉API调用）
  const [plan, setPlan] = useState<TravelPlan | undefined>(undefined)
  
  // useEffect(() => {
  //   if (planId && isAuthenticated) {
  //     fetchTravelPlan(planId).then(setPlan).catch(console.error)
  //   }
  // }, [planId, isAuthenticated])

  // 使用高德地图加载器
  const { loaded: amapLoaded, error: amapError } = useAmapLoader()

  // 格式化距离
  const formatDistance = (distance: number) => {
    if (distance < 1000) {
      return `${distance}米`
    }
    return `${(distance / 1000).toFixed(1)}公里`
  }

  // 格式化时间
  const formatTime = (time: number) => {
    if (time < 60) {
      return `${time}秒`
    }
    const minutes = Math.floor(time / 60)
    if (minutes < 60) {
      return `${minutes}分钟`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}小时${remainingMinutes}分钟`
  }

  // 清除所有地图元素
  const clearMapElements = useCallback(() => {
    if (mapInstanceRef.current) {
      // 清除标记
      if (markersRef.current.length > 0) {
        markersRef.current.forEach(marker => {
          try {
            if (marker) {
              mapInstanceRef.current!.remove(marker)
            }
          } catch (error) {
            console.warn('移除标记失败:', error)
          }
        })
        markersRef.current = []
      }

      // 清除路线
      try {
        mapInstanceRef.current.clearMap()
      } catch (error) {
        console.warn('清除地图路线失败:', error)
      }
    }
    
    setRouteInfo(null)
    routeInfoRef.current = null
  }, [])

  // 显示位置信息
  const showLocationInfo = useCallback((location: any) => {
    try {
      if (!mapInstanceRef.current || !(window as any).AMap) {
        console.warn('地图未初始化，无法显示信息窗口')
        return
      }
      
      const infoWindow = new (window as any).AMap.InfoWindow({
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

      infoWindow.open(mapInstanceRef.current, location.position)
    } catch (error) {
      console.error('显示位置信息失败:', error)
    }
  }, [])

  // 规划路线
  const planRoute = useCallback(async (locations: any[]) => {
    if (locations.length < 2) return

    const start = locations[0].position
    const end = locations[locations.length - 1].position
    const waypoints = locations.slice(1, -1).map((loc: any) => loc.position)

    try {
      let routeService: any

      switch (routeType) {
        case 'driving':
          if ((window as any).AMap && (window as any).AMap.Driving) {
            routeService = new (window as any).AMap.Driving({
              map: mapInstanceRef.current,
              showTraffic: true,
              hideMarkers: true,
              autoFitView: false
            })
          }
          break
        case 'walking':
          if ((window as any).AMap && (window as any).AMap.Walking) {
            routeService = new (window as any).AMap.Walking({
              map: mapInstanceRef.current,
              hideMarkers: true,
              autoFitView: false
            })
          }
          break
        case 'transit':
          if ((window as any).AMap && (window as any).AMap.Transfer) {
            routeService = new (window as any).AMap.Transfer({
              map: mapInstanceRef.current,
              hideMarkers: true,
              autoFitView: false
            })
          }
          break
      }

      if (routeService && mapInstanceRef.current) {
        routeService.search(start, end, {
          waypoints: waypoints
        }, (status: string, result: any) => {
          if (status === 'complete') {
            setRouteInfo(result)
            routeInfoRef.current = result
          } else {
            message.warning('路线规划失败')
          }
        })
      } else {
        message.warning('当前路线类型不可用或地图未初始化')
      }

    } catch (error) {
      console.error('路线规划失败:', error)
      message.error('路线规划服务暂时不可用')
    }
  }, [routeType])

  // 初始化地图
  const initMap = useCallback(async () => {
    if (!mapRef.current || !window.AMap) {
      console.error('地图容器未找到或高德地图 API 未加载')
      setLoading(false)
      return
    }

    try {
      // 创建地图实例
      const map = new (window as any).AMap.Map(mapRef.current, {
        zoom: 10,
        zooms: [3, 18],
        viewMode: '2D',
        mapStyle: 'amap://styles/normal',
        features: ['bg', 'point', 'road', 'building']
      })

      mapInstanceRef.current = map

      // 等待地图加载完成
      await new Promise((resolve) => {
        map.on('complete', () => {
          console.log('地图加载完成')
          resolve(true)
        })
        
        // 设置超时，避免无限等待
        setTimeout(resolve, 3000, false)
      })

      // 添加地图控件（修复兼容性问题）
      try {
        // 检查 Scale 控件是否存在
        if ((window as any).AMap && (window as any).AMap.Scale) {
          map.addControl(new (window as any).AMap.Scale())
        }
        
        // 检查 ToolBar 控件是否存在
        if ((window as any).AMap && (window as any).AMap.ToolBar) {
          map.addControl(new (window as any).AMap.ToolBar())
        }
        
        console.log('地图控件添加成功')
      } catch (error) {
        console.warn('地图控件添加失败:', error)
      }

      setIsMapReady(true)
      setLoading(false)

    } catch (error) {
      console.error('地图初始化失败:', error)
      message.error('地图初始化失败，请刷新页面重试')
      setLoading(false)
    }
  }, [])

  // 更新地图显示
  const updateMapWithPlan = useCallback(() => {
    if (!mapInstanceRef.current || !plan?.itinerary) {
      return
    }

    clearMapElements()

    const newLocations: any[] = []
    const bounds = new (window as any).AMap.Bounds()

    // 添加行程中的地点
    plan.itinerary.forEach((day: any, dayIndex: number) => {
      day.activities.forEach((activity: any, activityIndex: number) => {
        if (activity.location && activity.location.coordinates) {
          const position = [
            activity.location.coordinates.lng,
            activity.location.coordinates.lat
          ]
          
          const location = {
            id: `activity-${dayIndex}-${activityIndex}`,
            name: activity.title,
            position: position,
            icon: '📍',
            activity: activity,
            day: day.day
          }

          newLocations.push(location)
          bounds.extend(position)
        }
      })
    })

    // 添加住宿信息
    if (plan.accommodation) {
      plan.accommodation.forEach((hotel: any, index: number) => {
        if (hotel.location && hotel.location.coordinates) {
          const position = [
            hotel.location.coordinates.lng,
            hotel.location.coordinates.lat
          ]
          
          const location = {
            id: `hotel-${index}`,
            name: hotel.name,
            position: position,
            icon: '🏨',
            activity: null,
            day: null
          }

          newLocations.push(location)
          bounds.extend(position)
        }
      })
    }

    // 创建标记
    newLocations.forEach(location => {
      const marker = new (window as any).AMap.Marker({
        position: location.position,
        title: location.name,
        icon: new (window as any).AMap.Icon({
          size: new (window as any).AMap.Size(24, 34),
          image: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png',
          imageSize: new (window as any).AMap.Size(24, 34)
        }),
        offset: new (window as any).AMap.Pixel(-12, -34)
      })

      marker.on('click', () => showLocationInfo(location))
      marker.setMap(mapInstanceRef.current)
      markersRef.current.push(marker)
    })

    // 调整地图视野
    if (newLocations.length > 0) {
      mapInstanceRef.current.setBounds(bounds, false, [50, 50, 50, 50])
    }

    onLocationsChange?.(newLocations)
  }, [plan, onLocationsChange, clearMapElements, showLocationInfo])

  // 监听高德地图加载状态
  useEffect(() => {
    if (amapLoaded && !amapError) {
      initMap()
    } else if (amapError) {
      console.error('高德地图加载失败:', amapError)
      message.error('地图服务暂时不可用')
      setLoading(false)
    }
  }, [amapLoaded, amapError, initMap])

  // 监听路线类型变化
  useEffect(() => {
    if (isMapReady && locations.length > 1) {
      planRoute(locations)
    }
  }, [routeType, isMapReady, locations, planRoute])

  // 监听行程数据变化
  useEffect(() => {
    if (isMapReady && plan) {
      updateMapWithPlan()
    }
  }, [isMapReady, plan, updateMapWithPlan])

  // 清理函数
  useEffect(() => {
    return () => {
      // 使用 setTimeout 确保在 React 渲染周期之后执行清理
      setTimeout(() => {
        if (mapInstanceRef.current) {
          try {
            // 移除所有事件监听器
            mapInstanceRef.current.off('complete')
            mapInstanceRef.current.off('error')
            
            // 清除所有标记
            clearMapElements()
            
            // 销毁地图实例
            try {
              mapInstanceRef.current.destroy()
            } catch (error) {
              console.warn('销毁地图实例失败:', error)
            }
            
            // 重置引用
            mapInstanceRef.current = null
            
          } catch (cleanupError) {
            console.error('地图清理过程中发生错误:', cleanupError)
          }
        }
      }, 0)
    }
  }, [clearMapElements])

  if (loading) {
    return (
      <StyledMapContainer>
        <StyledSpin>
          <div>地图加载中...</div>
        </StyledSpin>
      </StyledMapContainer>
    )
  }

  return (
    <StyledMapContainer>
      <MapContainer ref={mapRef} />
      
      {/* 控制面板 */}
      <ControlPanel>
        <RouteTypeSelector>
          <Select
            value={routeType}
            onChange={(value) => {
              setRouteType(value)
              if (mapInstanceRef.current && locations.length > 1) {
                planRoute(locations)
              }
            }}
            style={{ width: 120 }}
          >
            <Option value="driving">驾车</Option>
            <Option value="walking">步行</Option>
            <Option value="transit">公交</Option>
          </Select>
        </RouteTypeSelector>
        
        <ButtonGroup>
          <Button 
            onClick={() => planRoute(locations)} 
            disabled={!mapInstanceRef.current || locations.length < 2}
          >
            规划路线
          </Button>
          <Button 
            onClick={clearMapElements} 
            danger 
            disabled={!mapInstanceRef.current}
          >
            清除
          </Button>
          <Button 
            size="small" 
            icon={<EnvironmentOutlined />}
            onClick={() => updateMapWithPlan()}
            disabled={!mapInstanceRef.current}
          >
            刷新
          </Button>
        </ButtonGroup>
      </ControlPanel>

      {/* 路线信息面板 */}
      {routeInfo && (
        <RouteInfoPanel>
          <RouteInfoHeader>
            <h4>路线信息</h4>
            <CloseButton onClick={() => setRouteInfo(null)}>×</CloseButton>
          </RouteInfoHeader>
          <RouteDetails>
            <p><strong>距离:</strong> {formatDistance(routeInfo.distance)}</p>
            <p><strong>预计时间:</strong> {formatTime(routeInfo.time)}</p>
            {routeInfo.taxi_cost && (
              <p><strong>打车费用:</strong> ¥{routeInfo.taxi_cost}</p>
            )}
          </RouteDetails>
        </RouteInfoPanel>
      )}
    </StyledMapContainer>
  )
}

export default MapDisplay