const isStorageAvailable = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

export function readStorageJson<T>(key: string): T | undefined {
  if (!isStorageAvailable) {
    return undefined
  }
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : undefined
  } catch {
    return undefined
  }
}

export function writeStorageJson(key: string, value: unknown): void {
  if (!isStorageAvailable) {
    return
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore quota errors
  }
}

export function removeStorageItem(key: string): void {
  if (!isStorageAvailable) {
    return
  }
  try {
    window.localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

export function getStorageSize(key: string): number {
  if (!isStorageAvailable) {
    return 0
  }
  try {
    const item = window.localStorage.getItem(key)
    if (!item) {
      return 0
    }
    // Размер в байтах (UTF-16, каждый символ = 2 байта)
    return item.length * 2
  } catch {
    return 0
  }
}

export function getAllStorageSize(): { total: number; items: Record<string, number> } {
  if (!isStorageAvailable) {
    return { total: 0, items: {} }
  }
  try {
    let total = 0
    const items: Record<string, number> = {}
    
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (key) {
        const size = getStorageSize(key)
        items[key] = size
        total += size
      }
    }
    
    return { total, items }
  } catch {
    return { total: 0, items: {} }
  }
}

