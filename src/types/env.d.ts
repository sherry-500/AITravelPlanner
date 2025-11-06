// 环境变量类型定义
interface ImportMetaEnv {
  readonly VITE_AMAP_WEB_SERVICE_KEY: string
  readonly VITE_AMAP_WEB_KEY: string
  readonly VITE_AMAP_SECURITY_CODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// 扩展全局类型
declare global {
  interface Window {
    AMap: any
  }
}