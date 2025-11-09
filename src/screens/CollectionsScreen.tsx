import { useGame } from '../contexts/GameContext.tsx'
import { useLanguage } from '../contexts/LanguageContext.tsx'
import { packDefinitions } from '../data/packs'
import { ScreenHeader } from '../components/ScreenHeader.tsx'

export function CollectionsScreen() {
  const { config, togglePack } = useGame()
  const { t } = useLanguage()

  return (
    <div className="screen">
      <ScreenHeader title={t('collections.title')} backTo="/" />
      <div className="card-grid">
        {packDefinitions.map((pack) => {
          const isActive = config.activePackIds.includes(pack.id)
          const isBase = pack.id === 'base'
          return (
            <div key={pack.id} className={`pack-card ${isActive ? 'pack-card--active' : ''}`}>
              <div className="pack-card__badge">
                {pack.dlc ? t('collections.dlc') : t('collections.base')}
              </div>
              <h2 className="pack-card__title">{pack.name}</h2>
              <p className="pack-card__description">{pack.description}</p>
              <div className="pack-card__tags">
                {pack.tags?.map((tag) => (
                  <span key={tag} className="tag">
                    #{tag}
                  </span>
                ))}
              </div>
              <div className="pack-card__actions">
                <button
                  type="button"
                  className="menu-button"
                  disabled={isBase}
                  onClick={() => !isBase && togglePack(pack.id)}
                >
                  {isActive ? '✓ Активно' : '+ Активировать'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
