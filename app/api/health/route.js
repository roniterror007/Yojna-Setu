import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';

export async function GET() {
  const hasKey = !!process.env.YOJNA_AWS_KEY;
  const hasSecret = !!process.env.YOJNA_AWS_SECRET;
  const region = process.env.YOJNA_AWS_REGION || 'NOT SET';

  if (!hasKey || !hasSecret) {
    return Response.json({ hasKey, hasSecret, region, bedrockTest: 'SKIPPED - no credentials' });
  }

  try {
    const client = new BedrockRuntimeClient({
      region,
      credentials: {
        accessKeyId: process.env.YOJNA_AWS_KEY,
        secretAccessKey: process.env.YOJNA_AWS_SECRET,
      },
    });

    const command = new ConverseCommand({
      modelId: 'amazon.nova-pro-v1:0',
      messages: [{ role: 'user', content: [{ text: 'Say hi' }] }],
      inferenceConfig: { maxTokens: 10 },
    });

    const response = await client.send(command);
    return Response.json({
      hasKey, hasSecret, region,
      bedrockTest: 'SUCCESS',
      reply: response.output.message.content[0].text,
    });
  } catch (err) {
    return Response.json({
      hasKey, hasSecret, region,
      bedrockTest: 'FAILED',
      errorName: err.name,
      errorMessage: err.message,
      errorCode: err.$metadata?.httpStatusCode,
    });
  }
}
