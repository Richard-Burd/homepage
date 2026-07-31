function getAssetsBaseUrl() {
  const base = process.env.NEXT_PUBLIC_ASSETS_BASE_URL?.replace(/\/$/, '')
  if (!base) {
    throw new Error('NEXT_PUBLIC_ASSETS_BASE_URL is not set')
  }
  return base
}

/** Absolute asset URL on the public assets host. */
export function assetUrl(path: string) {
  return `${getAssetsBaseUrl()}/${path.replace(/^\//, '')}`
}

/**
 * Same-origin path proxied to the assets host (see next.config rewrites).
 * Use for browser fetches that would otherwise hit S3 CORS limits (e.g. GLB).
 */
export function proxiedAssetUrl(path: string) {
  return `/s3/${path.replace(/^\//, '')}`
}
