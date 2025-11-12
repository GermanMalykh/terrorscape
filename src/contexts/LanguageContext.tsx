/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState, useCallback, type ReactNode } from 'react'
import { defaultLocale, translate, type LocaleCode } from '../i18n/translations.ts'
import { readStorageJson, removeStorageItem, writeStorageJson } from '../utils/storage.ts'

const LANGUAGE_STORAGE_KEY = 'terrorscape.preferences.locale'

interface LanguageContextValue {
  locale: LocaleCode
  setLocale: (code: LocaleCode) => void
  resetLocalePreference: () => void
  t: (key: string, fallback?: string) => string
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>(() => {
    const stored = readStorageJson<LocaleCode>(LANGUAGE_STORAGE_KEY)
    return stored ?? defaultLocale
  })

  const handleSetLocale = useCallback((code: LocaleCode) => {
    setLocaleState(code)
    writeStorageJson(LANGUAGE_STORAGE_KEY, code)
  }, [])

  const handleResetLocale = useCallback(() => {
    setLocaleState(defaultLocale)
    removeStorageItem(LANGUAGE_STORAGE_KEY)
  }, [])

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      setLocale: handleSetLocale,
      resetLocalePreference: handleResetLocale,
      t: (key, fallback) => translate(locale, key, fallback),
    }),
    [handleResetLocale, handleSetLocale, locale],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}
