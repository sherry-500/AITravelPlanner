import React, { useEffect, useRef, useState } from 'react'
import { Spin, Alert, Button } from 'antd'
import type { DayItinerary, Activity } from '../types'

interface DayMapDisplayProps {
  dayItinerary: DayItinerary | null
  loading?: boolean
}

interface MapPoint {
  lng: number
  lat: number
  name: string
  address: string
  activity: Activity
  index: number
}

const DayMapDisplay: React.FC<DayMapDisplayProps> = ({
  dayItinerary,
  loading = false
}) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [mapLoading, setMapLoading] = useState(true)
  const [error, setError] = useState('')
  const [markers, setMarkers] = useState<any[]>([])
  const [polylines, setPolylines] = useState<any[]>([])

  // 将活动转换为地图点位
  const convertActivitiesToMapPoints = (activities: Activity[]): MapPoint[] => {
    return activities.map((activity, index) => {
      // 处理 location 可能是字符串或对象的情况
      let lng = 120.1551 + Math.random() * 0.01 // 默认杭州坐标
      let lat = 30.2741 + Math.random() * 0.01
      let address = '地址待定'
      
      if (activity.location) {
        if (typeof activity.location === 'object') {
          // 确保坐标是有效的数字
          const locLng = parseFloat(String(activity.location.lng || 0))
          const locLat = parseFloat(String(activity.location.lat || 0))
          
          if (!isNaN(locLng) && !isNaN(locLat) && 
              isFinite(locLng) && isFinite(locLat) &&
              locLng >= -180 && locLng <= 180 &&
              locLat >= -90 && locLat <= 90) {
            lng = locLng
            lat = locLat
          }
          
          address = activity.location.address || activity.location.name || address
        } else {
          address = activity.location
        }
      }
      
      // 最终验证坐标
      if (isNaN(lng) || isNaN(lat) || !isFinite(lng) || !isFinite(lat)) {
        console.warn('坐标验证失败，使用默认坐标:', { activity: activity.name, lng, lat })
        lng = 120.1551 + Math.random() * 0.01
        lat = 30.2741 + Math.random() * 0.01
      }
      
      return {
        lng,
        lat,
        name: activity.name || activity.title || '未知活动',
        address,
        activity,
        index: index + 1
      }
    })
  }

  // 初始化地图
  const initMap = async () => {
    setMapLoading(true)
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

      // 不添加控件，避免错误
      // 控件在高德地图 2.0 版本中可能不可用

      setMap(mapInstance)
      setMapLoading(false)
    } catch (err) {
      console.error('地图初始化失败:', err)
      setError(err instanceof Error ? err.message : '地图初始化失败')
      setMapLoading(false)
    }
  }

  // 清除地图上的标记和路线
  const clearMapElements = () => {
    if (map) {
      // 清除标记
      markers.forEach(marker => {
        try {
          map.remove(marker)
        } catch (e) {
          console.warn('清除标记失败:', e)
        }
      })
      setMarkers([])
      
      // 清除路线
      polylines.forEach(polyline => {
        try {
          map.remove(polyline)
        } catch (e) {
          console.warn('清除路线失败:', e)
        }
      })
      setPolylines([])
    }
  }

  // 添加景点标记
  const addMarkers = (points: MapPoint[]) => {
    if (!map || !window.AMap || points.length === 0) return

    const newMarkers: any[] = []

    points.forEach((point, index) => {
      // 更严格的坐标验证
      const lng = parseFloat(String(point.lng))
      const lat = parseFloat(String(point.lat))
      
      if (!point.lng || !point.lat || 
          isNaN(lng) || isNaN(lat) || 
          !isFinite(lng) || !isFinite(lat) ||
          lng < -180 || lng > 180 || 
          lat < -90 || lat > 90) {
        console.warn('无效的坐标:', point, { lng, lat })
        return
      }

      try {
        // 使用验证后的坐标
        const position = [lng, lat]
        
        // 使用简单的圆形标记，避免复杂的 HTML 内容
        const marker = new window.AMap.Marker({
          position: position,
          icon: new window.AMap.Icon({
            size: new window.AMap.Size(32, 32),
            image: `data:image/svg+xml;base64,${btoa(`
              <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="14" fill="#ff4d6d" stroke="#fff" stroke-width="3"/>
                <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">${point.index || index + 1}</text>
              </svg>
            `)}`
          })
        })

        // 添加点击事件
        marker.on('click', () => {
          try {
            const infoWindow = new window.AMap.InfoWindow({
              content: `
                <div style="padding: 10px; min-width: 200px;">
                  <h4 style="margin: 0 0 8px 0; color: #333;">${point.name || '未知地点'}</h4>
                  <p style="margin: 0 0 5px 0; color: #666; font-size: 12px;">
                    📍 ${point.address || '地址未知'}
                  </p>
                  <p style="margin: 0 0 5px 0; color: #999; font-size: 11px;">
                    坐标: ${lng.toFixed(6)}, ${lat.toFixed(6)}
                  </p>
                  ${point.activity?.startTime ? `
                    <p style="margin: 0 0 5px 0; color: #666; font-size: 12px;">
                      ⏰ ${point.activity.startTime}${point.activity.endTime ? ` - ${point.activity.endTime}` : ''}
                    </p>
                  ` : ''}
                  ${point.activity?.description ? `
                    <p style="margin: 5px 0 0 0; color: #666; font-size: 12px;">
                      ${point.activity.description}
                    </p>
                  ` : ''}
                </div>
              `
            })
            infoWindow.open(map, position)
          } catch (infoError) {
            console.warn('信息窗口创建失败:', infoError)
          }
        })

        map.add(marker)
        newMarkers.push(marker)
      } catch (markerError) {
        console.warn('标记创建失败:', markerError, point)
      }
    })

    setMarkers(newMarkers)
  }

  // 绘制路线
  const drawRoute = (points: MapPoint[]) => {
    if (!map || !window.AMap || points.length < 2) return

    const newPolylines: any[] = []

    try {
      // 更严格的坐标验证
      const validPoints = points.filter(point => {
        const lng = parseFloat(String(point.lng))
        const lat = parseFloat(String(point.lat))
        
        return point.lng && point.lat && 
               !isNaN(lng) && !isNaN(lat) &&
               isFinite(lng) && isFinite(lat) &&
               lng >= -180 && lng <= 180 &&
               lat >= -90 && lat <= 90
      })

      if (validPoints.length < 2) {
        console.warn('有效坐标点不足，无法绘制路线')
        return
      }

      // 创建路径点数组，使用验证后的坐标
      const path = validPoints.map(point => [
        parseFloat(String(point.lng)), 
        parseFloat(String(point.lat))
      ])

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
      if (validPoints.length > 0) {
        try {
          const bounds = new window.AMap.Bounds()
          validPoints.forEach(point => {
            const lng = parseFloat(String(point.lng))
            const lat = parseFloat(String(point.lat))
            bounds.extend([lng, lat])
          })
          map.setBounds(bounds, false, [50, 50, 50, 50])
        } catch (boundsError) {
          console.warn('地图视野调整失败:', boundsError)
        }
      }
    } catch (routeError) {
      console.warn('路线绘制失败:', routeError)
    }
  }

  // 更新地图显示
  const updateMapDisplay = () => {
    if (!dayItinerary || !dayItinerary.activities) {
      clearMapElements()
      return
    }

    clearMapElements()
    
    const mapPoints = convertActivitiesToMapPoints(dayItinerary.activities)
    if (mapPoints.length > 0) {
      addMarkers(mapPoints)
      drawRoute(mapPoints)
    }
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
  }, [map, dayItinerary])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {(mapLoading || loading) && (
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
          <Spin size="large">
            <div style={{ padding: '50px' }}>地图加载中...</div>
          </Spin>
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
            showIcon
            action={
              <Button size="small" onClick={initMap}>
                重试
              </Button>
            }
          />
        </div>
      )}

      {!dayItinerary && !loading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          color: '#999'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗺️</div>
          <div>请选择日程查看地图</div>
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
  )
}

export default DayMapDisplay