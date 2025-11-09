import { Link } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext.tsx'

export function MainMenuScreen() {
  const { t } = useLanguage()

  return (
    <div className="screen main-menu">
      <div className="menu-hero">
        <div className="menu-hero__ribbon">
          <span>{t('menu.title')}</span>
        </div>
      </div>
      <nav className="menu-actions">
        <Link className="menu-button" to="/setup">
          {t('menu.newGame')}
        </Link>
        <Link className="menu-button" to="/collections">
          {t('menu.collections')}
        </Link>
        <Link className="menu-button" to="/settings">
          {t('menu.settings')}
        </Link>
      </nav>
      <footer className="menu-footer">
        <span>
          {t('menu.version')} 0.1.0
        </span>
        <button type="button" className="ghost-button">
          {t('menu.install')}
        </button>
      </footer>
    </div>
  )
}
