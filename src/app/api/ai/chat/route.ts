import OpenAI from 'openai';
import { NextRequest } from 'next/server';

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

    const openai = new OpenAI({
      apiKey,
      baseURL: 'https://api.opentyphoon.ai/v1',
    });

    const stream = await openai.chat.completions.create({
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
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const token = chunk.choices?.[0]?.delta?.content || '';
            if (token) {
              controller.enqueue(encoder.encode(token));
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
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(`AI chat error: ${message}`, { status: 500 });
  }
}
