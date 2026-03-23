'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import styles from './login.module.css';

export default function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get('redirectTo') || '/dashboard';
    const { logIn, signUp, error: authError, clearError } = useAuth();
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rawLineUserId, setRawLineUserId] = useState('');
    const [birthdate, setBirthdate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [lineConnecting, setLineConnecting] = useState(false);

    useEffect(() => {
        const modeParam = searchParams.get('mode');

        if (modeParam === 'signup' || modeParam === 'login') {
            setMode(modeParam);
        }
    }, [searchParams]);

    const handleModeSwitch = (newMode: 'login' | 'signup') => {
        setMode(newMode);
        setError('');
        clearError();
        // Reset form
        setEmail('');
        setPassword('');
        setBirthdate('');
    };

    const handleConnectLine = () => {
        setLineConnecting(true);
        
        // Open LIFF connect window
        const liffConnectUrl = `${window.location.origin}/liff/connect`;
        const width = 500;
        const height = 600;
        const left = (window.innerWidth - width) / 2;
        const top = (window.innerHeight - height) / 2;
        
        const popup = window.open(
            liffConnectUrl,
            'LINE_CONNECT',
            `width=${width},height=${height},left=${left},top=${top}`
        );

        // Poll for localStorage value set by the popup
        const checkInterval = setInterval(() => {
            const lineUserId = localStorage.getItem('lineUserId');
            if (lineUserId) {
                clearInterval(checkInterval);
                setRawLineUserId(lineUserId);
                localStorage.removeItem('lineUserId');
                setLineConnecting(false);
                if (popup && !popup.closed) {
                    popup.close();
                }
            }
        }, 500);

        // Timeout after 2 minutes
        setTimeout(() => {
            clearInterval(checkInterval);
            setLineConnecting(false);
            if (popup && !popup.closed) {
                popup.close();
            }
        }, 120000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        clearError();

        // Validate required fields
        if (!email || !password) {
            setError('Email and password are required.');
            return;
        }

        if (mode === 'signup') {
            // For signup, email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                setError('Please enter a valid email address.');
                return;
            }

            if (password.length < 6) {
                setError('Password must be at least 6 characters long.');
                return;
            }
        }

        setLoading(true);

        try {
            if (mode === 'login') {
                const result = await logIn(email, password);
                console.log('Login successful, redirecting to:', redirectTo);
            } else {
                const result = await signUp(email, password, rawLineUserId || undefined, birthdate || undefined);
                console.log('Signup successful, redirecting to:', redirectTo);
            }
            
            // Give a moment for the user state to update in context
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Redirect to the intended page or dashboard
            console.log('Navigating to:', redirectTo);
            router.push(redirectTo);
        } catch (err) {
            // Error is handled by authError from context
            setLoading(false);
            console.error('Auth error:', err);
            // Optionally display the error to user
            if (err instanceof Error) {
                setError(err.message);
            }
        }
    };

    const displayError = error || authError;

    return (
        <div className={styles.page}>
            <div className={styles.card}>
                <div className={styles.brand}>
                    <h1 className={styles.brandName}>OceanView</h1>
                    <p className={styles.brandSub}>Smart Fishery Intelligence</p>
                </div>

                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${mode === 'login' ? styles.tabActive : ''}`}
                        onClick={() => handleModeSwitch('login')}
                        disabled={loading}
                    >
                        Log In
                    </button>
                    <button
                        className={`${styles.tab} ${mode === 'signup' ? styles.tabActive : ''}`}
                        onClick={() => handleModeSwitch('signup')}
                        disabled={loading}
                    >
                        Sign Up
                    </button>
                </div>

                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.field}>
                        <label className={styles.label}>Email Address <span style={{ color: 'red' }}>*</span></label>
                        <input
                            type="email"
                            className={styles.input}
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            disabled={loading}
                            required
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Password <span style={{ color: 'red' }}>*</span></label>
                        <input
                            type="password"
                            className={styles.input}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                            disabled={loading}
                            required
                        />
                    </div>

                    {mode === 'signup' && (
                        <>
                            <div className={styles.field}>
                                <label className={styles.label}>LINE Account <span style={{ color: '#999', fontSize: '0.8em' }}>(optional)</span></label>
                                {rawLineUserId ? (
                                    <div
                                        style={{
                                            padding: '12px 14px',
                                            border: '1px solid #10B981',
                                            borderRadius: '8px',
                                            background: '#f0fdf4',
                                            color: '#10B981',
                                            fontWeight: 600,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            minHeight: '44px',
                                        }}
                                    >
                                        <span>✓ Connected to LINE</span>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleConnectLine}
                                        disabled={loading || lineConnecting}
                                        style={{
                                            padding: '12px 14px',
                                            border: '2px solid #0ea5e9',
                                            borderRadius: '8px',
                                            background: '#f0f9ff',
                                            color: '#0ea5e9',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            minHeight: '44px',
                                            width: '100%',
                                            fontSize: '1rem',
                                            transition: 'all 0.2s',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = '#0ea5e9';
                                            e.currentTarget.style.color = 'white';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = '#f0f9ff';
                                            e.currentTarget.style.color = '#0ea5e9';
                                        }}
                                    >
                                        {lineConnecting ? 'Connecting...' : 'Connect LINE'}
                                    </button>
                                )}
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label}>Birthdate <span style={{ color: '#999', fontSize: '0.8em' }}>(optional)</span></label>
                                <input
                                    type="date"
                                    className={styles.input}
                                    value={birthdate}
                                    onChange={(e) => setBirthdate(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                        </>
                    )}

                    {displayError && <div className={styles.errorMsg}>{displayError}</div>}

                    <button 
                        type="submit" 
                        className={styles.submitBtn}
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : (mode === 'login' ? 'Log In' : 'Create Account')}
                    </button>

                    {mode === 'login' && (
                        <p className={styles.forgotLink}>
                            <a href="#">Forgot password?</a>
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
}
