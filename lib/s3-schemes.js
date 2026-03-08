/**
 * Req 9.4 — S3 Scheme Data Integration
 *
 * Tries to fetch the latest schemes.json from S3 (if bucket is configured).
 * Falls back to local data/schemes.json on any error.
 *
 * This enables the 48-hour refresh pipeline: schemes.json is updated in S3
 * and the app picks it up automatically without redeployment.
 *
 * Setup: Set AWS_S3_BUCKET in .env.local and upload schemes.json to that bucket
 * as "data/schemes.json" with public-read or IAM access.
 */

import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import localData from '../data/schemes.json';

// In-memory cache so S3 is hit at most once per server process lifetime
let cachedSchemes = null;
let cacheTime = 0;
const S3_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

function getS3Client() {
  if (!process.env.YOJNA_AWS_KEY || !process.env.YOJNA_AWS_SECRET) return null;
  return new S3Client({
    region: process.env.YOJNA_AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.YOJNA_AWS_KEY,
      secretAccessKey: process.env.YOJNA_AWS_SECRET,
    },
  });
}

async function streamToString(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

/**
 * Fetch schemes from S3 if available, else return local data.
 * Returns the parsed schemes array.
 */
export async function getSchemesFromS3OrLocal() {
  // Return in-memory cache if fresh
  if (cachedSchemes && (Date.now() - cacheTime) < S3_CACHE_TTL_MS) {
    return cachedSchemes;
  }

  const bucket = process.env.AWS_S3_BUCKET;
  const s3Key = process.env.AWS_S3_SCHEMES_KEY || 'data/schemes.json';

  if (!bucket) {
    // No S3 bucket configured — use local data
    cachedSchemes = localData.schemes;
    cacheTime = Date.now();
    return cachedSchemes;
  }

  try {
    const client = getS3Client();
    if (!client) throw new Error('No S3 client');

    const { Body } = await client.send(new GetObjectCommand({ Bucket: bucket, Key: s3Key }));
    const json = await streamToString(Body);
    const parsed = JSON.parse(json);
    const schemes = parsed.schemes || parsed;

    cachedSchemes = Array.isArray(schemes) ? schemes : localData.schemes;
    cacheTime = Date.now();
    console.log(`[s3-schemes] Loaded ${cachedSchemes.length} schemes from S3`);
    return cachedSchemes;
  } catch (err) {
    console.warn('[s3-schemes] S3 fetch failed, using local data:', err.message);
    cachedSchemes = localData.schemes;
    cacheTime = Date.now();
    return cachedSchemes;
  }
}

/**
 * Force-refresh the in-memory cache from S3 (used by the refresh endpoint)
 */
export function invalidateS3Cache() {
  cachedSchemes = null;
  cacheTime = 0;
}

export { localData };
