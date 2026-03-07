/**
 * Req 9.1 — Amazon Transcribe STT endpoint
 *
 * Accepts a base64-encoded audio blob (webm/ogg/wav) from the browser,
 * uploads it to a temporary S3 bucket, starts a Transcribe job, polls
 * for completion, and returns the transcript.
 *
 * Falls back to an error response so the client can use browser STT instead.
 *
 * POST /api/transcribe
 * Body: { audioBase64: string, language: "hi"|"kn"|"ta"|"te"|"en", mimeType: string }
 */

import {
  TranscribeClient,
  StartTranscriptionJobCommand,
  GetTranscriptionJobCommand,
} from '@aws-sdk/client-transcribe';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// Map UI language codes to Amazon Transcribe language codes
const TRANSCRIBE_LANG_MAP = {
  hi: 'hi-IN',
  kn: 'kn-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  en: 'en-IN',
};

const getClients = () => {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) return null;
  const region = process.env.AWS_REGION || 'us-east-1';
  const credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
  return {
    transcribe: new TranscribeClient({ region, credentials }),
    s3: new S3Client({ region, credentials }),
  };
};

// Wait up to 30s for Transcribe job (poll every 2s)
async function pollJob(client, jobName, maxWaitMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const { TranscriptionJob: job } = await client.send(
      new GetTranscriptionJobCommand({ TranscriptionJobName: jobName })
    );
    if (job.TranscriptionJobStatus === 'COMPLETED') {
      return job.Transcript.TranscriptFileUri;
    }
    if (job.TranscriptionJobStatus === 'FAILED') {
      throw new Error(`Transcribe job failed: ${job.FailureReason}`);
    }
    await new Promise(r => setTimeout(r, 2000));
  }
  throw new Error('Transcribe job timed out');
}

export async function POST(request) {
  const clients = getClients();
  if (!clients) {
    return Response.json({ error: 'AWS credentials not configured', fallback: true }, { status: 503 });
  }

  const bucket = process.env.AWS_S3_BUCKET || process.env.NEXT_PUBLIC_APP_NAME?.toLowerCase().replace(/\s/g, '-') + '-audio';
  if (!bucket || bucket === 'undefined-audio') {
    return Response.json({
      error: 'Set AWS_S3_BUCKET in .env.local to use Amazon Transcribe',
      fallback: true,
    }, { status: 503 });
  }

  try {
    const { audioBase64, language = 'hi', mimeType = 'audio/webm' } = await request.json();
    if (!audioBase64) {
      return Response.json({ error: 'audioBase64 is required' }, { status: 400 });
    }

    const ext = mimeType.includes('wav') ? 'wav' : mimeType.includes('ogg') ? 'ogg' : 'webm';
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    const jobName = `yojna-setu-${Date.now()}`;
    const s3Key = `audio/${jobName}.${ext}`;

    // 1. Upload audio to S3
    await clients.s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: s3Key,
      Body: audioBuffer,
      ContentType: mimeType,
    }));

    const mediaUri = `s3://${bucket}/${s3Key}`;
    const transcribeLang = TRANSCRIBE_LANG_MAP[language] || 'hi-IN';

    // 2. Start Transcribe job
    await clients.transcribe.send(new StartTranscriptionJobCommand({
      TranscriptionJobName: jobName,
      LanguageCode: transcribeLang,
      MediaFormat: ext,
      Media: { MediaFileUri: mediaUri },
      Settings: { ShowSpeakerLabels: false },
    }));

    // 3. Poll for result
    const transcriptUri = await pollJob(clients.transcribe, jobName);

    // 4. Fetch transcript JSON from URI (it's a public S3 presigned URL)
    const transcriptRes = await fetch(transcriptUri);
    const transcriptData = await transcriptRes.json();
    const transcript = transcriptData?.results?.transcripts?.[0]?.transcript || '';

    // 5. Cleanup S3 audio file
    await clients.s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: s3Key })).catch(() => {});

    return Response.json({ success: true, transcript, language });
  } catch (error) {
    console.error('Transcribe error:', error);
    return Response.json({
      error: error.message || 'Transcription failed',
      fallback: true,
    }, { status: 500 });
  }
}
