import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { AnalyticsProvider } from '@/shared/providers/analytics-provider'
import { ThemeProvider } from '@/shared/providers/theme-provider'
import { isValidLocale } from '@/shared/types/routing'
import './globals.css'

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL
  }
  
  return `https://${process.env.VERCEL_URL}`
}

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {
    default: 'Pro Grid Generator',
    template: '%s | Pro Grid Generator',
  },
  description: 'Visual grid editor for multiple frameworks and CSS approaches',
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const localeHeader = headersList.get('x-next-intl-locale')
  const lang = localeHeader && isValidLocale(localeHeader) ? localeHeader : 'en'

  return (
    <html lang={lang} suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme-preference');
                  if (theme === 'light') {
                    document.documentElement.classList.remove('dark');
                  } else {
                    document.documentElement.classList.add('dark');
                    if (!theme) {
                      localStorage.setItem('theme-preference', 'dark');
                    }
                  }
                } catch (e) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
        <AnalyticsProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </AnalyticsProvider>
      </body>
    </html>
  )
}
