'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

const AMPLITUDE_ENDPOINT = 'https://api2.amplitude.com/2/httpapi'
const DEVICE_ID_STORAGE_KEY = 'pro-grid-generator-device-id'
const FIRST_TOUCH_STORAGE_KEY = 'pro-grid-generator-first-touch'
const LATEST_TOUCH_STORAGE_KEY = 'pro-grid-generator-latest-touch'
const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
] as const

type UtmKey = (typeof UTM_KEYS)[number]
type UtmParams = Partial<Record<UtmKey, string>>

interface TouchData extends UtmParams {
  landing_page: string
  referrer: string
  captured_at: string
}

function getDeviceId(): string {
  const storedDeviceId = localStorage.getItem(DEVICE_ID_STORAGE_KEY)

  if (storedDeviceId) {
    return storedDeviceId
  }

  const deviceId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `device-${Date.now()}-${Math.random().toString(36).slice(2)}`

  localStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId)
  return deviceId
}

function getUtmParams(searchParams: URLSearchParams): UtmParams {
  return Object.fromEntries(
    UTM_KEYS.flatMap((key) => {
      const value = searchParams.get(key)
      return value ? [[key, value]] : []
    })
  )
}

function hasUtmParams(utmParams: UtmParams): boolean {
  return UTM_KEYS.some((key) => Boolean(utmParams[key]))
}

function readStoredTouch(storageKey: string): TouchData | null {
  try {
    const storedTouch = localStorage.getItem(storageKey)
    return storedTouch ? (JSON.parse(storedTouch) as TouchData) : null
  } catch {
    return null
  }
}

function writeStoredTouch(storageKey: string, touchData: TouchData): void {
  localStorage.setItem(storageKey, JSON.stringify(touchData))
}

function captureTouchData(currentUrl: URL): {
  firstTouch: TouchData | null
  latestTouch: TouchData | null
} {
  const utmParams = getUtmParams(currentUrl.searchParams)
  const existingFirstTouch = readStoredTouch(FIRST_TOUCH_STORAGE_KEY)
  const existingLatestTouch = readStoredTouch(LATEST_TOUCH_STORAGE_KEY)

  if (!hasUtmParams(utmParams)) {
    return {
      firstTouch: existingFirstTouch,
      latestTouch: existingLatestTouch,
    }
  }

  const touchData: TouchData = {
    ...utmParams,
    landing_page: currentUrl.href,
    referrer: document.referrer,
    captured_at: new Date().toISOString(),
  }

  if (!existingFirstTouch) {
    writeStoredTouch(FIRST_TOUCH_STORAGE_KEY, touchData)
  }

  writeStoredTouch(LATEST_TOUCH_STORAGE_KEY, touchData)

  return {
    firstTouch: existingFirstTouch ?? touchData,
    latestTouch: touchData,
  }
}

function getRouteProperties(pathname: string) {
  const [, locale, technology] = pathname.split('/')

  return {
    locale: locale || null,
    technology: technology || null,
  }
}

function prefixProperties<T extends object>(
  prefix: string,
  properties: T | null
): Record<string, unknown> {
  if (!properties) return {}

  return Object.fromEntries(
    Object.entries(properties)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => [`${prefix}_${key}`, value])
  )
}

async function trackPageView(pathname: string): Promise<void> {
  const apiKey = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY

  if (!apiKey) return

  const currentUrl = new URL(window.location.href)
  const { firstTouch, latestTouch } = captureTouchData(currentUrl)
  const routeProperties = getRouteProperties(pathname)
  const eventProperties = {
    event_name: 'page_view',
    path: pathname,
    search: currentUrl.search,
    url: currentUrl.href,
    referrer: document.referrer,
    ...routeProperties,
    ...prefixProperties('first_touch', firstTouch),
    ...prefixProperties('latest_touch', latestTouch),
  }

  await fetch(AMPLITUDE_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      api_key: apiKey,
      events: [
        {
          device_id: getDeviceId(),
          event_type: 'page_view',
          time: Date.now(),
          event_properties: eventProperties,
          user_properties: {
            ...prefixProperties('first_touch', firstTouch),
            ...prefixProperties('latest_touch', latestTouch),
          },
        },
      ],
    }),
    keepalive: true,
  })
}

function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  useEffect(() => {
    trackPageView(pathname).catch(() => {
      // Analytics must never break the app.
    })
  }, [pathname])

  return <>{children}</>
}

export { AnalyticsProvider }
