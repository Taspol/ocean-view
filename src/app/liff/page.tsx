'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LIFFDashboard() {
    const router = useRouter();
    const [status, setStatus] = useState('Connecting to LINE...');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const startLiffLoginFlow = async () => {
            try {
                const liffId = process.env.NEXT_PUBLIC_LIFF_LOGIN_ID;

                if (!liffId) {
                    throw new Error('Missing NEXT_PUBLIC_LIFF_LOGIN_ID in environment');
                }

                const liffModule = await import('@line/liff');
                const liff = liffModule.default;

                await liff.init({ liffId });

                if (!liff.isLoggedIn()) {
                    const isHttps = window.location.protocol === 'https:';
                    const isLocalhost = window.location.hostname === 'localhost';

                    if (!isHttps && !isLocalhost) {
                        throw new Error('LINE Login requires an HTTPS LIFF endpoint. Use an HTTPS tunnel URL and update LIFF Endpoint URL in LINE Developers Console.');
                    }

                    const redirectUri = `${window.location.origin}/liff`;
                    liff.login({ redirectUri });
                    return;
                }

                setStatus('Reading LINE profile...');
                const profile = await liff.getProfile();
                const rawLineUserId = profile.userId;
                const idToken = liff.getIDToken();
                const accessToken = liff.getAccessToken();

                if (!rawLineUserId || (!idToken && !accessToken)) {
                    throw new Error('Unable to read LINE user ID from profile');
                }

                setStatus('Checking account link...');
                const response = await fetch('/api/auth/line/session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ rawLineUserId, idToken, accessToken }),
                    credentials: 'include',
                });

                if (response.ok) {
                    setStatus('Login successful, redirecting...');
                    window.location.href = '/dashboard';
                    return;
                }

                if (response.status === 404) {
                    setStatus('No linked account found, redirecting to signup...');
                    localStorage.setItem('lineUserId', rawLineUserId);
                    const params = new URLSearchParams({
                        mode: 'signup',
                        rawLineUserId,
                        redirectTo: '/dashboard',
                    });
                    router.replace(`/login?${params.toString()}`);
                    return;
                }

                const payload = (await response.json().catch(() => ({}))) as { error?: string };
                throw new Error(payload.error || 'Failed to authenticate with LINE');
            } catch (err) {
                if (!isMounted) return;
                const message = err instanceof Error ? err.message : 'LINE login failed';
                setError(message);
            }
        };

        void startLiffLoginFlow();

        return () => {
            isMounted = false;
        };
    }, [router]);

    return (
        <main
            style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px 16px',
                background: 'var(--background)',
                color: 'var(--foreground)',
            }}
        >
            <section
                style={{
                    width: '100%',
                    maxWidth: '420px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '20px',
                    textAlign: 'center',
                }}
            >
                <h1 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>LINE Login</h1>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        marginTop: '8px',
                    }}
                >
                    {!error && (
                        <span
                            aria-hidden="true"
                            style={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                border: '2px solid rgba(148, 163, 184, 0.4)',
                                borderTopColor: '#0ea5e9',
                                animation: 'line-login-spin 0.7s linear infinite',
                            }}
                        />
                    )}
                    <p style={{ margin: 0, opacity: 0.8 }}>{error || status}</p>
                </div>

                <style jsx>{`
                    @keyframes line-login-spin {
                        to {
                            transform: rotate(360deg);
                        }
                    }
                `}</style>
            </section>
        </main>
    );
}
