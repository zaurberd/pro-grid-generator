'use client'

import { useMemo, useState, useRef, useCallback, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/shared/lib'
import type { GridState, GridItem } from '@/entities/grid'
import { itemsOverlap, isValidGridItem } from '@/entities/grid'

interface GridCanvasProps {
  gridState: GridState
  containerWidth?: number
  containerHeight?: number
  onItemClick?: (itemId: string) => void
  onEmptyCellClick?: (col: number, row: number) => void
  onItemChange?: (itemId: string, item: GridItem) => void
  selectedItemId?: string | null
  className?: string
}

const DEFAULT_CONTAINER_WIDTH = 800
const DEFAULT_CONTAINER_HEIGHT = 600
const MIN_CELL_SIZE = 28
/** Minimum pointer movement (px) before a click is treated as a drag */
const DRAG_THRESHOLD_PX = 8

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | null

function GridCanvas({
  gridState,
  containerWidth,
  containerHeight,
  onItemClick,
  onEmptyCellClick,
  onItemChange,
  selectedItemId,
  className,
}: GridCanvasProps) {
  const t = useTranslations()
  const { config, items } = gridState
  const containerRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const dragOccurredRef = useRef(false)
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle>(null)
  const [dragStart, setDragStart] = useState<{
    colStart: number
    rowStart: number
    clientX: number
    clientY: number
  } | null>(null)
  const [resizeStart, setResizeStart] = useState<{ item: GridItem } | null>(null)
  const [dimensions, setDimensions] = useState({ width: DEFAULT_CONTAINER_WIDTH, height: DEFAULT_CONTAINER_HEIGHT })
  const [isScrollable, setIsScrollable] = useState(false)

  // Calculate responsive dimensions – enforce MIN_CELL_SIZE on mobile for dense grids
  useEffect(() => {
    if (containerWidth && containerHeight) {
      setDimensions({ width: containerWidth, height: containerHeight })
      setIsScrollable(false)
      return
    }

    const padding = 8
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const parentWidth = rect.width || DEFAULT_CONTAINER_WIDTH
        const parentHeight = rect.height || parentWidth * (DEFAULT_CONTAINER_HEIGHT / DEFAULT_CONTAINER_WIDTH)

        const availW = parentWidth - padding * 2
        const availH = parentHeight - padding * 2
        const cellW = (availW - config.gap * (config.columns - 1)) / config.columns
        const cellH = (availH - config.gap * (config.rows - 1)) / config.rows

        const useMinCell = cellW < MIN_CELL_SIZE || cellH < MIN_CELL_SIZE
        const cellSize = useMinCell ? MIN_CELL_SIZE : Math.min(cellW, cellH)

        const width = padding * 2 + cellSize * config.columns + config.gap * (config.columns - 1)
        const height = padding * 2 + cellSize * config.rows + config.gap * (config.rows - 1)

        if (useMinCell) {
          setDimensions({ width, height })
        } else {
          const maxWidth = Math.min(parentWidth, DEFAULT_CONTAINER_WIDTH)
          const aspectRatio = DEFAULT_CONTAINER_HEIGHT / DEFAULT_CONTAINER_WIDTH
          setDimensions({ width: maxWidth, height: maxWidth * aspectRatio })
        }
        setIsScrollable(useMinCell)
      }
    }

    if (containerRef.current && !containerWidth && !containerHeight) {
      const resizeObserver = new ResizeObserver(() => updateDimensions())
      resizeObserver.observe(containerRef.current)
      updateDimensions()
      return () => resizeObserver.disconnect()
    }
    updateDimensions()
  }, [containerWidth, containerHeight, config.columns, config.rows, config.gap])

  // Compute cell dimensions from dimensions state so item positions stay in sync
  // with the container on all viewports. Using gridRef.getBoundingClientRect() in
  // render would read stale layout (previous frame), causing mismatch on resize.
  const cellDimensions = useMemo(() => {
    const padding = 8
    const availableWidth = dimensions.width - padding * 2
    const availableHeight = dimensions.height - padding * 2
    const cellWidth = (availableWidth - config.gap * (config.columns - 1)) / config.columns
    const cellHeight = (availableHeight - config.gap * (config.rows - 1)) / config.rows
    return { cellWidth, cellHeight, gap: config.gap, padding }
  }, [dimensions.width, dimensions.height, config.columns, config.rows, config.gap])

  const isCellOccupied = useMemo(() => {
    const occupied = new Set<string>()
    items.forEach((item) => {
      for (let row = item.rowStart; row < item.rowStart + item.rowSpan; row++) {
        for (let col = item.colStart; col < item.colStart + item.colSpan; col++) {
          occupied.add(`${col}-${row}`)
        }
      }
    })
    return occupied
  }, [items])

  const wouldCollide = useCallback(
    (proposedItem: GridItem, excludeItemId?: string): boolean => {
      if (!isValidGridItem(proposedItem, config)) {
        return true
      }

      return items.some((item) => {
        if (item.id === excludeItemId) return false
        return itemsOverlap(proposedItem, item)
      })
    },
    [items, config]
  )

  const pixelToGrid = useCallback(
    (x: number, y: number): { col: number; row: number } | null => {
      const gridElement = gridRef.current
      if (!gridElement) return null

      const rect = gridElement.getBoundingClientRect()
      const relativeX = x - rect.left - cellDimensions.padding
      const relativeY = y - rect.top - cellDimensions.padding

      const col = Math.floor(relativeX / (cellDimensions.cellWidth + cellDimensions.gap)) + 1
      const row = Math.floor(relativeY / (cellDimensions.cellHeight + cellDimensions.gap)) + 1

      return {
        col: Math.max(1, Math.min(col, config.columns)),
        row: Math.max(1, Math.min(row, config.rows)),
      }
    },
    [cellDimensions, config.columns, config.rows]
  )

  const itemNumberMap = useMemo(() => {
    const sortedItems = [...items].sort((a, b) => {
      if (a.rowStart !== b.rowStart) return a.rowStart - b.rowStart
      return a.colStart - b.colStart
    })
    const map = new Map<string, number>()
    sortedItems.forEach((item, index) => {
      map.set(item.id, index + 1)
    })
    return map
  }, [items])

  const itemStyles = useMemo(() => {
    return items.map((item) => {
      const left = cellDimensions.padding + (item.colStart - 1) * (cellDimensions.cellWidth + cellDimensions.gap)
      const top = cellDimensions.padding + (item.rowStart - 1) * (cellDimensions.cellHeight + cellDimensions.gap)
      const width = item.colSpan * cellDimensions.cellWidth + (item.colSpan - 1) * cellDimensions.gap
      const height = item.rowSpan * cellDimensions.cellHeight + (item.rowSpan - 1) * cellDimensions.gap

      return {
        item,
        style: {
          position: 'absolute' as const,
          left: `${left}px`,
          top: `${top}px`,
          width: `${width}px`,
          height: `${height}px`,
        },
      }
    })
  }, [items, cellDimensions])

  const handleCellClick = (col: number, row: number) => {
    const cellKey = `${col}-${row}`
    if (!isCellOccupied.has(cellKey)) {
      onEmptyCellClick?.(col, row)
    }
  }

  const handleItemPointerDown = useCallback((item: GridItem, clientX: number, clientY: number) => {
    dragOccurredRef.current = false
    setDraggedItemId(item.id)
    setDragStart({
      colStart: item.colStart,
      rowStart: item.rowStart,
      clientX,
      clientY,
    })
  }, [])

  const handleItemMouseDown = useCallback(
    (e: React.MouseEvent, item: GridItem) => {
      if (e.button !== 0) return // Only handle left mouse button
      e.stopPropagation()
      e.preventDefault()
      handleItemPointerDown(item, e.clientX, e.clientY)
    },
    [handleItemPointerDown]
  )

  const handleItemTouchStart = useCallback(
    (e: React.TouchEvent, item: GridItem) => {
      e.stopPropagation()
      const touch = e.touches[0]
      if (touch) handleItemPointerDown(item, touch.clientX, touch.clientY)
    },
    [handleItemPointerDown]
  )

  const handlePointerMove = useCallback(
    (clientX: number, clientY: number) => {
      if (draggedItemId && dragStart) {
        const dx = clientX - dragStart.clientX
        const dy = clientY - dragStart.clientY
        const distance = Math.sqrt(dx * dx + dy * dy)
        if (distance < DRAG_THRESHOLD_PX) return

        const gridPos = pixelToGrid(clientX, clientY)
        if (!gridPos) return

        const item = items.find((i) => i.id === draggedItemId)
        if (!item) return

        const newColStart = Math.max(1, Math.min(gridPos.col, config.columns - item.colSpan + 1))
        const newRowStart = Math.max(1, Math.min(gridPos.row, config.rows - item.rowSpan + 1))

        const proposedItem: GridItem = {
          ...item,
          colStart: newColStart,
          rowStart: newRowStart,
        }

        if (!wouldCollide(proposedItem, draggedItemId)) {
          if (newColStart !== item.colStart || newRowStart !== item.rowStart) {
            dragOccurredRef.current = true
            onItemChange?.(draggedItemId, proposedItem)
          }
        }
        return
      }

      if (resizeHandle && resizeStart) {
        const gridPos = pixelToGrid(clientX, clientY)
        if (!gridPos) return

        const initialItem = resizeStart.item
        let newColStart = initialItem.colStart
        let newRowStart = initialItem.rowStart
        let newColSpan = initialItem.colSpan
        let newRowSpan = initialItem.rowSpan

        switch (resizeHandle) {
          case 'nw':
            newColStart = Math.max(1, Math.min(gridPos.col, initialItem.colStart + initialItem.colSpan - 1))
            newRowStart = Math.max(1, Math.min(gridPos.row, initialItem.rowStart + initialItem.rowSpan - 1))
            newColSpan = initialItem.colStart + initialItem.colSpan - newColStart
            newRowSpan = initialItem.rowStart + initialItem.rowSpan - newRowStart
            break
          case 'ne':
            newRowStart = Math.max(1, Math.min(gridPos.row, initialItem.rowStart + initialItem.rowSpan - 1))
            newColSpan = Math.max(1, Math.min(gridPos.col - initialItem.colStart + 1, config.columns - initialItem.colStart + 1))
            newRowSpan = initialItem.rowStart + initialItem.rowSpan - newRowStart
            break
          case 'sw':
            newColStart = Math.max(1, Math.min(gridPos.col, initialItem.colStart + initialItem.colSpan - 1))
            newColSpan = initialItem.colStart + initialItem.colSpan - newColStart
            newRowSpan = Math.max(1, Math.min(gridPos.row - initialItem.rowStart + 1, config.rows - initialItem.rowStart + 1))
            break
          case 'se':
            newColSpan = Math.max(1, Math.min(gridPos.col - initialItem.colStart + 1, config.columns - initialItem.colStart + 1))
            newRowSpan = Math.max(1, Math.min(gridPos.row - initialItem.rowStart + 1, config.rows - initialItem.rowStart + 1))
            break
          case 'n':
            newRowStart = Math.max(1, Math.min(gridPos.row, initialItem.rowStart + initialItem.rowSpan - 1))
            newRowSpan = initialItem.rowStart + initialItem.rowSpan - newRowStart
            break
          case 's':
            newRowSpan = Math.max(1, Math.min(gridPos.row - initialItem.rowStart + 1, config.rows - initialItem.rowStart + 1))
            break
          case 'e':
            newColSpan = Math.max(1, Math.min(gridPos.col - initialItem.colStart + 1, config.columns - initialItem.colStart + 1))
            break
          case 'w':
            newColStart = Math.max(1, Math.min(gridPos.col, initialItem.colStart + initialItem.colSpan - 1))
            newColSpan = initialItem.colStart + initialItem.colSpan - newColStart
            break
        }

        if (newColSpan < 1 || newRowSpan < 1) return

        if (newColStart + newColSpan - 1 > config.columns || newRowStart + newRowSpan - 1 > config.rows) return

        const proposedItem: GridItem = {
          ...initialItem,
          colStart: newColStart,
          rowStart: newRowStart,
          colSpan: newColSpan,
          rowSpan: newRowSpan,
        }

        if (!wouldCollide(proposedItem, initialItem.id)) {
          const currentItem = items.find((i) => i.id === initialItem.id)
          if (
            !currentItem ||
            newColStart !== currentItem.colStart ||
            newRowStart !== currentItem.rowStart ||
            newColSpan !== currentItem.colSpan ||
            newRowSpan !== currentItem.rowSpan
          ) {
            onItemChange?.(initialItem.id, proposedItem)
          }
        }
      }
    },
    [draggedItemId, dragStart, resizeHandle, resizeStart, items, pixelToGrid, config, wouldCollide, onItemChange]
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => handlePointerMove(e.clientX, e.clientY),
    [handlePointerMove]
  )

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length > 0) {
        e.preventDefault()
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY)
      }
    },
    [handlePointerMove]
  )

  const handleMouseUp = useCallback(() => {
    setDraggedItemId(null)
    setResizeHandle(null)
    setDragStart(null)
    setResizeStart(null)
  }, [])

  useEffect(() => {
    if (draggedItemId || resizeHandle) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('touchend', handleMouseUp)
      document.addEventListener('touchcancel', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', handleMouseUp)
        document.removeEventListener('touchcancel', handleMouseUp)
      }
    }
  }, [draggedItemId, resizeHandle, handleMouseMove, handleTouchMove, handleMouseUp])

  const handleResizePointerDown = useCallback((handle: ResizeHandle, item: GridItem) => {
    if (!handle) return
    setResizeHandle(handle)
    setResizeStart({ item })
  }, [])

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent, handle: ResizeHandle, item: GridItem) => {
      if (e.button !== 0 || !handle) return
      e.stopPropagation()
      e.preventDefault()
      handleResizePointerDown(handle, item)
    },
    [handleResizePointerDown]
  )

  const handleResizeTouchStart = useCallback(
    (e: React.TouchEvent, handle: ResizeHandle, item: GridItem) => {
      if (!handle) return
      e.stopPropagation()
      e.preventDefault()
      handleResizePointerDown(handle, item)
    },
    [handleResizePointerDown]
  )

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full',
        isScrollable ? 'overflow-auto max-h-[min(500px,70vh)] min-h-[200px]' : 'overflow-hidden',
        className
      )}
      style={{
        width: containerWidth || '100%',
        height: containerHeight ?? (isScrollable ? undefined : dimensions.height),
        maxWidth: containerWidth || DEFAULT_CONTAINER_WIDTH,
        ...(!containerWidth && !containerHeight && !isScrollable
          ? { aspectRatio: `${DEFAULT_CONTAINER_WIDTH} / ${DEFAULT_CONTAINER_HEIGHT}` }
          : {}),
      }}
    >
      <div
        className="relative shrink-0"
        style={{
          width: dimensions.width,
          height: dimensions.height,
          ...(!isScrollable ? { position: 'absolute', inset: 0 } : {}),
        }}
      >
        <div
          ref={gridRef}
          className="absolute inset-0"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${config.columns}, 1fr)`,
          gridTemplateRows: `repeat(${config.rows}, 1fr)`,
          gap: `${config.gap}px`,
          padding: '8px',
        }}
      >
        {Array.from({ length: config.columns * config.rows }).map((_, index) => {
          const col = (index % config.columns) + 1
          const row = Math.floor(index / config.columns) + 1
          const cellKey = `${col}-${row}`
          const isOccupied = isCellOccupied.has(cellKey)
          return (
            <div
              key={`cell-${col}-${row}`}
              className={cn(
                'border-2 transition-colors',
                isOccupied
                  ? 'border-border/40 bg-background/60 cursor-default'
                  : 'border-border/70 bg-background/40 hover:border-primary/60 hover:bg-primary/5 cursor-pointer'
              )}
              style={{
                minWidth: 0,
                minHeight: 0,
              }}
              onClick={() => handleCellClick(col, row)}
            />
          )
        })}
      </div>

      {/* Grid items - positioned absolutely to match grid cells */}
      <div className="absolute inset-0 pointer-events-none">
        {itemStyles.map(({ item, style }) => {
          const isSelected = selectedItemId === item.id
          const isDragging = draggedItemId === item.id
          return (
            <div
              key={item.id}
              className={cn(
                'bg-primary/20 border-2 rounded-md transition-all pointer-events-auto relative touch-none',
                'hover:bg-primary/30 hover:border-primary/50',
                isSelected && 'bg-primary/40 border-primary ring-2 ring-primary/20',
                isDragging && 'opacity-75 cursor-move',
                !isDragging && 'cursor-move',
                'flex items-center justify-center text-xs font-medium text-foreground'
              )}
              style={style}
              onMouseDown={(e) => handleItemMouseDown(e, item)}
              onTouchStart={(e) => handleItemTouchStart(e, item)}
              onClick={(e) => {
                e.stopPropagation()
                if (!dragOccurredRef.current) {
                  onItemClick?.(item.id)
                }
                dragOccurredRef.current = false
              }}
            >
              {/* Resize handles - show only when selected (w-5 = 20px for better touch targets) */}
              {isSelected && (
                <>
                  {/* Corner handles */}
                  <div
                    className="absolute top-0 left-0 w-3 h-3 bg-primary border border-primary-foreground rounded-sm cursor-nw-resize z-10 touch-none"
                    onMouseDown={(e) => handleResizeMouseDown(e, 'nw', item)}
                    onTouchStart={(e) => handleResizeTouchStart(e, 'nw', item)}
                  />
                  <div
                    className="absolute top-0 right-0 w-3 h-3 bg-primary border border-primary-foreground rounded-sm cursor-ne-resize z-10 touch-none"
                    onMouseDown={(e) => handleResizeMouseDown(e, 'ne', item)}
                    onTouchStart={(e) => handleResizeTouchStart(e, 'ne', item)}
                  />
                  <div
                    className="absolute bottom-0 left-0 w-3 h-3 bg-primary border border-primary-foreground rounded-sm cursor-sw-resize z-10 touch-none"
                    onMouseDown={(e) => handleResizeMouseDown(e, 'sw', item)}
                    onTouchStart={(e) => handleResizeTouchStart(e, 'sw', item)}
                  />
                  <div
                    className="absolute bottom-0 right-0 w-3 h-3 bg-primary border border-primary-foreground rounded-sm cursor-se-resize z-10 touch-none"
                    onMouseDown={(e) => handleResizeMouseDown(e, 'se', item)}
                    onTouchStart={(e) => handleResizeTouchStart(e, 'se', item)}
                  />
                </>
              )}

              <div className="text-center px-2 py-1 pointer-events-none">
                <div className="font-semibold">
                  {t('gridCanvas.itemLabel', {
                    number: itemNumberMap.get(item.id) ?? 0,
                  })}
                </div>
                <div className="text-muted-foreground text-[10px] mt-0.5">
                  {item.colSpan}×{item.rowSpan}
                </div>
              </div>
              
            </div>
          )
        })}
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground pointer-events-none">
          <div className="text-center">
            <div className="text-sm font-medium mb-1">{t('gridCanvas.emptyTitle')}</div>
            <div className="text-xs">{t('gridCanvas.emptyMessage')}</div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export { GridCanvas }
