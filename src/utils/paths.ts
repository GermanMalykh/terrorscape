/**
 * Утилита для получения правильных путей к ресурсам с учетом base path
 * В production это будет '/terrorscape/', в development - '/'
 */
export const getAssetPath = (path: string): string => {
  // Убираем ведущий слэш, если есть
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  // BASE_URL уже содержит завершающий слэш
  return `${import.meta.env.BASE_URL}${cleanPath}`
}

