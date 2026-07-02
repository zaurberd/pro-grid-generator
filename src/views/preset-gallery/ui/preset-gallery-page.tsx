import {
  GRID_PRESETS,
  getGridPresetSlug,
  type GridPreset,
} from '@/entities/grid'
import { AppFooter } from '@/widgets/app-footer'
import { GridEditorHeader } from '@/views/grid-editor/ui/grid-editor-header'
import { DEFAULT_TECHNOLOGY, type Locale } from '@/shared/types/routing'
import { Button, Card, CardContent } from '@/shared/ui'
import Link from 'next/link'

interface PresetGalleryPageProps {
  locale: Locale
}

function getEditorHref(
  locale: Locale,
  preset?: GridPreset
): string {
  const params = new URLSearchParams()

  if (preset) {
    params.set('preset', getGridPresetSlug(preset))
  } else {
    params.set('new', '1')
  }

  const queryString = params.toString()
  return `/${locale}/${DEFAULT_TECHNOLOGY}${queryString ? `?${queryString}` : ''}`
}

function PresetPreview({ preset }: { preset: GridPreset }) {
  const { config, items } = preset.state

  return (
    <div
      className="grid h-56 rounded-md border border-border bg-background p-3 sm:h-64"
      style={{
        gridTemplateColumns: `repeat(${config.columns}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${config.rows}, minmax(0, 1fr))`,
        gap: `${Math.max(4, Math.min(config.gap, 10))}px`,
      }}
      aria-hidden
    >
      {items.map((item, index) => (
        <div
          key={item.id}
          className="rounded-sm border border-primary/40 bg-primary/20"
          style={{
            gridColumn: `${item.colStart} / span ${item.colSpan}`,
            gridRow: `${item.rowStart} / span ${item.rowSpan}`,
            opacity: 0.55 + (index % 4) * 0.1,
          }}
        />
      ))}
    </div>
  )
}

function PresetGalleryPage({ locale }: PresetGalleryPageProps) {
  return (
    <div className="min-h-screen bg-background">
      <GridEditorHeader />

      <main className="container mx-auto px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-8">
          <section className="flex flex-col gap-4">
            <div className="max-w-3xl">
              <h1 className="text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
                Grid presets
              </h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
                Start from a production-style layout or open a blank canvas.
              </p>
            </div>

            <Card className="rounded-lg py-5">
              <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-foreground">
                    Create manually
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Open a blank canvas and choose the editing mode there.
                  </p>
                </div>
                <Button asChild>
                  <Link href={getEditorHref(locale)}>Create grid</Link>
                </Button>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            {GRID_PRESETS.map((preset) => (
              <Card key={preset.name} className="rounded-lg py-5">
                <CardContent className="flex h-full flex-col gap-4">
                  <PresetPreview preset={preset} />
                  <div className="flex flex-1 flex-col gap-2">
                    <h2 className="text-base font-semibold text-foreground">
                      {preset.name}
                    </h2>
                    <p className="text-sm leading-5 text-muted-foreground">
                      {preset.description}
                    </p>
                  </div>
                  <Button asChild size="sm">
                    <Link href={getEditorHref(locale, preset)}>
                      Use preset
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </section>
        </div>
      </main>

      <AppFooter />
    </div>
  )
}

export { PresetGalleryPage }
