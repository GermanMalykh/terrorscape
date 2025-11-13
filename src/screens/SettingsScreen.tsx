import { type ChangeEvent, useMemo, useState, useEffect } from 'react'
import { ScreenHeader } from '../components/ScreenHeader.tsx'
import { useGame } from '../contexts/GameContext.tsx'
import { useLanguage } from '../contexts/LanguageContext.tsx'
import { locales } from '../i18n/translations.ts'
import { getAllStorageSize } from '../utils/storage.ts'

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

// Определяем iOS устройство
// На Android всегда вернет false
const isIOS = () => {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

// Определяем Safari (не Chrome на Android)
// На Android всегда вернет false
const isSafari = () => {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
}

// Функция для случайного выделения буквы в каждом слове красным цветом
const renderTextWithHighlight = (text: string, seed: string) => {
  // Простая хеш-функция для детерминированного выбора на основе текста
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i)
    hash = hash & hash
  }
  
  // Разбиваем на слова и разделители (пробелы и т.д.)
  const parts = text.split(/(\s+)/)
  let wordIndex = 0
  
  return parts.map((part, partIndex) => {
    // Пропускаем пробелы и другие разделители
    if (/^\s+$/.test(part)) {
      return <span key={partIndex}>{part}</span>
    }
    
    // Если часть - это слово
    const letters = part.split('')
    // Слова из менее чем 3 букв не выделяем (первая и последняя не раскрашиваются)
    if (letters.length < 3) {
      return <span key={partIndex}>{part}</span>
    }
    
    // Выбираем случайную букву (не первую и не последнюю) на основе хеша
    // Используем seed + wordIndex для уникальности каждого слова
    // Доступные индексы: от 1 до letters.length - 2 (исключая первую и последнюю)
    const wordHash = hash + wordIndex * 31
    const availableLetters = letters.length - 2 // Количество букв между первой и последней
    const randomIndex = 1 + (Math.abs(wordHash) % availableLetters)
    wordIndex++
    
    return (
      <span key={partIndex}>
        {letters.map((letter, letterIndex) => (
          <span
            key={letterIndex}
            style={letterIndex === randomIndex ? { color: '#b01218' } : undefined}
          >
            {letter}
          </span>
        ))}
      </span>
    )
  })
}

export function SettingsScreen() {
  const { resetStatistics } = useGame()
  const { locale, setLocale, resetLocalePreference, t } = useLanguage()
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const storageInfo = useMemo(() => getAllStorageSize(), [])
  const isIOSDevice = isIOS() || (isSafari() && !window.matchMedia('(display-mode: standalone)').matches)

  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
  }

  useEffect(() => {
    // Проверяем, установлено ли приложение
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    // Слушаем событие beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Слушаем событие appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleLocaleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setLocale(event.target.value as typeof locale)
  }

  const handleResetStatistics = () => {
    setShowResetConfirm(true)
  }

  const handleResetConfirmCancel = () => {
    setShowResetConfirm(false)
  }

  const handleResetConfirmProceed = () => {
    resetStatistics()
    resetLocalePreference()
    setShowResetConfirm(false)
  }

  const handleInstall = async () => {
    // Для iOS показываем инструкцию (на Android isIOSDevice всегда false)
    if (isIOSDevice) {
      setShowIOSInstructions(true)
      // Автоматически скрываем через 5 секунд
      setTimeout(() => setShowIOSInstructions(false), 5000)
      return
    }

    // Для Android/Chrome и других браузеров используем стандартный prompt
    // deferredPrompt будет доступен благодаря событию beforeinstallprompt
    if (!deferredPrompt) {
      return
    }

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setDeferredPrompt(null)
    }
  }

  return (
    <div className="screen">
      <ScreenHeader 
        title={renderTextWithHighlight(t('settings.title'), 'settings.title')} 
        backTo="/"
        titleClassName="screen-header__title--caslon"
      />
      <section className="section-block">
        <h2 className="section-block__title section-block__title--caslon">
          {renderTextWithHighlight(t('settings.language'), 'settings.language')}
        </h2>
        <div className="form-field">
          <select
            id="language-select"
            value={locale}
            onChange={handleLocaleChange}
            aria-label={t('settings.language')}
          >
            {locales.map((item) => (
              <option key={item.code} value={item.code}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="section-block">
        <h2 className="section-block__title section-block__title--caslon">
          {renderTextWithHighlight(t('settings.resetData', 'Сброс данных'), 'settings.resetData')}
        </h2>
        <p dangerouslySetInnerHTML={{ __html: t('settings.resetStatsDescription') }} />
        <button type="button" className="menu-button menu-button--caslon" onClick={handleResetStatistics}>
          {renderTextWithHighlight(t('settings.resetStats', 'Сброс'), 'settings.resetStats')}
        </button>
      </section>

      {showResetConfirm && (
        <div className="killer-hero__overlay killer-hero__overlay--confirm" role="alertdialog" aria-modal="true">
          <div className="confirm-dialog">
            <h3 className="confirm-dialog__title confirm-dialog__title--caslon">
              {renderTextWithHighlight(t('settings.resetConfirmTitle', 'Сбросить данные?'), 'settings.resetConfirmTitle')}
            </h3>
            <p className="confirm-dialog__message">
              {t('settings.resetConfirmMessage', 'Вы уверены, что хотите сбросить данные? Это действие нельзя отменить.')}
            </p>
            <div className="confirm-dialog__actions">
              <button type="button" className="ghost-button" onClick={handleResetConfirmCancel}>
                {t('settings.resetConfirmCancel', 'Отмена')}
              </button>
              <button type="button" className="menu-button menu-button--caslon" onClick={handleResetConfirmProceed}>
                {renderTextWithHighlight(t('settings.resetConfirmProceed', 'Сбросить'), 'settings.resetConfirmProceed')}
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="section-block">
        <h2 className="section-block__title section-block__title--caslon">
          {renderTextWithHighlight(t('settings.cache'), 'settings.cache')}
        </h2>
        <p>
          {isInstalled
            ? t('settings.installed', 'Приложение установлено. Работает офлайн.')
            : t('settings.installDescription', 'Установите приложение на устройство для работы офлайн.')}
        </p>
        {!isInstalled && (deferredPrompt || isIOSDevice) && (
          <button type="button" className="menu-button menu-button--caslon" onClick={handleInstall}>
            {renderTextWithHighlight(t('settings.install'), 'settings.install')}
          </button>
        )}
        {!isInstalled && !deferredPrompt && !isIOSDevice && (
          <p style={{ fontSize: '0.85rem', color: 'rgba(231, 225, 214, 0.6)', marginTop: '8px' }}>
            {t('settings.installNotAvailable', 'Установка доступна только в поддерживаемых браузерах.')}
          </p>
        )}
        {showIOSInstructions && (
          <div
            style={{
              marginTop: '16px',
              backgroundColor: 'rgba(12, 12, 12, 0.95)',
              border: '1px solid rgba(176, 18, 24, 0.5)',
              borderRadius: '8px',
              padding: '16px',
              fontSize: '0.9rem',
              color: '#e7e1d6',
              textAlign: 'center',
            }}
          >
            <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>
              {t('menu.iosInstallTitle', 'Как установить на iOS')}
            </p>
            <p style={{ margin: '0', fontSize: '0.85rem', lineHeight: '1.4' }}>
              {t(
                'menu.iosInstallInstructions',
                'Нажмите кнопку "Поделиться" внизу экрана, затем выберите "На экран «Домой»"',
              )}
            </p>
          </div>
        )}
      </section>

      <section className="section-block">
        <h2 className="section-block__title section-block__title--caslon">
          {renderTextWithHighlight(t('settings.storage', 'Хранилище'), 'settings.storage')}
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'rgba(231, 225, 214, 0.75)', marginBottom: '12px' }}>
          {t('settings.storageDescription', 'Использовано:')} <strong>{formatBytes(storageInfo.total)}</strong>
        </p>
      </section>
    </div>
  )
}
