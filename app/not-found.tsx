import Link from 'next/link'
import { headers } from 'next/headers'
import { DEFAULT_LOCALE, isValidLocale, type Locale } from '@/shared/types/routing'

const notFoundText: Record<Locale, { message: string; homeLink: string }> = {
  en: {
    message: 'Page not found',
    homeLink: 'Go to home',
  },
  es: {
    message: 'Página no encontrada',
    homeLink: 'Ir al inicio',
  },
  ru: {
    message: 'Страница не найдена',
    homeLink: 'На главную',
  },
}

export default async function NotFound() {
  const headersList = await headers()
  const localeHeader = headersList.get('x-next-intl-locale')
  const locale = localeHeader && isValidLocale(localeHeader)
    ? localeHeader
    : DEFAULT_LOCALE
  const text = notFoundText[locale]

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">404</h1>
        <p className="text-muted-foreground mb-8">{text.message}</p>
        <Link
          href={`/${locale}`}
          className="text-primary hover:underline"
        >
          {text.homeLink}
        </Link>
      </div>
    </div>
  )
}
