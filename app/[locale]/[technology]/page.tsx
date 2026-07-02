import { GridEditorPage } from '@/views/grid-editor'
import { isValidLocale, isValidTechnology, type Technology } from '@/shared/types/routing'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

interface TechnologyPageProps {
  params: Promise<{ locale: string; technology: string }>
}

export default async function TechnologyPage({ params }: TechnologyPageProps) {
  const { locale, technology } = await params

  if (!isValidLocale(locale) || !isValidTechnology(technology)) {
    notFound()
  }

  return (
    <Suspense>
      <GridEditorPage technology={technology as Technology} />
    </Suspense>
  )
}
