'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LIFFConnect() {
  const router = useRouter();
  const [status, setStatus] = useState('Connecting to LINE...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const startLineConnection = async () => {
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

          const redirectUri = `${window.location.origin}/liff/connect`;
          liff.login({ redirectUri });
          return;
        }

        setStatus('Reading LINE profile...');
        const profile = await liff.getProfile();
        const rawLineUserId = profile.userId;

        if (!rawLineUserId) {
          throw new Error('Unable to read LINE user ID');
        }

        // Store in localStorage for signup form to read
        localStorage.setItem('lineUserId', rawLineUserId);
        setStatus('LINE connected! Redirecting back to signup...');

        // Close the LIFF window if in browser (mobile context), or navigate back
        if (liff.isInClient()) {
          liff.closeWindow();
        } else {
          window.close();
        }

        // Fallback: redirect back to signup after a short delay
        setTimeout(() => {
          if (isMounted) {
            window.history.back();
          }
        }, 1000);
      } catch (err) {
        if (!isMounted) return;
        const message = err instanceof Error ? err.message : 'LINE connection failed';
        setError(message);

        // After 3 seconds, go back anyway
        setTimeout(() => {
          if (isMounted) {
            window.history.back();
          }
        }, 3000);
      }
    };

    void startLineConnection();

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
        <h1 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Connecting to LINE</h1>
        <p style={{ margin: 0, opacity: 0.8 }}>{error || status}</p>
      </section>
    </main>
  );
}
