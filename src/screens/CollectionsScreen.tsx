import { useGame } from '../contexts/GameContext.tsx'
import { useLanguage } from '../contexts/LanguageContext.tsx'
import { packDefinitions } from '../data/packs'
import { ScreenHeader } from '../components/ScreenHeader.tsx'
import { getAssetPath } from '../utils/paths.ts'

export function CollectionsScreen() {
  const { config, togglePack } = useGame()
  const { t } = useLanguage()

  const getPackCoverImage = (packId: string): string | undefined => {
    const coverMap: Record<string, string> = {
      'base': getAssetPath('/art/collections/base-cover.webp'),
      'feral-instincts': getAssetPath('/art/collections/feral-cover.webp'),
      'amorphous-peril': getAssetPath('/art/collections/amorphouse-cover.webp'),
      'lethal-immortals': getAssetPath('/art/collections/lethal-cover.webp'),
      'putrefied-enmity': getAssetPath('/art/collections/putrefied-cover.webp'),
    }
    return coverMap[packId]
  }

  return (
    <div className="screen">
      <ScreenHeader title={t('collections.title')} backTo="/" />
      <div className="card-grid">
        {packDefinitions.map((pack) => {
          const isBase = pack.id === 'base'
          const isActive = !isBase && config.activePackIds.includes(pack.id)
          const cardClassName = [
            'pack-card',
            isActive ? 'pack-card--active' : '',
            isBase ? 'pack-card--base' : '',
            pack.dlc ? 'pack-card--dlc' : '',
          ]
            .filter(Boolean)
            .join(' ')
          const coverImage = getPackCoverImage(pack.id)
          const cardStyle = coverImage
            ? {
                backgroundImage: `url(${coverImage})`,
                backgroundSize: 'cover',
                backgroundPosition: pack.dlc ? 'center 10%' : 'center',
                backgroundRepeat: 'no-repeat',
              }
            : undefined
          return (
            <div key={pack.id} className={cardClassName} style={cardStyle}>
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
                {isBase ? (
                  <div className="pack-card__base-label">Базовый набор</div>
                ) : (
                  <button type="button" className="menu-button" onClick={() => togglePack(pack.id)}>
                    {isActive ? '✓ Активно' : '+ Активировать'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
