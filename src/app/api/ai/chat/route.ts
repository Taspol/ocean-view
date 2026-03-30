import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENTYPHOON_API_KEY || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return new Response('Missing OPENTYPHOON_API_KEY (or OPENAI_API_KEY).', { status: 500 });
    }

    const body = await request.json();
    const messages = (body?.messages || []) as IncomingMessage[];
    const pathname = typeof body?.pathname === 'string' ? body.pathname : '/';

    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort('Upstream timeout after 30s'), 30000);

    let upstreamRes: Response;
    try {
      upstreamRes = await fetch('https://api.opentyphoon.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'typhoon-v2.5-30b-a3b-instruct',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            {
              role: 'system',
              content: `Current page context: ${pathname}. Use this context when user asks about their current page or feature.`,
            },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
          ],
          temperature: 0.6,
          max_completion_tokens: 512,
          top_p: 0.6,
          frequency_penalty: 0,
          stream: true,
        }),
        signal: timeoutController.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

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
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(`AI chat error: ${message}`, { status: 500 });
  }
}
