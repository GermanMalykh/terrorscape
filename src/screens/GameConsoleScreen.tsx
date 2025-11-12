import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScreenHeader } from '../components/ScreenHeader.tsx'
import { useGame, type PlayerSlot } from '../contexts/GameContext.tsx'
import { useLanguage } from '../contexts/LanguageContext.tsx'
import { killerProfiles, survivorProfiles, soundLibrary } from '../data/packs'

interface ActiveSound {
  id: string
  startedAt: number
}

interface PlayerGroup {
  id: string
  name: string
  roles: string[]
  playerIds: string[]
  images: string[]
  type: 'killer' | 'survivor'
}

const formatElapsed = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const minutePart = hours > 0 ? String(minutes).padStart(2, '0') : String(minutes)
  const hourPart = hours > 0 ? `${hours}:` : ''
  return `${hourPart}${minutePart}:${String(seconds).padStart(2, '0')}`
}

const buildPlayerGroups = (
  players: PlayerSlot[],
  options: {
    killerLookup: Map<string, { image?: string }>
    survivorLookup: Map<string, { image?: string }>
    selectedKillerId?: string
  },
): PlayerGroup[] => {
  const { killerLookup, survivorLookup, selectedKillerId } = options

  const killer = players.find((player) => player.id.startsWith('killer:'))
  const survivors = players.filter((player) => player.id.startsWith('survivor:'))

  const groups: PlayerGroup[] = []

  if (killer) {
    const name = killer.name.trim() || killer.role.trim() || '—'
    const roleLabel = killer.role.trim() || '—'
    const profile = selectedKillerId ? killerLookup.get(selectedKillerId) : undefined
    groups.push({
      id: killer.id,
      name,
      roles: [roleLabel],
      playerIds: [killer.id],
      images: profile?.image ? [profile.image] : [],
      type: 'killer',
    })
  }

  if (survivors.length === 0) {
    return groups
  }

  const playerById = new Map(players.map((player) => [player.id, player]))
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

  const survivorGroups = new Map<
    string,
    {
      id: string
      name: string
      roles: string[]
      playerIds: string[]
      images: string[]
    }
  >()
  const order: string[] = []

  survivors.forEach((player) => {
    const rootId = resolveRootId(player)
    const rootPlayer = playerById.get(rootId) ?? player
    const name = (rootPlayer.name ?? '').trim() || (player.name ?? '').trim() || (rootPlayer.role ?? '').trim() || '—'

    const referenceKey = player.id.split(':')[1] ?? ''
    const profile = survivorLookup.get(referenceKey)

    let group = survivorGroups.get(rootId)
    if (!group) {
      group = {
        id: rootId,
        name,
        roles: [],
        playerIds: [],
        images: [],
      }
      survivorGroups.set(rootId, group)
      order.push(rootId)
    }

    const role = (player.role ?? '').trim()
    if (role && !group.roles.includes(role)) {
      group.roles.push(role)
    }
    group.playerIds.push(player.id)
    if (profile?.image && !group.images.includes(profile.image)) {
      group.images.push(profile.image)
    }
  })

  order.forEach((groupId) => {
    const group = survivorGroups.get(groupId)
    if (!group) return
    groups.push({
      id: group.id,
      name: group.name,
      roles: group.roles,
      playerIds: group.playerIds,
      images: group.images,
      type: 'survivor',
    })
  })

  return groups
}

export function GameConsoleScreen() {
  const { config, selectedKiller, state, statistics, finishGame } = useGame()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [activeSounds, setActiveSounds] = useState<ActiveSound[]>([])
  const [elapsedMs, setElapsedMs] = useState(0)
  const [pendingGroup, setPendingGroup] = useState<PlayerGroup | null>(null)
  const [confirmExit, setConfirmExit] = useState(false)
  const [timerWarningDismissed, setTimerWarningDismissed] = useState(false)

  const killerLookup = useMemo(() => new Map(killerProfiles.map((profile) => [profile.id, profile])), [])
  const survivorLookup = useMemo(() => new Map(survivorProfiles.map((profile) => [profile.id, profile])), [])

  const playerGroups = useMemo(
    () =>
      buildPlayerGroups(config.players, {
        killerLookup,
        survivorLookup,
        selectedKillerId: config.selectedKillerId,
      }),
    [config.players, config.selectedKillerId, killerLookup, survivorLookup],
  )

  const killerGroup = useMemo(
    () => playerGroups.find((group) => group.type === 'killer') ?? null,
    [playerGroups],
  )
  const survivorGroups = useMemo(
    () => playerGroups.filter((group) => group.type === 'survivor'),
    [playerGroups],
  )

  const currentStatistic = useMemo(() => {
    if (!state.currentStatisticId) {
      return undefined
    }
    return statistics.find((entry) => entry.id === state.currentStatisticId)
  }, [state.currentStatisticId, statistics])

  const winnerSet = useMemo(() => {
    return new Set(currentStatistic?.winnerIds ?? [])
  }, [currentStatistic?.winnerIds])

  const gameFinished = Boolean(currentStatistic?.endedAt)

  const winnerGroups = useMemo(() => {
    if (!winnerSet.size) {
      return []
    }
    return playerGroups.filter((group) => group.playerIds.some((id) => winnerSet.has(id)))
  }, [playerGroups, winnerSet])

  const matchSummary = useMemo(() => {
    if (!gameFinished || winnerGroups.length === 0) {
      return null
    }

    const winnersLabel = winnerGroups
      .map((group) => {
        const rolesLabel = group.roles.length > 0 ? ` — ${group.roles.join(', ')}` : ''
        return `${group.name}${rolesLabel}`
      })
      .join(' · ')

    const outcomeLabel =
      winnerGroups.length > 1 ? t('console.outcomeLabelPlural') : t('console.outcomeLabelSingle')

    return `${winnersLabel} ${outcomeLabel}`
  }, [gameFinished, t, winnerGroups])

  useEffect(() => {
    if (!state.startedAt) {
      setElapsedMs(0)
      return
    }

    if (!state.isTimerRunning) {
      if (state.endedAt) {
        setElapsedMs(state.endedAt - state.startedAt)
      }
      return
    }

    const tick = () => {
      setElapsedMs(Date.now() - state.startedAt!)
    }

    tick()
    const intervalId = window.setInterval(tick, 1000)
    return () => window.clearInterval(intervalId)
  }, [state.endedAt, state.isTimerRunning, state.startedAt])

  const uniqueIds = (ids: string[]) => Array.from(new Set(ids))

  const allSurvivorIds = useMemo(() => uniqueIds(survivorGroups.flatMap((group) => group.playerIds)), [survivorGroups])

  const groupedSounds = useMemo(() => {
    const categories = new Map<string, typeof soundLibrary>()
    for (const sound of soundLibrary) {
      const list = categories.get(sound.category) ?? []
      if (config.activePackIds.some((packId) => sound.tags?.includes(packId))) {
        list.push(sound)
        categories.set(sound.category, list)
      }
    }
    return categories
  }, [config.activePackIds])

  const toggleSound = (soundId: string) => {
    setActiveSounds((prev) => {
      const isActive = prev.some((item) => item.id === soundId)
      if (isActive) {
        return prev.filter((item) => item.id !== soundId)
      }
      return [...prev, { id: soundId, startedAt: Date.now() }]
    })
  }

  const handleMuteAll = () => setActiveSounds([])

  const handlePlayerClick = (group: PlayerGroup) => {
    if (gameFinished) {
      return
    }
    setPendingGroup(group)
  }

  const handleDialogClose = () => setPendingGroup(null)

  const handleSurvivorOutcome = (_group: PlayerGroup, result: 'win' | 'dead') => {
    if (gameFinished) {
      setPendingGroup(null)
      return
    }

    // Если таймер остановлен, используем время на основе elapsedMs, иначе текущее время
    const endedAt = state.isTimerRunning
      ? undefined
      : state.startedAt
        ? state.startedAt + elapsedMs
        : undefined

    if (result === 'win') {
      finishGame({ outcome: 'survivors', winnerIds: uniqueIds(allSurvivorIds), endedAt })
    } else {
      finishGame({ outcome: 'killer', winnerIds: uniqueIds(killerGroup?.playerIds ?? []), endedAt })
    }

    setPendingGroup(null)
  }

  const handleKillerOutcome = (result: 'win' | 'lose') => {
    if (gameFinished) {
      setPendingGroup(null)
      return
    }

    // Если таймер остановлен, используем время на основе elapsedMs, иначе текущее время
    const endedAt = state.isTimerRunning
      ? undefined
      : state.startedAt
        ? state.startedAt + elapsedMs
        : undefined

    if (result === 'win') {
      finishGame({ outcome: 'killer', winnerIds: uniqueIds(killerGroup?.playerIds ?? []), endedAt })
    } else {
      finishGame({ outcome: 'survivors', winnerIds: uniqueIds(allSurvivorIds), endedAt })
    }

    setPendingGroup(null)
  }

  const handleBack = () => {
    // Если игра начата, таймер запущен и игра не завершена, показываем подтверждение
    if (state.startedAt && state.isTimerRunning && !gameFinished) {
      setConfirmExit(true)
    } else {
      navigate('/setup')
    }
  }

  const handleConfirmExitCancel = () => {
    setConfirmExit(false)
  }

  const handleConfirmExitProceed = () => {
    setConfirmExit(false)
    navigate('/setup')
  }

  const handleStartNewGame = () => {
    navigate('/setup')
  }

  const handleContinueWithoutTimer = () => {
    // Скрываем предупреждение, продолжаем игру без отслеживания времени
    setTimerWarningDismissed(true)
  }

  const handleViewStatistics = () => {
    navigate('/stats')
  }

  const isTimerStoppedAfterReload = state.startedAt && !state.isTimerRunning && !gameFinished && !timerWarningDismissed

  return (
    <div className="screen">
      <ScreenHeader title={t('console.title')} onBack={handleBack} />

      {state.startedAt && (
        <section className="section-block">
          <div className="timer-block" role="status" aria-live="polite">
            <span className="timer-label">{t('console.timer')}</span>
            <span className="timer-value">{formatElapsed(elapsedMs)}</span>
          </div>
          {isTimerStoppedAfterReload && (
            <div className="timer-warning">
              <p className="timer-warning__message">
                {t('console.timerStoppedWarning', 'Таймер остановился после перезагрузки страницы. Время не будет учитываться.')}
              </p>
              <div className="timer-warning__actions">
                <button type="button" className="menu-button" onClick={handleStartNewGame}>
                  {t('console.startNewGame', 'Начать новую партию')}
                </button>
                <button type="button" className="ghost-button" onClick={handleContinueWithoutTimer}>
                  {t('console.continueWithoutTimer', 'Продолжить без отслеживания времени')}
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      <section className="section-block">
        <div className="console-section">
          <div className="console-section__header">
            <h2>{t('console.playersTitle')}</h2>
          </div>
          <div className="console-players">
            {playerGroups.length > 0 ? (
              playerGroups.map((group) => {
                const isWinner = group.playerIds.some((id) => winnerSet.has(id))
                return (
                  <button
                    key={group.id}
                    type="button"
                    className={`console-player console-player--${group.type}${
                      isWinner ? ' console-player--winner' : ''
                    }`}
                    onClick={() => handlePlayerClick(group)}
                    disabled={gameFinished}
                  >
                    <div className="console-player__layout">
                      {group.images.length > 0 && (
                        <div className="console-player__avatars">
                          {group.images.slice(0, 3).map((image, index) => (
                            <span
                              key={`${group.id}-avatar-${index}`}
                              className="console-player__avatar"
                              style={{ backgroundImage: `url(${image})` }}
                              aria-hidden="true"
                            />
                          ))}
                        </div>
                      )}
                      <div className="console-player__info">
                        <span className="console-player__name">{group.name}</span>
                        {group.roles.length > 0 && (
                          <span className="console-player__roles">{group.roles.join(', ')}</span>
                        )}
                        <span className="console-player__tag">
                          {group.type === 'killer' ? t('console.playerTagKiller') : t('console.playerTagSurvivor')}
                        </span>
                        {isWinner && <span className="console-player__badge">{t('console.winnerBadge')}</span>}
                      </div>
                    </div>
                  </button>
                )
              })
            ) : (
              <p className="console-players__empty">{t('console.playersEmpty')}</p>
            )}
          </div>
        </div>
      </section>

      {gameFinished && matchSummary && (
        <section className="section-block console-result-banner">
          <h2>{t('console.matchFinished')}</h2>
          <p>{matchSummary}</p>
          <div className="console-result-banner__actions">
            <button type="button" className="menu-button" onClick={handleStartNewGame}>
              {t('console.startNewGame', 'Начать новую партию')}
            </button>
            <button type="button" className="ghost-button" onClick={handleViewStatistics}>
              {t('console.viewStatistics', 'Посмотреть статистику')}
            </button>
          </div>
        </section>
      )}

      {selectedKiller && (
        <section className="section-block">
          <div className="console-section">
            <div className="console-section__header">
              <h2>{selectedKiller.name}</h2>
              <span>{selectedKiller.codename}</span>
            </div>
            <div className="button-grid">
              {selectedKiller.signatureSounds.map((soundId) => {
                const sound = soundLibrary.find((item) => item.id === soundId)
                if (!sound) return null
                const isActive = activeSounds.some((item) => item.id === sound.id)
                return (
                  <button
                    key={sound.id}
                    type="button"
                    className={`pad-button ${isActive ? 'pad-button--active' : ''}`}
                    onClick={() => toggleSound(sound.id)}
                  >
                    {sound.name}
                  </button>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {[...groupedSounds.entries()]
        .filter(([category]) => category !== 'killer')
        .map(([category, sounds]) => (
          <section key={category} className="section-block">
            <div className="console-section">
              <div className="console-section__header">
                <h2>{category.toUpperCase()}</h2>
              </div>
              <div className="button-grid">
                {sounds.map((sound) => {
                  const isActive = activeSounds.some((item) => item.id === sound.id)
                  return (
                    <button
                      key={sound.id}
                      type="button"
                      className={`pad-button ${isActive ? 'pad-button--active' : ''}`}
                      onClick={() => toggleSound(sound.id)}
                    >
                      {sound.name}
                    </button>
                  )
                })}
              </div>
            </div>
          </section>
        ))}

      <div className="floating-actions floating-actions--spread">
        <button type="button" className="ghost-button" onClick={handleMuteAll}>
          {t('console.muteAll')}
        </button>
        <button type="button" className="ghost-button">
          {t('console.mix')}
        </button>
        <button type="button" className="ghost-button">
          {t('console.queue')}
        </button>
        <button type="button" className="ghost-button">
          {t('console.scenarios')}
        </button>
      </div>

      {pendingGroup && (
        <div className="console-result-dialog" role="dialog" aria-modal="true">
          <div className="console-result-dialog__backdrop" onClick={handleDialogClose} />
          <div className="console-result-dialog__panel">
            <h3>
              {pendingGroup.type === 'killer'
                ? t('console.finishPromptKiller')
                : t('console.finishPromptSurvivor')}
            </h3>
            <p>
              <strong>{pendingGroup.name}</strong>
              {pendingGroup.roles.length > 0 && ` — ${pendingGroup.roles.join(', ')}`}
            </p>
            <div className="console-result-dialog__actions">
              {pendingGroup.type === 'survivor' ? (
                <>
                  <button
                    type="button"
                    className="menu-button"
                    onClick={() => handleSurvivorOutcome(pendingGroup, 'win')}
                  >
                    {t('console.playerWinOption')}
                  </button>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => handleSurvivorOutcome(pendingGroup, 'dead')}
                  >
                    {t('console.playerDeadOption')}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="menu-button"
                    onClick={() => handleKillerOutcome('win')}
                  >
                    {t('console.killerWinOption')}
                  </button>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => handleKillerOutcome('lose')}
                  >
                    {t('console.killerLoseOption')}
                  </button>
                </>
              )}
              <button type="button" className="ghost-button" onClick={handleDialogClose}>
                {t('console.finishCancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmExit && (
        <div className="killer-hero__overlay killer-hero__overlay--confirm" role="alertdialog" aria-modal="true">
          <div className="confirm-dialog">
            <h3 className="confirm-dialog__title">
              {t('console.exitConfirmTitle', 'Выйти из партии?')}
            </h3>
            <p className="confirm-dialog__message">
              {t(
                'console.exitConfirmMessage',
                'Партия ещё не завершена. Вы уверены, что хотите выйти без выбора победителя?',
              )}
            </p>
            <div className="confirm-dialog__actions">
              <button type="button" className="ghost-button" onClick={handleConfirmExitCancel}>
                {t('console.exitConfirmCancel', 'Остаться')}
              </button>
              <button type="button" className="menu-button" onClick={handleConfirmExitProceed}>
                {t('console.exitConfirmProceed', 'Выйти')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
