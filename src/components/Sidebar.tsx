'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import styles from './Sidebar.module.css';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

function NavIcon({ type }: { type: 'dashboard' | 'maps' | 'prediction' | 'weather' | 'settings' | 'logout' }) {
    const commonProps = {
        className: styles.iconSvg,
        viewBox: '0 0 24 24',
        fill: 'none',
        xmlns: 'http://www.w3.org/2000/svg',
        'aria-hidden': true,
    } as const;

    if (type === 'dashboard') {
        return (
            <svg {...commonProps}>
                <path d="M4 5H11V11H4V5ZM13 5H20V8H13V5ZM13 10H20V19H13V10ZM4 13H11V19H4V13Z" stroke="currentColor" strokeWidth="1.7" />
            </svg>
        );
    }

    if (type === 'maps') {
        return (
            <svg {...commonProps}>
                <path d="M3 6.5L8.5 4L15.5 6.5L21 4V17.5L15.5 20L8.5 17.5L3 20V6.5Z" stroke="currentColor" strokeWidth="1.7" />
                <path d="M8.5 4V17.5M15.5 6.5V20" stroke="currentColor" strokeWidth="1.7" />
            </svg>
        );
    }

    if (type === 'weather') {
        return (
            <svg {...commonProps}>
                <path d="M7 16C4.79 16 3 14.21 3 12C3 9.79 4.79 8 7 8C7.49 8 7.96 8.09 8.4 8.24C9.07 6.32 10.9 5 13 5C15.76 5 18 7.24 18 10C19.66 10 21 11.34 21 13C21 14.66 19.66 16 18 16H7Z" stroke="currentColor" strokeWidth="1.7" />
            </svg>
        );
    }

    if (type === 'prediction') {
        return (
            <svg {...commonProps}>
                <path d="M4 6H20" stroke="currentColor" strokeWidth="1.7" />
                <path d="M4 12H14" stroke="currentColor" strokeWidth="1.7" />
                <path d="M4 18H10" stroke="currentColor" strokeWidth="1.7" />
                <path d="M17 15L20 18L17 21" stroke="currentColor" strokeWidth="1.7" />
            </svg>
        );
    }

    if (type === 'settings') {
        return (
            <svg {...commonProps}>
                <path d="M12 8.5C10.07 8.5 8.5 10.07 8.5 12C8.5 13.93 10.07 15.5 12 15.5C13.93 15.5 15.5 13.93 15.5 12C15.5 10.07 13.93 8.5 12 8.5Z" stroke="currentColor" strokeWidth="1.7" />
                <path d="M19.4 15A1.66 1.66 0 0 0 19.73 16.82L19.79 16.88A2 2 0 1 1 16.96 19.71L16.9 19.65A1.66 1.66 0 0 0 15.08 19.32A1.66 1.66 0 0 0 14 20.85V21A2 2 0 1 1 10 21V20.85A1.66 1.66 0 0 0 8.92 19.32A1.66 1.66 0 0 0 7.1 19.65L7.04 19.71A2 2 0 1 1 4.21 16.88L4.27 16.82A1.66 1.66 0 0 0 4.6 15A1.66 1.66 0 0 0 3.07 13.92H3A2 2 0 1 1 3 9.92H3.15A1.66 1.66 0 0 0 4.6 8.92A1.66 1.66 0 0 0 4.27 7.1L4.21 7.04A2 2 0 1 1 7.04 4.21L7.1 4.27A1.66 1.66 0 0 0 8.92 4.6H9A1.66 1.66 0 0 0 10 3.15V3A2 2 0 1 1 14 3V3.15A1.66 1.66 0 0 0 15.08 4.6A1.66 1.66 0 0 0 16.9 4.27L16.96 4.21A2 2 0 1 1 19.79 7.04L19.73 7.1A1.66 1.66 0 0 0 19.4 8.92V9A1.66 1.66 0 0 0 20.93 10.08H21A2 2 0 1 1 21 14.08H20.85A1.66 1.66 0 0 0 19.4 15Z" stroke="currentColor" strokeWidth="1.4" />
            </svg>
        );
    }

    return (
        <svg {...commonProps}>
            <path d="M10 17L15 12L10 7" stroke="currentColor" strokeWidth="1.7" />
            <path d="M15 12H3" stroke="currentColor" strokeWidth="1.7" />
            <path d="M13 4H19C20.1 4 21 4.9 21 6V18C21 19.1 20.1 20 19 20H13" stroke="currentColor" strokeWidth="1.7" />
        </svg>
    );
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
                <div className={styles.logoRow}>
                    <Image src="/logo.png" alt="OceanView logo" width={140} height={42} className={styles.logoImage} priority />
                </div>
                {/* <p className={styles.logoEyebrow}>Marine Ops</p> */}
            </div>
            <nav className={styles.nav}>
                <Link
                    href="/dashboard"
                    className={`${styles.navItem} ${pathname === '/dashboard' ? styles.navItemActiveParent : ''}`}
                    onClick={handleNavClick}
                >
                    <span className={styles.iconWrap}><NavIcon type="dashboard" /></span>
                    <span>Dashboard</span>
                </Link>

                <Link
                    href="/maps"
                    className={`${styles.navItem} ${pathname === '/maps' ? styles.navItemActiveParent : ''}`}
                    onClick={handleNavClick}
                >
                    <span className={styles.iconWrap}><NavIcon type="maps" /></span>
                    <span>Fishing Maps</span>
                </Link>

                <Link
                    href="/weather"
                    className={`${styles.navItem} ${pathname === '/weather' ? styles.navItemActiveParent : ''}`}
                    onClick={handleNavClick}
                >
                    <span className={styles.iconWrap}><NavIcon type="weather" /></span>
                    <span>Weather Forecast</span>
                </Link>

                <Link
                    href="/prediction"
                    className={`${styles.navItem} ${pathname === '/prediction' ? styles.navItemActiveParent : ''}`}
                    onClick={handleNavClick}
                >
                    <span className={styles.iconWrap}><NavIcon type="prediction" /></span>
                    <span>Prediction</span>
                </Link>
            </nav>

            <div className={styles.bottomMenu}>
                <Link
                    href="/settings"
                    className={`${styles.navItem} ${pathname === '/settings' ? styles.navItemActiveParent : ''}`}
                    onClick={handleNavClick}
                >
                    <span className={styles.iconWrap}><NavIcon type="settings" /></span>
                    <span>Settings</span>
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
                    <span className={styles.iconWrap}><NavIcon type="logout" /></span>
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
}
