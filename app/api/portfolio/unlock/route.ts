import { cookies } from 'next/headers'

import {
  PORTFOLIO_COOKIE,
  createSessionValue,
  passwordMatches,
  portfolioCookieOptions,
} from '@/lib/portfolio-session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const noStore = { 'Cache-Control': 'private, no-store' }

export async function POST(request: Request) {
  let password = ''
  try {
    const body: unknown = await request.json()
    if (
      body &&
      typeof body === 'object' &&
      'password' in body &&
      typeof body.password === 'string'
    ) {
      password = body.password
    }
  } catch {
    return Response.json({ ok: false }, { status: 400, headers: noStore })
  }

  if (
    password.length === 0 ||
    password.length > 200 ||
    !passwordMatches(password)
  ) {
    return Response.json({ ok: false }, { status: 401, headers: noStore })
  }

  const cookieStore = await cookies()
  cookieStore.set(
    PORTFOLIO_COOKIE,
    createSessionValue(),
    portfolioCookieOptions()
  )
  return Response.json({ ok: true }, { headers: noStore })
}
