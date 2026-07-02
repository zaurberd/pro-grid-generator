'use client'

import { Button } from '@/shared/ui'
import { useTranslations } from 'next-intl'
import type { GridEditorMode } from '../model/types'

interface GridEditorModeSwitchProps {
  mode: GridEditorMode
  onModeChange: (mode: GridEditorMode) => void
  className?: string
}

function GridEditorModeSwitch({
  mode,
  onModeChange,
  className,
}: GridEditorModeSwitchProps) {
  const t = useTranslations()

  return (
    <div className={className}>
      <div className="inline-flex rounded-md border border-border bg-background p-1">
        <Button
          type="button"
          size="sm"
          variant={mode === 'simple' ? 'default' : 'ghost'}
          className="w-28 border border-transparent px-0"
          onClick={() => onModeChange('simple')}
        >
          {t('editorMode.simple')}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === 'responsive' ? 'default' : 'ghost'}
          className="w-28 border border-transparent px-0"
          onClick={() => onModeChange('responsive')}
        >
          {t('editorMode.responsive')}
        </Button>
      </div>
    </div>
  )
}

export { GridEditorModeSwitch }
