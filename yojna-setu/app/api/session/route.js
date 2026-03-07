/**
 * Session API — Amazon DynamoDB for conversation persistence
 *
 * Table: YojnaSetuSessions
 *   PK: sessionId (String)
 *   Attributes: language, messages (JSON), profile (JSON), createdAt, updatedAt, ttl
 *
 * AWS Console setup:
 *   1. Go to DynamoDB → Create table → Name: YojnaSetuSessions, PK: sessionId (String)
 *   2. Enable TTL on attribute: ttl
 *   3. Add IAM policy: dynamodb:GetItem, PutItem, UpdateItem, DeleteItem on the table
 *
 * Falls back to in-memory Map if DynamoDB is not configured (local dev)
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const TABLE_NAME = process.env.DYNAMODB_TABLE || 'YojnaSetuSessions';
const SESSION_TTL_SECONDS = 24 * 60 * 60; // 24 hours

// In-memory fallback for local dev (no DynamoDB configured)
const memoryStore = new Map();

function getDynamoClient() {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) return null;
  const client = new DynamoDBClient({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
  return DynamoDBDocumentClient.from(client);
}

// GET /api/session?sessionId=xxx — retrieve session
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return Response.json({ error: 'sessionId required' }, { status: 400 });
  }

  try {
    const docClient = getDynamoClient();

    if (docClient) {
      const result = await docClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { sessionId },
      }));
      if (!result.Item) {
        return Response.json({ session: null });
      }
      return Response.json({ session: result.Item, source: 'dynamodb' });
    } else {
      // Memory fallback
      const session = memoryStore.get(sessionId) || null;
      return Response.json({ session, source: 'memory' });
    }
  } catch (error) {
    console.error('Session GET error:', error);
    const session = memoryStore.get(sessionId) || null;
    return Response.json({ session, source: 'memory_fallback', error: error.message });
  }
}

// POST /api/session — create or update session
export async function POST(request) {
  try {
    const body = await request.json();
    const { sessionId, language, messages, profile } = body;

    if (!sessionId) {
      return Response.json({ error: 'sessionId required' }, { status: 400 });
    }

    const now = Math.floor(Date.now() / 1000);
    const ttl = now + SESSION_TTL_SECONDS;

    const sessionData = {
      sessionId,
      language: language || 'hi',
      messages: messages || [],
      profile: profile || {},
      updatedAt: new Date().toISOString(),
      ttl,
    };

    const docClient = getDynamoClient();

    if (docClient) {
      // Check if session exists to set createdAt
      let createdAt = new Date().toISOString();
      try {
        const existing = await docClient.send(new GetCommand({
          TableName: TABLE_NAME,
          Key: { sessionId },
        }));
        if (existing.Item?.createdAt) createdAt = existing.Item.createdAt;
      } catch (_) {}

      await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: { ...sessionData, createdAt },
      }));

      return Response.json({ success: true, sessionId, source: 'dynamodb' });
    } else {
      // Memory fallback
      const existing = memoryStore.get(sessionId);
      memoryStore.set(sessionId, {
        ...sessionData,
        createdAt: existing?.createdAt || new Date().toISOString(),
      });
      // Cleanup old entries (keep max 500 sessions in memory)
      if (memoryStore.size > 500) {
        const firstKey = memoryStore.keys().next().value;
        memoryStore.delete(firstKey);
      }
      return Response.json({ success: true, sessionId, source: 'memory' });
    }
  } catch (error) {
    console.error('Session POST error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/session?sessionId=xxx — clear session (reset conversation)
export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return Response.json({ error: 'sessionId required' }, { status: 400 });
  }

  try {
    const docClient = getDynamoClient();
    if (docClient) {
      const { DeleteCommand } = await import('@aws-sdk/lib-dynamodb');
      await docClient.send(new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { sessionId },
      }));
    }
    memoryStore.delete(sessionId);
    return Response.json({ success: true });
  } catch (error) {
    console.error('Session DELETE error:', error);
    memoryStore.delete(sessionId);
    return Response.json({ success: true, note: error.message });
  }
}
