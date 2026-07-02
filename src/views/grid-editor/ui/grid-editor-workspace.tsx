'use client'

import {
  GridActions,
  type GridConfig,
  type GridItem,
  type GridState,
} from '@/entities/grid'
import { GridControls } from '@/features/grid-controls'
import {
  GridEditorModeSwitch,
  type GridEditorMode,
} from '@/features/grid-editor-mode'
import { BreakpointSelector } from '@/features/responsive-breakpoints'
import type {
  GridBreakpoint,
  GridBreakpointDefinition,
} from '@/shared/types/code-generator'
import { Card, CardContent } from '@/shared/ui'
import { GridCanvas } from '@/widgets/grid-canvas'

interface GridEditorWorkspaceProps {
  gridState: GridState
  breakpoints: GridBreakpointDefinition[]
  activeBreakpoint: GridBreakpoint
  editorMode: GridEditorMode
  selectedItemId: string | null
  onEditorModeChange: (mode: GridEditorMode) => void
  onBreakpointChange: (breakpoint: GridBreakpoint) => void
  onConfigChange: (config: GridConfig) => void
  onItemClick: (itemId: string) => void
  onEmptyCellClick: (col: number, row: number) => void
  onItemChange: (itemId: string, item: GridItem) => void
  onReset: () => void
  onItemDelete: () => void
}

function GridEditorWorkspace({
  gridState,
  breakpoints,
  activeBreakpoint,
  editorMode,
  selectedItemId,
  onEditorModeChange,
  onBreakpointChange,
  onConfigChange,
  onItemClick,
  onEmptyCellClick,
  onItemChange,
  onReset,
  onItemDelete,
}: GridEditorWorkspaceProps) {
  return (
    <Card className="!p-0 bg-transparent border-none">
      <CardContent>
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_2.5fr]">
          <div>
            <GridControls
              className="flex flex-col gap-4 justify-between h-full"
              config={gridState.config}
              onConfigChange={onConfigChange}
              onReset={onReset}
              selectedItemId={selectedItemId}
              onItemDelete={onItemDelete}
            />
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <GridEditorModeSwitch
                mode={editorMode}
                onModeChange={onEditorModeChange}
              />
              {editorMode === 'responsive' && (
                <BreakpointSelector
                  breakpoints={breakpoints}
                  activeBreakpoint={activeBreakpoint}
                  onBreakpointChange={onBreakpointChange}
                />
              )}
            </div>
            <div className="flex justify-center rounded-lg w-full overflow-hidden">
              <GridCanvas
                gridState={gridState}
                onItemClick={onItemClick}
                onEmptyCellClick={onEmptyCellClick}
                onItemChange={onItemChange}
                selectedItemId={selectedItemId}
              />
            </div>
            <div className="lg:hidden">
              <GridActions
                onReset={onReset}
                selectedItemId={selectedItemId}
                onItemDelete={onItemDelete}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export { GridEditorWorkspace }
