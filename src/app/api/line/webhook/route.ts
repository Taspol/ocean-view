import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Validate LINE webhook signature here in a real app
        // const signature = req.headers.get('x-line-signature');

        console.log('Received LINE webhook event:', JSON.stringify(body, null, 2));

        // Handle events (message, follow, etc.)
        if (body.events && body.events.length > 0) {
            for (const event of body.events) {
                if (event.type === 'message' && event.message.type === 'text') {
                    console.log(`User ${event.source.userId} sent: ${event.message.text}`);

                    // In a full implementation, you'd use the LINE Messaging API to reply.
                    // Example mock response: "Your routine oceanic data report for Zone Alpha is ready."
                }
            }
        }

        // Always respond with 200 OK to LINE Platform
        return new NextResponse('OK', { status: 200 });
    } catch (error) {
        console.error('Error handling LINE webhook:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({
        status: 'active',
        service: 'Smart Fishery LINE Webhook',
        timestamp: new Date().toISOString()
    });
}
