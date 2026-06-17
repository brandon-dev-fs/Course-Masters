import { S3Client } from '@aws-sdk/client-s3';
import { config } from '../config.js';
import { logger } from './logger.js';

const { S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_REGION } = config;

let s3Client: S3Client | null = null;
let exportedBucket: string | null = null;

if (S3_ENDPOINT && S3_BUCKET && S3_ACCESS_KEY_ID && S3_SECRET_ACCESS_KEY) {
  s3Client = new S3Client({
    endpoint: S3_ENDPOINT,
    region: S3_REGION,
    credentials: {
      accessKeyId: S3_ACCESS_KEY_ID,
      secretAccessKey: S3_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true,
  });
  exportedBucket = S3_BUCKET;
} else {
  logger.warn(
    { missing: [!S3_ENDPOINT && 'S3_ENDPOINT', !S3_BUCKET && 'S3_BUCKET', !S3_ACCESS_KEY_ID && 'S3_ACCESS_KEY_ID', !S3_SECRET_ACCESS_KEY && 'S3_SECRET_ACCESS_KEY'].filter(Boolean) },
    'S3 not configured — file upload/download will be unavailable',
  );
}

export { s3Client, exportedBucket as S3_BUCKET };
