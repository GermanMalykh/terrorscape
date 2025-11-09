import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScreenHeader } from '../components/ScreenHeader.tsx'
import { useGame } from '../contexts/GameContext.tsx'
import { useLanguage } from '../contexts/LanguageContext.tsx'
import { killerProfiles, soundLibrary, victimProfiles } from '../data/packs'

interface RoleSlot {
  key: string
  type: 'killer' | 'victim'
  label: string
  referenceId: string
}

export function GameSetupScreen() {
  const {
    config,
    activePacks,
    selectedKiller,
    selectedVictims,
    selectKiller,
    toggleVictim,
    setPlayers,
    beginGame,
  } = useGame()
  const { t } = useLanguage()
  const navigate = useNavigate()

  const availableKillers = useMemo(() => {
    const killerIds = new Set(activePacks.flatMap((pack) => pack.includes.killers ?? []))
    return killerProfiles.filter((killer) => killerIds.has(killer.id))
  }, [activePacks])

  const availableVictims = useMemo(() => {
    const victimIds = new Set(activePacks.flatMap((pack) => pack.includes.victims ?? []))
    return victimProfiles.filter((victim) => victimIds.has(victim.id))
  }, [activePacks])

  const availableSounds = useMemo(() => {
    const soundIds = activePacks.flatMap((pack) => pack.includes.sounds ?? [])
    return soundLibrary.filter((sound) => soundIds.includes(sound.id))
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
    selectedVictims.forEach((victim) => {
      slots.push({ key: `victim:${victim.id}`, type: 'victim', label: victim.name, referenceId: victim.id })
    })
    return slots
  }, [selectedKiller, selectedVictims])

  const [playerNames, setPlayerNames] = useState<Record<string, string>>({})
  const [step, setStep] = useState<'killer' | 'victims' | 'roles'>('killer')

  useEffect(() => {
    setPlayerNames((prev) => {
      const next: Record<string, string> = {}
      roleSlots.forEach((slot) => {
        const existing = prev[slot.key]
        const stored = config.players.find((player) => player.id === slot.key)
        next[slot.key] = existing ?? stored?.name ?? ''
      })
      return next
    })
  }, [roleSlots, config.players])

  const canProceedToVictims = Boolean(selectedKiller)
  const canProceedToRoles = canProceedToVictims && config.selectedVictimIds.length > 0
  const canStart = canProceedToRoles && roleSlots.length > 0

  const handlePlayerNameChange = (slotKey: string, value: string) => {
    setPlayerNames((prev) => ({ ...prev, [slotKey]: value }))
  }

  const handleBegin = () => {
    const players = roleSlots.map((slot) => ({
      id: slot.key,
      name: playerNames[slot.key]?.trim() ?? '',
      role: slot.label,
    }))
    setPlayers(players)
    beginGame()
    navigate('/console')
  }

  const handleSelectKiller = (killerId: string) => {
    selectKiller(killerId)
    setStep('killer')
  }

  return (
    <div className="screen">
      <ScreenHeader title={t('setup.title')} backTo="/" />

      <section className="section-block killer-hero">
        {selectedKiller ? (
          <>
            <div
              className={`killer-hero__image killer-hero__image--${selectedKiller.id}`}
              style={
                selectedKiller.image
                  ? {
                      backgroundImage: `linear-gradient(180deg, rgba(12, 12, 12, 0.1), rgba(12, 12, 12, 0.75)), url(${selectedKiller.image})`,
                    }
                  : undefined
              }
            />
            <div className="killer-hero__content">
              <span className="killer-hero__codename">{selectedKiller.codename}</span>
              <h2 className="killer-hero__name">{selectedKiller.name}</h2>
              <p className="killer-hero__description">{selectedKiller.description}</p>
              {selectedKiller.traits && (
                <div className="killer-hero__traits">
                  <span className="killer-hero__traits-label">{t('setup.killerTraits')}</span>
                  <ul>
                    {selectedKiller.traits.map((trait) => (
                      <li key={trait}>{trait}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="killer-hero__actions">
                <button
                  type="button"
                  className="menu-button"
                  onClick={() => setStep('victims')}
                  disabled={!canProceedToVictims}
                >
                  {t('setup.openVictims')}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <p>{t('setup.rolesHint')}</p>
          </div>
        )}
      </section>

      <section className="section-block killer-thumbs">
        {availableKillers.map((killer) => (
          <button
            key={killer.id}
            type="button"
            className={`killer-thumb ${config.selectedKillerId === killer.id ? 'killer-thumb--selected' : ''}`}
            onClick={() => handleSelectKiller(killer.id)}
          >
            <span className="killer-thumb__name">{killer.name}</span>
          </button>
        ))}
        {availableKillers.length === 0 && (
          <div className="empty-state">
            <p>Нет доступных убийц. Активируйте коллекцию в разделе «Коллекции».</p>
          </div>
        )}
      </section>

      {(step === 'victims' || step === 'roles') && (
        <section className="section-block">
          <h2 className="section-block__title">{t('setup.victims')}</h2>
          <div className="victim-grid">
            {availableVictims.map((victim) => {
              const isSelected = config.selectedVictimIds.includes(victim.id)
              return (
                <button
                  key={victim.id}
                  type="button"
                  className={`victim-card ${isSelected ? 'victim-card--selected' : ''}`}
                  onClick={() => toggleVictim(victim.id)}
                >
                  <span className="victim-card__name">{victim.name}</span>
                  <span className="victim-card__meta">{victim.codename}</span>
                </button>
              )
            })}
            {availableVictims.length === 0 && (
              <div className="empty-state">
                <p>{t('setup.victimsHint')}</p>
              </div>
            )}
          </div>
          <div className="section-block__footer">
            <button
              type="button"
              className="menu-button"
              disabled={!canProceedToRoles}
              onClick={() => setStep('roles')}
            >
              {t('setup.openRoles')}
            </button>
          </div>
        </section>
      )}

      {step === 'roles' && (
        <section className="section-block">
          <h2 className="section-block__title">{t('setup.roles')}</h2>
          <div className="roster-list">
            {roleSlots.map((slot) => (
              <div key={slot.key} className="roster-card">
                <div>
                  <h3>{slot.label}</h3>
                  <p>{slot.type === 'killer' ? t('setup.killer') : t('setup.victims')}</p>
                </div>
                <input
                  className="roster-input"
                  placeholder="Имя игрока"
                  value={playerNames[slot.key] ?? ''}
                  onChange={(event) => handlePlayerNameChange(slot.key, event.target.value)}
                />
              </div>
            ))}
            {roleSlots.length === 0 && (
              <div className="empty-state">
                <p>{t('setup.rolesHint')}</p>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="section-block">
        <h2 className="section-block__title">{t('setup.items')}</h2>
        <div className="sound-list">
          {availableSounds.map((sound) => (
            <div key={sound.id} className={`sound-chip sound-chip--${sound.category}`}>
              <span className="sound-chip__name">{sound.name}</span>
              <span className="sound-chip__meta">{sound.category}</span>
            </div>
          ))}
          {availableSounds.length === 0 && (
            <div className="empty-state">
              <p>Пока нет звуков. Добавьте дополнения или коллекции.</p>
            </div>
          )}
        </div>
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
      </section>

      {step === 'roles' && (
        <div className="floating-actions">
          <button type="button" className="menu-button" disabled={!canStart} onClick={handleBegin}>
            {t('setup.start')}
          </button>
          <button type="button" className="ghost-button" onClick={() => navigate('/collections')}>
            {t('menu.collections')}
          </button>
        </div>
      )}
    </div>
  )
}
