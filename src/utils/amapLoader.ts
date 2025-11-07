// 动态加载高德地图JavaScript SDK
export class AmapLoader {
  private static isLoaded = false
  private static loadPromise: Promise<void> | null = null

  /**
   * 动态加载高德地图SDK
   */
  static async load(): Promise<void> {
    if (this.isLoaded) {
      return Promise.resolve()
    }

    if (this.loadPromise) {
      return this.loadPromise
    }

    this.loadPromise = new Promise((resolve, reject) => {
      // 检查是否已经加载
      if (window.AMap) {
        this.isLoaded = true
        resolve()
        return
      }

      // 获取Web端API Key
      const webApiKey = import.meta.env.VITE_AMAP_WEB_KEY || '4de14f83dd2551db8d5797e35a6b0068'
      
      // 创建script标签
      const script = document.createElement('script')
      script.type = 'text/javascript'
      script.src = `https://webapi.amap.com/maps?v=2.0&key=${webApiKey}&plugin=AMap.Geocoder,AMap.Driving,AMap.Walking,AMap.Transfer,AMap.InfoWindow,AMap.Marker,AMap.Polyline,AMap.PathSimplifier`
      
      script.onload = () => {
        this.isLoaded = true
        console.log('✅ 高德地图SDK加载成功')
        resolve()
      }
      
      script.onerror = () => {
        console.error('❌ 高德地图SDK加载失败')
        reject(new Error('高德地图SDK加载失败'))
      }
      
      document.head.appendChild(script)
    })

    return this.loadPromise
  }

  /**
   * 检查SDK是否已加载
   */
  static isSDKLoaded(): boolean {
    return this.isLoaded && !!window.AMap
  }
}