import React, { useEffect, useRef } from 'react'
import { Card } from 'antd'
import styled from 'styled-components'
import { TravelPlan, Location } from '../types'

const MapContainer = styled.div`
  width: 100%;
  height: 400px;
  border-radius: 8px;
  overflow: hidden;
`

const StyledCard = styled(Card)`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
`

interface MapDisplayProps {
  plan?: TravelPlan
  locations?: Location[]
  center?: [number, number]
}

const MapDisplay: React.FC<MapDisplayProps> = ({ plan, locations, center }) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (!mapRef.current) return

    // 初始化地图
    const initMap = () => {
      if (window.AMap) {
        const defaultCenter = center || [116.397428, 39.90923] // 默认北京
        
        mapInstanceRef.current = new window.AMap.Map(mapRef.current, {
          zoom: 10,
          center: defaultCenter,
          mapStyle: 'amap://styles/normal',
        })

        // 添加地点标记
        if (plan) {
          addPlanMarkers(plan)
        } else if (locations) {
          addLocationMarkers(locations)
        }
      }
    }

    // 如果高德地图API已加载，直接初始化
    if (window.AMap) {
      initMap()
    } else {
      // 等待API加载完成
      const checkAMap = setInterval(() => {
        if (window.AMap) {
          clearInterval(checkAMap)
          initMap()
        }
      }, 100)

      return () => clearInterval(checkAMap)
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy()
      }
    }
  }, [plan, locations, center])

  const addPlanMarkers = (travelPlan: TravelPlan) => {
    if (!mapInstanceRef.current) return

    const markers: any[] = []
    const bounds = new window.AMap.Bounds()

    travelPlan.itinerary.forEach((day, dayIndex) => {
      day.activities.forEach((activity, activityIndex) => {
        const { location } = activity
        const position = [location.longitude, location.latitude]

        // 创建标记
        const marker = new window.AMap.Marker({
          position,
          title: activity.name,
          content: `
            <div style="
              background: white;
              border: 2px solid #1890ff;
              border-radius: 50%;
              width: 30px;
              height: 30px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              color: #1890ff;
              font-size: 12px;
            ">
              ${dayIndex + 1}
            </div>
          `,
        })

        // 添加信息窗口
        const infoWindow = new window.AMap.InfoWindow({
          content: `
            <div style="padding: 10px; min-width: 200px;">
              <h4 style="margin: 0 0 8px 0; color: #1890ff;">${activity.name}</h4>
              <p style="margin: 4px 0; color: #666; font-size: 12px;">
                📍 ${location.address}
              </p>
              <p style="margin: 4px 0; color: #666; font-size: 12px;">
                ⏰ ${activity.startTime} - ${activity.endTime}
              </p>
              <p style="margin: 4px 0; color: #666; font-size: 12px;">
                💰 ¥${activity.cost}
              </p>
              ${activity.description ? `
                <p style="margin: 8px 0 0 0; color: #333; font-size: 12px;">
                  ${activity.description}
                </p>
              ` : ''}
            </div>
          `,
        })

        marker.on('click', () => {
          infoWindow.open(mapInstanceRef.current, position)
        })

        markers.push(marker)
        bounds.extend(position)
      })

      // 添加住宿标记
      if (day.accommodation) {
        const { location } = day.accommodation
        const position = [location.longitude, location.latitude]

        const marker = new window.AMap.Marker({
          position,
          title: day.accommodation.name,
          content: `
            <div style="
              background: white;
              border: 2px solid #52c41a;
              border-radius: 4px;
              padding: 4px 8px;
              font-weight: bold;
              color: #52c41a;
              font-size: 12px;
            ">
              🏨
            </div>
          `,
        })

        const infoWindow = new window.AMap.InfoWindow({
          content: `
            <div style="padding: 10px; min-width: 200px;">
              <h4 style="margin: 0 0 8px 0; color: #52c41a;">🏨 ${day.accommodation.name}</h4>
              <p style="margin: 4px 0; color: #666; font-size: 12px;">
                📍 ${location.address}
              </p>
              <p style="margin: 4px 0; color: #666; font-size: 12px;">
                📅 ${day.accommodation.checkIn} - ${day.accommodation.checkOut}
              </p>
              <p style="margin: 4px 0; color: #666; font-size: 12px;">
                💰 ¥${day.accommodation.cost}/晚
              </p>
              ${day.accommodation.amenities ? `
                <p style="margin: 8px 0 0 0; color: #333; font-size: 12px;">
                  🏨 设施: ${day.accommodation.amenities.join(', ')}
                </p>
              ` : ''}
            </div>
          `,
        })

        marker.on('click', () => {
          infoWindow.open(mapInstanceRef.current, position)
        })

        markers.push(marker)
        bounds.extend(position)
      }
    })

    // 添加标记到地图
    mapInstanceRef.current.add(markers)

    // 调整地图视野以包含所有标记
    if (markers.length > 0) {
      mapInstanceRef.current.setBounds(bounds, false, [20, 20, 20, 20])
    }
  }

  const addLocationMarkers = (locationList: Location[]) => {
    if (!mapInstanceRef.current) return

    const markers: any[] = []
    const bounds = new window.AMap.Bounds()

    locationList.forEach((location, index) => {
      const position = [location.longitude, location.latitude]

      const marker = new window.AMap.Marker({
        position,
        title: location.name,
        content: `
          <div style="
            background: white;
            border: 2px solid #1890ff;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: #1890ff;
            font-size: 12px;
          ">
            ${index + 1}
          </div>
        `,
      })

      const infoWindow = new window.AMap.InfoWindow({
        content: `
          <div style="padding: 10px; min-width: 200px;">
            <h4 style="margin: 0 0 8px 0; color: #1890ff;">${location.name}</h4>
            <p style="margin: 4px 0; color: #666; font-size: 12px;">
              📍 ${location.address}
            </p>
            <p style="margin: 4px 0; color: #666; font-size: 12px;">
              🌍 ${location.city}, ${location.country}
            </p>
          </div>
        `,
      })

      marker.on('click', () => {
        infoWindow.open(mapInstanceRef.current, position)
      })

      markers.push(marker)
      bounds.extend(position)
    })

    mapInstanceRef.current.add(markers)

    if (markers.length > 0) {
      mapInstanceRef.current.setBounds(bounds, false, [20, 20, 20, 20])
    }
  }

  return (
    <StyledCard title="🗺️ 地图导览" size="small">
      <MapContainer ref={mapRef} />
    </StyledCard>
  )
}

export default MapDisplay