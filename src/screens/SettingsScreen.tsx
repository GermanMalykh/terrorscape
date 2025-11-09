import { type ChangeEvent } from 'react'
import { ScreenHeader } from '../components/ScreenHeader.tsx'
import { useGame } from '../contexts/GameContext.tsx'
import { useLanguage } from '../contexts/LanguageContext.tsx'
import { locales } from '../i18n/translations.ts'

export function SettingsScreen() {
  const { resetStatistics } = useGame()
  const { locale, setLocale, t } = useLanguage()

  const handleLocaleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setLocale(event.target.value as typeof locale)
  }

  return (
    <div className="screen">
      <ScreenHeader title={t('settings.title')} backTo="/" />
      <section className="section-block">
        <h2 className="section-block__title">{t('settings.language')}</h2>
        <div className="form-field">
          <label htmlFor="language-select">UI</label>
          <select id="language-select" value={locale} onChange={handleLocaleChange}>
            {locales.map((item) => (
              <option key={item.code} value={item.code}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="section-block">
        <h2 className="section-block__title">Статистика</h2>
        <p>{t('settings.resetStatsDescription')}</p>
        <button type="button" className="menu-button" onClick={resetStatistics}>
          {t('settings.resetStats')}
        </button>
      </section>

      <section className="section-block">
        <h2 className="section-block__title">{t('settings.cache')}</h2>
        <p>Подготовка офлайн-кэша будет доступна позже. Следите за статусом в дорожной карте.</p>
        <button type="button" className="ghost-button" disabled>
          {t('settings.install')}
        </button>
      </section>
    </div>
  )
}
