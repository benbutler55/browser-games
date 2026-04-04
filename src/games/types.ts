import type { ComponentType } from 'react'

export type GameDefinition = {
  slug: string
  name: string
  genre: string
  status: 'Planned' | 'Framework Ready' | 'Playable'
  description: string
  tags: string[]
  highlights: string[]
  controls: string
  initialMode: string
  expansionPath: string
  preview: ComponentType
  playable?: ComponentType
}
