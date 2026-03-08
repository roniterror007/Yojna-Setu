/**
 * Req 10.2 — Automated Scheme Refresh Endpoint
 *
 * GET /api/refresh-schemes
 *   Returns current scheme metadata (count, lastUpdated, source)
 *
 * POST /api/refresh-schemes
 *   Triggers a cache invalidation so the next request re-fetches from S3.
 *   Can be called by a cron job (e.g. Vercel Cron, AWS EventBridge) every 48h.
 *   Optionally accepts { secret } to guard against unauthorized refreshes.
 *
 * AWS EventBridge setup:
 *   Create a rule: schedule = rate(48 hours)
 *   Target: HTTP endpoint = https://your-app.vercel.app/api/refresh-schemes
 *   Method: POST, body: { "secret": "<REFRESH_SECRET>" }
 */

import { invalidateS3Cache, getSchemesFromS3OrLocal } from '../../../lib/s3-schemes';

export async function GET() {
  const schemes = await getSchemesFromS3OrLocal();
  const lastUpdated = schemes.reduce((latest, s) => {
    if (!s.lastUpdated) return latest;
    return !latest || s.lastUpdated > latest ? s.lastUpdated : latest;
  }, null);

  return Response.json({
    schemeCount: schemes.length,
    lastUpdated: lastUpdated || 'unknown',
    source: process.env.AWS_S3_BUCKET ? 's3' : 'local',
    bucket: process.env.AWS_S3_BUCKET || null,
    nextRefreshIn: '48h (cron)',
    refreshEndpoint: '/api/refresh-schemes (POST)',
  });
}

export async function POST(request) {
  // Optional secret guard
  const refreshSecret = process.env.REFRESH_SECRET;
  if (refreshSecret) {
    let body = {};
    try { body = await request.json(); } catch (_) {}
    if (body.secret !== refreshSecret) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    // Invalidate in-memory cache so next fetch pulls from S3
    invalidateS3Cache();

    // Immediately trigger a re-fetch to warm the cache
    const schemes = await getSchemesFromS3OrLocal();

    return Response.json({
      success: true,
      message: 'Scheme data refreshed',
      schemeCount: schemes.length,
      source: process.env.AWS_S3_BUCKET ? 's3' : 'local',
      refreshedAt: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({
      error: 'Refresh failed: ' + error.message,
    }, { status: 500 });
  }
}
