import { ImageResponse } from 'next/og'
import { isValidLocale, isValidTechnology, type Locale } from '@/shared/types/routing'

function getTechDisplayName(technology: string): string {
  const names: Record<string, string> = {
    'material-ui': 'Material UI',
    'ant-design': 'Ant Design',
    'mantine': 'Mantine',
    'raw-css': 'CSS Grid',
    tailwind: 'Tailwind',
  }
  return names[technology] ?? technology
}

export const alt = 'Pro Grid Generator - Visual grid editor for multiple frameworks'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const ogText: Record<Locale, { eyebrow: string; tagline: string }> = {
  en: {
    eyebrow: 'Grid Generator',
    tagline: 'Visual editor · Responsive layouts · Copy-ready code',
  },
  es: {
    eyebrow: 'Generador de cuadrículas',
    tagline: 'Editor visual · Diseños responsivos · Código listo para copiar',
  },
  ru: {
    eyebrow: 'Генератор сеток',
    tagline: 'Визуальный редактор · Адаптивные макеты · Готовый код',
  },
}

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; technology: string }>
}) {
  const { locale, technology } = await params

  if (!isValidLocale(locale) || !isValidTechnology(technology)) {
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 48,
            background: '#0f172a',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}
        >
          Pro Grid Generator
        </div>
      ),
      { ...size }
    )
  }

  const displayName = getTechDisplayName(technology)
  const text = ogText[locale]

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 48,
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Grid pattern overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontSize: 28,
              color: '#94a3b8',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: 4,
            }}
          >
            {text.eyebrow}
          </div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: '#38bdf8',
            }}
          >
            Pro {displayName}
          </div>
          <div
            style={{
              fontSize: 24,
              color: '#94a3b8',
              marginTop: 16,
            }}
          >
            {text.tagline}
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
