import { useMemo, useState } from 'react'
import { ScreenHeader } from '../components/ScreenHeader.tsx'
import { useGame } from '../contexts/GameContext.tsx'
import { useLanguage } from '../contexts/LanguageContext.tsx'
import { soundLibrary } from '../data/packs'

interface ActiveSound {
  id: string
  startedAt: number
}

export function GameConsoleScreen() {
  const { config, selectedKiller } = useGame()
  const { t } = useLanguage()
  const [activeSounds, setActiveSounds] = useState<ActiveSound[]>([])

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

  return (
    <div className="screen">
      <ScreenHeader title={t('console.title')} backTo="/setup" />

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
    </div>
  )
}
