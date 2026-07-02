import {
  GRID_PRESETS,
  getGridPresetSlug,
  type GridPreset,
} from '@/entities/grid'
import { AppFooter } from '@/widgets/app-footer'
import { GridEditorHeader } from '@/views/grid-editor/ui/grid-editor-header'
import { DEFAULT_TECHNOLOGY, type Locale } from '@/shared/types/routing'
import { Button, Card, CardContent } from '@/shared/ui'
import { useTranslations } from 'next-intl'
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
      className="grid h-40 min-w-0 overflow-hidden rounded-md border border-border bg-background p-2 sm:h-56 sm:p-3 lg:h-64"
      style={{
        gridTemplateColumns: `repeat(${config.columns}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${config.rows}, minmax(0, 1fr))`,
        gap: `${Math.max(3, Math.min(config.gap, 8))}px`,
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
  const t = useTranslations()

  return (
    <div className="min-h-screen bg-background">
      <GridEditorHeader />

      <main className="container mx-auto px-4 py-5 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-6 sm:gap-8">
          <section className="flex flex-col gap-4">
            <div className="max-w-3xl">
              <h1 className="text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
                {t('presetGallery.title')}
              </h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
                {t('presetGallery.subtitle')}
              </p>
            </div>

            <Card className="min-w-0 overflow-hidden rounded-lg py-4 sm:py-5">
              <CardContent className="flex min-w-0 flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 lg:px-6">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-foreground">
                    {t('presetGallery.manualTitle')}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t('presetGallery.manualDescription')}
                  </p>
                </div>
                <Button asChild className="w-full sm:w-auto">
                  <Link href={getEditorHref(locale)}>
                    {t('presetGallery.createGrid')}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </section>

          <section className="grid min-w-0 gap-4 sm:gap-5 lg:grid-cols-2">
            {GRID_PRESETS.map((preset) => (
              <Card key={preset.name} className="min-w-0 overflow-hidden rounded-lg py-4 sm:py-5">
                <CardContent className="flex h-full min-w-0 flex-col gap-4 px-4 sm:px-5 lg:px-6">
                  <PresetPreview preset={preset} />
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <h2 className="text-base font-semibold text-foreground">
                      {t(`presets.${preset.id}.name`)}
                    </h2>
                    <p className="text-sm leading-5 text-muted-foreground">
                      {t(`presets.${preset.id}.description`)}
                    </p>
                  </div>
                  <Button asChild size="sm" className="w-full">
                    <Link href={getEditorHref(locale, preset)}>
                      {t('presetGallery.usePreset')}
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
