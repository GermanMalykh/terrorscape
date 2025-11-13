import { useState, useEffect, useCallback } from 'react'
import { readStorageJson, writeStorageJson } from '../utils/storage'

const SOUND_ENABLED_STORAGE_KEY = 'terrorscape.preferences.soundEnabled'

export function useSoundToggle() {
  const [isSoundEnabled, setIsSoundEnabledState] = useState<boolean>(() => {
    const stored = readStorageJson<boolean>(SOUND_ENABLED_STORAGE_KEY)
    // По умолчанию звук включен, если значение не сохранено
    return stored !== undefined ? stored : true
  })

  // Синхронизируем с localStorage при изменении
  useEffect(() => {
    writeStorageJson(SOUND_ENABLED_STORAGE_KEY, isSoundEnabled)
  }, [isSoundEnabled])

  const toggleSound = useCallback(() => {
    setIsSoundEnabledState((prev) => !prev)
  }, [])

  return {
    isSoundEnabled,
    toggleSound,
  }
}

