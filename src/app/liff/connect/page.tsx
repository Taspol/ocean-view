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
        minHeight: '100svh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        background: '#ffffff',
        color: '#0f172a',
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: '420px',
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: '14px',
          padding: '24px',
          boxShadow: '0 12px 32px -20px rgba(15, 23, 42, 0.35)',
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: '1.375rem', marginBottom: '8px', color: '#0f172a' }}>Connecting to LINE</h1>
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
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                border: '2px solid rgba(15, 23, 42, 0.2)',
                borderTopColor: '#0284c7',
                animation: 'line-connect-spin 0.7s linear infinite',
              }}
            />
          )}
          <p style={{ margin: 0, color: error ? '#b91c1c' : '#334155', fontWeight: 500 }}>{error || status}</p>
        </div>

        <style jsx>{`
          @keyframes line-connect-spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </section>
    </main>
  );
}
