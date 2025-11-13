import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScreenHeader } from '../components/ScreenHeader.tsx'
import { useGame } from '../contexts/GameContext.tsx'
import { useLanguage } from '../contexts/LanguageContext.tsx'
import { killerProfiles, survivorProfiles, soundLibrary } from '../data/packs'
import { getAssetPath } from '../utils/paths'
import { getImagePaths } from '../utils/imagePaths'
import { ProgressiveImage } from '../components/ProgressiveImage.tsx'
import { useSoundToggle } from '../hooks/useSoundToggle.ts'

interface RoleSlot {
  key: string
  type: 'killer' | 'survivor'
  label: string
  referenceId: string
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
  const { isSoundEnabled, toggleSound } = useSoundToggle()
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
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map())
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

  const killerImagePaths = useMemo(() => {
    if (!selectedKiller?.image) {
      return null
    }
    // Извлекаем путь из полного URL (убираем base URL)
    const imagePath = selectedKiller.image.replace(import.meta.env.BASE_URL, '/')
    return getImagePaths(imagePath)
  }, [selectedKiller])

  const killerImageStyle = useMemo((): CSSProperties | undefined => {
    if (!selectedKiller?.image) {
      return undefined
    }

    const preset = killerImagePresets.get(selectedKiller.id)
    return {
      backgroundPosition: preset?.position ?? 'center',
      backgroundSize: preset?.size ?? 'cover',
      backgroundRepeat: 'no-repeat',
      position: 'relative',
    }
  }, [selectedKiller, killerImagePresets])

  // Функция для остановки всех звуков
  const stopAllSounds = useCallback(() => {
    audioRefs.current.forEach((audio) => {
      audio.pause()
      audio.currentTime = 0
    })
  }, [])

  // Останавливаем все звуки, когда звук выключен
  useEffect(() => {
    if (!isSoundEnabled) {
      stopAllSounds()
    }
  }, [isSoundEnabled, stopAllSounds])

  const playKillerSound = (killerId: string) => {
    // Не воспроизводим звук, если он выключен
    if (!isSoundEnabled) {
      return
    }

    const killer = killerProfiles.find((k) => k.id === killerId)
    if (!killer || killer.signatureSounds.length === 0) {
      return
    }

    // Берем первый звук из signatureSounds
    const soundId = killer.signatureSounds[0]
    const sound = soundLibrary.find((s) => s.id === soundId)
    if (!sound) {
      return
    }

    // Определяем категорию звука для пути
    const category = sound.category === 'killer' ? 'killers' : sound.category
    const audioPath = getAssetPath(`/sounds/${category}/${soundId}.mp3`)

    // Останавливаем предыдущий звук, если играет
    stopAllSounds()

    // Создаем или используем существующий audio элемент
    let audio = audioRefs.current.get(soundId)
    if (!audio) {
      audio = new Audio(audioPath)
      audioRefs.current.set(soundId, audio)
    }

    // Воспроизводим звук
    audio.currentTime = 0
    audio.play().catch((error) => {
      console.warn('Failed to play sound:', error)
    })
  }

  const handleCycleKiller = (direction: 'prev' | 'next') => {
    if (availableKillers.length === 0) {
      return
    }

    if (!selectedKiller) {
      const firstKiller = availableKillers[0]
      selectKiller(firstKiller.id)
      setStep('killer')
      playKillerSound(firstKiller.id)
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
      playKillerSound(target.id)
    }
  }

  const killerLookup = useMemo(() => {
    return new Map(killerProfiles.map((killer) => [killer.id, killer]))
  }, [])

  // Выбираем мясника по умолчанию, если убийца не выбран
  useEffect(() => {
    if (!selectedKiller && availableKillers.length > 0) {
      const butcher = availableKillers.find((k) => k.id === 'butcher')
      if (butcher) {
        selectKiller(butcher.id)
      } else {
        // Если мясник недоступен, выбираем первого доступного
        selectKiller(availableKillers[0].id)
      }
    }
  }, [selectedKiller, availableKillers, selectKiller])

  // Воспроизводим звук при первой загрузке, если убийца уже выбран
  useEffect(() => {
    if (selectedKiller && step === 'killer') {
      playKillerSound(selectedKiller.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Только при монтировании компонента

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

  // Функция для получения путей к изображениям жертвы
  const getSurvivorImagePaths = (survivor: { image?: string }) => {
    if (!survivor?.image) {
      return null
    }
    // Извлекаем путь из полного URL (убираем base URL)
    const imagePath = survivor.image.replace(import.meta.env.BASE_URL, '/')
    return getImagePaths(imagePath)
  }

  // Функция для получения путей к изображениям роли (убийца или жертва)
  const getRoleAvatarPaths = (slot: RoleSlot) => {
    const avatar = getRoleAvatar(slot)
    if (!avatar) {
      return null
    }
    // Извлекаем путь из полного URL (убираем base URL)
    const imagePath = avatar.replace(import.meta.env.BASE_URL, '/')
    return getImagePaths(imagePath)
  }

  return (
    <div className="screen">
      <ScreenHeader 
        title={renderTextWithHighlight(t('setup.title'), 'setup.title')}
        titleClassName="screen-header__title--caslon"
        backTo="/"
        rightSlot={
          <button
            type="button"
            className="ghost-button sound-toggle-button"
            onClick={toggleSound}
            aria-label={isSoundEnabled ? 'Выключить звук' : 'Включить звук'}
            title={isSoundEnabled ? 'Выключить звук' : 'Включить звук'}
          >
            {isSoundEnabled ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            ) : (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            )}
          </button>
        }
      />

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
              {killerImagePaths ? (
                <div
                  className={`killer-hero__image killer-hero__image--${selectedKiller.id}`}
                  style={killerImageStyle}
                >
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(180deg, rgba(12, 12, 12, 0.1), rgba(12, 12, 12, 0.75))',
                      zIndex: 1,
                    }}
                  />
                  <ProgressiveImage
                    src={killerImagePaths.high}
                    srcLow={killerImagePaths.low}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      zIndex: 0,
                    }}
                    backgroundPosition={killerImagePresets.get(selectedKiller.id)?.position ?? 'center'}
                    backgroundSize={killerImagePresets.get(selectedKiller.id)?.size ?? 'cover'}
                  />
                </div>
              ) : (
                <div
                  className={`killer-hero__image killer-hero__image--${selectedKiller.id}`}
                  style={killerImageStyle}
                />
              )}
              <div className="killer-hero__content">
                <span className="killer-hero__codename">
                  {t('setup.killerLabel', isRussian ? 'Убийца' : 'Killer').toUpperCase()}
                </span>
                <div className="killer-hero__name-row">
                  <h2 className="killer-hero__name killer-hero__name--caslon">
                    {renderTextWithHighlight(selectedKiller.name, `killer:${selectedKiller.id}`)}
                  </h2>
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
                    {selectedSurvivors.map((survivor) => {
                      const survivorPaths = getSurvivorImagePaths(survivor)
                      return (
                      <div key={survivor.id} className="killer-hero__survivor-chip">
                        <span
                          className="killer-hero__survivor-chip-avatar"
                          style={survivorPaths ? { position: 'relative', overflow: 'hidden' } : undefined}
                          aria-hidden="true"
                        >
                          {survivorPaths && (
                            <ProgressiveImage
                              src={survivorPaths.high}
                              srcLow={survivorPaths.low}
                              style={{
                                position: 'absolute',
                                inset: 0,
                              }}
                              backgroundSize="cover"
                              backgroundPosition="center"
                            />
                          )}
                        </span>
                        <span className="killer-hero__survivor-chip-name">
                          {isRussian ? survivor.name : survivor.codename}
                        </span>
                      </div>
                      )
                    })}
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
                    className="menu-button menu-button--caslon"
                    onClick={() => setStep('survivors')}
                    disabled={!canProceedToSurvivors}
                  >
                    {renderTextWithHighlight(t('setup.openSurvivors'), 'setup.openSurvivors')}
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
                    <h3 className="killer-hero__overlay-header--caslon">
                      {renderTextWithHighlight(t('setup.survivors'), 'setup.survivors')}
                    </h3>
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
                          style={{ position: 'relative' }}
                        >
                          <div className="survivor-card__art" aria-hidden="true">
                            {(() => {
                              const survivorPaths = getSurvivorImagePaths(survivor)
                              return survivorPaths ? (
                                <ProgressiveImage
                                  src={survivorPaths.high}
                                  srcLow={survivorPaths.low}
                                  style={{
                                    position: 'absolute',
                                    inset: 0,
                                  }}
                                  backgroundSize="cover"
                                  backgroundPosition="center"
                                />
                              ) : null
                            })()}
                          </div>
                          <div className="survivor-card__overlay">
                            <span className="survivor-card__name survivor-card__name--caslon">
                              {renderTextWithHighlight(
                                isRussian ? survivor.name : survivor.codename,
                                `survivor-${survivor.id}-name`
                              )}
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
                      className={`menu-button menu-button--caslon ${config.selectedSurvivorIds.length === maxSurvivorSlots ? 'menu-button--active' : ''}`}
                      disabled={!canProceedToRoles}
                      onClick={() => setStep('roles')}
                    >
                      {renderTextWithHighlight(t('setup.openRoles'), 'setup.openRoles')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === 'roles' && (
              <div className="killer-hero__overlay killer-hero__overlay--roles" role="dialog" aria-modal="true">
                <div className="killer-hero__overlay-content killer-hero__overlay-content--roles">
                  <h3 className="roster-preview__title roster-preview__title--overlay roster-preview__title--caslon">
                    {renderTextWithHighlight(t('setup.roles'), 'setup.roles')}
                  </h3>
                  <div className="roster-preview__list">
                    {roleSlots.length === 0 ? (
                      <div className="empty-state">
                        <p>{t('setup.rolesHint')}</p>
                      </div>
                    ) : (
                      roleSlots.map((slot) => {
                        const avatarPaths = getRoleAvatarPaths(slot)
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
                                style={avatarPaths ? { position: 'relative', overflow: 'hidden' } : undefined}
                                aria-hidden="true"
                              >
                                {avatarPaths && (
                                  <ProgressiveImage
                                    src={avatarPaths.high}
                                    srcLow={avatarPaths.low}
                                    style={{
                                      position: 'absolute',
                                      inset: 0,
                                    }}
                                    backgroundSize="cover"
                                    backgroundPosition="center"
                                  />
                                )}
                              </span>
                              <div className="roster-preview__meta">
                                <span className="roster-preview__name roster-preview__name--caslon">
                                  {renderTextWithHighlight(slot.label, `role-${slot.key}-name`)}
                                </span>
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
                                    }${nameValue.trim() ? ' roster-preview__assign-toggle--active' : ''}`}
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
                    <button type="button" className="menu-button menu-button--caslon" disabled={!canStart} onClick={handleBegin}>
                      {renderTextWithHighlight(t('setup.start'), 'setup.start')}
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
        <h2 className="section-block__title section-block__title--caslon">
          {renderTextWithHighlight(
            locale === 'ru' ? 'Активные коллекции' : t('setup.activeCollections', 'Active Collections'),
            'setup.activeCollections'
          )}
        </h2>
        <div className="tag-strip">
          {activePacks.map((pack) => (
            <span key={pack.id} className="tag">
              {pack.name}
            </span>
          ))}
        </div>
        <div className="section-block__footer section-block__footer--left">
          <button type="button" className="ghost-button ghost-button--caslon" onClick={() => navigate('/collections')}>
            {renderTextWithHighlight(t('menu.collections'), 'menu.collections')}
          </button>
        </div>
      </section>

      {confirmMissingNames && (
        <div className="killer-hero__overlay killer-hero__overlay--confirm" role="alertdialog" aria-modal="true">
          <div className="confirm-dialog confirm-dialog--missing-names">
            <h3 className="confirm-dialog__title confirm-dialog__title--caslon">
              {renderTextWithHighlight(t('setup.missingNamesTitle', 'Не все имена заполнены'), 'setup.missingNamesTitle')}
            </h3>
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
              <button type="button" className="menu-button menu-button--caslon" onClick={handleConfirmMissingNamesProceed}>
                {renderTextWithHighlight(t('setup.missingNamesProceed', 'Продолжить без имён'), 'setup.missingNamesProceed')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
