import { useState, useEffect } from 'react'
import { AmapLoader } from './amapLoader'

/**
 * 高德地图加载Hook
 */
export function useAmapLoader() {
  const [loaded, setLoaded] = useState(AmapLoader.isSDKLoaded())
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadMap = async () => {
      try {
        await AmapLoader.load()
        if (isMounted) {
          setLoaded(true)
          setError(null)
        }
      } catch (err) {
        if (isMounted) {
          setLoaded(false)
          setError(err instanceof Error ? err : new Error('Unknown error'))
        }
      }
    }

    if (!loaded) {
      loadMap()
    }

    return () => {
      isMounted = false
    }
  }, [loaded])

  return { loaded, error }
}