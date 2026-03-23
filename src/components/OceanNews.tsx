'use client';

import React, { useState } from 'react';
import styles from './OceanNews.module.css';

const NEWS_ITEMS = [
    {
        id: 1,
        category: 'Storm Warning',
        title: 'Tropical Storm Advisory: Strong Winds Expected in Upper Gulf',
        summary: 'A developing tropical depression is projected to bring 40–60 km/h winds to the northern Gulf of Thailand over the next 48 hours. Fishermen are advised to delay offshore operations.',
        time: '2 hours ago',
    },
    {
        id: 2,
        category: 'Wave Alert',
        title: 'Wave Heights Rising to 2.5m Along Chanthaburi Coast',
        summary: 'Monsoon-driven swells are intensifying along the eastern seaboard. Wave heights of 2–2.5m are expected through Thursday, posing moderate risk for small vessel operations.',
        time: '5 hours ago',
    },
    {
        id: 3,
        category: 'Good Conditions',
        title: 'Calm Seas Forecast for Andaman Sea This Weekend',
        summary: 'A high-pressure system is stabilizing conditions across the Andaman, with wave heights below 1m and light winds. Excellent outlook for fishing operations near Phuket and Krabi.',
        time: '8 hours ago',
    },
    {
        id: 4,
        category: 'Tide Update',
        title: 'Spring Tides Begin: Unusually High Tides Across Gulf Ports',
        summary: 'Spring tidal conditions are leading to above-normal high tides of up to +0.9m at major gulf ports. Coastal fishing near Bangkok Bay and Hua Hin may experience restricted access at low tide.',
        time: '1 day ago',
    },
];

export default function OceanNews() {
    const [expanded, setExpanded] = useState<number | null>(null);

    return (
        <div>
            <div className={styles.container}>

                <div className={styles.newsList}>
                    {NEWS_ITEMS.map((item) => (
                        <div
                            key={item.id}
                            className={`${styles.newsCard} ${expanded === item.id ? styles.expanded : ''}`}
                            onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                        >
                            <div className={styles.cardTop}>
                                <div className={styles.cardContent}>
                                    <div className={styles.cardMeta}>
                                        <span className={styles.category}>{item.category}</span>
                                        <span className={styles.time}>{item.time}</span>
                                    </div>
                                    <div className={styles.title}>{item.title}</div>
                                </div>
                                <span className={styles.chevron}>{expanded === item.id ? '▲' : '▼'}</span>
                            </div>
                            {expanded === item.id && (
                                <div className={styles.summary}>{item.summary}</div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
