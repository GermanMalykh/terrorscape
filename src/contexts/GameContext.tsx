/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { killerProfiles, packDefinitions, survivorProfiles } from '../data/packs'
import type { KillerProfile, PackDefinition, SurvivorProfile } from '../types'
import { readStorageJson, removeStorageItem, writeStorageJson } from '../utils/storage.ts'

export interface PlayerSlot {
  id: string
  name: string
  role: string
  assignedFromId?: string
}

export interface GameConfig {
  activePackIds: string[]
  selectedKillerId?: string
  selectedSurvivorIds: string[]
  players: PlayerSlot[]
}

export interface GameStatisticEntry {
  id: string
  startedAt: number
  endedAt?: number
  killerId?: string
  survivorIds: string[]
  outcome?: 'killer' | 'survivors'
  players: PlayerSlot[]
  winnerIds?: string[]
}

interface GameState {
  startedAt?: number
  currentStatisticId?: string
  isTimerRunning?: boolean
  endedAt?: number
}

interface GameContextValue {
  config: GameConfig
  state: GameState
  statistics: GameStatisticEntry[]
  activePacks: PackDefinition[]
  selectedKiller?: KillerProfile
  selectedSurvivors: SurvivorProfile[]
  togglePack: (packId: string) => void
  selectKiller: (killerId?: string) => void
  toggleSurvivor: (survivorId: string) => void
  setPlayers: (players: PlayerSlot[]) => void
  beginGame: (playersSnapshot?: PlayerSlot[]) => void
  finishGame: (result: { outcome: 'killer' | 'survivors'; winnerIds: string[]; endedAt?: number }) => void
  resetStatistics: () => void
  removeStatistic: (statisticId: string) => void
}

const GAME_STORAGE_KEY = 'terrorscape.progress'

interface PersistentGameData {
  config: GameConfig
  state: GameState
  statistics: GameStatisticEntry[]
}

const createDefaultConfig = (): GameConfig => ({
  activePackIds: ['base'],
  selectedKillerId: 'spectre',
  selectedSurvivorIds: [],
  players: [],
})

const GameContext = createContext<GameContextValue | undefined>(undefined)

export function GameProvider({ children }: { children: ReactNode }) {
  const persisted = readStorageJson<PersistentGameData>(GAME_STORAGE_KEY)

  const [config, setConfig] = useState<GameConfig>(() => persisted?.config ?? createDefaultConfig())
  const [state, setState] = useState<GameState>(() => {
    if (!persisted?.state) return {}
    const next: GameState = { ...persisted.state }
    if (next.startedAt) {
      next.isTimerRunning = false
    }
    return next
  })
  const [statistics, setStatistics] = useState<GameStatisticEntry[]>(() =>
    (persisted?.statistics ?? []).map((entry) => ({
      ...entry,
      players: (entry.players ?? []).map((player) => ({ ...player })),
      survivorIds: [...entry.survivorIds],
      winnerIds: entry.winnerIds ? [...entry.winnerIds] : [],
    })),
  )

  const hasHydratedRef = useRef(false)
  const skipNextPersistRef = useRef(false)

  useEffect(() => {
    if (!hasHydratedRef.current) {
      hasHydratedRef.current = true
      return
    }
    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false
      return
    }
    const payload: PersistentGameData = {
      config,
      state,
      statistics,
    }
    writeStorageJson(GAME_STORAGE_KEY, payload)
  }, [config, state, statistics])

  const appendStatistic = useCallback((entry: GameStatisticEntry) => {
    setStatistics((prev) => [entry, ...prev])
  }, [])

  const finishGame = useCallback(
    ({ outcome, winnerIds, endedAt }: { outcome: 'killer' | 'survivors'; winnerIds: string[]; endedAt?: number }) => {
      const currentId = state.currentStatisticId
      const timestamp = endedAt ?? Date.now()

      setState((prev) => ({
        ...prev,
        endedAt: timestamp,
        isTimerRunning: false,
      }))

      if (!currentId) {
        return
      }

      setStatistics((prev) =>
        prev.map((entry) => {
          if (entry.id !== currentId) {
            return entry
          }

          // Если у игрока есть assignedFromId, и источник победил, то и цель тоже побеждает
          const expandedWinnerIds = new Set(winnerIds)
          entry.players.forEach((player) => {
            if (player.assignedFromId && expandedWinnerIds.has(player.assignedFromId)) {
              expandedWinnerIds.add(player.id)
            }
          })

          return {
            ...entry,
            endedAt: timestamp,
            outcome,
            winnerIds: Array.from(expandedWinnerIds),
          }
        }),
      )
    },
    [state.currentStatisticId],
  )

  const value = useMemo<GameContextValue>(() => {
    const activePacks = packDefinitions.filter((pack) => config.activePackIds.includes(pack.id))
    const selectedKiller = killerProfiles.find((killer) => killer.id === config.selectedKillerId)
    const selectedSurvivors = survivorProfiles.filter((survivor) =>
      config.selectedSurvivorIds.includes(survivor.id),
    )

    return {
      config,
      state,
      statistics,
      activePacks,
      selectedKiller,
      selectedSurvivors,
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

          const allowedSurvivors = new Set(
            activePackIds.flatMap((id) => packDefinitions.find((pack) => pack.id === id)?.includes.survivors ?? []),
          )

          const selectedKillerId = allowedKillers.includes(prev.selectedKillerId ?? '')
            ? prev.selectedKillerId
            : allowedKillers[0]

          const selectedSurvivorIds = prev.selectedSurvivorIds.filter((survivorId) =>
            allowedSurvivors.has(survivorId),
          )

          return { ...prev, activePackIds, selectedKillerId, selectedSurvivorIds }
        })
      },
      selectKiller: (killerId) => {
        setConfig((prev) => ({ ...prev, selectedKillerId: killerId }))
      },
      toggleSurvivor: (survivorId) => {
        setConfig((prev) => {
          const isSelected = prev.selectedSurvivorIds.includes(survivorId)
          const selectedSurvivorIds = isSelected
            ? prev.selectedSurvivorIds.filter((id) => id !== survivorId)
            : [...prev.selectedSurvivorIds, survivorId]
          return { ...prev, selectedSurvivorIds }
        })
      },
      setPlayers: (players) => {
        setConfig((prev) => ({ ...prev, players }))
      },
      beginGame: (playersSnapshot) => {
        const startedAt = Date.now()
        const players = (playersSnapshot ?? config.players).map((player) => ({ ...player }))
        setConfig((prev) => ({ ...prev, players }))
        const statisticEntry: GameStatisticEntry = {
          id: `${startedAt}-${Math.random().toString(16).slice(2)}`,
          startedAt,
          killerId: config.selectedKillerId,
          survivorIds: [...config.selectedSurvivorIds],
          players: players.map((player) => ({ ...player })),
        }
        setState((prev) => ({
          ...prev,
          startedAt,
          currentStatisticId: statisticEntry.id,
          isTimerRunning: true,
          endedAt: undefined,
        }))
        appendStatistic(statisticEntry)
      },
      finishGame,
      resetStatistics: () => {
        skipNextPersistRef.current = true
        removeStorageItem(GAME_STORAGE_KEY)
        setConfig(createDefaultConfig())
        setState({})
        setStatistics([])
      },
      removeStatistic: (statisticId) => {
        setStatistics((prev) => prev.filter((entry) => entry.id !== statisticId))
      },
    }
  }, [appendStatistic, config, finishGame, state, statistics])

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame(): GameContextValue {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame must be used within GameProvider')
  }
  return context
}
