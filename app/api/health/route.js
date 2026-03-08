export async function GET() {
  return Response.json({
    hasKey: !!process.env.YOJNA_AWS_KEY,
    hasSecret: !!process.env.YOJNA_AWS_SECRET,
    region: process.env.YOJNA_AWS_REGION || 'NOT SET',
    nodeEnv: process.env.NODE_ENV,
  });
}
