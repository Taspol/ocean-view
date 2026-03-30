'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import styles from './AIAssistantWidget.module.css';

type ChatMsg = {
    role: 'user' | 'assistant';
    text: string;
};

export default function AIAssistantWidget() {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [messages, setMessages] = useState<ChatMsg[]>([
        {
            role: 'assistant',
            text: 'Hi! I am AI Assistance. Ask me anything about this page or your workflow.',
        },
    ]);

    const pageLabel = useMemo(() => pathname || '/', [pathname]);

    useEffect(() => {
        const handler = () => setOpen(true);
        window.addEventListener('ai-assistant:open', handler as EventListener);
        return () => {
            window.removeEventListener('ai-assistant:open', handler as EventListener);
        };
    }, []);

    const sendMessage = async () => {
        const text = input.trim();
        if (!text || isSending) return;

        const nextMessages = [...messages, { role: 'user' as const, text }];
        setMessages(nextMessages);
        setInput('');
        setIsSending(true);

        // Create an empty assistant bubble first, then stream tokens into it.
        setMessages((prev) => [...prev, { role: 'assistant', text: '' }]);

        try {
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    pathname: pageLabel,
                    messages: nextMessages.map((m) => ({
                        role: m.role,
                        content: m.text,
                    })),
                }),
            });

            if (!response.ok || !response.body) {
                const errText = await response.text();
                throw new Error(errText || 'Failed to get AI response.');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                fullText += decoder.decode(value, { stream: true });

                setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { role: 'assistant', text: fullText };
                    return updated;
                });
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to connect to AI provider.';
            setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', text: `Error: ${message}` };
                return updated;
            });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <>
            {open && (
                <div className={styles.panel} role="dialog" aria-label="AI Assistance chat panel">
                    <div className={styles.header}>
                        <div>
                            <div className={styles.title}>AI Assistance</div>
                            <div className={styles.subtitle}>Ask anything about this page</div>
                        </div>
                        <button className={styles.ghostBtn} onClick={() => setOpen(false)} aria-label="Close AI Assistance">
                            ×
                        </button>
                    </div>

                    <div className={styles.routeBar}>Page context: {pageLabel}</div>

                    <div className={styles.messages}>
                        {messages.map((m, i) => (
                            <div key={`${m.role}-${i}`} className={m.role === 'user' ? styles.msgUser : styles.msgBot}>
                                {m.role === 'assistant' ? (
                                    <ReactMarkdown
                                        components={{
                                            p: ({ children }) => <p style={{ margin: '0 0 0.28rem 0', padding: 0, lineHeight: 1.48, color: 'inherit' }}>{children}</p>,
                                            h1: ({ children }) => <h1 style={{ margin: '0 0 0.22rem 0', padding: 0, fontSize: '1em', fontWeight: 700, lineHeight: 1.35, color: 'inherit' }}>{children}</h1>,
                                            h2: ({ children }) => <h2 style={{ margin: '0 0 0.2rem 0', padding: 0, fontSize: '0.96em', fontWeight: 700, lineHeight: 1.35, color: 'inherit' }}>{children}</h2>,
                                            h3: ({ children }) => <h3 style={{ margin: '0 0 0.18rem 0', padding: 0, fontSize: '0.92em', fontWeight: 700, lineHeight: 1.35, color: 'inherit' }}>{children}</h3>,
                                            ul: ({ children }) => <ul style={{ margin: '0 0 0.24rem 0', padding: 0, paddingLeft: '1rem', lineHeight: 1.48, color: 'inherit' }}>{children}</ul>,
                                            ol: ({ children }) => <ol style={{ margin: '0 0 0.24rem 0', padding: 0, paddingLeft: '1rem', lineHeight: 1.48, color: 'inherit' }}>{children}</ol>,
                                            li: ({ children }) => <li style={{ margin: '0 0 0.1rem 0', padding: 0, lineHeight: 1.48, color: 'inherit' }}>{children}</li>,
                                            code: ({ children }) => (
                                                <code style={{
                                                    background: m.role === 'assistant' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)',
                                                    color: m.role === 'assistant' ? '#000' : '#fff',
                                                    padding: '1px 4px',
                                                    borderRadius: '4px',
                                                    fontSize: '0.84em',
                                                    fontFamily: 'monospace',
                                                }}
                                                >
                                                    {children}
                                                </code>
                                            ),
                                            strong: ({ children }) => <strong style={{ color: 'inherit' }}>{children}</strong>,
                                            em: ({ children }) => <em style={{ color: 'inherit' }}>{children}</em>,
                                        }}
                                    >
                                        {m.text}
                                    </ReactMarkdown>
                                ) : (
                                    m.text
                                )}
                            </div>
                        ))}
                    </div>

                    <div className={styles.inputRow}>
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    sendMessage();
                                }
                            }}
                            className={styles.input}
                            placeholder="Ask AI Assistance..."
                            aria-label="Type message"
                            disabled={isSending}
                        />
                        <button className={styles.send} onClick={sendMessage} disabled={isSending}>
                            {isSending ? '...' : 'Send'}
                        </button>
                    </div>
                </div>
            )}

            <button
                className={styles.fab}
                onClick={() => setOpen((v) => !v)}
                aria-label="Open AI Assistance"
                title="AI Assistance"
            >
                <svg className={styles.fabIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M12 3L13.9 7.8L18.7 9.7L13.9 11.6L12 16.4L10.1 11.6L5.3 9.7L10.1 7.8L12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M18 14.5L18.7 16.3L20.5 17L18.7 17.7L18 19.5L17.3 17.7L15.5 17L17.3 16.3L18 14.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>
        </>
    );
}
