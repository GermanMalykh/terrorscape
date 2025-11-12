import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext.tsx'
import { getAssetPath } from '../utils/paths'

const titleAssets = {
  ru: getAssetPath('/art/common/title-rus.webp'),
  en: getAssetPath('/art/common/title-eng.webp'),
} as const

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
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

export function MainMenuScreen() {
  const { t, locale } = useLanguage()
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)

  const titleImage = titleAssets[locale as keyof typeof titleAssets] ?? titleAssets.en
  const isRussian = locale === 'ru'
  const isIOSDevice = isIOS() || (isSafari() && !window.matchMedia('(display-mode: standalone)').matches)

  useEffect(() => {
    // Проверяем, установлено ли приложение
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    // Слушаем событие beforeinstallprompt (не работает на iOS)
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

  // Показываем кнопку если:
  // 1. Не установлено И
  // 2. (Есть deferredPrompt (Android/Chrome) ИЛИ это iOS устройство)
  // На Android: показывается когда браузер готов (deferredPrompt доступен)
  // На iOS: показывается всегда (isIOSDevice = true)
  const shouldShowInstallButton = !isInstalled && (deferredPrompt || isIOSDevice)

  return (
    <div className="main-menu-stage">
      <div className="main-menu-stage__overlay" aria-hidden="true" />
      <div className="screen main-menu">
        <div className="menu-hero">
          <div
            className={`menu-hero__ribbon${isRussian ? ' menu-hero__ribbon--ru' : ''}`}
          >
            <img src={titleImage} alt={t('menu.title')} />
          </div>
        </div>
        <nav className="menu-actions">
          <Link className="menu-button" to="/setup">
            {t('menu.newGame')}
          </Link>
          <Link className="menu-button" to="/collections">
            {t('menu.collections')}
          </Link>
          <Link className="menu-button" to="/stats">
            {t('menu.statistics')}
          </Link>
          <Link className="menu-button" to="/settings">
            {t('menu.settings')}
          </Link>
        </nav>
        <footer className="menu-footer">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <span>
                {t('menu.version')} 0.1.0
              </span>
              {shouldShowInstallButton && (
                <button type="button" className="ghost-button" onClick={handleInstall}>
                  {t('menu.install')}
                </button>
              )}
            </div>
            <div
              style={{
                fontSize: '0.75rem',
                color: 'rgba(231, 225, 214, 0.6)',
                lineHeight: '1.5',
                textAlign: 'center',
                paddingTop: '8px',
                borderTop: '1px solid rgba(231, 225, 214, 0.1)',
              }}
            >
              {locale === 'ru' ? (
                <>
                  <p style={{ margin: '0 0 4px 0' }}>
                    {t('settings.madeBy', 'Разработал')}{' '}
                    <a
                      href="https://github.com/GermanMalykh/"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#b01218', textDecoration: 'none' }}
                      onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                      onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                    >
                      @gnmalykh
                    </a>
                    .{' '}
                    {t('settings.artBy', 'Дизайн артов')}{' '}
                    <a
                      href="https://icemakesgames.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#b01218', textDecoration: 'none' }}
                      onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                      onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                    >
                      ICE Makes
                    </a>
                    .
                  </p>
                  <p style={{ margin: '0 0 4px 0', fontSize: '0.7rem', color: 'rgba(231, 225, 214, 0.5)' }}>
                    {t('settings.localizationThanks', 'Особая благодарность')}{' '}
                    <a
                      href="https://nizagams.ru/"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#b01218', textDecoration: 'none' }}
                      onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                      onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                    >
                      Низа Гамс
                    </a>
                    {' '}
                    {t('settings.localizationThanksText', 'за русскую локализацию')}.
                  </p>
                  <p style={{ margin: '0', fontSize: '0.65rem', color: 'rgba(231, 225, 214, 0.4)' }}>
                    {t('settings.nonCommercial', 'Только для некоммерческого использования')}.
                  </p>
                </>
              ) : (
                <>
                  <p style={{ margin: '0 0 4px 0' }}>
                    {t('settings.madeBy', 'Made by')}{' '}
                    <a
                      href="https://github.com/GermanMalykh/"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#b01218', textDecoration: 'none' }}
                      onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                      onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                    >
                      @gnmalykh
                    </a>
                    .{' '}
                    {t('settings.artBy', 'Art are made by')}{' '}
                    <a
                      href="https://icemakesgames.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#b01218', textDecoration: 'none' }}
                      onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                      onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                    >
                      ICE Makes
                    </a>
                    .
                  </p>
                  <p style={{ margin: '0', fontSize: '0.65rem', color: 'rgba(231, 225, 214, 0.4)' }}>
                    {t('settings.nonCommercial', 'For non-commercial use only')}.
                  </p>
                </>
              )}
            </div>
          </div>
          {showIOSInstructions && (
            <div
              style={{
                position: 'fixed',
                bottom: '80px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(12, 12, 12, 0.95)',
                border: '1px solid rgba(176, 18, 24, 0.5)',
                borderRadius: '8px',
                padding: '16px',
                maxWidth: '90%',
                zIndex: 1000,
                fontSize: '0.9rem',
                color: '#e7e1d6',
                textAlign: 'center',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
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
        </footer>
      </div>
    </div>
  )
}
