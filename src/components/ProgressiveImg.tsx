import { useState, useEffect, useRef } from 'react'

interface ProgressiveImgProps {
  src: string
  srcLow?: string
  alt?: string
  className?: string
  style?: React.CSSProperties
}

// Глобальный кэш для отслеживания загружающихся изображений (избегаем дублирования запросов)
const loadingCache = new Set<string>()

/**
 * Компонент для прогрессивной загрузки обычных img элементов.
 * Сначала показывает низкокачественное изображение, затем заменяет на высококачественное.
 */
export function ProgressiveImg({
  src,
  srcLow,
  alt,
  className,
  style,
}: ProgressiveImgProps) {
  const [highImageLoaded, setHighImageLoaded] = useState(false)
  const [lowImageLoaded, setLowImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [highImageReadyInDOM, setHighImageReadyInDOM] = useState(false)
  const highImgRef = useRef<HTMLImageElement | null>(null)
  const lowImgRef = useRef<HTMLImageElement | null>(null)
  const imageKeyRef = useRef<string>('')

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
    }
    
    // При каждом монтировании (даже с тем же изображением) проверяем кэш браузера
    // Это нужно для случая, когда компонент размонтировался и снова монтировался
    const checkBrowserCache = () => {
      if (cancelled) return
      const img = new Image()
      img.onload = () => {
        if (!cancelled) {
          setHighImageLoaded(true)
          setHighImageReadyInDOM(true)
          if (srcLow && srcLow !== src) {
            setLowImageLoaded(true)
          }
        }
      }
      img.src = src
      // Проверяем синхронно - если изображение уже в кэше, complete будет true
      if (img.complete && img.naturalWidth > 0) {
        img.onload(null as any) // Вызываем onload вручную
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
        
        lowImg.onload = () => {
          cleanupHandler()
          if (!cancelled) {
            setLowImageLoaded(true)
          }
        }
        lowImg.onerror = () => {
          cleanupHandler()
          if (!cancelled) {
            // Если low не загрузилось, показываем high сразу (если он доступен)
            setLowImageLoaded(true)
          }
        }
        lowImg.src = srcLow

        return () => {
          cancelled = true
          cleanupHandler()
          lowImg.onload = null
          lowImg.onerror = null
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
    } else if (!srcLow || srcLow === src || highImageLoaded) {
      // Если low не предоставлен, или high уже загрузился - сразу готовы показывать
      setLowImageLoaded(true)
    }

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [srcLow, src, highImageLoaded])

  useEffect(() => {
    let cancelled = false

    // Проверяем, не загружено ли изображение уже (из кэша браузера)
    const checkCacheAndLoad = () => {
      const img = new Image()
      highImgRef.current = img
      
      const handleLoad = () => {
        if (!cancelled) {
          // ПРИОРИТЕТ: как только high загрузился - сразу переключаемся на него
          setHighImageLoaded(true)
          setHighImageReadyInDOM(true)
        }
      }
      
      const handleError = () => {
        if (!cancelled) {
          setImageError(true)
          // При ошибке остаёмся на low-версии (если она доступна)
          setHighImageLoaded(false)
          setHighImageReadyInDOM(true)
        }
      }
      
      img.onload = handleLoad
      img.onerror = handleError
      
      // Устанавливаем src - если изображение уже в кэше, onload вызовется сразу
      img.src = src
      
      // Проверяем, если изображение уже загружено (из кэша), сразу устанавливаем состояние
      if (img.complete && img.naturalWidth > 0) {
        // Изображение уже в кэше - сразу устанавливаем состояние
        handleLoad()
      }

      return () => {
        cancelled = true
        img.onload = null
        img.onerror = null
      }
    }

    // Всегда проверяем кэш и загружаем изображение
    // Кэш loadingCache нужен только для предотвращения дублирующих запросов
    // Но нам все равно нужно проверить, не загружено ли изображение из кэша браузера
    if (!loadingCache.has(src)) {
      loadingCache.add(src)
      let cleanup = false
      
      const cleanupHandler = () => {
        if (!cleanup) {
          cleanup = true
          loadingCache.delete(src)
        }
      }
      
      const cleanupImg = checkCacheAndLoad()
      
      // Переопределяем обработчики чтобы вызывать cleanupHandler
      const img = highImgRef.current!
      const originalHandleLoad = img.onload
      const originalHandleError = img.onerror
      
      img.onload = (e) => {
        cleanupHandler()
        if (originalHandleLoad) originalHandleLoad.call(img, e)
      }
      
      img.onerror = (e) => {
        cleanupHandler()
        if (originalHandleError) originalHandleError.call(img, e)
      }

      return () => {
        cancelled = true
        cleanupHandler()
        cleanupImg()
      }
    } else {
      // Изображение уже в loadingCache, но все равно проверяем кэш браузера
      return checkCacheAndLoad()
    }
  }, [src, srcLow])

  // Определяем, что показывать: используем два слоя для плавного перехода
  // Low показывается ТОЛЬКО если high ещё не готов к показу
  const shouldShowLow = !highImageReadyInDOM && lowImageLoaded && lowSrc && lowSrc !== src
  // High показывается когда загрузился (упрощенная проверка)
  const shouldShowHigh = highImageLoaded && !imageError

  // Если нет low или high, показываем high (fallback)
  const showFallback = !shouldShowLow && !shouldShowHigh && src

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        display: 'inline-block',
        ...style,
      }}
    >
      {/* Низкокачественный слой - показывается пока high не загрузился */}
      {shouldShowLow && (
        <img
          src={lowSrc}
          alt=""
          aria-hidden="true"
          className={className}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            opacity: shouldShowHigh ? 0 : 1,
            transition: shouldShowHigh ? 'opacity 0.4s ease' : 'none',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />
      )}
      {/* Высококачественный слой - показывается когда загрузится, поверх low */}
      {(shouldShowHigh || showFallback) && (
        <img
          src={src}
          alt={alt}
          className={className}
          style={{
            position: shouldShowLow ? 'absolute' : 'relative',
            top: shouldShowLow ? 0 : undefined,
            left: shouldShowLow ? 0 : undefined,
            width: shouldShowLow ? '100%' : undefined,
            height: shouldShowLow ? '100%' : undefined,
            objectFit: shouldShowLow ? 'contain' : undefined,
            opacity: (shouldShowHigh || showFallback) ? 1 : 0,
            transition: (shouldShowHigh && shouldShowLow) ? 'opacity 0.4s ease' : 'none',
            zIndex: 1,
            ...(shouldShowLow ? {} : style),
          }}
          onLoad={() => {
            // Когда high изображение загрузилось в DOM, помечаем как готовое к показу
            setHighImageReadyInDOM(true)
          }}
          onError={() => {
            // При ошибке все равно показываем
            setHighImageReadyInDOM(true)
            setImageError(true)
          }}
        />
      )}
    </div>
  )
}


