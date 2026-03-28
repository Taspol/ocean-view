'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import styles from '../app/page.module.css';

const STANDALONE_ROUTES = ['/', '/login', '/register', '/liff'];

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isStandalonePage = STANDALONE_ROUTES.some((route) => {
        if (route === '/') {
            return pathname === '/';
        }
        return pathname.startsWith(route);
    });
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Close sidebar when route changes
    useEffect(() => {
        setSidebarOpen(false);
    }, [pathname]);

    // Close sidebar on window resize to desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setSidebarOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (isStandalonePage) {
        return <>{children}</>;
    }

    return (
        <div className={styles.layout}>
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            {sidebarOpen && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.5)',
                        zIndex: 30,
                    }}
                    onClick={() => setSidebarOpen(false)}
                />
            )}
            <div className={styles.mainWrapper}>
                <header className={styles.header}>
                    <button
                        className={styles.menuBtn}
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        aria-label="Toggle navigation menu"
                    >
                        ☰
                    </button>
                    <h2>Dashboard</h2>
                </header>
                <main className={styles.mainContent}>
                    {children}
                </main>
            </div>
        </div>
    );
}
