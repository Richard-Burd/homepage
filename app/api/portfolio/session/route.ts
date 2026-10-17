import { cookies } from 'next/headers'

import { PORTFOLIO_COOKIE, sessionIsValid } from '@/lib/portfolio-session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const cookieStore = await cookies()
  const valid = sessionIsValid(cookieStore.get(PORTFOLIO_COOKIE)?.value)
  return new Response(null, {
    status: valid ? 204 : 401,
    headers: { 'Cache-Control': 'private, no-store' },
  })
}
