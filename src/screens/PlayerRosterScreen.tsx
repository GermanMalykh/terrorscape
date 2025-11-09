import { type FormEvent, useState } from 'react'
import { ScreenHeader } from '../components/ScreenHeader.tsx'
import { useGame, type PlayerSlot } from '../contexts/GameContext.tsx'
import { useLanguage } from '../contexts/LanguageContext.tsx'

export function PlayerRosterScreen() {
  const { config, setPlayers } = useGame()
  const { t } = useLanguage()
  const [draftName, setDraftName] = useState('')
  const [draftRole, setDraftRole] = useState('')
  const [players, updatePlayers] = useState<PlayerSlot[]>(config.players)

  const handleAddPlayer = (event: FormEvent) => {
    event.preventDefault()
    if (!draftName.trim()) return
    const newPlayer: PlayerSlot = {
      id: crypto.randomUUID(),
      name: draftName.trim(),
      role: draftRole.trim(),
    }
    const next = [...players, newPlayer]
    updatePlayers(next)
    setPlayers(next)
    setDraftName('')
    setDraftRole('')
  }

  const handleRemove = (id: string) => {
    const next = players.filter((player) => player.id !== id)
    updatePlayers(next)
    setPlayers(next)
  }

  return (
    <div className="screen">
      <ScreenHeader title={t('players.title')} backTo="/" />
      <form className="section-block roster-form" onSubmit={handleAddPlayer}>
        <div className="form-field">
          <label htmlFor="player-name">Имя</label>
          <input
            id="player-name"
            placeholder="Мария"
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
          />
        </div>
        <div className="form-field">
          <label htmlFor="player-role">Роль</label>
          <input
            id="player-role"
            placeholder="Выживший"
            value={draftRole}
            onChange={(event) => setDraftRole(event.target.value)}
          />
        </div>
        <button type="submit" className="menu-button">
          {t('players.add')}
        </button>
      </form>

      <section className="section-block roster-list">
        {players.map((player) => (
          <div key={player.id} className="roster-card">
            <div>
              <h3>{player.name}</h3>
              {player.role && <p>{player.role}</p>}
            </div>
            <button type="button" className="ghost-button" onClick={() => handleRemove(player.id)}>
              ✕
            </button>
          </div>
        ))}
        {players.length === 0 && (
          <div className="empty-state">
            <p>Добавьте игроков, чтобы пульт подсвечивал нужные роли.</p>
          </div>
        )}
      </section>

      <div className="floating-actions">
        <a className="menu-button" href="#/console">
          {t('players.start')}
        </a>
      </div>
    </div>
  )
}
