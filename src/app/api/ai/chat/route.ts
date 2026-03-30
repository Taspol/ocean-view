import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

let dnsPreferenceConfigured = false;

async function ensureIpv4FirstDns() {
  if (dnsPreferenceConfigured) return;

  try {
    const dns = await import('node:dns');
    if (typeof dns.setDefaultResultOrder === 'function') {
      dns.setDefaultResultOrder('ipv4first');
    }
  } catch {
    // Ignore if runtime does not expose node:dns.
  }

  dnsPreferenceConfigured = true;
}

type IncomingMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const SYSTEM_PROMPT = `You are a fishing assistant for fishermen.
When a user asks where to fish, extract:
1. Species (ปลาทู, ปลาหมึก, ปลากะตัก, etc.)
2. Date (วันนี้, พรุ่งนี้, etc.)
3. Region preference if any (อ่าวไทย, อันดามัน)

Then call the FisherThai API and respond in English with provide markdown formatted answer including:
**keep answer readable by seperately listing each location and its details. don't proide the table**
- Top 3 fishing locations (lat/lon converted to description)
- Probability of good catch
- Recommended gear (Thai name)
- Any warnings (spawning, closures)
- Google Maps link to each location`;
async function callProvider(args: {
  apiKey: string;
  model: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  timeoutMs?: number;
}): Promise<Response> {
  await ensureIpv4FirstDns();

  const body = {
    model: args.model,
    messages: args.messages,
    temperature: 0.6,
    max_completion_tokens: 512,
    top_p: 0.6,
    frequency_penalty: 0,
    stream: true,
  };

  const timeoutMs = args.timeoutMs ?? 30000;
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(`Upstream timeout after ${timeoutMs}ms`), timeoutMs);

  try {
    return await fetchWithRetry(
      'https://api.opentyphoon.ai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${args.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: timeoutController.signal,
      },
      1
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchWithRetry(url: string, init: RequestInit, retries = 2): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fetch(url, init);
    } catch (error) {
      lastError = error;
      if (attempt === retries) break;
      // Small backoff before next retry.
      await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Unknown fetch error');
}

function getErrorMeta(error: unknown): { message: string; code: string; causeMessage: string } {
  const message = error instanceof Error ? error.message : String(error);
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: string }).code || '')
      : '';
  const causeMessage =
    typeof error === 'object' && error !== null && 'cause' in error
      ? String((error as { cause?: unknown }).cause || '')
      : '';
  return { message, code, causeMessage };
}

function isTimeoutError(error: unknown): boolean {
  const { message, code, causeMessage } = getErrorMeta(error);
  const combined = `${message} ${causeMessage}`.toLowerCase();
  return combined.includes('timeout') || combined.includes('etimedout') || code === 'ETIMEDOUT';
}

export async function GET() {
  const apiKey = process.env.OPENTYPHOON_API_KEY;
  if (!apiKey) {
    return Response.json({ ok: false, error: 'Missing OPENTYPHOON_API_KEY' }, { status: 500 });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort('Connectivity check timeout after 10s'), 10000);

  try {
    const res = await fetch('https://api.opentyphoon.ai/v1/models', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      cache: 'no-store',
    });

    const text = await res.text();
    return Response.json(
      {
        ok: res.ok,
        status: res.status,
        statusText: res.statusText,
        sample: text.slice(0, 300),
      },
      { status: res.ok ? 200 : 502 }
    );
  } catch (error) {
    const meta = getErrorMeta(error);
    return Response.json(
      {
        ok: false,
        error: 'Connectivity check failed',
        ...meta,
      },
      { status: isTimeoutError(error) ? 504 : 500 }
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENTYPHOON_API_KEY;
    const model = process.env.OPENTYPHOON_MODEL || 'typhoon-v2.5-30b-a3b-instruct';

    if (!apiKey) {
      return new Response('Missing OPENTYPHOON_API_KEY.', { status: 500 });
    }

    const body = await request.json();
    const messages = (body?.messages || []) as IncomingMessage[];
    const pathname = typeof body?.pathname === 'string' ? body.pathname : '/';

    const requestMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'system',
        content: `Current page context: ${pathname}. Use this context when user asks about their current page or feature.`,
      },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const upstreamRes = await callProvider({
      apiKey,
      model,
      messages: requestMessages,
      timeoutMs: 30000,
    });

    if (!upstreamRes.ok || !upstreamRes.body) {
      const upstreamText = await upstreamRes.text();
      return new Response(
        `AI upstream error (${upstreamRes.status}): ${upstreamText || upstreamRes.statusText || 'Unknown upstream error'}`,
        { status: 502 }
      );
    }

    const reader = upstreamRes.body.getReader();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        let buffer = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            for (const rawLine of lines) {
              const line = rawLine.trim();
              if (!line.startsWith('data:')) continue;

              const payload = line.slice(5).trim();
              if (!payload || payload === '[DONE]') continue;

              try {
                const json = JSON.parse(payload) as {
                  choices?: Array<{ delta?: { content?: string } }>;
                };
                const token = json.choices?.[0]?.delta?.content || '';
                if (token) controller.enqueue(encoder.encode(token));
              } catch {
                // Ignore non-JSON SSE lines and continue streaming.
              }
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
      },
    });
  } catch (error) {
    console.error('AI chat route error:', error);
    const meta = getErrorMeta(error);
    if (isTimeoutError(error)) {
      return new Response(
        `AI chat timeout: Deployed server cannot reach api.opentyphoon.ai in time. message=${meta.message} code=${meta.code} cause=${meta.causeMessage}`,
        { status: 504 }
      );
    }
    return new Response(
      `AI chat error: message=${meta.message} code=${meta.code} cause=${meta.causeMessage}`,
      { status: 500 }
    );
  }
}
