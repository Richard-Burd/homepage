import { cookies } from 'next/headers'

import {
  PORTFOLIO_COOKIE,
  portfolioCookieOptions,
} from '@/lib/portfolio-session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  const cookieStore = await cookies()
  cookieStore.set(PORTFOLIO_COOKIE, '', portfolioCookieOptions(0))
  return new Response(null, {
    status: 204,
    headers: { 'Cache-Control': 'private, no-store' },
  })
}
