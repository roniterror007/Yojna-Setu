/**
 * Req 9.5 + 10.2 — AWS Lambda Handler: Scheme Refresh (48-hour cron)
 *
 * This Lambda runs on a schedule (AWS EventBridge every 48h).
 * It calls the /api/refresh-schemes endpoint to invalidate the S3 cache
 * and optionally fetches updated scheme data from external sources.
 *
 * EventBridge setup:
 *   aws events put-rule \
 *     --name "YojnaSetu48hRefresh" \
 *     --schedule-expression "rate(48 hours)"
 *
 *   aws events put-targets \
 *     --rule YojnaSetu48hRefresh \
 *     --targets '[{"Id":"1","Arn":"<LAMBDA_ARN>"}]'
 */

'use strict';

const https = require('https');

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://yojna-setu.vercel.app';
const REFRESH_SECRET = process.env.REFRESH_SECRET || '';

function postJson(url, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

exports.handler = async () => {
  console.log('[refresh-handler] Starting 48h scheme refresh...');
  try {
    const result = await postJson(`${APP_URL}/api/refresh-schemes`, { secret: REFRESH_SECRET });
    console.log('[refresh-handler] Refresh result:', result.body);
    return { statusCode: result.status, body: result.body };
  } catch (err) {
    console.error('[refresh-handler] Failed:', err.message);
    return { statusCode: 500, body: { error: err.message } };
  }
};
