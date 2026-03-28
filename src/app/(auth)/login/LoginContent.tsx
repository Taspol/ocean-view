'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import TravelConnectSignIn1 from '@/components/ui/travel-connect-signin-1';

export default function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get('redirectTo') || '/dashboard';
    const { user, loading: authLoading, logIn, signUp, error: authError, clearError } = useAuth();
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rawLineUserId, setRawLineUserId] = useState('');
    const [birthdate, setBirthdate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [lineConnecting, setLineConnecting] = useState(false);

    useEffect(() => {
        const modeParam = searchParams.get('mode');
        const rawLineUserIdParam = searchParams.get('rawLineUserId');

        if (modeParam === 'signup' || modeParam === 'login') {
            setMode(modeParam);
        }

        if (rawLineUserIdParam) {
            setRawLineUserId(rawLineUserIdParam);
            setMode('signup');
            return;
        }

        const storedLineUserId = localStorage.getItem('lineUserId');
        if (storedLineUserId) {
            setRawLineUserId(storedLineUserId);
            setMode('signup');
            localStorage.removeItem('lineUserId');
        }
    }, [searchParams]);

    useEffect(() => {
        if (!authLoading && user) {
            router.replace('/dashboard');
        }
    }, [authLoading, user, router]);

    const handleModeSwitch = (newMode: 'login' | 'signup') => {
        setMode(newMode);
        setError('');
        setSuccessMessage('');
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
        setSuccessMessage('');
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
                if (result.requiresEmailConfirmation) {
                    setLoading(false);
                    setSuccessMessage('Account created successfully. Please check your email and confirm your account before logging in.');
                    return;
                }
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

    const displayError = error || authError || undefined;

    return (
        <TravelConnectSignIn1
            mode={mode}
            setMode={handleModeSwitch}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            birthdate={birthdate}
            setBirthdate={setBirthdate}
            loading={loading}
            lineConnected={Boolean(rawLineUserId)}
            lineConnecting={lineConnecting}
            onConnectLine={handleConnectLine}
            onSubmit={handleSubmit}
            error={displayError}
            successMessage={successMessage}
        />
    );
}
