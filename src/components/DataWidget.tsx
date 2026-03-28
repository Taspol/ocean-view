import React from 'react';
import styles from './DataWidget.module.css';

interface DataWidgetProps {
    title: string;
    value: string;
    icon: string;
    meta?: string;
    tone?: 'info' | 'warning' | 'success' | 'neutral';
}

export default function DataWidget({ title, value, icon, meta, tone = 'neutral' }: DataWidgetProps) {
    const toneClass = {
        info: styles.toneInfo,
        warning: styles.toneWarning,
        success: styles.toneSuccess,
        neutral: styles.toneNeutral,
    }[tone];

    return (
        <article className={`${styles.widget} ${toneClass}`}>
            <div className={styles.header}>
                <span className={styles.title}>{title}</span>
                {icon && <span className={styles.icon}>{icon}</span>}
            </div>
            <div className={styles.content}>
                <h3 className={styles.value}>{value}</h3>
                {meta && <p className={styles.meta}>{meta}</p>}
            </div>
        </article>
    );
}
