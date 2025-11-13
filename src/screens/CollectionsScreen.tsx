import { useGame } from '../contexts/GameContext.tsx'
import { useLanguage } from '../contexts/LanguageContext.tsx'
import { packDefinitions } from '../data/packs'
import { ScreenHeader } from '../components/ScreenHeader.tsx'
import { getAssetPath } from '../utils/paths'
import { ProgressiveImage } from '../components/ProgressiveImage.tsx'

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

export function CollectionsScreen() {
  const { config, togglePack } = useGame()
  const { t } = useLanguage()

  const getPackCoverImage = (packId: string): { high: string; low: string } | undefined => {
    const coverMap: Record<string, { high: string; low: string }> = {
      'base': {
        high: getAssetPath('/art/collections/base-cover.webp'),
        low: getAssetPath('/art/collections/low/base-cover.webp'),
      },
      'feral-instincts': {
        high: getAssetPath('/art/collections/feral-cover.webp'),
        low: getAssetPath('/art/collections/low/feral-cover.webp'),
      },
      'amorphous-peril': {
        high: getAssetPath('/art/collections/amorphouse-cover.webp'),
        low: getAssetPath('/art/collections/low/amorphouse-cover.webp'),
      },
      'lethal-immortals': {
        high: getAssetPath('/art/collections/lethal-cover.webp'),
        low: getAssetPath('/art/collections/low/lethal-cover.webp'),
      },
      'putrefied-enmity': {
        high: getAssetPath('/art/collections/putrefied-cover.webp'),
        low: getAssetPath('/art/collections/low/putrefied-cover.webp'),
      },
    }
    return coverMap[packId]
  }

  return (
    <div className="screen">
      <ScreenHeader 
        title={renderTextWithHighlight(t('collections.title'), 'collections.title')} 
        backTo="/"
        titleClassName="screen-header__title--caslon"
      />
      <section className="section-block">
        <p>{t('collections.description', 'Коллекции нужны для отображения новых убийц, жертв и соответствующих звуков в игре.')}</p>
      </section>
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
          return (
            <div key={pack.id} className={cardClassName}>
              {coverImage && (
                <ProgressiveImage
                  src={coverImage.high}
                  srcLow={coverImage.low}
                  className="pack-card__background"
                  backgroundSize="cover"
                  backgroundPosition={pack.dlc ? 'center 10%' : 'center'}
                />
              )}
              <div className="pack-card__badge">
                {pack.dlc ? t('collections.dlc') : t('collections.base')}
              </div>
              <h2 className="pack-card__title pack-card__title--caslon">
                {renderTextWithHighlight(pack.name, `pack-${pack.id}-name`)}
              </h2>
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
                  <div className="pack-card__base-label pack-card__base-label--caslon">
                    {renderTextWithHighlight('Базовый набор', 'pack-base-label')}
                  </div>
                ) : (
                  <button type="button" className="menu-button menu-button--caslon" onClick={() => togglePack(pack.id)}>
                    {isActive 
                      ? renderTextWithHighlight('✓ Активно', `pack-${pack.id}-active`)
                      : renderTextWithHighlight('+ Активировать', `pack-${pack.id}-activate`)
                    }
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
