import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

import { PORTFOLIO_MAX_AGE_SECONDS } from '@/lib/portfolio-session'

const portfolioPairs = [
  {
    id: 'tangie-gantt-chart',
    preview: 'secret-tangie-gantt-chart-preview.1.jpg',
    full: 'secret-tangie-gantt-chart.1.jpg',
  },
  {
    id: 'tangie-label-processing',
    preview: 'secret-tangie-label-processing-preview.1.jpg',
    full: 'secret-tangie-label-processing.1.jpg',
  },
  {
    id: 'adc-map',
    preview: 'secret-adc-map-preview.1.jpg',
    full: 'secret-adc-map.1.jpg',
  },
  {
    id: 'adc-process-flow',
    preview: 'secret-adc-process-flow-preview.1.jpg',
    full: 'secret-adc-process-flow.1.jpg',
  },
] as const

export type PortfolioImage = {
  id: string
  previewUrl: string
  fullUrl: string
}

let client: S3Client | undefined

function s3Client() {
  const region = process.env.AWS_REGION
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
  if (!region || !accessKeyId || !secretAccessKey) {
    throw new Error('Missing AWS credentials for the portfolio bucket')
  }
  client ??= new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  })
  return client
}

async function presign(bucket: string, key: string) {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    ResponseCacheControl: 'private, no-store',
    ResponseContentType: 'image/jpeg',
  })
  return getSignedUrl(s3Client(), command, {
    expiresIn: PORTFOLIO_MAX_AGE_SECONDS,
  })
}

export async function presignPortfolioImages(): Promise<PortfolioImage[]> {
  const bucket = process.env.S3_SECRET_BUCKET
  if (!bucket) {
    throw new Error('Missing S3_SECRET_BUCKET')
  }

  return Promise.all(
    portfolioPairs.map(async (pair) => ({
      id: pair.id,
      previewUrl: await presign(bucket, pair.preview),
      fullUrl: await presign(bucket, pair.full),
    }))
  )
}
