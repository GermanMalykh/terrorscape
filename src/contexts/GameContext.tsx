/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { killerProfiles, packDefinitions, victimProfiles } from '../data/packs'
import type { KillerProfile, PackDefinition, VictimProfile } from '../types'

export interface PlayerSlot {
  id: string
  name: string
  role: string
}

export interface GameConfig {
  activePackIds: string[]
  selectedKillerId?: string
  selectedVictimIds: string[]
  players: PlayerSlot[]
}

export interface GameStatisticEntry {
  id: string
  startedAt: number
  endedAt?: number
  killerId?: string
  victimIds: string[]
  outcome?: 'killer' | 'victims'
}

interface GameState {
  startedAt?: number
}

interface GameContextValue {
  config: GameConfig
  state: GameState
  statistics: GameStatisticEntry[]
  activePacks: PackDefinition[]
  selectedKiller?: KillerProfile
  selectedVictims: VictimProfile[]
  togglePack: (packId: string) => void
  selectKiller: (killerId?: string) => void
  toggleVictim: (victimId: string) => void
  setPlayers: (players: PlayerSlot[]) => void
  beginGame: () => void
  resetStatistics: () => void
}

const defaultConfig: GameConfig = {
  activePackIds: ['base'],
  selectedKillerId: 'spectre',
  selectedVictimIds: [],
  players: [],
}

const GameContext = createContext<GameContextValue | undefined>(undefined)

export function GameProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<GameConfig>(defaultConfig)
  const [state, setState] = useState<GameState>({})
  const [statistics, setStatistics] = useState<GameStatisticEntry[]>([])

  const value = useMemo<GameContextValue>(() => {
    const activePacks = packDefinitions.filter((pack) => config.activePackIds.includes(pack.id))
    const selectedKiller = killerProfiles.find((killer) => killer.id === config.selectedKillerId)
    const selectedVictims = victimProfiles.filter((victim) => config.selectedVictimIds.includes(victim.id))

    return {
      config,
      state,
      statistics,
      activePacks,
      selectedKiller,
      selectedVictims,
      togglePack: (packId) => {
        if (packId === 'base') {
          return
        }
        setConfig((prev) => {
          const isActive = prev.activePackIds.includes(packId)
          const nextPackIds = isActive
            ? prev.activePackIds.filter((id) => id !== packId)
            : [...prev.activePackIds, packId]

          const activePackIds = nextPackIds.includes('base') ? nextPackIds : ['base', ...nextPackIds]

          const allowedKillers = activePackIds.flatMap(
            (id) => packDefinitions.find((pack) => pack.id === id)?.includes.killers ?? [],
          )

          const allowedVictims = new Set(
            activePackIds.flatMap((id) => packDefinitions.find((pack) => pack.id === id)?.includes.victims ?? []),
          )

          const selectedKillerId = allowedKillers.includes(prev.selectedKillerId ?? '')
            ? prev.selectedKillerId
            : allowedKillers[0]

          const selectedVictimIds = prev.selectedVictimIds.filter((victimId) => allowedVictims.has(victimId))

          return { ...prev, activePackIds, selectedKillerId, selectedVictimIds }
        })
      },
      selectKiller: (killerId) => {
        setConfig((prev) => ({ ...prev, selectedKillerId: killerId }))
      },
      toggleVictim: (victimId) => {
        setConfig((prev) => {
          const isSelected = prev.selectedVictimIds.includes(victimId)
          const selectedVictimIds = isSelected
            ? prev.selectedVictimIds.filter((id) => id !== victimId)
            : [...prev.selectedVictimIds, victimId]
          return { ...prev, selectedVictimIds }
        })
      },
      setPlayers: (players) => {
        setConfig((prev) => ({ ...prev, players }))
      },
      beginGame: () => {
        setState({ startedAt: Date.now() })
      },
      resetStatistics: () => {
        setStatistics([])
      },
    }
  }, [config, state, statistics])

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame(): GameContextValue {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame must be used within GameProvider')
  }
  return context
}
