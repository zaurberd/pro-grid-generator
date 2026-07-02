import { PresetGalleryPage } from '@/views/preset-gallery'
import { isValidLocale, type Locale } from '@/shared/types/routing'
import { notFound } from 'next/navigation'

interface LocalePageProps {
  params: Promise<{ locale: string }>
}

export default async function LocalePage({ params }: LocalePageProps) {
  const { locale } = await params

  if (!isValidLocale(locale)) {
    notFound()
  }

  return <PresetGalleryPage locale={locale as Locale} />
}
