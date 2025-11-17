import { useState, useCallback } from 'react'
import { readStorageJson, writeStorageJson } from '../utils/storage.ts'

const MENU_ANIMATION_STORAGE_KEY = 'terrorscape.preferences.menuAnimation'

export function useMenuAnimation() {
  const [enabled, setEnabledState] = useState<boolean>(() => {
    const stored = readStorageJson<boolean>(MENU_ANIMATION_STORAGE_KEY)
    return stored ?? true // по умолчанию включено
  })

  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value)
    writeStorageJson(MENU_ANIMATION_STORAGE_KEY, value)
  }, [])

  return { enabled, setEnabled }
}

