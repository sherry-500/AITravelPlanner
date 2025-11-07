import React, { useEffect, useRef, useState } from 'react'
import { Spin, Alert, Button } from 'antd'
import type { DayItinerary, Activity } from '../types'
import { geocodingService } from '../services/geocodingService'
import { apiConfigService } from '../services/apiConfigService'

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
  console.log('DayMapDisplay 组件接收到的行程数据:', dayItinerary)
  console.log('当前天数:', dayItinerary?.day)
  console.log('活动数量:', dayItinerary?.activities?.length)
  console.log('住宿信息:', dayItinerary?.accommodation)
  
  // 详细检查每个活动
  if (dayItinerary?.activities) {
    dayItinerary.activities.forEach((activity, index) => {
      console.log(`活动 ${index + 1}:`, {
        id: activity.id,
        title: activity.title || activity.name,
        type: activity.type,
        location: activity.location,
        time: activity.time || activity.startTime
      })
    })
  }
  
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [mapLoading, setMapLoading] = useState(true)
  const [error, setError] = useState('')
  const [markers, setMarkers] = useState<any[]>([])
  const [polylines, setPolylines] = useState<any[]>([])

  // 将活动转换为地图点位
  const convertActivitiesToMapPoints = async (activities: Activity[]): Promise<MapPoint[]> => {
    console.log('开始转换活动为地图点位，活动数量:', activities.length)
    const mapPoints: MapPoint[] = []
    
    // 过滤掉交通类型的活动，只显示景点、餐饮、购物等活动
    const filteredActivities = activities.filter(activity => activity.type !== 'transport')
    console.log('过滤后的活动数量:', filteredActivities.length, '原始数量:', activities.length)
    
    for (let index = 0; index < filteredActivities.length; index++) {
      const activity = filteredActivities[index]
      console.log(`处理活动 ${index + 1}:`, {
        id: activity.id,
        name: activity.name,
        location: activity.location
      })
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
        console.log(`活动 ${index + 1} 需要地理编码:`, searchAddress)
        
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
      
      const mapPoint = {
        lng: validLng,
        lat: validLat,
        name: activity.name || activity.title || '未知活动',
        address,
        activity,
        index: index + 1
      }
      console.log(`活动 ${index + 1} 转换成功:`, mapPoint)
      mapPoints.push(mapPoint)
    }
    
    return mapPoints
  }

  // 初始化地图
  const initMap = async () => {
    setMapLoading(true)
    setError('')

    try {
      if (!mapRef.current) {
        throw new Error('地图容器未找到')
      }

      // 确保高德地图SDK已加载
      const { AmapLoader } = await import('../utils/amapLoader')
      await AmapLoader.load()

      if (!window.AMap) {
        throw new Error('高德地图SDK加载失败')
      }

      // 使用默认中心点初始化地图
      let initialCenter: [number, number] = [120.1551, 30.2741] // 默认杭州
      let initialZoom = 13

      // 如果有行程数据，尝试根据第一个活动的位置设置初始中心点
      if (dayItinerary && dayItinerary.activities && dayItinerary.activities.length > 0) {
        const firstActivity = dayItinerary.activities[0]
        if (firstActivity.location) {
          if (typeof firstActivity.location === 'object' && 
              firstActivity.location.lng && firstActivity.location.lat) {
            const lng = Number(firstActivity.location.lng)
            const lat = Number(firstActivity.location.lat)
            if (!isNaN(lng) && !isNaN(lat) && 
                lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) {
              initialCenter = [lng, lat]
              initialZoom = 13
            }
          } else {
            // 根据地址关键词设置大概位置
            const locationText = (firstActivity.location || '').toLowerCase()
            if (locationText.includes('伦敦') || locationText.includes('london')) {
              initialCenter = [-0.1276, 51.5074]
            } else if (locationText.includes('巴黎') || locationText.includes('paris')) {
              initialCenter = [2.3522, 48.8566]
            } else if (locationText.includes('东京') || locationText.includes('tokyo')) {
              initialCenter = [139.6917, 35.6895]
            } else if (locationText.includes('纽约') || locationText.includes('new york')) {
              initialCenter = [-74.0060, 40.7128]
            }
          }
        }
      }

      // 创建地图实例
      const mapInstance = new window.AMap.Map(mapRef.current, {
        zoom: initialZoom,
        center: initialCenter,
        mapStyle: 'amap://styles/light',
        viewMode: '2D',
        features: ['bg', 'road', 'building', 'point'],
        showLabel: true,
        resizeEnable: true
      })

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
    console.log('addMarkers 函数被调用，点数量:', points.length)
    console.log('传入的点数据:', points.map(p => ({ name: p.name, lng: p.lng, lat: p.lat, index: p.index })))
    if (!map || !window.AMap || points.length === 0) return

    const newMarkers: any[] = []

    points.forEach((point, index) => {
      console.log(`处理标记 ${index + 1}:`, { name: point.name, lng: point.lng, lat: point.lat, index: point.index })
      
      // 检查是否有重叠的标记，如果有则稍微偏移
      let markerLng = point.lng
      let markerLat = point.lat
      const overlapThreshold = 0.0001 // 坐标重叠阈值
      
      for (let i = 0; i < newMarkers.length; i++) {
        const existingMarker = newMarkers[i]
        const existingPoint = points[i]
        if (Math.abs(point.lng - existingPoint.lng) < overlapThreshold && 
            Math.abs(point.lat - existingPoint.lat) < overlapThreshold) {
          // 如果坐标重叠，稍微偏移新标记的位置
          markerLng = point.lng + (Math.random() - 0.5) * 0.0002
          markerLat = point.lat + (Math.random() - 0.5) * 0.0002
          console.log(`标记 ${index + 1} 与标记 ${i + 1} 重叠，偏移坐标: [${markerLng}, ${markerLat}]`)
          break
        }
      }
      
      // 更严格的坐标验证
      const lng = parseFloat(String(markerLng))
      const lat = parseFloat(String(markerLat))
      
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
        
        // 使用简单的HTML内容标记，避免复杂的Icon对象
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
            cursor: pointer;
          ">
            ${point.index || index + 1}
          </div>
        `

        const marker = new window.AMap.Marker({
          position: position,
          content: markerContent,
          anchor: 'center'
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
              `,
              anchor: 'bottom-center',
              offset: [0, -35]
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
  const drawRoute = async (points: MapPoint[]) => {
    if (!map || !window.AMap || points.length < 2) return

    const newPolylines: any[] = []
    let retryCount = 0 // 重试计数器

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

      // 对所有点进行逐段步行路线规划
      console.log('🔍 检查Walking插件状态...')
      console.log('window.AMap:', !!window.AMap)
      console.log('window.AMap.Walking:', typeof window.AMap?.Walking)
      console.log('Walking插件是否为函数:', typeof window.AMap?.Walking === 'function')
      
      if (window.AMap && typeof window.AMap.Walking === 'function') {
        console.log('✅ Walking插件可用，开始逐段步行路线规划')
        
        // 逐段进行路线规划
        const planRoutes = async () => {
          for (let i = 0; i < validPoints.length - 1; i++) {
            try {
              const start = [validPoints[i].lng, validPoints[i].lat]
              const end = [validPoints[i + 1].lng, validPoints[i + 1].lat]
              
              console.log(`🚶 规划第 ${i + 1} 段路线，起点:`, start, '终点:', end)
              
              const walking = new window.AMap.Walking({
                map: map,
                panel: 'panel',
                hideMarkers: true,
                showTraffic: false
              })
              
              const routeResult = await new Promise((resolve, reject) => {
                walking.search(start, end, (status: string, result: any) => {
                  if (status === 'complete' && result.routes && result.routes.length > 0) {
                    resolve(result.routes[0])
                  } else {
                    reject(result)
                  }
                })
              })
              
              const route = routeResult as any
              console.log(`✅ 第 ${i + 1} 段路线规划成功，距离:`, route.distance)
              
              // 提取路径点
              const path = []
              for (let j = 0; j < route.steps.length; j++) {
                const step = route.steps[j]
                for (let k = 0; k < step.path.length; k++) {
                  const point = step.path[k]
                  path.push([point.lng, point.lat])
                }
              }
              
              // 绘制这段路径
              const polyline = new window.AMap.Polyline({
                path: path,
                strokeColor: '#ff4d6d',
                strokeWeight: 4,
                strokeStyle: 'solid',
                strokeOpacity: 0.8,
                lineJoin: 'round',
                lineCap: 'round'
              })
              
              map.add(polyline)
              newPolylines.push(polyline)
              
              console.log(`📍 第 ${i + 1} 段路径点数量:`, path.length)
              
            } catch (error) {
              console.warn(`⚠️ 第 ${i + 1} 段路线规划失败，使用直线连接`, error)
              // 如果某一段失败，使用直线连接
              const straightPath = [
                [validPoints[i].lng, validPoints[i].lat],
                [validPoints[i + 1].lng, validPoints[i + 1].lat]
              ]
              
              const polyline = new window.AMap.Polyline({
                path: straightPath,
                strokeColor: '#888888',
                strokeWeight: 3,
                strokeStyle: 'dashed',
                strokeOpacity: 0.6,
                strokeDasharray: [15, 8],
                lineJoin: 'round',
                lineCap: 'round'
              })
              
              map.add(polyline)
              newPolylines.push(polyline)
            }
          }
          
          setPolylines(newPolylines)
          console.log('🎉 完成所有路段的路线规划')
        }
        
        planRoutes()
      } else {
        console.error('❌ 高德地图Walking插件不可用，使用直线连接')
        console.log('当前AMap对象:', window.AMap)
        console.log('Walking插件类型:', typeof window.AMap?.Walking)
        drawStraightLine(validPoints)
      }
    } catch (routeError) {
      console.warn('路线绘制失败:', routeError)
    }
  }

  // 绘制直线连接（备用方案）
  const drawStraightLine = (validPoints: MapPoint[]) => {
    const newPolylines: any[] = []
    
    // 创建路径点数组，使用验证后的坐标
    const path = validPoints.map(point => [
      parseFloat(String(point.lng)), 
      parseFloat(String(point.lat))
    ])

    // 绘制虚线路径作为备用方案（更明显的虚线）
    const polyline = new window.AMap.Polyline({
      path: path,
      strokeColor: '#888888', // 使用灰色表示备用方案
      strokeWeight: 3,
      strokeStyle: 'dashed', // 使用虚线表示备用方案
      strokeOpacity: 0.6,
      strokeDasharray: [15, 8], // 更明显的虚线 pattern
      lineJoin: 'round',
      lineCap: 'round'
    })

    map.add(polyline)
    newPolylines.push(polyline)
    setPolylines(newPolylines)
    
    console.log('⚠️ 使用直线连接作为备用方案，路径点数:', path.length)
  }

  // 计算地图中心点
  const calculateMapCenter = (points: MapPoint[]): [number, number] => {
    console.log('计算地图中心点，输入点数:', points.length)
    
    if (points.length === 0) {
      console.log('无有效点，使用默认中心点')
      return [120.1551, 30.2741]
    }
    
    const validPoints = points.filter(point => {
      const lng = Number(point.lng)
      const lat = Number(point.lat)
      const isValid = !isNaN(lng) && !isNaN(lat) && 
                     isFinite(lng) && isFinite(lat) &&
                     lng >= -180 && lng <= 180 && 
                     lat >= -90 && lat <= 90 &&
                     lng !== 0 && lat !== 0  // 排除(0,0)坐标
      
      if (!isValid) {
        console.warn('过滤无效点:', { name: point.name, lng, lat })
      }
      return isValid
    })
    
    console.log('有效点数量:', validPoints.length)
    
    if (validPoints.length === 0) {
      console.log('无有效点，使用默认中心点')
      return [120.1551, 30.2741]
    }
    
    // 计算平均坐标
    let sumLng = 0
    let sumLat = 0
    
    validPoints.forEach(point => {
      const lng = Number(point.lng)
      const lat = Number(point.lat)
      sumLng += lng
      sumLat += lat
      console.log('累加坐标:', { name: point.name, lng, lat, sumLng, sumLat })
    })
    
    const avgLng = sumLng / validPoints.length
    const avgLat = sumLat / validPoints.length
    
    console.log('计算结果:', { avgLng, avgLat, validPointsCount: validPoints.length })
    
    // 最终验证计算结果
    if (isNaN(avgLng) || isNaN(avgLat) || !isFinite(avgLng) || !isFinite(avgLat)) {
      console.error('中心点计算结果无效，使用默认坐标:', { avgLng, avgLat })
      return [120.1551, 30.2741]
    }
    
    return [avgLng, avgLat]
  }

  // 更新地图显示
  const updateMapDisplay = async () => {
    if (!dayItinerary || !dayItinerary.activities) {
      clearMapElements()
      return
    }

    clearMapElements()
    
    try {
      const mapPoints = await convertActivitiesToMapPoints(dayItinerary.activities)
      console.log('转换后的地图点:', mapPoints)
      
      if (mapPoints.length > 0) {
        // 更新地图中心点
        const center = calculateMapCenter(mapPoints)
        console.log('计算的地图中心点:', center)
        
        // 验证中心点坐标
        const [centerLng, centerLat] = center
        if (isNaN(centerLng) || isNaN(centerLat) || !isFinite(centerLng) || !isFinite(centerLat)) {
          console.error('地图中心点坐标无效:', center)
          return
        }
        
        if (map) {
          try {
            map.setCenter(center)
            console.log('地图中心点设置成功:', center)
            
            // 根据点的数量调整缩放级别
            let zoomLevel
            if (mapPoints.length === 1) {
              zoomLevel = 15
            } else if (mapPoints.length <= 3) {
              zoomLevel = 13
            } else if (mapPoints.length <= 5) {
              zoomLevel = 12.5 // 为4-5个点使用稍高的缩放
            } else {
              zoomLevel = 12
            }
            
            console.log('设置地图缩放级别:', zoomLevel, '点数量:', mapPoints.length)
            map.setZoom(zoomLevel)
            
            // 添加额外的缩放调整，确保所有标记都可见
            if (mapPoints.length >= 4) {
              // 对于4个或更多点，稍微放大一点以确保标记不重叠
              setTimeout(() => {
                map.setZoom(zoomLevel + 0.5)
                console.log('额外放大地图以避免标记重叠')
              }, 100)
            }
          } catch (setCenterError) {
            console.error('设置地图中心点失败:', setCenterError)
          }
        }
        
        addMarkers(mapPoints)
        drawRoute(mapPoints)
      } else {
        console.warn('没有有效的地图点，使用默认中心点')
        if (map) {
          map.setCenter([120.1551, 30.2741])
          map.setZoom(13)
        }
      }
    } catch (error) {
      console.error('更新地图显示失败:', error)
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