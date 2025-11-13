import { useMemo, useState } from 'react'
import { ScreenHeader } from '../components/ScreenHeader.tsx'
import { useGame, type PlayerSlot } from '../contexts/GameContext.tsx'
import { useLanguage } from '../contexts/LanguageContext.tsx'

const formatDuration = (startedAt?: number, endedAt?: number): string | null => {
  if (!startedAt || !endedAt || endedAt <= startedAt) {
    return null
  }
  const diffMs = endedAt - startedAt
  const totalSeconds = Math.floor(diffMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = (totalSeconds % 60).toString().padStart(2, '0')
  return `${minutes}:${seconds}`
}

const ITEMS_PER_PAGE = 5

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

export function StatisticsScreen() {
  const { statistics, removeStatistic } = useGame()
  const { locale, t } = useLanguage()
  const [showAll, setShowAll] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const dateFormatter = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' })
    } catch {
      return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' })
    }
  }, [locale])

  const displayedStatistics = useMemo(() => {
    if (showAll || statistics.length <= ITEMS_PER_PAGE) {
      return statistics
    }
    return statistics.slice(0, ITEMS_PER_PAGE)
  }, [statistics, showAll])

  const hasMore = statistics.length > ITEMS_PER_PAGE

  return (
    <div className="screen">
      <ScreenHeader 
        title={renderTextWithHighlight(t('statistics.title'), 'statistics.title')} 
        backTo="/"
        titleClassName="screen-header__title--caslon"
      />

      {statistics.length === 0 ? (
        <section className="section-block">
          <p>{t('statistics.empty')}</p>
        </section>
      ) : (
        <section className="section-block statistics-block">
          <div className="statistics-table" role="table">
            <div className="statistics-table__header" role="row">
              <span role="columnheader">{t('statistics.startedAt')}</span>
              <span role="columnheader">{t('statistics.players')}</span>
              <span role="columnheader">{t('statistics.duration')}</span>
              <span role="columnheader">{t('statistics.outcomeLabel')}</span>
            </div>

            <div className="statistics-table__body">
              {displayedStatistics.map((entry) => {
                const startedAt = entry.startedAt ? dateFormatter.format(new Date(entry.startedAt)) : '—'
                const duration = formatDuration(entry.startedAt, entry.endedAt) ?? '—'
                const outcomeTranslationKey = entry.outcome
                  ? `statistics.outcome.${entry.outcome}`
                  : 'statistics.outcome.unknown'

                const playersList = entry.players ?? []
                const playerById = new Map(playersList.map((player) => [player.id, player]))
                const rootCache = new Map<string, string>()

                const resolveRootId = (player: PlayerSlot): string => {
                  const cached = rootCache.get(player.id)
                  if (cached) {
                    return cached
                  }

                  let current: PlayerSlot | undefined = player
                  const visited = new Set<string>()

                  while (current?.assignedFromId) {
                    if (visited.has(current.assignedFromId)) {
                      break
                    }
                    visited.add(current.assignedFromId)
                    const next = playerById.get(current.assignedFromId)
                    if (!next) {
                      break
                    }
                    current = next
                  }

                  const rootId = current?.id ?? player.id
                  rootCache.set(player.id, rootId)
                  return rootId
                }

                const groupOrder: string[] = []
                const groups = new Map<
                  string,
                  {
                    id: string
                    name: string
                    roles: string[]
                    playerIds: string[]
                  }
                >()

                playersList.forEach((player) => {
                  const rootId = resolveRootId(player)
                  const rootPlayer = playerById.get(rootId) ?? player
                  const name = (rootPlayer.name ?? '').trim() || (player.name ?? '').trim() || (rootPlayer.role ?? '').trim() || '—'
                  let group = groups.get(rootId)
                  if (!group) {
                    group = { id: rootId, name, roles: [], playerIds: [] }
                    groups.set(rootId, group)
                    groupOrder.push(rootId)
                  }
                  const role = (player.role ?? '').trim()
                  if (role && !group.roles.includes(role)) {
                    group.roles.push(role)
                  }
                  group.playerIds.push(player.id)
                })

                const winnerIds = new Set(entry.winnerIds ?? [])
                const playerGroups = groupOrder.map((groupId) => groups.get(groupId)!).filter(Boolean)

                const handleDelete = () => {
                  if (deletingId === entry.id) {
                    removeStatistic(entry.id)
                    setDeletingId(null)
                  } else {
                    setDeletingId(entry.id)
                  }
                }

                const handleCancelDelete = () => {
                  setDeletingId(null)
                }

                return (
                  <div className="statistics-table__row" role="row" key={entry.id}>
                    <span role="cell">{startedAt}</span>
                    <span role="cell" className="statistics-table__players">
                      {playerGroups.length > 0 ? (
                        playerGroups.map((group, index) => {
                          const rolesLabel = group.roles.length > 0 ? ` — ${group.roles.join(', ')}` : ''
                          const isWinner = group.playerIds.some((id) => winnerIds.has(id))
                          return (
                            <span
                              key={`${entry.id}-player-group-${group.id}-${index}`}
                              className={`statistics-table__player${
                                isWinner ? ' statistics-table__player--winner' : ''
                              }`}
                            >
                              {group.name}
                              {rolesLabel}
                              {isWinner && (
                                <span className="statistics-table__player-badge">{t('statistics.winner')}</span>
                              )}
                            </span>
                          )
                        })
                      ) : (
                        '—'
                      )}
                    </span>
                    <span role="cell">{duration}</span>
                    <span role="cell">{t(outcomeTranslationKey)}</span>
                    {deletingId === entry.id ? (
                      <div className="statistics-table__delete-confirm">
                        <button
                          type="button"
                          className="ghost-button"
                          onClick={handleCancelDelete}
                          style={{ fontSize: '0.75rem', padding: '4px 8px', whiteSpace: 'nowrap' }}
                        >
                          {t('statistics.deleteCancel', 'Отмена')}
                        </button>
                        <button
                          type="button"
                          className="menu-button menu-button--caslon"
                          onClick={handleDelete}
                          style={{ fontSize: '0.75rem', padding: '4px 8px', whiteSpace: 'nowrap' }}
                        >
                          {renderTextWithHighlight(t('statistics.deleteConfirm', 'Удалить'), 'statistics.deleteConfirm')}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="ghost-button statistics-table__delete-button"
                        onClick={handleDelete}
                        aria-label={t('statistics.delete', 'Удалить запись')}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          {hasMore && (
            <div className="section-block__footer section-block__footer--center">
              <button type="button" className="ghost-button ghost-button--caslon" onClick={() => setShowAll(!showAll)}>
                {showAll 
                  ? renderTextWithHighlight(t('statistics.showLess', 'Показать меньше'), 'statistics.showLess')
                  : renderTextWithHighlight(t('statistics.showAll', 'Показать все'), 'statistics.showAll')
                }
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

