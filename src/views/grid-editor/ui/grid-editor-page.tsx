'use client'

import {
  clampGridItem,
  createDefaultGridState,
  findGridPreset,
  generateGridItemId,
  isValidGridItem,
  itemsOverlap,
  type GridItem,
  type ResponsiveGridLayouts,
  type GridState,
} from '@/entities/grid'
import {
  generateAntDesignCode,
  generateMaterialUICode,
  generateMantineCode,
  generateRawCSSCode,
  generateTailwindCode,
} from '@/features/code-generator'
import type { GridEditorMode } from '@/features/grid-editor-mode'
import {
  getTechnologyBreakpoints,
  type CodeFormat,
  type GridBreakpoint,
  type GridBreakpointDefinition,
} from '@/shared/types/code-generator'
import { DEFAULT_TECHNOLOGY, type Technology } from '@/shared/types/routing'
import { useMediaQuery } from '@/shared/lib'
import { AppFooter } from '@/widgets/app-footer'
import { CodeGeneratorPanel } from './code-generator-panel'
import { GridEditorHeader } from './grid-editor-header'
import { GridEditorWorkspace } from './grid-editor-workspace'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type CodeGeneratorType = Technology

interface GridEditorPageProps {
  technology?: Technology
}

const STORAGE_KEY = 'grid-editor-state'
const RESPONSIVE_LAYOUT_VERSION = 18
const BREAKPOINT_COLUMN_TARGETS: Record<GridBreakpoint, number> = {
  xs: 1,
  sm: 2,
  md: 4,
  lg: 6,
  xl: 8,
  '2xl': 12,
}

interface PersistedState {
  gridState?: GridState
  responsiveLayouts?: ResponsiveGridLayouts
  activeBreakpoint?: GridBreakpoint
  editorMode?: GridEditorMode
  responsiveLayoutVersion?: number
  codeFormat: CodeFormat
  withStyledBorders: boolean
  withTailwind: boolean
}

function cloneGridState(gridState: GridState): GridState {
  return {
    config: { ...gridState.config },
    items: gridState.items.map((item) => ({ ...item })),
  }
}

function createResponsiveLayouts(
  gridState: GridState,
  breakpoints: ReturnType<typeof getTechnologyBreakpoints>
): ResponsiveGridLayouts {
  return Object.fromEntries(
    breakpoints.map((breakpoint, index) => [
      breakpoint.id,
      createResponsiveLayoutForBreakpoint(
        gridState,
        breakpoint,
        index,
        breakpoints.length
      ),
    ])
  )
}

function createResponsiveLayoutForBreakpoint(
  gridState: GridState,
  breakpoint: GridBreakpointDefinition,
  breakpointIndex: number,
  breakpointCount: number
): GridState {
  if (breakpointCount <= 1 || breakpointIndex === breakpointCount - 1) {
    return cloneGridState(gridState)
  }

  const sourceColumns = getSafeColumnCount(gridState)
  const columns = getResponsiveColumnCount(gridState, breakpoint.id)

  if (columns === sourceColumns) {
    return cloneGridState(gridState)
  }

  if (columns > sourceColumns) {
    return expandGridState(gridState, columns)
  }

  if (columns >= BREAKPOINT_COLUMN_TARGETS.md && isLaneGridState(gridState)) {
    return compactLaneGridState(gridState, columns)
  }

  if (columns >= BREAKPOINT_COLUMN_TARGETS.md && isShellGridState(gridState)) {
    return compactShellGridState(gridState, columns)
  }

  if (columns >= BREAKPOINT_COLUMN_TARGETS.md && isPricingGridState(gridState)) {
    return compactPricingGridState(gridState, columns)
  }

  if (breakpoint.id === 'md' && isLandingGridState(gridState)) {
    return compactLandingGridState(gridState, columns)
  }

  return compactGridState(gridState, breakpoint.id, columns)
}

function getSafeColumnCount(gridState: GridState): number {
  return Math.max(1, gridState.config.columns)
}

function getResponsiveColumnCount(
  gridState: GridState,
  breakpoint: GridBreakpoint
): number {
  const sourceColumns = getSafeColumnCount(gridState)

  if (breakpoint === '2xl') {
    return Math.min(12, Math.max(sourceColumns, BREAKPOINT_COLUMN_TARGETS['2xl']))
  }

  if (breakpoint === 'xl') {
    return Math.min(12, Math.max(sourceColumns, BREAKPOINT_COLUMN_TARGETS.xl))
  }

  if (breakpoint === 'lg') {
    const laneCount = getEqualLaneCount(gridState)
    if (laneCount >= 3) {
      return Math.min(sourceColumns, laneCount)
    }

    return Math.min(sourceColumns, BREAKPOINT_COLUMN_TARGETS.lg)
  }

  return Math.min(sourceColumns, BREAKPOINT_COLUMN_TARGETS[breakpoint])
}

function compactGridState(
  gridState: GridState,
  breakpoint: GridBreakpoint,
  columns: number
): GridState {
  const sourceColumns = getSafeColumnCount(gridState)
  const sortedItems = [...gridState.items].sort((a, b) => {
    if (a.rowStart !== b.rowStart) return a.rowStart - b.rowStart
    return a.colStart - b.colStart
  })
  const dominantFeature = findDominantFeature(gridState)
  const dominantFeatureSpan =
    dominantFeature && breakpoint === 'lg'
      ? Math.max(
          Math.ceil(columns / 2),
          Math.min(
            columns - 1,
            Math.round((dominantFeature.colSpan / sourceColumns) * columns)
          )
        )
      : null
  const items: GridItem[] = []

  sortedItems.forEach((item) => {
    const layoutHints = getCompactItemLayoutHints({
      breakpoint,
      columns,
      dominantFeature,
      dominantFeatureSpan,
      item,
      sourceColumns,
    })
    const rowSpan = Math.max(1, item.rowSpan)
    const position = findFirstAvailablePosition(
      items,
      columns,
      layoutHints.colSpan,
      rowSpan,
      layoutHints.preferredPosition
    )

    items.push({
      ...item,
      ...position,
      colSpan: layoutHints.colSpan,
      rowSpan,
    })
  })

  const normalizedItems = fillPartiallyEmptyRows(items, columns)

  const maxRowEnd = normalizedItems.reduce(
    (maxRow, item) => Math.max(maxRow, item.rowStart + item.rowSpan - 1),
    1
  )

  return {
    config: {
      columns,
      rows: maxRowEnd,
      gap: gridState.config.gap,
    },
    items: normalizedItems,
  }
}

function isShellGridState(gridState: GridState): boolean {
  const sidebar = getShellSidebar(gridState)

  if (!sidebar) {
    return false
  }

  const contentItems = gridState.items.filter(
    (item) => item.colStart > sidebar.colStart + sidebar.colSpan - 1
  )
  const hasTopbar = contentItems.some(
    (item) => item.rowStart === 1 && item.rowSpan === 1
  )
  const hasMainRegion = contentItems.some(
    (item) => item.rowStart > 1 && item.rowSpan >= 2
  )
  const hasFooter = contentItems.some(
    (item) => item.rowStart + item.rowSpan - 1 >= gridState.config.rows
  )

  return hasTopbar && hasMainRegion && hasFooter
}

function getShellSidebar(gridState: GridState): GridItem | undefined {
  return gridState.items.find((item) => {
    const rowEnd = item.rowStart + item.rowSpan - 1

    return (
      item.colStart === 1 &&
      item.colSpan <= 2 &&
      item.rowStart === 1 &&
      rowEnd >= gridState.config.rows
    )
  })
}

function compactShellGridState(
  gridState: GridState,
  columns: number
): GridState {
  const sidebar = getShellSidebar(gridState)

  if (!sidebar || columns < 4) {
    return compactGridState(gridState, 'md', columns)
  }

  const contentStart = 2
  const contentColumns = columns - 1
  const topbar = gridState.items.find(
    (item) => item.id !== sidebar.id && item.rowStart === 1
  )
  const footer = gridState.items.find((item) => {
    return (
      item.id !== sidebar.id &&
      item.rowStart + item.rowSpan - 1 >= gridState.config.rows
    )
  })
  const middleItems = gridState.items
    .filter((item) => {
      if (item.id === sidebar.id || item.id === topbar?.id || item.id === footer?.id) {
        return false
      }

      return item.rowStart > 1
    })
    .sort((a, b) => a.colStart - b.colStart)
  const main = middleItems[0]
  const inspector = middleItems[1]
  const mainSpan =
    inspector && contentColumns >= 3
      ? Math.max(2, contentColumns - Math.max(1, Math.round(inspector.colSpan / gridState.config.columns * columns)))
      : contentColumns
  const inspectorSpan = inspector ? contentColumns - mainSpan : 0

  const items = gridState.items.map((item) => {
    if (item.id === sidebar.id) {
      return {
        ...item,
        colStart: 1,
        colSpan: 1,
        rowStart: 1,
        rowSpan: gridState.config.rows,
      }
    }

    if (topbar && item.id === topbar.id) {
      return {
        ...item,
        colStart: contentStart,
        colSpan: contentColumns,
        rowStart: 1,
        rowSpan: item.rowSpan,
      }
    }

    if (footer && item.id === footer.id) {
      return {
        ...item,
        colStart: contentStart,
        colSpan: contentColumns,
        rowStart: gridState.config.rows,
        rowSpan: item.rowSpan,
      }
    }

    if (main && item.id === main.id) {
      return {
        ...item,
        colStart: contentStart,
        colSpan: mainSpan,
        rowStart: item.rowStart,
        rowSpan: item.rowSpan,
      }
    }

    if (inspector && item.id === inspector.id) {
      return {
        ...item,
        colStart: contentStart + mainSpan,
        colSpan: Math.max(1, inspectorSpan),
        rowStart: item.rowStart,
        rowSpan: item.rowSpan,
      }
    }

    const scaledColStart = Math.max(
      contentStart,
      Math.min(
        Math.floor(((item.colStart - 1) / gridState.config.columns) * columns) + 1,
        columns
      )
    )

    return {
      ...item,
      colStart: scaledColStart,
      colSpan: Math.max(1, columns - scaledColStart + 1),
    }
  })

  const maxRowEnd = items.reduce(
    (maxRow, item) => Math.max(maxRow, item.rowStart + item.rowSpan - 1),
    1
  )

  return {
    config: {
      ...gridState.config,
      columns,
      rows: maxRowEnd,
    },
    items,
  }
}

interface PricingGridParts {
  header: GridItem
  plans: [GridItem, GridItem, GridItem]
  supplements: GridItem[]
}

function isPricingGridState(gridState: GridState): boolean {
  return Boolean(getPricingGridParts(gridState))
}

function getPricingGridParts(gridState: GridState): PricingGridParts | null {
  const sortedItems = [...gridState.items].sort((a, b) => {
    if (a.rowStart !== b.rowStart) return a.rowStart - b.rowStart
    return a.colStart - b.colStart
  })
  const header = sortedItems.find((item) => {
    return item.rowStart === 1 && item.colStart === 1 && item.colSpan >= gridState.config.columns
  })

  if (!header) {
    return null
  }

  const planRows = Array.from(
    new Set(
      sortedItems
        .filter((item) => item.id !== header.id && item.rowStart > header.rowStart)
        .map((item) => item.rowStart)
    )
  ).sort((a, b) => a - b)

  for (const rowStart of planRows) {
    const rowItems = sortedItems.filter((item) => item.rowStart === rowStart)

    if (rowItems.length !== 3) {
      continue
    }

    const [leftPlan, featuredPlan, rightPlan] = rowItems as [
      GridItem,
      GridItem,
      GridItem,
    ]
    const fillsSourceRow =
      rowItems.reduce((sum, item) => sum + item.colSpan, 0) ===
      gridState.config.columns
    const hasFeaturedCenter =
      featuredPlan.rowSpan > leftPlan.rowSpan &&
      featuredPlan.rowSpan > rightPlan.rowSpan

    if (!fillsSourceRow || !hasFeaturedCenter) {
      continue
    }

    const planIds = new Set(rowItems.map((item) => item.id))
    const supplements = sortedItems.filter(
      (item) => item.id !== header.id && !planIds.has(item.id)
    )

    if (supplements.length < 2) {
      return null
    }

    return {
      header,
      plans: [leftPlan, featuredPlan, rightPlan],
      supplements,
    }
  }

  return null
}

function compactPricingGridState(
  gridState: GridState,
  columns: number
): GridState {
  const pricingParts = getPricingGridParts(gridState)

  if (!pricingParts || columns < 4) {
    return compactGridState(gridState, 'md', columns)
  }

  const [leftPlan, featuredPlan, rightPlan] = pricingParts.plans
  const sideSpan = 1
  const featuredSpan = Math.max(1, columns - sideSpan * 2)
  const leftPlanEnd = leftPlan.colStart + leftPlan.colSpan - 1
  const rightPlanStart = rightPlan.colStart
  const leftSupplement = pricingParts.supplements.find(
    (item) => item.colStart <= leftPlanEnd
  )
  const rightSupplement = [...pricingParts.supplements]
    .reverse()
    .find((item) => item.colStart >= rightPlanStart)
  const usedSupplementIds = new Set(
    [leftSupplement?.id, rightSupplement?.id].filter(Boolean)
  )
  const extraSupplements = pricingParts.supplements.filter(
    (item) => !usedSupplementIds.has(item.id)
  )
  const planRow = 2
  const supplementRow = planRow + Math.max(leftPlan.rowSpan, rightPlan.rowSpan)
  const items: GridItem[] = [
    {
      ...pricingParts.header,
      colStart: 1,
      colSpan: columns,
      rowStart: 1,
      rowSpan: pricingParts.header.rowSpan,
    },
    {
      ...leftPlan,
      colStart: 1,
      colSpan: sideSpan,
      rowStart: planRow,
      rowSpan: leftPlan.rowSpan,
    },
    {
      ...featuredPlan,
      colStart: sideSpan + 1,
      colSpan: featuredSpan,
      rowStart: planRow,
      rowSpan: featuredPlan.rowSpan,
    },
    {
      ...rightPlan,
      colStart: columns,
      colSpan: sideSpan,
      rowStart: planRow,
      rowSpan: rightPlan.rowSpan,
    },
  ]

  if (leftSupplement) {
    items.push({
      ...leftSupplement,
      colStart: 1,
      colSpan: sideSpan,
      rowStart: supplementRow,
      rowSpan: leftSupplement.rowSpan,
    })
  }

  if (rightSupplement) {
    items.push({
      ...rightSupplement,
      colStart: columns,
      colSpan: sideSpan,
      rowStart: supplementRow,
      rowSpan: rightSupplement.rowSpan,
    })
  }

  extraSupplements.forEach((item, index) => {
    items.push({
      ...item,
      colStart: 1,
      colSpan: columns,
      rowStart: supplementRow + index + 1,
      rowSpan: item.rowSpan,
    })
  })

  const maxRowEnd = items.reduce(
    (maxRow, item) => Math.max(maxRow, item.rowStart + item.rowSpan - 1),
    1
  )

  return {
    config: {
      ...gridState.config,
      columns,
      rows: maxRowEnd,
    },
    items,
  }
}

function isLandingGridState(gridState: GridState): boolean {
  const fullWidthItems = gridState.items.filter(
    (item) => item.colSpan >= gridState.config.columns
  )
  const hasHero = fullWidthItems.some(
    (item) => item.rowStart === 1 && item.rowSpan >= 2
  )
  const hasFooter = fullWidthItems.some(
    (item) => item.rowStart + item.rowSpan - 1 >= gridState.config.rows
  )
  const hasFeatureRow = gridState.items.some((item) => {
    const rowItems = gridState.items.filter(
      (candidate) => candidate.rowStart === item.rowStart
    )

    return rowItems.length >= 3
  })

  return hasHero && hasFooter && hasFeatureRow
}

function compactLandingGridState(
  gridState: GridState,
  columns: number
): GridState {
  const sortedItems = [...gridState.items].sort((a, b) => {
    if (a.rowStart !== b.rowStart) return a.rowStart - b.rowStart
    return a.colStart - b.colStart
  })
  const hero = sortedItems.find(
    (item) => item.colSpan >= gridState.config.columns && item.rowStart === 1
  )
  const footer = [...sortedItems]
    .reverse()
    .find((item) => item.colSpan >= gridState.config.columns)
  const featureRow = sortedItems.find((item) => {
    return sortedItems.filter((candidate) => candidate.rowStart === item.rowStart)
      .length >= 3
  })?.rowStart
  let cursorRow = 1
  const items: GridItem[] = []

  sortedItems.forEach((item) => {
    if (item.id === hero?.id) {
      items.push({
        ...item,
        colStart: 1,
        colSpan: columns,
        rowStart: cursorRow,
        rowSpan: item.rowSpan,
      })
      cursorRow += item.rowSpan
      return
    }

    if (item.id === footer?.id) {
      return
    }

    if (featureRow && item.rowStart === featureRow) {
      const featureItems = sortedItems.filter(
        (candidate) => candidate.rowStart === featureRow
      )
      const featureIndex = featureItems.findIndex(
        (candidate) => candidate.id === item.id
      )
      const colSpan =
        featureIndex === featureItems.length - 1
          ? columns - featureIndex
          : Math.max(1, Math.floor(columns / featureItems.length))
      const colStart = featureIndex + 1

      items.push({
        ...item,
        colStart,
        colSpan,
        rowStart: cursorRow,
        rowSpan: item.rowSpan,
      })

      if (featureIndex === featureItems.length - 1) {
        cursorRow += item.rowSpan
      }
      return
    }

    items.push({
      ...item,
      colStart: 1,
      colSpan: columns,
      rowStart: cursorRow,
      rowSpan: item.rowSpan,
    })
    cursorRow += item.rowSpan
  })

  if (footer) {
    items.push({
      ...footer,
      colStart: 1,
      colSpan: columns,
      rowStart: cursorRow,
      rowSpan: footer.rowSpan,
    })
  }

  const maxRowEnd = items.reduce(
    (maxRow, item) => Math.max(maxRow, item.rowStart + item.rowSpan - 1),
    1
  )

  return {
    config: {
      ...gridState.config,
      columns,
      rows: maxRowEnd,
    },
    items,
  }
}

function isLaneGridState(gridState: GridState): boolean {
  return Boolean(getEqualLaneRowItems(gridState))
}

function getEqualLaneRowItems(gridState: GridState): GridItem[] | null {
  const itemsByRow = new Map<number, GridItem[]>()

  gridState.items.forEach((item) => {
    const rowItems = itemsByRow.get(item.rowStart) ?? []
    rowItems.push(item)
    itemsByRow.set(item.rowStart, rowItems)
  })

  for (const rowItems of itemsByRow.values()) {
    if (rowItems.length < 3) continue

    const sortedRowItems = [...rowItems].sort((a, b) => a.colStart - b.colStart)
    const firstSpan = sortedRowItems[0].colSpan
    const firstRowSpan = sortedRowItems[0].rowSpan

    if (firstRowSpan <= 1) continue

    const isEqualLaneRow = sortedRowItems.every(
      (item) => item.colSpan === firstSpan && item.rowSpan === firstRowSpan
    )
    const fillsSourceRow =
      sortedRowItems.reduce((sum, item) => sum + item.colSpan, 0) ===
      gridState.config.columns

    if (isEqualLaneRow && fillsSourceRow) {
      return sortedRowItems
    }
  }

  return null
}

function compactLaneGridState(
  gridState: GridState,
  columns: number
): GridState {
  const laneItems = getEqualLaneRowItems(gridState)

  if (!laneItems) {
    return compactGridState(gridState, 'lg', columns)
  }

  let cursorRow = 1
  const items: GridItem[] = []
  const laneIds = new Set(laneItems.map((item) => item.id))
  const sortedItems = [...gridState.items].sort((a, b) => {
    if (a.rowStart !== b.rowStart) return a.rowStart - b.rowStart
    return a.colStart - b.colStart
  })
  const nonLaneRows = Array.from(
    new Set(sortedItems.filter((item) => !laneIds.has(item.id)).map((item) => item.rowStart))
  ).sort((a, b) => a - b)

  nonLaneRows.forEach((rowStart) => {
    if (rowStart > laneItems[0].rowStart) return

    const rowItems = sortedItems.filter(
      (item) => item.rowStart === rowStart && !laneIds.has(item.id)
    )
    const rowSpan = Math.max(...rowItems.map((item) => item.rowSpan))

    rowItems.forEach((item) => {
      items.push({
        ...item,
        colStart: 1,
        colSpan: columns,
        rowStart: cursorRow,
      })
    })
    cursorRow += rowSpan
  })

  let laneColStart = 1
  laneItems.forEach((item, index) => {
    const remainingColumns = columns - laneColStart + 1
    const remainingItems = laneItems.length - index
    const colSpan =
      index === laneItems.length - 1
        ? remainingColumns
        : Math.max(1, Math.floor(remainingColumns / remainingItems))

    items.push({
      ...item,
      colStart: laneColStart,
      colSpan,
      rowStart: cursorRow,
      rowSpan: item.rowSpan,
    })
    laneColStart += colSpan
  })
  cursorRow += laneItems[0].rowSpan

  nonLaneRows.forEach((rowStart) => {
    if (rowStart <= laneItems[0].rowStart) return

    const rowItems = sortedItems.filter(
      (item) => item.rowStart === rowStart && !laneIds.has(item.id)
    )
    const rowSpan = Math.max(...rowItems.map((item) => item.rowSpan))

    rowItems.forEach((item) => {
      items.push({
        ...item,
        colStart: 1,
        colSpan: columns,
        rowStart: cursorRow,
      })
    })
    cursorRow += rowSpan
  })

  const maxRowEnd = items.reduce(
    (maxRow, item) => Math.max(maxRow, item.rowStart + item.rowSpan - 1),
    1
  )

  return {
    config: {
      ...gridState.config,
      columns,
      rows: maxRowEnd,
    },
    items,
  }
}

function fillPartiallyEmptyRows(items: GridItem[], columns: number): GridItem[] {
  let normalizedItems = items.map((item) => ({ ...item }))
  const maxRowEnd = normalizedItems.reduce(
    (maxRow, item) => Math.max(maxRow, item.rowStart + item.rowSpan - 1),
    1
  )

  for (let row = 1; row <= maxRowEnd; row += 1) {
    const rowItems = normalizedItems
      .filter((item) => row >= item.rowStart && row < item.rowStart + item.rowSpan)
      .sort((a, b) => a.colStart - b.colStart)
    const occupiedColumns = rowItems.reduce(
      (sum, item) => sum + item.colSpan,
      0
    )

    if (rowItems.length === 0 || occupiedColumns >= columns) {
      continue
    }

    if (rowItems.length === 1) {
      const item = rowItems[0]
      const expandedItem = {
        ...item,
        colStart: 1,
        colSpan: columns,
      }

      normalizedItems = replaceItemIfItFits(
        normalizedItems,
        item.id,
        expandedItem
      )
      continue
    }

    if (!rowItems.every((item) => item.rowSpan === 1)) {
      continue
    }

    const lastItem = rowItems[rowItems.length - 1]
    const expandedItem = {
      ...lastItem,
      colSpan: columns - lastItem.colStart + 1,
    }

    normalizedItems = replaceItemIfItFits(
      normalizedItems,
      lastItem.id,
      expandedItem
    )
  }

  return normalizedItems
}

function replaceItemIfItFits(
  items: GridItem[],
  itemId: string,
  replacementItem: GridItem
): GridItem[] {
  const currentItem = items.find((item) => item.id === itemId)

  if (!currentItem) {
    return items
  }

  const nextItems = items.map((item) =>
    item.id === itemId ? replacementItem : item
  )
  const hasCollision = nextItems.some((item, index) =>
    nextItems.slice(index + 1).some((otherItem) => itemsOverlap(item, otherItem))
  )

  return hasCollision ? items : nextItems
}

function getEqualLaneCount(gridState: GridState): number {
  return getEqualLaneRowItems(gridState)?.length ?? 0
}

function findDominantFeature(gridState: GridState): GridItem | null {
  const sourceColumns = getSafeColumnCount(gridState)
  const candidates = gridState.items.filter((item) => {
    return item.colSpan < sourceColumns && item.rowSpan >= 2
  })

  return candidates.reduce<GridItem | null>((currentFeature, item) => {
    const itemArea = item.colSpan * item.rowSpan
    const currentArea = currentFeature
      ? currentFeature.colSpan * currentFeature.rowSpan
      : 0

    return itemArea > currentArea ? item : currentFeature
  }, null)
}

function getCompactItemLayoutHints({
  breakpoint,
  columns,
  dominantFeature,
  dominantFeatureSpan,
  item,
  sourceColumns,
}: {
  breakpoint: GridBreakpoint
  columns: number
  dominantFeature: GridItem | null
  dominantFeatureSpan: number | null
  item: GridItem
  sourceColumns: number
}): {
  colSpan: number
  preferredPosition?: Pick<GridItem, 'colStart' | 'rowStart'>
} {
  const widthRatio = item.colSpan / sourceColumns
  const isFullWidthSourceItem = item.colSpan >= sourceColumns
  const isRightOfDominantFeature = Boolean(
    dominantFeature &&
      item.colStart > dominantFeature.colStart + dominantFeature.colSpan - 1
  )

  if (breakpoint === 'xs') {
    return { colSpan: columns }
  }

  if (breakpoint === 'sm') {
    const colSpan =
      isFullWidthSourceItem || item.rowSpan > 1 || widthRatio >= 0.5
        ? columns
        : 1
    return { colSpan }
  }

  if (breakpoint === 'md') {
    if (dominantFeature && item.id === dominantFeature.id) {
      return {
        colSpan: Math.max(
          Math.ceil(columns / 2),
          Math.min(columns - 1, Math.round(widthRatio * columns))
        ),
        preferredPosition: {
          colStart: 1,
          rowStart: Math.max(1, item.rowStart),
        },
      }
    }

    if (isRightOfDominantFeature && dominantFeature) {
      const scaledColStart = Math.max(
        Math.floor(columns / 2) + 1,
        Math.min(
          Math.round(((item.colStart - 1) / sourceColumns) * columns) + 1,
          columns
        )
      )
      return {
        colSpan: Math.max(
          1,
          Math.min(
            Math.floor(columns / 2),
            Math.round(widthRatio * columns),
            columns - scaledColStart + 1
          )
        ),
        preferredPosition: {
          colStart: scaledColStart,
          rowStart: Math.max(1, item.rowStart),
        },
      }
    }

    const colSpan =
      isFullWidthSourceItem || (item.rowSpan > 1 && widthRatio >= 0.5)
        ? columns
        : Math.max(1, Math.min(columns, Math.round(widthRatio * columns)))
    return { colSpan }
  }

  if (breakpoint === 'lg' && isRightOfDominantFeature && dominantFeatureSpan) {
    return {
      colSpan: columns - dominantFeatureSpan,
      preferredPosition: {
        colStart: dominantFeatureSpan + 1,
        rowStart: Math.max(1, item.rowStart),
      },
    }
  }

  const scaledSpan = Math.round(widthRatio * columns)
  const colSpan = isFullWidthSourceItem
    ? columns
    : Math.max(1, Math.min(columns, scaledSpan))
  const preferredColStart = Math.max(
    1,
    Math.min(
      Math.floor(((item.colStart - 1) / sourceColumns) * columns) + 1,
      columns - colSpan + 1
    )
  )

  return {
    colSpan,
    preferredPosition: {
      colStart: preferredColStart,
      rowStart: Math.max(1, item.rowStart),
    },
  }
}

function expandGridState(gridState: GridState, columns: number): GridState {
  const sourceColumns = getSafeColumnCount(gridState)
  const scale = columns / sourceColumns
  const items = gridState.items.map((item) => {
    const sourceEndLine = item.colStart + item.colSpan
    const colStart = Math.round((item.colStart - 1) * scale) + 1
    const colEnd = Math.max(
      colStart,
      Math.round((sourceEndLine - 1) * scale)
    )

    return {
      ...item,
      colStart,
      colSpan: Math.min(columns - colStart + 1, colEnd - colStart + 1),
    }
  })

  return {
    config: {
      ...gridState.config,
      columns,
    },
    items,
  }
}

function findFirstAvailablePosition(
  items: GridItem[],
  columns: number,
  colSpan: number,
  rowSpan: number,
  preferredPosition?: Pick<GridItem, 'colStart' | 'rowStart'>
): Pick<GridItem, 'colStart' | 'rowStart'> {
  const canPlaceAt = (colStart: number, rowStart: number) => {
    const proposedItem: GridItem = {
      id: '__candidate__',
      colStart,
      colSpan,
      rowStart,
      rowSpan,
    }

    return (
      colStart >= 1 &&
      rowStart >= 1 &&
      colStart + colSpan - 1 <= columns &&
      !items.some((item) => itemsOverlap(proposedItem, item))
    )
  }

  if (
    preferredPosition &&
    canPlaceAt(preferredPosition.colStart, preferredPosition.rowStart)
  ) {
    return preferredPosition
  }

  if (preferredPosition) {
    for (let rowStart = preferredPosition.rowStart; rowStart < 100; rowStart += 1) {
      if (canPlaceAt(preferredPosition.colStart, rowStart)) {
        return { colStart: preferredPosition.colStart, rowStart }
      }
    }
  }

  for (let rowStart = 1; rowStart < 100; rowStart += 1) {
    for (let colStart = 1; colStart <= columns - colSpan + 1; colStart += 1) {
      if (canPlaceAt(colStart, rowStart)) {
        return { colStart, rowStart }
      }
    }
  }

  return { colStart: 1, rowStart: 1 }
}

function addItemToLayout(layout: GridState, item: GridItem): GridState {
  const columns = Math.max(1, layout.config.columns)
  const colSpan = Math.max(1, Math.min(item.colSpan, columns))
  const rowSpan = Math.max(1, item.rowSpan)
  const preferredColStart = Math.max(
    1,
    Math.min(item.colStart, columns - colSpan + 1)
  )
  const position = findFirstAvailablePosition(
    layout.items,
    columns,
    colSpan,
    rowSpan,
    {
      colStart: preferredColStart,
      rowStart: Math.max(1, item.rowStart),
    }
  )
  const nextItem: GridItem = {
    ...item,
    ...position,
    colSpan,
    rowSpan,
  }
  const rows = Math.max(
    layout.config.rows,
    nextItem.rowStart + nextItem.rowSpan - 1
  )

  return {
    config: {
      ...layout.config,
      columns,
      rows,
    },
    items: [...layout.items, nextItem],
  }
}

function isGridState(value: unknown): value is GridState {
  if (!value || typeof value !== 'object') return false

  const state = value as GridState
  return (
    Boolean(state.config) &&
    typeof state.config.columns === 'number' &&
    typeof state.config.rows === 'number' &&
    typeof state.config.gap === 'number' &&
    Array.isArray(state.items)
  )
}

function getFirstAvailableLayout(
  layouts: ResponsiveGridLayouts
): GridState | undefined {
  return Object.values(layouts).find(isGridState)
}

function getLargestAvailableLayout(
  layouts: ResponsiveGridLayouts,
  breakpoints: ReturnType<typeof getTechnologyBreakpoints>
): GridState | undefined {
  for (let index = breakpoints.length - 1; index >= 0; index -= 1) {
    const layout = layouts[breakpoints[index].id]
    if (isGridState(layout)) return layout
  }

  return getFirstAvailableLayout(layouts)
}

function getDefaultResponsiveBreakpoint(
  breakpoints: ReturnType<typeof getTechnologyBreakpoints>
): GridBreakpoint {
  return (
    breakpoints.find((breakpoint) => breakpoint.id === 'md') ??
    breakpoints[0]
  ).id
}

function getDesktopBreakpoint(
  breakpoints: ReturnType<typeof getTechnologyBreakpoints>
): GridBreakpoint {
  return breakpoints[breakpoints.length - 1].id
}

function loadPersistedState(): Partial<PersistedState> | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error('Failed to load persisted state:', e)
  }
  return null
}

function savePersistedState(state: PersistedState) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    console.error('Failed to save persisted state:', e)
  }
}

function GridEditorPage({ technology: initialTechnology }: GridEditorPageProps) {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const locale = (params?.locale as string) || 'en'
  const urlTechnology = (params?.technology as Technology) || DEFAULT_TECHNOLOGY
  const initialBreakpoints = getTechnologyBreakpoints(
    initialTechnology || urlTechnology || DEFAULT_TECHNOLOGY
  )
  const initialBreakpoint = getDesktopBreakpoint(initialBreakpoints)
  
  // Initialize with defaults for SSR (will be updated from localStorage on client)
  const [responsiveLayouts, setResponsiveLayouts] =
    useState<ResponsiveGridLayouts>({
      [initialBreakpoint]: createDefaultGridState(),
    })
  const [activeBreakpoint, setActiveBreakpoint] =
    useState<GridBreakpoint>(initialBreakpoint)
  const [editorMode, setEditorMode] = useState<GridEditorMode>('simple')
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [codeGeneratorType, setCodeGeneratorType] = useState<CodeGeneratorType>(
    initialTechnology || urlTechnology || DEFAULT_TECHNOLOGY
  )
  const [codeFormat, setCodeFormat] = useState<CodeFormat>('jsx')
  const [withStyledBorders, setWithStyledBorders] = useState(true)
  const [withTailwind, setWithTailwind] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [isCodeLoading, setIsCodeLoading] = useState(false)
  const isFirstCodeRender = useRef(true)
  const codeLoadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const appliedLaunchKeyRef = useRef<string | null>(null)
  const initialBreakpointRef = useRef(initialBreakpoint)
  const initialBreakpointsRef = useRef(initialBreakpoints)
  const initialTechnologyRef = useRef(
    initialTechnology || urlTechnology || DEFAULT_TECHNOLOGY
  )
  const initialPresetParamRef = useRef(searchParams.get('preset'))
  const initialNewGridParamRef = useRef(searchParams.get('new') === '1')
  const isTabletOrDesktop = useMediaQuery('(min-width: 768px)')
  const breakpoints = useMemo(
    () => getTechnologyBreakpoints(codeGeneratorType),
    [codeGeneratorType]
  )
  const activeGridState = useMemo(
    () => responsiveLayouts[activeBreakpoint] ?? createDefaultGridState(),
    [responsiveLayouts, activeBreakpoint]
  )
  
  // Load persisted state only on client after mount (prevents hydration mismatch)
  useEffect(() => {
    const persistedState = loadPersistedState()
    const hasLaunchGridParam =
      Boolean(initialPresetParamRef.current) || initialNewGridParamRef.current

    if (persistedState) {
      if (!hasLaunchGridParam) {
        if (persistedState.responsiveLayouts) {
          const fallbackLayout =
            getFirstAvailableLayout(persistedState.responsiveLayouts)
          const largestLayout = getLargestAvailableLayout(
            persistedState.responsiveLayouts,
            initialBreakpointsRef.current
          )
          const shouldRegenerateResponsiveLayouts =
            persistedState.editorMode === 'responsive' &&
            persistedState.responsiveLayoutVersion !==
              RESPONSIVE_LAYOUT_VERSION &&
            Boolean(largestLayout)

          setResponsiveLayouts(
            shouldRegenerateResponsiveLayouts && largestLayout
              ? createResponsiveLayouts(
                  largestLayout,
                  initialBreakpointsRef.current
                )
              : persistedState.responsiveLayouts[initialBreakpointRef.current]
              ? persistedState.responsiveLayouts
              : {
                  ...persistedState.responsiveLayouts,
                  ...(fallbackLayout
                    ? {
                        [initialBreakpointRef.current]:
                          cloneGridState(fallbackLayout),
                      }
                    : {}),
                }
          )
        } else if (isGridState(persistedState.gridState)) {
          setResponsiveLayouts({
            [initialBreakpointRef.current]: persistedState.gridState,
          })
        }
        if (persistedState.activeBreakpoint) {
          const isSupported = initialBreakpointsRef.current.some(
            (breakpoint) => breakpoint.id === persistedState.activeBreakpoint
          )
          if (persistedState.editorMode === 'simple') {
            setActiveBreakpoint(getDesktopBreakpoint(initialBreakpointsRef.current))
          } else if (isSupported) {
            setActiveBreakpoint(persistedState.activeBreakpoint)
          }
        }
        if (persistedState.editorMode) {
          setEditorMode(persistedState.editorMode)
        }
      }
      if (persistedState.codeFormat) {
        setCodeFormat(persistedState.codeFormat)
      }
      if (persistedState.withStyledBorders !== undefined) {
        setWithStyledBorders(persistedState.withStyledBorders)
      }
      if (persistedState.withTailwind !== undefined) {
        setWithTailwind(persistedState.withTailwind)
      }
    }
    setIsHydrated(true)
  }, [])
  
  // Persist state whenever it changes (only after hydration to avoid saving defaults)
  useEffect(() => {
    if (isHydrated) {
      savePersistedState({
        responsiveLayouts,
        activeBreakpoint,
        editorMode,
        responsiveLayoutVersion: RESPONSIVE_LAYOUT_VERSION,
        codeFormat,
        withStyledBorders,
        withTailwind,
      })
    }
  }, [
    responsiveLayouts,
    activeBreakpoint,
    editorMode,
    codeFormat,
    withStyledBorders,
    withTailwind,
    isHydrated,
  ])
  
  useEffect(() => {
    if (urlTechnology && urlTechnology !== codeGeneratorType) {
      setCodeGeneratorType(urlTechnology)
    }
  }, [urlTechnology, codeGeneratorType])

  useEffect(() => {
    const presetParam = searchParams.get('preset')
    const isNewGrid = searchParams.get('new') === '1'

    if (!presetParam && !isNewGrid) {
      return
    }

    const launchKey = presetParam ?? 'new'

    if (appliedLaunchKeyRef.current === launchKey) {
      return
    }

    const sourceState = presetParam
      ? findGridPreset(presetParam)?.state ?? createDefaultGridState()
      : createDefaultGridState()
    const nextBreakpoints = getTechnologyBreakpoints(initialTechnologyRef.current)
    const nextActiveBreakpoint = getDesktopBreakpoint(nextBreakpoints)

    setEditorMode('simple')
    setSelectedItemId(null)
    setActiveBreakpoint(nextActiveBreakpoint)
    setResponsiveLayouts({ [nextActiveBreakpoint]: cloneGridState(sourceState) })

    appliedLaunchKeyRef.current = launchKey
  }, [searchParams])

  useEffect(() => {
    if (!breakpoints.some((breakpoint) => breakpoint.id === activeBreakpoint)) {
      setActiveBreakpoint(
        editorMode === 'responsive'
          ? getDefaultResponsiveBreakpoint(breakpoints)
          : getDesktopBreakpoint(breakpoints)
      )
    }

    if (editorMode !== 'responsive') {
      return
    }

    setResponsiveLayouts((currentLayouts) => {
      const sourceLayout =
        currentLayouts[activeBreakpoint] ??
        currentLayouts[breakpoints[0].id] ??
        getFirstAvailableLayout(currentLayouts) ??
        createDefaultGridState()
      const generatedLayouts = createResponsiveLayouts(sourceLayout, breakpoints)
      let hasChanges = false
      const nextLayouts = { ...currentLayouts }

      breakpoints.forEach((breakpoint) => {
        if (!nextLayouts[breakpoint.id]) {
          nextLayouts[breakpoint.id] = generatedLayouts[breakpoint.id]
          hasChanges = true
        }
      })

      return hasChanges ? nextLayouts : currentLayouts
    })
  }, [activeBreakpoint, breakpoints, editorMode])

  const hasVerticalItems = useMemo(() => {
    if (editorMode === 'simple') {
      return activeGridState.items.some((item) => item.rowSpan > 1)
    }

    return breakpoints.some((breakpoint) =>
      responsiveLayouts[breakpoint.id]?.items.some((item) => item.rowSpan > 1)
    )
  }, [activeGridState.items, breakpoints, editorMode, responsiveLayouts])

  const handleTechnologyChange = useCallback((tech: Technology) => {
    setCodeGeneratorType(tech)
    const nextBreakpoints = getTechnologyBreakpoints(tech)
    const nextActiveBreakpoint =
      editorMode === 'responsive'
        ? nextBreakpoints.some((breakpoint) => breakpoint.id === activeBreakpoint)
          ? activeBreakpoint
          : getDefaultResponsiveBreakpoint(nextBreakpoints)
        : getDesktopBreakpoint(nextBreakpoints)

    setResponsiveLayouts((currentLayouts) => {
        const sourceLayout =
          currentLayouts[activeBreakpoint] ??
          currentLayouts[breakpoints[0].id] ??
          getFirstAvailableLayout(currentLayouts) ??
          activeGridState

      if (editorMode === 'responsive') {
        return createResponsiveLayouts(sourceLayout, nextBreakpoints)
      }

      return {
        [nextActiveBreakpoint]: cloneGridState(sourceLayout),
      }
    })
    setActiveBreakpoint(nextActiveBreakpoint)
    const queryString = searchParams.toString()
    router.push(`/${locale}/${tech}${queryString ? `?${queryString}` : ''}`, {
      scroll: false,
    })
  }, [
    activeBreakpoint,
    activeGridState,
    breakpoints,
    editorMode,
    locale,
    router,
    searchParams,
  ])

  const handleEditorModeChange = useCallback(
    (mode: GridEditorMode) => {
      setEditorMode(mode)
      setSelectedItemId(null)

      if (mode === 'simple') {
        setActiveBreakpoint(getDesktopBreakpoint(breakpoints))
        return
      }

      setResponsiveLayouts((currentLayouts) => {
        const sourceLayout =
          currentLayouts[activeBreakpoint] ??
          currentLayouts[breakpoints[0].id] ??
          getFirstAvailableLayout(currentLayouts) ??
          createDefaultGridState()

        return createResponsiveLayouts(sourceLayout, breakpoints)
      })
      setActiveBreakpoint(getDefaultResponsiveBreakpoint(breakpoints))
    },
    [activeBreakpoint, breakpoints]
  )

  const handleBreakpointChange = useCallback((breakpoint: GridBreakpoint) => {
    setActiveBreakpoint(breakpoint)
    setSelectedItemId(null)
  }, [])

  const generatedCode = useMemo(() => {
    const responsiveOptions =
      editorMode === 'responsive'
        ? { responsiveLayouts, breakpoints }
        : undefined

    switch (codeGeneratorType) {
      case 'material-ui':
        return generateMaterialUICode(activeGridState, {
          withStyledBorders,
          ...responsiveOptions,
        })
      case 'ant-design':
        return generateAntDesignCode(activeGridState, {
          withStyledBorders,
          ...responsiveOptions,
        })
      case 'mantine':
        return generateMantineCode(activeGridState, {
          withStyledBorders,
          withTailwind,
          ...responsiveOptions,
        })
      case 'raw-css':
        return generateRawCSSCode(activeGridState, codeFormat, {
          withStyledBorders,
          ...responsiveOptions,
        })
      case 'tailwind':
        return generateTailwindCode(activeGridState, codeFormat, {
          withStyledBorders,
          ...responsiveOptions,
        })
      default:
        return generateMaterialUICode(activeGridState, {
          withStyledBorders,
          ...responsiveOptions,
        })
    }
  }, [
    activeGridState,
    breakpoints,
    codeGeneratorType,
    codeFormat,
    editorMode,
    responsiveLayouts,
    withStyledBorders,
    withTailwind,
  ])

  // Brief loading state when generated code inputs change (skip first render)
  useEffect(() => {
    if (isFirstCodeRender.current) {
      isFirstCodeRender.current = false
      return
    }
    if (codeLoadingTimeoutRef.current) {
      clearTimeout(codeLoadingTimeoutRef.current)
    }
    setIsCodeLoading(true)
    codeLoadingTimeoutRef.current = setTimeout(() => {
      setIsCodeLoading(false)
      codeLoadingTimeoutRef.current = null
    }, 220)
    return () => {
      if (codeLoadingTimeoutRef.current) {
        clearTimeout(codeLoadingTimeoutRef.current)
      }
    }
  }, [generatedCode])

  const updateActiveLayout = useCallback(
    (update: (gridState: GridState) => GridState) => {
      setResponsiveLayouts((currentLayouts) => {
        const currentLayout =
          currentLayouts[activeBreakpoint] ?? createDefaultGridState()

        return {
          ...currentLayouts,
          [activeBreakpoint]: update(currentLayout),
        }
      })
    },
    [activeBreakpoint]
  )

  const handleConfigChange = useCallback(
    (config: GridState['config']) => {
      updateActiveLayout((gridState) => {
        const validItems = gridState.items
          .map((item) => {
            const clamped = clampGridItem(item, config)
            return isValidGridItem(clamped, config) ? clamped : null
          })
          .filter((item): item is GridItem => item !== null)

        return {
          config,
          items: validItems,
        }
      })
    },
    [updateActiveLayout]
  )

  const handleItemClick = useCallback((itemId: string) => {
    setSelectedItemId((currentItemId) =>
      itemId === currentItemId ? null : itemId
    )
  }, [])

  const handleEmptyCellClick = useCallback((col: number, row: number) => {
    const colSpan = isTabletOrDesktop ? 1 : 2
    const rowSpan = isTabletOrDesktop ? 1 : 2
    const activeConfig = activeGridState.config
    const colStart = Math.max(1, Math.min(col, activeConfig.columns - colSpan + 1))
    const rowStart = Math.max(1, Math.min(row, activeConfig.rows - rowSpan + 1))
    const newItem: GridItem = {
      id: generateGridItemId(),
      colStart,
      colSpan,
      rowStart,
      rowSpan,
    }
    setResponsiveLayouts((currentLayouts) => {
      const nextLayouts = { ...currentLayouts }

      const layout = nextLayouts[activeBreakpoint] ?? createDefaultGridState()

      if (editorMode === 'responsive') {
        return {
          ...nextLayouts,
          [activeBreakpoint]: addItemToLayout(layout, newItem),
        }
      }

      return {
        ...nextLayouts,
        [activeBreakpoint]: {
          ...layout,
          items: [...layout.items, newItem],
        },
      }
    })
    setSelectedItemId(newItem.id)
  }, [
    activeBreakpoint,
    activeGridState.config,
    editorMode,
    isTabletOrDesktop,
  ])

  const handleItemChange = useCallback(
    (itemId: string, updatedItem: GridItem) => {
      updateActiveLayout((gridState) => ({
        ...gridState,
        items: gridState.items.map((item) =>
          item.id === itemId ? updatedItem : item
        ),
      }))
    },
    [updateActiveLayout]
  )

  const handleDeleteItem = useCallback(() => {
    if (!selectedItemId) return

    setResponsiveLayouts((currentLayouts) => {
      const nextLayouts = { ...currentLayouts }

      if (editorMode === 'simple') {
        const layout = nextLayouts[activeBreakpoint]
        if (!layout) return currentLayouts

        return {
          ...nextLayouts,
          [activeBreakpoint]: {
            ...layout,
            items: layout.items.filter((item) => item.id !== selectedItemId),
          },
        }
      }

      const layout = nextLayouts[activeBreakpoint]
      if (!layout) return currentLayouts

      return {
        ...nextLayouts,
        [activeBreakpoint]: {
          ...layout,
          items: layout.items.filter((item) => item.id !== selectedItemId),
        },
      }
    })
    setSelectedItemId(null)
  }, [activeBreakpoint, editorMode, selectedItemId])

  const handleResetGrid = useCallback(() => {
    setResponsiveLayouts((currentLayouts) => {
      const nextLayouts = { ...currentLayouts }

      if (editorMode === 'simple') {
        const layout = nextLayouts[activeBreakpoint]
        if (!layout) return currentLayouts

        return {
          ...nextLayouts,
          [activeBreakpoint]: {
            ...layout,
            items: [],
          },
        }
      }

      const layout = nextLayouts[activeBreakpoint]
      if (!layout) return currentLayouts

      return {
        ...nextLayouts,
        [activeBreakpoint]: {
          ...layout,
          items: [],
        },
      }
    })
    setSelectedItemId(null)
  }, [activeBreakpoint, editorMode])

  const codeLanguage =
    codeFormat === 'html' || codeGeneratorType === 'raw-css' ? 'html' : 'tsx'

  return (
    <div className="min-h-screen bg-background">
      <GridEditorHeader />

      <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="flex flex-col gap-8">
          <GridEditorWorkspace
            gridState={activeGridState}
            breakpoints={breakpoints}
            activeBreakpoint={activeBreakpoint}
            editorMode={editorMode}
            selectedItemId={selectedItemId}
            onEditorModeChange={handleEditorModeChange}
            onBreakpointChange={handleBreakpointChange}
            onConfigChange={handleConfigChange}
            onItemClick={handleItemClick}
            onEmptyCellClick={handleEmptyCellClick}
            onItemChange={handleItemChange}
            onReset={handleResetGrid}
            onItemDelete={handleDeleteItem}
          />
          <CodeGeneratorPanel
            selectedTechnology={codeGeneratorType}
            onTechnologyChange={handleTechnologyChange}
            codeFormat={codeFormat}
            onFormatChange={setCodeFormat}
            withStyledBorders={withStyledBorders}
            onStyledBordersChange={setWithStyledBorders}
            withTailwind={withTailwind}
            onTailwindChange={setWithTailwind}
            hasVerticalItems={hasVerticalItems}
            generatedCode={generatedCode}
            isCodeLoading={isCodeLoading}
            codeLanguage={codeLanguage}
          />
        </div>
      </main>
      <AppFooter />
    </div>
  )
}

export { GridEditorPage }
