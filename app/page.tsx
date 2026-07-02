import { redirect } from 'next/navigation'
import { DEFAULT_LOCALE } from '@/shared/types/routing'

export default function RootPage() {
  redirect(`/${DEFAULT_LOCALE}`)
}
