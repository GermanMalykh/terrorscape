import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScreenHeader } from '../components/ScreenHeader.tsx'
import { useGame } from '../contexts/GameContext.tsx'
import { useLanguage } from '../contexts/LanguageContext.tsx'
import { killerProfiles, survivorProfiles } from '../data/packs'

interface RoleSlot {
  key: string
  type: 'killer' | 'survivor'
  label: string
  referenceId: string
}

export function GameSetupScreen() {
  const {
    config,
    activePacks,
    selectedKiller,
    selectedSurvivors,
    selectKiller,
    toggleSurvivor,
    setPlayers,
    beginGame,
  } = useGame()
  const { t, locale } = useLanguage()
  const navigate = useNavigate()
  const isRussian = locale === 'ru'

  const availableKillers = useMemo(() => {
    const killerIds = new Set(activePacks.flatMap((pack) => pack.includes.killers ?? []))
    return killerProfiles.filter((killer) => killerIds.has(killer.id))
  }, [activePacks])

  const availableSurvivors = useMemo(() => {
    const survivorIds = new Set(activePacks.flatMap((pack) => pack.includes.survivors ?? []))
    return survivorProfiles.filter((survivor) => survivorIds.has(survivor.id))
  }, [activePacks])

  const roleSlots = useMemo<RoleSlot[]>(() => {
    const slots: RoleSlot[] = []
    if (selectedKiller) {
      slots.push({
        key: `killer:${selectedKiller.id}`,
        type: 'killer',
        label: selectedKiller.name,
        referenceId: selectedKiller.id,
      })
    }
    selectedSurvivors.forEach((survivor) => {
      slots.push({ key: `survivor:${survivor.id}`, type: 'survivor', label: survivor.name, referenceId: survivor.id })
    })
    return slots
  }, [selectedKiller, selectedSurvivors])

  const [playerNames, setPlayerNames] = useState<Record<string, string>>({})
  const [assignedSources, setAssignedSources] = useState<Record<string, string | undefined>>({})
  const [step, setStep] = useState<'killer' | 'survivors' | 'roles'>('killer')
  const [expandedAssignSource, setExpandedAssignSource] = useState<string | null>(null)
  const [confirmMissingNames, setConfirmMissingNames] = useState(false)
  const [isMobileLayout, setIsMobileLayout] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const mediaQuery = window.matchMedia('(max-width: 640px)')
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsMobileLayout(event.matches)
    }

    handleChange(mediaQuery)

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }

    mediaQuery.addListener(handleChange)
    return () => mediaQuery.removeListener(handleChange)
  }, [])

  useEffect(() => {
    const storedPlayers = new Map(config.players.map((player) => [player.id, player]))

    setPlayerNames((prev) => {
      const next: Record<string, string> = {}
      roleSlots.forEach((slot) => {
        const existing = prev[slot.key]
        const stored = storedPlayers.get(slot.key)
        next[slot.key] = existing ?? stored?.name ?? ''
      })
      return next
    })

    setAssignedSources(() => {
      const next: Record<string, string | undefined> = {}
      roleSlots.forEach((slot) => {
        const stored = storedPlayers.get(slot.key)
        if (stored?.assignedFromId) {
          next[slot.key] = stored.assignedFromId
        }
      })
      return next
    })
  }, [roleSlots, config.players])

  const canProceedToSurvivors = Boolean(selectedKiller)
  const requiredSurvivorCount = 3
  const canProceedToRoles = canProceedToSurvivors && config.selectedSurvivorIds.length === requiredSurvivorCount
  const canStart = canProceedToRoles && roleSlots.length > 0

  const handlePlayerNameChange = (slotKey: string, value: string) => {
    const trimmed = value.trim()
    setPlayerNames((prev) => {
      const next = { ...prev, [slotKey]: value }
      Object.entries(assignedSources).forEach(([targetKey, sourceKey]) => {
        if (sourceKey === slotKey) {
          next[targetKey] = value
        }
      })
      return next
    })

    if (trimmed === '') {
      setAssignedSources((prev) => {
        const next = { ...prev }
        Object.entries(prev).forEach(([targetKey, sourceKey]) => {
          if (sourceKey === slotKey) {
            delete next[targetKey]
          }
        })
        return next
      })
    }

    setExpandedAssignSource((prev) => (prev === slotKey && trimmed === '' ? null : prev))
  }

  const handleAssignToggle = (slotKey: string) => {
    const isOpening = expandedAssignSource !== slotKey
    const wasOpen = expandedAssignSource === slotKey
    
    // При открытии модального окна сбрасываем все назначения от этого источника
    if (isOpening && !wasOpen) {
      // Сначала получаем список целей, которые нужно очистить
      const targetsToClear: string[] = []
      Object.entries(assignedSources).forEach(([targetKey, sourceKey]) => {
        if (sourceKey === slotKey) {
          targetsToClear.push(targetKey)
        }
      })
      
      // Очищаем назначения
      if (targetsToClear.length > 0) {
        setAssignedSources((prev) => {
          const next = { ...prev }
          targetsToClear.forEach((targetKey) => {
            delete next[targetKey]
          })
          return next
        })
        
        // Очищаем имена у целей, которые были назначены от этого источника
        setPlayerNames((prevNames) => {
          const nextNames = { ...prevNames }
          const sourceName = prevNames[slotKey]?.trim()
          if (sourceName) {
            targetsToClear.forEach((targetKey) => {
              if (prevNames[targetKey]?.trim() === sourceName) {
                nextNames[targetKey] = ''
              }
            })
          }
          return nextNames
        })
      }
    }
    
    setExpandedAssignSource((prev) => (prev === slotKey ? null : slotKey))
  }

  const handleAssignSamePlayer = (sourceKey: string, targetKey: string, shouldAssign: boolean) => {
    setPlayerNames((prev) => {
      const next = { ...prev }
      const sourceName = prev[sourceKey]?.trim()

      if (!sourceName) {
        return next
      }

      if (shouldAssign) {
        next[targetKey] = sourceName
      } else if (prev[targetKey]?.trim() === sourceName) {
        next[targetKey] = ''
      }

      return next
    })

    if (shouldAssign) {
      setAssignedSources((prev) => ({ ...prev, [targetKey]: sourceKey }))
    } else {
      setAssignedSources((prev) => {
        const next = { ...prev }
        if (next[targetKey] === sourceKey) {
          delete next[targetKey]
        }
        return next
      })
    }
  }

  const missingNameSlots = roleSlots.filter((slot) => (playerNames[slot.key] ?? '').trim() === '')

  const handleBeginConfirmed = () => {
    const players = roleSlots.map((slot) => ({
      id: slot.key,
      name: playerNames[slot.key]?.trim() ?? '',
      role: slot.label,
      assignedFromId: assignedSources[slot.key],
    }))
    setPlayers(players)
    beginGame(players)
    navigate('/console')
  }

  const handleBegin = () => {
    if (missingNameSlots.length > 0) {
      setConfirmMissingNames(true)
      return
    }

    handleBeginConfirmed()
  }

  const handleConfirmMissingNamesCancel = () => {
    setConfirmMissingNames(false)
  }

  const handleConfirmMissingNamesProceed = () => {
    setConfirmMissingNames(false)
    handleBeginConfirmed()
  }

  const maxSurvivorSlots = 3
  const survivorPlaceholderCount = Math.max(0, maxSurvivorSlots - selectedSurvivors.length)
  const survivorPlaceholderLabel = isRussian ? 'Свободный слот' : 'Empty slot'

  const handleToggleSurvivor = (survivorId: string) => {
    const isSelected = config.selectedSurvivorIds.includes(survivorId)
    if (isSelected) {
      toggleSurvivor(survivorId)
      return
    }

    if (config.selectedSurvivorIds.length >= maxSurvivorSlots) {
      return
    }

    toggleSurvivor(survivorId)
  }

  useEffect(() => {
    setExpandedAssignSource(null)
  }, [step])

  useEffect(() => {
    setAssignedSources((prev) => {
      const next = { ...prev }
      Object.entries(next).forEach(([targetKey, sourceKey]) => {
        if (!sourceKey) {
          delete next[targetKey]
          return
        }
        const sourceName = playerNames[sourceKey]?.trim()
        const targetName = playerNames[targetKey]?.trim()
        const sourceExists = roleSlots.some((slot) => slot.key === sourceKey)
        const targetExists = roleSlots.some((slot) => slot.key === targetKey)
        if (!sourceExists || !targetExists || !sourceName || targetName !== sourceName) {
          delete next[targetKey]
        }
      })
      return next
    })
  }, [playerNames, roleSlots])

useEffect(() => {
  const nextPlayers = roleSlots.map((slot) => ({
    id: slot.key,
    name: (playerNames[slot.key] ?? '').trim(),
    role: slot.label,
    assignedFromId: assignedSources[slot.key],
  }))

  if (nextPlayers.length !== config.players.length) {
    setPlayers(nextPlayers)
    return
  }

  const existingById = new Map(config.players.map((player) => [player.id, player]))
  const hasDiff = nextPlayers.some((player) => {
    const stored = existingById.get(player.id)
    if (!stored) {
      return true
    }
    return (
      stored.name !== player.name ||
      stored.role !== player.role ||
      stored.assignedFromId !== player.assignedFromId
    )
  })

  if (hasDiff) {
    setPlayers(nextPlayers)
  }
}, [assignedSources, config.players, playerNames, roleSlots, setPlayers])

  useEffect(() => {
    if (confirmMissingNames && missingNameSlots.length === 0) {
      setConfirmMissingNames(false)
    }
  }, [confirmMissingNames, missingNameSlots.length])

  const heroBackgroundStyle = useMemo(() => {
    return {
      background: 'linear-gradient(120deg, rgba(12, 12, 12, 0.9) 12%, rgba(12, 12, 12, 0.7) 48%, rgba(12, 12, 12, 0.92) 88%)',
    }
  }, [])

  const killerImagePresets = useMemo(
    () =>
      new Map<string, { position: string; size?: string }>([
        ['spectre', { position: 'center 10%', size: 'cover' }],
        ['butcher', { position: 'center 5%', size: 'cover' }],
        ['werewolf', { position: 'center 12%', size: 'cover' }],
        ['huntress', { position: 'center 8%', size: 'cover' }],
      ]),
    [],
  )

  const killerImageStyle = useMemo((): CSSProperties | undefined => {
    if (!selectedKiller?.image) {
      return undefined
    }

    const preset = killerImagePresets.get(selectedKiller.id)
    return {
      backgroundImage: `linear-gradient(180deg, rgba(12, 12, 12, 0.1), rgba(12, 12, 12, 0.75)), url(${selectedKiller.image})`,
      backgroundPosition: preset?.position ?? 'center',
      backgroundSize: preset?.size ?? 'cover',
      backgroundRepeat: 'no-repeat',
    }
  }, [selectedKiller, killerImagePresets])

  const handleCycleKiller = (direction: 'prev' | 'next') => {
    if (availableKillers.length === 0) {
      return
    }

    if (!selectedKiller) {
      selectKiller(availableKillers[0].id)
      setStep('killer')
      return
    }

    const currentIndex = availableKillers.findIndex((killer) => killer.id === selectedKiller.id)
    const fallbackIndex = currentIndex === -1 ? 0 : currentIndex
    let nextIndex = direction === 'next' ? fallbackIndex + 1 : fallbackIndex - 1

    if (nextIndex >= availableKillers.length) {
      nextIndex = 0
    } else if (nextIndex < 0) {
      nextIndex = availableKillers.length - 1
    }

    const target = availableKillers[nextIndex]
    if (target) {
      selectKiller(target.id)
      setStep('killer')
    }
  }

  const killerLookup = useMemo(() => {
    return new Map(killerProfiles.map((killer) => [killer.id, killer]))
  }, [])

  const survivorLookup = useMemo(() => {
    return new Map(survivorProfiles.map((survivor) => [survivor.id, survivor]))
  }, [])

  const getRoleAvatar = (slot: RoleSlot) => {
    if (slot.type === 'killer') {
      const killer = killerLookup.get(slot.referenceId)
      return killer?.image
    }
    const survivor = survivorLookup.get(slot.referenceId)
    return survivor?.image
  }

  return (
    <div className="screen">
      <ScreenHeader title={t('setup.title')} backTo="/" />

      <section className="section-block killer-hero" style={heroBackgroundStyle}>
        {selectedKiller ? (
          <>
            <button
              type="button"
              className="killer-hero__nav killer-hero__nav--prev"
              onClick={() => handleCycleKiller('prev')}
              aria-label={t('setup.previousKiller')}
              disabled={availableKillers.length <= 1}
            >
              ‹
            </button>
            <div className="killer-hero__layout">
              <div
                className={`killer-hero__image killer-hero__image--${selectedKiller.id}`}
                style={killerImageStyle}
              />
              <div className="killer-hero__content">
                <span className="killer-hero__codename">
                  {t('setup.killerLabel', isRussian ? 'Убийца' : 'Killer').toUpperCase()}
                </span>
                <div className="killer-hero__name-row">
                  <h2 className="killer-hero__name">{selectedKiller.name}</h2>
                  <span className="tag tag--pack">
                    {isRussian ? selectedKiller.packLabel?.ru ?? 'База' : selectedKiller.packLabel?.en ?? 'Base'}
                  </span>
                </div>
                <p className="killer-hero__description">
                  {isRussian ? selectedKiller.description : selectedKiller.codename}
                </p>
                {selectedKiller.traits && (
                  <div className="killer-hero__traits">
                    <span className="killer-hero__traits-label">
                      {isRussian ? 'Особенности' : 'Traits'}
                    </span>
                    <ul>
                      {selectedKiller.traits.map((trait) => (
                        <li key={trait}>{trait}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="killer-hero__survivors">
                  <span className="killer-hero__survivors-label">
                    {isRussian ? 'Выбранные жертвы' : 'Selected Survivors'}
                  </span>
                  <div className="killer-hero__survivors-list">
                    {selectedSurvivors.map((survivor) => (
                      <div key={survivor.id} className="killer-hero__survivor-chip">
                        <span
                          className="killer-hero__survivor-chip-avatar"
                          style={survivor.image ? { backgroundImage: `url(${survivor.image})` } : undefined}
                          aria-hidden="true"
                        />
                        <span className="killer-hero__survivor-chip-name">
                          {isRussian ? survivor.name : survivor.codename}
                        </span>
                      </div>
                    ))}
                    {Array.from({ length: survivorPlaceholderCount }).map((_, index) => (
                      <div
                        key={`survivor-placeholder-${index}`}
                        className="killer-hero__survivor-chip killer-hero__survivor-chip--placeholder"
                      >
                        <span
                          className="killer-hero__survivor-chip-avatar killer-hero__survivor-chip-avatar--placeholder"
                          aria-hidden="true"
                        />
                        <span className="killer-hero__survivor-chip-name">{survivorPlaceholderLabel}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="killer-hero__actions">
                  <button
                    type="button"
                    className="menu-button"
                    onClick={() => setStep('survivors')}
                    disabled={!canProceedToSurvivors}
                  >
                    {t('setup.openSurvivors')}
                  </button>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="killer-hero__nav killer-hero__nav--next"
              onClick={() => handleCycleKiller('next')}
              aria-label={t('setup.nextKiller')}
              disabled={availableKillers.length <= 1}
            >
              ›
            </button>
            {step === 'survivors' && (
              <div className="killer-hero__overlay" role="dialog" aria-modal="true">
                <div className="killer-hero__overlay-content">
                  <div className="killer-hero__overlay-header">
                    <h3>{t('setup.survivors')}</h3>
                    <span className="killer-hero__overlay-meta">
                      {t('setup.survivorSlots')} {config.selectedSurvivorIds.length}/{maxSurvivorSlots}
                    </span>
                  </div>
                  <div className="killer-hero__overlay-grid survivor-grid">
                    {availableSurvivors.map((survivor) => {
                      const isSelected = config.selectedSurvivorIds.includes(survivor.id)
                      const canSelectMore = config.selectedSurvivorIds.length < maxSurvivorSlots
                      const isDisabled = !isSelected && !canSelectMore
                      return (
                        <button
                          key={survivor.id}
                          type="button"
                          className={`survivor-card ${isSelected ? 'survivor-card--selected' : ''} ${
                            isDisabled ? 'survivor-card--disabled' : ''
                          }`}
                          onClick={() => handleToggleSurvivor(survivor.id)}
                          disabled={isDisabled}
                          style={
                            survivor.image
                              ? ({ '--survivor-art-image': `url(${survivor.image})` } as CSSProperties)
                              : undefined
                          }
                        >
                          <div className="survivor-card__art" aria-hidden="true" />
                          <div className="survivor-card__overlay">
                            <span className="survivor-card__name">
                              {isRussian ? survivor.name : survivor.codename}
                            </span>
                          </div>
                        </button>
                      )
                    })}
                    {availableSurvivors.length === 0 && (
                      <div className="empty-state">
                        <p>{t('setup.survivorsHint')}</p>
                      </div>
                    )}
                  </div>
                  <div className="killer-hero__overlay-footer">
                    <button type="button" className="ghost-button" onClick={() => setStep('killer')}>
                      {t('setup.backToKiller')}
                    </button>
                    <button
                      type="button"
                      className="menu-button"
                      disabled={!canProceedToRoles}
                      onClick={() => setStep('roles')}
                    >
                      {t('setup.openRoles')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === 'roles' && (
              <div className="killer-hero__overlay killer-hero__overlay--roles" role="dialog" aria-modal="true">
                <div className="killer-hero__overlay-content killer-hero__overlay-content--roles">
                  <h3 className="roster-preview__title roster-preview__title--overlay">{t('setup.roles')}</h3>
                  <div className="roster-preview__list">
                    {roleSlots.length === 0 ? (
                      <div className="empty-state">
                        <p>{t('setup.rolesHint')}</p>
                      </div>
                    ) : (
                      roleSlots.map((slot) => {
                        const avatar = getRoleAvatar(slot)
                        const isKiller = slot.type === 'killer'
                        const assignableTargets = roleSlots.filter(
                          (other) => other.type === 'survivor' && other.key !== slot.key,
                        )
                        const nameValue = playerNames[slot.key] ?? ''
                        const canAssign = !isKiller && assignableTargets.length > 0
                        const assignedFromKey = assignedSources[slot.key]
                        const assignedFrom = assignedFromKey
                          ? roleSlots.find((other) => other.key === assignedFromKey)
                          : undefined
                        const sourceNameTrimmed = nameValue.trim()
                        const isAssigned = Boolean(assignedFrom && sourceNameTrimmed !== '')
                        const isAssignedSource = Object.values(assignedSources).includes(slot.key)
                        return (
                          <div key={slot.key} className="roster-preview__item">
                            <div className="roster-preview__info">
                              <span
                                className="roster-preview__icon"
                                style={avatar ? { backgroundImage: `url(${avatar})` } : undefined}
                                aria-hidden="true"
                              />
                              <div className="roster-preview__meta">
                                <span className="roster-preview__name">{slot.label}</span>
                                <span className="roster-preview__role">
                                  {isKiller ? t('setup.killer') : t('setup.survivorSingular')}
                                </span>
                                {assignedFrom && isAssigned && assignedFrom.key !== slot.key && (
                                  <span className="roster-preview__assigned-from">
                                    {t('setup.assignedFromLabel', isRussian ? 'Назначено от' : 'Assigned from')}{' '}
                                    {isRussian
                                      ? assignedFrom.label
                                      : assignedFrom.type === 'killer'
                                        ? killerLookup.get(assignedFrom.referenceId)?.codename ?? assignedFrom.label
                                        : survivorLookup.get(assignedFrom.referenceId)?.codename ?? assignedFrom.label}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div
                              className={`roster-preview__controls ${
                                isAssigned ? 'roster-preview__controls--assigned-target' : ''
                              } ${isAssignedSource ? 'roster-preview__controls--assigned-source' : ''} ${
                                isMobileLayout ? 'roster-preview__controls--touch' : ''
                              }`}
                            >
                              <input
                                className="roster-preview__input roster-input"
                                placeholder={t('setup.playerName', 'Имя игрока')}
                                value={nameValue}
                                onChange={(event) => handlePlayerNameChange(slot.key, event.target.value)}
                                disabled={Boolean(assignedFrom) && !isKiller}
                              />
                              {canAssign && !assignedFrom && (
                                <div className="roster-preview__assign">
                                  <button
                                    type="button"
                                    className={`ghost-button roster-preview__assign-toggle${
                                      isMobileLayout ? ' roster-preview__assign-toggle--touch' : ''
                                    }`}
                                    onClick={() => handleAssignToggle(slot.key)}
                                    disabled={!nameValue.trim()}
                                  >
                                    {expandedAssignSource === slot.key
                                      ? t('setup.assignHide')
                                      : t('setup.assignToOthers')}
                                  </button>
                                  {expandedAssignSource === slot.key && nameValue.trim() !== '' && (
                                    <div className="roster-preview__assign-dropdown">
                                      {assignableTargets.map((target) => {
                                        const targetName = playerNames[target.key]?.trim()
                                        const isAssigned = assignedSources[target.key] === slot.key
                                        const isChecked = isAssigned && targetName === nameValue.trim()
                                        return (
                                          <label key={target.key} className="roster-preview__assign-item">
                                            <input
                                              type="checkbox"
                                              checked={isChecked}
                                              onChange={(event) =>
                                                handleAssignSamePlayer(slot.key, target.key, event.target.checked)
                                              }
                                            />
                                            <span>
                                              {t('setup.assignLabel')} {target.label}
                                            </span>
                                          </label>
                                        )
                                      })}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                  <div className="killer-hero__overlay-footer killer-hero__overlay-footer--roles">
                    <button type="button" className="ghost-button" onClick={() => setStep('survivors')}>
                      {t('setup.backToSurvivors')}
                    </button>
                    <button type="button" className="menu-button" disabled={!canStart} onClick={handleBegin}>
                      {t('setup.start')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              className="killer-hero__nav killer-hero__nav--next"
              onClick={() => handleCycleKiller('next')}
              aria-label={t('setup.nextKiller')}
              disabled={availableKillers.length <= 1}
            >
              ›
            </button>
          </>
        ) : (
          <div className="empty-state">
            <p>{t('setup.rolesHint')}</p>
          </div>
        )}
      </section>

      <section className="section-block">
        <h2 className="section-block__title">Активные коллекции</h2>
        <div className="tag-strip">
          {activePacks.map((pack) => (
            <span key={pack.id} className="tag">
              {pack.name}
            </span>
          ))}
        </div>
        <div className="section-block__footer section-block__footer--left">
          <button type="button" className="ghost-button" onClick={() => navigate('/collections')}>
            {t('menu.collections')}
          </button>
        </div>
      </section>

      {confirmMissingNames && (
        <div className="killer-hero__overlay killer-hero__overlay--confirm" role="alertdialog" aria-modal="true">
          <div className="confirm-dialog">
            <h3 className="confirm-dialog__title">{t('setup.missingNamesTitle', 'Не все имена заполнены')}</h3>
            <p className="confirm-dialog__message">
              {t(
                'setup.missingNamesMessage',
                'Введите имена всех игроков. Они будут отображаться в статистике партии.',
              )}
            </p>
            {missingNameSlots.length > 0 && (
              <ul className="confirm-dialog__list">
                {missingNameSlots.map((slot) => (
                  <li key={slot.key}>{slot.label}</li>
                ))}
              </ul>
            )}
            <div className="confirm-dialog__actions">
              <button type="button" className="ghost-button" onClick={handleConfirmMissingNamesCancel}>
                {t('setup.missingNamesCancel', 'Заполнить имена')}
              </button>
              <button type="button" className="menu-button" onClick={handleConfirmMissingNamesProceed}>
                {t('setup.missingNamesProceed', 'Продолжить без имён')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
