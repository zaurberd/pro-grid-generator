'use client'

import type {
  GridBreakpoint,
  GridBreakpointDefinition,
} from '@/shared/types/code-generator'
import { Button } from '@/shared/ui'

interface BreakpointSelectorProps {
  breakpoints: GridBreakpointDefinition[]
  activeBreakpoint: GridBreakpoint
  onBreakpointChange: (breakpoint: GridBreakpoint) => void
  className?: string
}

function BreakpointSelector({
  breakpoints,
  activeBreakpoint,
  onBreakpointChange,
  className,
}: BreakpointSelectorProps) {
  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        {breakpoints.map((breakpoint) => (
          <Button
            key={breakpoint.id}
            type="button"
            size="sm"
            variant={activeBreakpoint === breakpoint.id ? 'default' : 'outline'}
            className="w-16 border px-0"
            onClick={() => onBreakpointChange(breakpoint.id)}
            title={`${breakpoint.label} >= ${breakpoint.minWidth}px`}
          >
            {breakpoint.label}
          </Button>
        ))}
      </div>
    </div>
  )
}

export { BreakpointSelector }
