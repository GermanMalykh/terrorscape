export type SoundCategory = 'killer' | 'common' | 'special' | 'atmosphere' | 'ui'

export interface SoundAsset {
  id: string
  name: string
  category: SoundCategory
  description?: string
  loop?: boolean
  lengthSeconds?: number
  tags?: string[]
}

export interface KillerProfile {
  id: string
  name: string
  codename: string
  description: string
  signatureSounds: string[]
  dlc?: string
  image?: string
  traits?: string[]
}

export interface VictimProfile {
  id: string
  name: string
  codename: string
  description?: string
  dlc?: string
}

export interface PackDefinition {
  id: string
  name: string
  description: string
  icon?: string
  includes: {
    killers?: string[]
    victims?: string[]
    sounds?: string[]
  }
  tags?: string[]
  dlc?: boolean
}

export interface ScenarioStep {
  id: string
  label: string
  delaySeconds: number
  soundId: string
  repeat?: number
}

export interface ScenarioPreset {
  id: string
  name: string
  description?: string
  steps: ScenarioStep[]
}
