import { useEffect, useMemo, useRef } from 'react'

type EmberCanvasProps = {
  /** Количество частиц на 100000 пикселей площади экрана (масштабируется под DPI) */
  density?: number
  /** Максимальная скорость падения (px/сек) */
  maxFallSpeed?: number
  /** Максимальная длина следа (чем больше, тем более "тлеющий" хвост) */
  trail?: number
  /** Скрыть/показать эффект */
  enabled?: boolean
}

type EmberParticle = {
  x: number
  y: number
  radius: number
  vx: number
  vy: number
  life: number
  ttl: number
  hue: number
  saturation: number
  lightness: number
  kind: 'streak' | 'round'
  length: number
  angle: number
}

export function EmberCanvas({
  density = 0.7,
  maxFallSpeed = 120,
  trail = 0.05,
  enabled = true,
}: EmberCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastTsRef = useRef<number>(0)
  const particlesRef = useRef<EmberParticle[]>([])
  const hiddenRef = useRef<boolean>(false)

  const prefersReducedMotion = useMemo(() => {
    return typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  // Инициализация размера и плотности
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 1.75)

    const resize = () => {
      const { innerWidth: w, innerHeight: h } = window
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      // Обновляем количество частиц относительно площади
      const area = w * h
      // Базовая формула плотности, но с верхним лимитом для производительности
      const baseCount = Math.floor((area / 100000) * density * 28)
      const targetCount = Math.max(16, Math.min(320, baseCount))
      const list = particlesRef.current
      if (list.length > targetCount) {
        list.length = targetCount
      } else {
        while (list.length < targetCount) {
          list.push(spawnParticle(w, h, maxFallSpeed))
        }
      }
    }

    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [density, maxFallSpeed])

  // Основной цикл
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    if (!enabled || prefersReducedMotion) return

    const onVisibility = () => {
      hiddenRef.current = document.hidden
      if (!hiddenRef.current && rafRef.current === null) {
        lastTsRef.current = performance.now()
        rafRef.current = requestAnimationFrame(loop)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    const loop = (ts: number) => {
      // Пропускаем кадры, когда вкладка скрыта
      if (hiddenRef.current) {
        rafRef.current = requestAnimationFrame(loop)
        return
      }
      const dt = Math.min(0.05, (ts - lastTsRef.current) / 1000 || 0.016)
      lastTsRef.current = ts

      const { innerWidth: w, innerHeight: h } = window

      // Очищаем canvas полностью (без шлейфа)
      ctx.globalCompositeOperation = 'source-over'
      ctx.clearRect(0, 0, w, h)

      ctx.globalCompositeOperation = 'lighter'

      const list = particlesRef.current
      for (let i = 0; i < list.length; i++) {
        const p = list[i]
        // Движение строго вверх с минимальным дрожанием
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.life += dt
        // Очень лёгкое дрожание по X для естественности
        p.vx += (Math.sin((p.life + i) * 4) * 2 - p.vx) * 0.01

        // Респавн: частицы, ушедшие за верх или истёкшие, респавнятся внизу
        if (p.y + p.radius < -40 || p.life > p.ttl) {
          list[i] = spawnParticle(w, h, maxFallSpeed, 0) // новые частицы стартуют с life=0
        }

        // мазок кистью: изогнутая форма с градиентом
        const hueVal = clamp(p.hue, 0, 360)
        const satVal = clamp(p.saturation, 0, 100)
        const lightVal = clamp(p.lightness, 0, 100)
        const [rHead, gHead, bHead] = hslToRgb(hueVal, satVal, clamp(lightVal + 4, 0, 100))
        const [rCore, gCore, bCore] = hslToRgb(hueVal, satVal, clamp(lightVal + 8, 0, 100))

        const len = p.length
        const baseWidth = Math.max(3, p.radius * 1.4) // толще для мазка
        const lifeFactor = Math.min(1, (p.ttl - p.life) / p.ttl) // затухание по жизни
        const currentWidth = baseWidth * (0.6 + 0.4 * lifeFactor)
        const currentOpacity = 0.3 + (0.6 * lifeFactor)

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.angle)

        // Градиент вдоль мазка
        const grad = ctx.createLinearGradient(0, -len, 0, 0)
        grad.addColorStop(0, `rgba(${rHead}, ${gHead}, ${bHead}, 0)`)
        grad.addColorStop(0.5, `rgba(${rCore}, ${gCore}, ${bCore}, ${currentOpacity})`)
        grad.addColorStop(1, `rgba(${rHead}, ${gHead}, ${bHead}, 0)`)

        ctx.fillStyle = grad

        // Изогнутый мазок кистью с quadraticCurveTo
        const halfW = currentWidth / 2
        const curveOffset = currentWidth * 0.6 // изгиб мазка

        ctx.beginPath()
        ctx.moveTo(-halfW, 0)
        // Нижняя кривая
        ctx.quadraticCurveTo(curveOffset, -len * 0.3, -halfW * 0.7, -len)
        // Верхняя кривая
        ctx.quadraticCurveTo(-curveOffset * 0.5, -len * 0.7, halfW * 0.5, -len * 0.5)
        ctx.quadraticCurveTo(-curveOffset * 0.3, -len * 0.2, halfW, 0)
        ctx.closePath()
        ctx.fill()

        // Акцентный элемент для текстуры (как в примере)
        ctx.fillStyle = `rgba(${rCore}, ${gCore}, ${bCore}, ${currentOpacity * 0.7})`
        ctx.beginPath()
        ctx.ellipse(curveOffset * 0.3, -len * 0.4, currentWidth * 0.25, len * 0.2, p.life * 0.5, 0, Math.PI * 2)
        ctx.fill()

        ctx.restore()
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    lastTsRef.current = performance.now()
    rafRef.current = requestAnimationFrame(loop)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [enabled, prefersReducedMotion, trail, maxFallSpeed])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        mixBlendMode: 'screen',
      }}
    />
  )
}

function spawnParticle(w: number, h: number, maxFallSpeed: number, initialLife?: number): EmberParticle {
  // Тёплая палитра около красного
  const hue = 8 + Math.random() * 8 // 8–16 — ближе к красно-оранжевому как на рефе
  const saturation = 94 + Math.random() * 6 // 94–100 насыщенность
  const lightness = 46 + Math.random() * 8 // 46–54 базовая яркость

  const kind: EmberParticle['kind'] = 'streak' // только мазки кистью
  const radius = 1 + Math.random() * 2
  const x = Math.random() * w
  
  // Старт с любой позиции по высоте (больше частиц внизу, меньше вверху)
  // Используем квадратный корень для распределения: больше частиц внизу
  const yFactor = Math.sqrt(Math.random()) // 0..1, но больше значений ближе к 0
  const y = h * 0.6 + (h * 0.5 * yFactor) + (Math.random() * 40) // от 60% высоты до низа + немного ниже

  // Направление строго вверх с небольшим случайным отклонением
  const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.15 // вертикально вверх с небольшим разбросом
  const speed = 20 + Math.random() * maxFallSpeed * 0.6 // уменьшена базовая скорость и диапазон
  const vx = Math.cos(angle) * speed
  const vy = Math.sin(angle) * speed

  const ttl = 5 + Math.random() * 4
  // Если частица стартует выше, она уже должна иметь некоторый прогресс жизни
  const life = initialLife !== undefined ? initialLife : (y / h) * ttl * 0.3 // частицы выше стартуют с большим life
  const length = 10 + Math.random() * 28

  return { x, y, radius, vx, vy, life, ttl, hue, saturation, lightness, kind, length, angle }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  // h: 0..360, s/l: 0..100
  const hh = ((h % 360) + 360) % 360
  const ss = clamp(s, 0, 100) / 100
  const ll = clamp(l, 0, 100) / 100

  const c = (1 - Math.abs(2 * ll - 1)) * ss
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1))
  const m = ll - c / 2

  let r = 0, g = 0, b = 0
  if (hh < 60) { r = c; g = x; b = 0 }
  else if (hh < 120) { r = x; g = c; b = 0 }
  else if (hh < 180) { r = 0; g = c; b = x }
  else if (hh < 240) { r = 0; g = x; b = c }
  else if (hh < 300) { r = x; g = 0; b = c }
  else { r = c; g = 0; b = x }

  const rr = Math.round((r + m) * 255)
  const gg = Math.round((g + m) * 255)
  const bb = Math.round((b + m) * 255)
  return [rr, gg, bb]
}

export default EmberCanvas


