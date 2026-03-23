'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import styles from './Sidebar.module.css';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { logOut } = useAuth();

    const handleNavClick = () => {
        if (onClose) {
            onClose();
        }
    };

    return (
        <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
            <div className={styles.logoArea}>
                <h2 className={styles.logoTitle}>OceanView</h2>
            </div>
            <nav className={styles.nav}>
                <Link
                    href="/dashboard"
                    className={`${styles.navItem} ${pathname === '/dashboard' ? styles.navItemActiveParent : ''}`}
                    style={{ textDecoration: 'none' }}
                    onClick={handleNavClick}
                >
                    <span className={styles.icon}>🏠</span>
                    Dashboard
                </Link>

                <Link
                    href="/maps"
                    className={`${styles.navItem} ${pathname === '/maps' ? styles.navItemActiveParent : ''}`}
                    style={{ textDecoration: 'none' }}
                    onClick={handleNavClick}
                >
                    <span className={styles.icon}>🗺️</span>
                    Fishing Maps
                </Link>

                <Link
                    href="/weather"
                    className={`${styles.navItem} ${pathname === '/weather' ? styles.navItemActiveParent : ''}`}
                    style={{ textDecoration: 'none' }}
                    onClick={handleNavClick}
                >
                    <span className={styles.icon}>⛅</span>
                    Weather Forecast
                </Link>
            </nav>

            <div className={styles.bottomMenu}>
                <Link
                    href="/settings"
                    className={`${styles.navItem} ${pathname === '/settings' ? styles.navItemActiveParent : ''}`}
                    style={{ textDecoration: 'none' }}
                    onClick={handleNavClick}
                >
                    <span className={styles.icon}>⚙️</span>
                    Settings
                </Link>

                <button
                    className={styles.logoutBtn}
                    onClick={async () => {
                        try {
                            await logOut();
                            handleNavClick();
                            router.push('/login');
                        } catch (err) {
                            console.error('Logout error:', err);
                        }
                    }}
                >
                    <span className={styles.icon}>🚪</span>
                    Logout
                </button>
            </div>
        </aside>
    );
}
