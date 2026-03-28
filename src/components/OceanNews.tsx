'use client';

import React, { useState } from 'react';
import styles from './OceanNews.module.css';

type Severity = 'critical' | 'warning' | 'info' | 'good';

const NEWS_ITEMS = [
    {
        id: 1,
        severity: 'critical' as Severity,
        category: 'Storm Warning',
        title: 'Tropical Storm Advisory: Strong Winds Expected in Upper Gulf',
        summary: 'A developing tropical depression is projected to bring 40–60 km/h winds to the northern Gulf of Thailand over the next 48 hours. Fishermen are advised to delay offshore operations.',
        time: '2 hours ago',
    },
    {
        id: 2,
        severity: 'warning' as Severity,
        category: 'Wave Alert',
        title: 'Wave Heights Rising to 2.5m Along Chanthaburi Coast',
        summary: 'Monsoon-driven swells are intensifying along the eastern seaboard. Wave heights of 2–2.5m are expected through Thursday, posing moderate risk for small vessel operations.',
        time: '5 hours ago',
    },
    {
        id: 3,
        severity: 'good' as Severity,
        category: 'Good Conditions',
        title: 'Calm Seas Forecast for Andaman Sea This Weekend',
        summary: 'A high-pressure system is stabilizing conditions across the Andaman, with wave heights below 1m and light winds. Excellent outlook for fishing operations near Phuket and Krabi.',
        time: '8 hours ago',
    },
    {
        id: 4,
        severity: 'info' as Severity,
        category: 'Tide Update',
        title: 'Spring Tides Begin: Unusually High Tides Across Gulf Ports',
        summary: 'Spring tidal conditions are leading to above-normal high tides of up to +0.9m at major gulf ports. Coastal fishing near Bangkok Bay and Hua Hin may experience restricted access at low tide.',
        time: '1 day ago',
    },
];

export default function OceanNews() {
    const [expanded, setExpanded] = useState<number | null>(null);
    const [activeFilter, setActiveFilter] = useState<'all' | Severity>('all');

    const filteredItems = NEWS_ITEMS.filter((item) => activeFilter === 'all' || item.severity === activeFilter);

    const severityLabel = {
        critical: 'Critical',
        warning: 'Warning',
        info: 'Info',
        good: 'Good',
    };

    const severityClass = {
        critical: styles.severityCritical,
        warning: styles.severityWarning,
        info: styles.severityInfo,
        good: styles.severityGood,
    };

    return (
        <div className={styles.container}>
            <div className={styles.toolbar}>
                <div className={styles.liveBadge}>
                    Live Advisory Feed
                </div>
                <div className={styles.filterGroup} role="tablist" aria-label="Alert severity filters">
                    {(['all', 'critical', 'warning', 'info'] as const).map((filter) => (
                        <button
                            key={filter}
                            type="button"
                            role="tab"
                            aria-selected={activeFilter === filter}
                            className={`${styles.filterBtn} ${activeFilter === filter ? styles.filterBtnActive : ''}`}
                            onClick={() => setActiveFilter(filter)}
                        >
                            {filter === 'all' ? 'All' : severityLabel[filter]}
                        </button>
                    ))}
                </div>
            </div>

            <div className={styles.newsList}>
                {filteredItems.map((item) => {
                    const isExpanded = expanded === item.id;
                    const panelId = `news-panel-${item.id}`;
                    const buttonId = `news-button-${item.id}`;

                    return (
                        <article
                            key={item.id}
                            className={`${styles.newsCard} ${severityClass[item.severity]} ${isExpanded ? styles.expanded : ''}`}
                        >
                            <button
                                id={buttonId}
                                type="button"
                                aria-expanded={isExpanded}
                                aria-controls={panelId}
                                className={styles.cardButton}
                                onClick={() => setExpanded(isExpanded ? null : item.id)}
                            >
                                <div className={styles.cardMeta}>
                                    <span className={styles.feedType}>{item.category}</span>
                                    <span className={styles.time}>{item.time}</span>
                                </div>
                                <div className={styles.title}>{item.title}</div>
                                <span className={styles.chevron} aria-hidden="true">{isExpanded ? '−' : '+'}</span>
                            </button>

                            {isExpanded && (
                                <div id={panelId} role="region" aria-labelledby={buttonId} className={styles.summary}>
                                    {item.summary}
                                </div>
                            )}
                        </article>
                    );
                })}

                {filteredItems.length === 0 && (
                    <p className={styles.emptyState}>No advisories for this filter.</p>
                )}
            </div>
        </div>
    );
}
