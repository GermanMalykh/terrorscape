import { getAssetPath } from './paths'

/**
 * Получает пути к высококачественному и низкокачественному изображению.
 * Если low-версия не найдена, возвращает только high.
 */
export function getImagePaths(imagePath: string): { high: string; low: string } {
  const high = getAssetPath(imagePath)
  
  // Создаем путь к low-версии
  // Например: /art/killers/butcher.webp -> /art/killers/low/butcher.webp
  const pathParts = imagePath.split('/')
  const filename = pathParts.pop()
  const directory = pathParts.join('/')
  
  const low = getAssetPath(`${directory}/low/${filename}`)
  
  return { high, low }
}

/**
 * Получает путь к высококачественному изображению.
 */
export function getHighImagePath(imagePath: string): string {
  return getAssetPath(imagePath)
}

/**
 * Получает путь к низкокачественному изображению.
 */
export function getLowImagePath(imagePath: string): string {
  const pathParts = imagePath.split('/')
  const filename = pathParts.pop()
  const directory = pathParts.join('/')
  return getAssetPath(`${directory}/low/${filename}`)
}

