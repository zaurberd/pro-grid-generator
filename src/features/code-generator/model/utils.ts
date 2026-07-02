import type {
  GridItem,
  GridState,
  ResponsiveGridLayouts,
} from '@/entities/grid'
import type {
  GridBreakpoint,
  GridBreakpointDefinition,
} from '@/shared/types/code-generator'

export interface ResponsiveGeneratorOptions {
  responsiveLayouts?: ResponsiveGridLayouts
  breakpoints?: GridBreakpointDefinition[]
}

export interface ResponsiveLayoutEntry {
  breakpoint: GridBreakpointDefinition
  state: GridState
}

export function sortGridItems(items: GridItem[]): GridItem[] {
  return [...items].sort((a, b) => {
    if (a.rowStart !== b.rowStart) return a.rowStart - b.rowStart
    return a.colStart - b.colStart
  })
}

export function generateTailwindGridClasses(
  item: GridItem,
  withStyledBorders: boolean
): string {
  const classes = [
    `col-span-${item.colSpan}`,
    `row-span-${item.rowSpan}`,
    item.colStart > 1 ? `col-start-${item.colStart}` : '',
    item.rowStart > 1 ? `row-start-${item.rowStart}` : '',
    withStyledBorders ? 'border border-gray-600' : '',
  ].filter(Boolean)
  
  return classes.join(' ')
}

export function generateTailwindGapClass(gap: number): string {
  return gap % 4 === 0 ? `gap-${gap / 4}` : `gap-[${gap}px]`
}

export function generateTailwindGridColsClass(columns: number): string {
  return `grid-cols-${columns}`
}

export function generateTailwindGridRowsClass(rows: number): string {
  return `grid-rows-${rows}`
}

export function generateBorderStyle(withStyledBorders: boolean): string {
  return withStyledBorders ? "border: '1px solid #4a5565'" : ''
}

export function generateBorderCSS(withStyledBorders: boolean): string {
  return withStyledBorders ? 'border: 1px solid #4a5565;' : ''
}

export function hasVerticalItems(items: GridItem[]): boolean {
  return items.some(item => item.rowSpan > 1)
}

export function calculateGridItemEnds(item: GridItem): {
  colEnd: number
  rowEnd: number
} {
  return {
    colEnd: item.colStart + item.colSpan,
    rowEnd: item.rowStart + item.rowSpan,
  }
}

export function getResponsiveLayoutEntries(
  fallbackGridState: GridState,
  options: ResponsiveGeneratorOptions
): ResponsiveLayoutEntry[] {
  if (!options.responsiveLayouts || !options.breakpoints?.length) {
    return [
      {
        breakpoint: { id: 'xs', label: 'XS', minWidth: 0 },
        state: fallbackGridState,
      },
    ]
  }

  return options.breakpoints.map((breakpoint) => ({
    breakpoint,
    state: options.responsiveLayouts?.[breakpoint.id] ?? fallbackGridState,
  }))
}

export function hasResponsiveEntries(entries: ResponsiveLayoutEntry[]): boolean {
  return entries.length > 1
}

export function getResponsiveItemIds(
  entries: ResponsiveLayoutEntry[]
): string[] {
  const ids = new Set<string>()

  entries.forEach(({ state }) => {
    sortGridItems(state.items).forEach((item) => ids.add(item.id))
  })

  return Array.from(ids)
}

export function getItemById(
  state: GridState,
  itemId: string
): GridItem | undefined {
  return state.items.find((item) => item.id === itemId)
}

export function formatResponsiveObject(
  entries: Array<[GridBreakpoint, number | string]>
): string {
  return `{ ${entries
    .map(([breakpoint, value]) => {
      const formattedValue = typeof value === 'number' ? value : `'${value}'`
      const key = /^[A-Za-z_$][\w$]*$/.test(breakpoint)
        ? breakpoint
        : `'${breakpoint}'`
      return `${key}: ${formattedValue}`
    })
    .join(', ')} }`
}

export function getCssBreakpointSelector(breakpoint: GridBreakpoint): string {
  return breakpoint === '2xl' ? '2xl' : breakpoint
}
