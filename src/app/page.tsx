'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import styles from './page.module.css';

export default function HomePage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    React.useEffect(() => {
        if (!loading && user) {
            // Redirect authenticated users to dashboard
            router.push('/dashboard');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                fontSize: '18px',
                color: '#666',
            }}>
                Loading...
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div style={{
                maxWidth: '600px',
                margin: '60px auto',
                textAlign: 'center',
                padding: '40px',
            }}>
                <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>OceanView</h1>
                <p style={{ fontSize: '20px', color: '#666', marginBottom: '10px' }}>
                    Smart Fishery Intelligence
                </p>
                <p style={{ fontSize: '16px', color: '#999', marginBottom: '40px', lineHeight: '1.6' }}>
                    Real-time oceanic data, advanced analytics, and predicted fishing zones to help you make smarter decisions for your catches.
                </p>
                <a 
                    href="/login"
                    style={{
                        display: 'inline-block',
                        backgroundColor: '#0066cc',
                        color: 'white',
                        padding: '12px 32px',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        fontSize: '16px',
                        fontWeight: '500',
                        transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0052a3')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0066cc')}
                >
                    Get Started
                </a>
            </div>
        </div>
    );
}
