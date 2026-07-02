import type { GridBreakpoint } from '@/shared/types/code-generator'

export interface GridConfig {
  columns: number
  rows: number
  gap: number
}

export interface GridItem {
  id: string
  colStart: number
  colSpan: number
  rowStart: number
  rowSpan: number
}

export interface GridState {
  config: GridConfig
  items: GridItem[]
}

export type ResponsiveGridLayouts = Partial<Record<GridBreakpoint, GridState>>

export interface ResponsiveGridState {
  layouts: ResponsiveGridLayouts
}

export interface GridPreset {
  id: string
  name: string
  description: string
  state: GridState
}
