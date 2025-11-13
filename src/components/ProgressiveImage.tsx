import { useState, useEffect, useRef } from 'react'

interface ProgressiveImageProps {
  src: string
  srcLow?: string
  alt?: string
  className?: string
  style?: React.CSSProperties
  backgroundSize?: string
  backgroundPosition?: string
}

// Глобальный кэш для отслеживания загружающихся изображений (избегаем дублирования запросов)
const loadingCache = new Set<string>()

/**
 * Компонент для прогрессивной загрузки изображений.
 * Сначала показывает низкокачественное изображение, затем поверх него накладывает высококачественное.
 */
export function ProgressiveImage({
  src,
  srcLow,
  alt,
  className,
  style,
  backgroundSize = 'cover',
  backgroundPosition = 'center',
}: ProgressiveImageProps) {
  const [highImageLoaded, setHighImageLoaded] = useState(false)
  const [lowImageLoaded, setLowImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [highImageReadyInDOM, setHighImageReadyInDOM] = useState(false)
  const [highImageSrc, setHighImageSrc] = useState<string>('')
  const imgRef = useRef<HTMLImageElement | null>(null)
  const lowImgRef = useRef<HTMLImageElement | null>(null)
  const imageKeyRef = useRef<string>('')

  // Используем low-версию, если она предоставлена, иначе используем основное изображение
  const lowSrc = srcLow || src

  useEffect(() => {
    // Уникальный ключ для отслеживания текущего изображения
    const currentImageKey = `${srcLow || ''}:${src}`
    let cancelled = false

    // Сброс состояния только если изменилось изображение
    if (imageKeyRef.current !== currentImageKey) {
      imageKeyRef.current = currentImageKey
      setLowImageLoaded(false)
      setHighImageLoaded(false)
      setImageError(false)
      setHighImageReadyInDOM(false)
      setHighImageSrc('')
    }
    
    // При каждом монтировании (даже с тем же изображением) проверяем кэш браузера
    // Это нужно для случая, когда компонент размонтировался и снова монтировался
    const checkBrowserCache = () => {
      if (cancelled) return
      // Проверяем high изображение
      const highImg = new Image()
      highImg.onload = () => {
        if (!cancelled) {
          setHighImageLoaded(true)
          setHighImageReadyInDOM(true)
          setHighImageSrc(highImg.src || src)
          if (srcLow && srcLow !== src) {
            setLowImageLoaded(true)
          }
        }
      }
      highImg.src = src
      // Проверяем синхронно - если изображение уже в кэше, complete будет true
      if (highImg.complete && highImg.naturalWidth > 0) {
        highImg.onload(null as any) // Вызываем onload вручную
      }
      
      // Проверяем low изображение
      if (srcLow && srcLow !== src) {
        const lowImg = new Image()
        lowImg.onload = () => {
          if (!cancelled) {
            setLowImageLoaded(true)
          }
        }
        lowImg.src = srcLow
        if (lowImg.complete && lowImg.naturalWidth > 0) {
          lowImg.onload(null as any)
        }
      }
    }
    
    // Проверяем кэш браузера с небольшой задержкой, чтобы дать React время обновить состояние
    const timeoutId = setTimeout(checkBrowserCache, 0)

    // Сначала загружаем низкокачественное изображение
    // Если high уже загрузился - не грузим low (оптимизация)
    if (srcLow && srcLow !== src && !highImageLoaded) {
      // Проверяем, не загружается ли уже это изображение
      if (!loadingCache.has(srcLow)) {
        loadingCache.add(srcLow)
        const lowImg = new Image()
        lowImgRef.current = lowImg
        let cleanup = false
        
        const cleanupHandler = () => {
          if (!cleanup) {
            cleanup = true
            loadingCache.delete(srcLow)
          }
        }

        const handleLowLoad = () => {
          cleanupHandler()
          if (!cancelled) {
            setLowImageLoaded(true)
          }
        }

        const handleLowError = () => {
          cleanupHandler()
          if (!cancelled) {
            // Если low не загрузилось, показываем высококачественное сразу
            setLowImageLoaded(true)
          }
        }

        lowImg.addEventListener('load', handleLowLoad)
        lowImg.addEventListener('error', handleLowError)
        lowImg.src = srcLow

        return () => {
          cancelled = true
          cleanupHandler()
          lowImg.removeEventListener('load', handleLowLoad)
          lowImg.removeEventListener('error', handleLowError)
        }
      } else {
        // Изображение уже загружается, просто ждём его загрузки
        const lowImg = new Image()
        lowImg.onload = () => {
          if (!cancelled) {
            setLowImageLoaded(true)
          }
        }
        lowImg.onerror = () => {
          if (!cancelled) {
            setLowImageLoaded(true)
          }
        }
        lowImg.src = srcLow

        return () => {
          cancelled = true
          lowImg.onload = null
          lowImg.onerror = null
        }
      }
    } else {
      // Если low не предоставлен, сразу готовы показывать
      setLowImageLoaded(true)
    }

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [srcLow, src, highImageLoaded])

  useEffect(() => {
    let cancelled = false

    // Загружаем высококачественное изображение параллельно
    // Проверяем, не загружается ли уже это изображение
    if (!loadingCache.has(src)) {
      loadingCache.add(src)
      const img = new Image()
      imgRef.current = img
      let cleanup = false
      
      const cleanupHandler = () => {
        if (!cleanup) {
          cleanup = true
          loadingCache.delete(src)
        }
      }

      const handleLoad = () => {
        cleanupHandler()
        if (!cancelled) {
          setHighImageLoaded(true)
          // Изображение загружено через new Image(), теперь используем его src напрямую
          // для backgroundImage - браузер должен использовать кэш
          setHighImageSrc(img.src || src)
          // Устанавливаем готовность сразу (без задержки)
          setHighImageReadyInDOM(true)
        }
      }

      const handleError = () => {
        cleanupHandler()
        if (!cancelled) {
          setImageError(true)
          setHighImageLoaded(true) // Оставляем low-версию при ошибке
        }
      }

      img.addEventListener('load', handleLoad)
      img.addEventListener('error', handleError)
      img.src = src

      // Проверяем, если изображение уже загружено (из кэша), сразу устанавливаем состояние
      if (img.complete && img.naturalWidth > 0) {
        // Изображение уже в кэше, сразу готово
        setHighImageLoaded(true)
        setHighImageSrc(img.src || src)
        setHighImageReadyInDOM(true)
      }

      return () => {
        cancelled = true
        cleanupHandler()
        img.removeEventListener('load', handleLoad)
        img.removeEventListener('error', handleError)
      }
    } else {
      // Изображение уже загружается, просто ждём его загрузки
      const img = new Image()
      img.onload = () => {
        if (!cancelled) {
          setHighImageLoaded(true)
          setHighImageSrc(img.src || src)
          setHighImageReadyInDOM(true)
        }
      }
      img.onerror = () => {
        if (!cancelled) {
          setImageError(true)
          setHighImageLoaded(true)
          setHighImageSrc(src)
          setHighImageReadyInDOM(true)
        }
      }
      img.src = src

      if (img.complete && img.naturalWidth > 0) {
        if (!cancelled) {
          setHighImageLoaded(true)
          setHighImageSrc(img.src || src)
          setHighImageReadyInDOM(true)
        }
      }

      return () => {
        cancelled = true
        img.onload = null
        img.onerror = null
      }
    }
  }, [src, srcLow])

  // Общие стили для обоих слоев
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    backgroundSize: backgroundSize || 'cover',
    backgroundPosition: backgroundPosition || 'center',
    backgroundRepeat: 'no-repeat',
  }

  // Приоритет: high-версия всегда важнее. Если она загрузилась - показываем её.
  // Low-версия показывается ТОЛЬКО если high ещё не готов к показу в DOM.
  const shouldShowLow = !highImageReadyInDOM && lowImageLoaded && lowSrc && lowSrc !== src
  // High показывается если загрузился
  const shouldShowHigh = highImageLoaded && !imageError && highImageReadyInDOM
  // Fallback: ВСЕГДА показываем изображение, если src есть
  // Если ни low, ни high не готовы, показываем high напрямую
  // Это гарантирует, что изображение всегда видно
  const showFallback = (!shouldShowLow && !shouldShowHigh && src)

  // Стили для низкокачественного слоя (видимый ТОЛЬКО если high ещё не загрузилась)
  const lowQualityStyle: React.CSSProperties = {
    ...baseStyle,
    backgroundImage: shouldShowLow && lowSrc ? `url(${lowSrc})` : undefined,
    opacity: shouldShowLow ? 1 : 0,
    zIndex: 0,
    transition: shouldShowLow ? 'opacity 0.4s ease' : 'opacity 0.2s ease',
    pointerEvents: 'none',
  }

  // Стили для высококачественного слоя (ПРИОРИТЕТ: показываем если загрузилась)
  // Используем src из предзагруженного Image объекта (из кэша) или напрямую src
  const highImageUrl = highImageSrc || src
  const highQualityStyle: React.CSSProperties = {
    ...baseStyle,
    backgroundImage: shouldShowHigh && highImageUrl ? `url(${highImageUrl})` : undefined,
    opacity: shouldShowHigh ? 1 : 0,
    zIndex: 1,
    transition: shouldShowHigh && shouldShowLow ? 'opacity 0.4s ease' : 'none',
    pointerEvents: 'none',
  }

  return (
    <div
      className={className}
      style={style}
      aria-label={alt}
      role={alt ? 'img' : undefined}
    >
      {/* Низкокачественный слой - ТОЛЬКО если high ещё не загрузилась */}
      {shouldShowLow && <div style={lowQualityStyle} />}
      {/* Высококачественный слой - ПРИОРИТЕТ: показываем если загрузилась */}
      {shouldShowHigh && <div style={highQualityStyle} />}
      {/* Fallback: ВСЕГДА показываем high напрямую, если ничего другое не готово */}
      {showFallback && src && (
        <div 
          style={{
            ...baseStyle,
            backgroundImage: `url(${src})`,
            opacity: 1,
            zIndex: shouldShowLow ? 1 : 0,
          }} 
        />
      )}
    </div>
  )
}

