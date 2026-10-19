import { createHash, createHmac, timingSafeEqual } from 'crypto'

export const PORTFOLIO_COOKIE = 'portfolio_session'
export const PORTFOLIO_MAX_AGE_SECONDS = 60 * 15

function password() {
  return process.env.SECRET_PORTFOLIO_PASSWORD ?? ''
}

function signingKey() {
  return createHash('sha256').update(`portfolio-session:${password()}`).digest()
}

function digest(value: string) {
  return createHash('sha256').update(value, 'utf8').digest()
}

export function passwordMatches(input: string) {
  const expected = password()
  const same = timingSafeEqual(digest(input), digest(expected))
  return expected.length > 0 && same
}

export function createSessionValue(now = Date.now()) {
  const expiresAt = Math.floor(now / 1000) + PORTFOLIO_MAX_AGE_SECONDS
  const body = String(expiresAt)
  const signature = createHmac('sha256', signingKey())
    .update(body)
    .digest('base64url')
  return `${body}.${signature}`
}

export function sessionIsValid(value: string | undefined, now = Date.now()) {
  if (!value || password().length === 0) return false
  const separator = value.indexOf('.')
  if (separator <= 0) return false
  const body = value.slice(0, separator)
  const signature = value.slice(separator + 1)
  const expected = createHmac('sha256', signingKey())
    .update(body)
    .digest('base64url')
  const actualBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)
  if (actualBuffer.length !== expectedBuffer.length) return false
  if (!timingSafeEqual(actualBuffer, expectedBuffer)) return false
  const expiresAt = Number(body)
  return Number.isFinite(expiresAt) && expiresAt * 1000 > now
}

export function portfolioCookieOptions(maxAge = PORTFOLIO_MAX_AGE_SECONDS) {
  return {
    httpOnly: true,
    sameSite: 'strict' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  }
}
