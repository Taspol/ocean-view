import React from 'react';
import styles from './DataWidget.module.css';

interface DataWidgetProps {
    title: string;
    value: string;
    icon: string;
}

export default function DataWidget({ title, value, icon }: DataWidgetProps) {
    return (
        <div className={`glass-panel ${styles.widget}`}>
            <div className={styles.header}>
                <span className={styles.title}>{title}</span>
                {icon && <span className={styles.icon}>{icon}</span>}
            </div>
            <div className={styles.content}>
                <h3 className={styles.value}>{value}</h3>
            </div>
        </div>
    );
}
