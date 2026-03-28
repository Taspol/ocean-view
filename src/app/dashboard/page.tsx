'use client';

import React, { useState } from "react";
import { ProtectedRoute } from "@/lib/protectedRoute";
import DataWidget from "@/components/DataWidget";
import MonitoredZones from "@/components/MonitoredZones";
import OceanNews from "@/components/OceanNews";
import { ALL_ZONES } from "@/lib/zones";
import styles from "../page.module.css";
import zoneStyles from "../dashboard.module.css";

function DashboardContent() {
    const [selectedZoneId, setSelectedZoneId] = useState('z1');
    const selectedZone = ALL_ZONES.find(z => z.id === selectedZoneId) ?? ALL_ZONES[0];
    const metrics = [
        {
            title: 'Sea Surface Temp',
            value: selectedZone.env.temp,
            tone: 'info' as const,
            meta: 'Updated every 5 min',
        },
        {
            title: 'Wave Height',
            value: selectedZone.env.waveHeight,
            tone: 'warning' as const,
            meta: 'Monitor small vessels',
        },
        {
            title: 'Active Vessels',
            value: selectedZone.env.vessels,
            tone: 'neutral' as const,
            meta: 'Fleet activity',
        },
        {
            title: 'Predicted Catch',
            value: selectedZone.env.catchRate,
            tone: 'success' as const,
            meta: 'Model confidence high',
        },
    ];

    return (
        <div className={zoneStyles.dashboardPage}>
            <section className={zoneStyles.sectionBlock}>
                <div className={styles.configHeader}>
                    <h2>Marine Alerts</h2>
                    <p>Critical weather and safety updates across monitored waters.</p>
                </div>
                <OceanNews />
            </section>

            <section className={zoneStyles.sectionBlock}>
                <div className={styles.configHeader}>
                    <div className={zoneStyles.envHeader}>
                        <div>
                            <h2>Overall Environment</h2>
                            <p>Live metrics for {selectedZone.name}.</p>
                        </div>

                        <div className={zoneStyles.zoneControl}>
                            <label htmlFor="active-zone" className={zoneStyles.zoneLabel}>Active Zone</label>
                            <select
                                id="active-zone"
                                name="active-zone"
                                className={zoneStyles.zoneSelect}
                                value={selectedZoneId}
                                onChange={(e) => setSelectedZoneId(e.target.value)}
                            >
                                {ALL_ZONES.map(z => (
                                    <option key={z.id} value={z.id}>{z.name}</option>
                                ))}
                            </select>
                            <span className={zoneStyles.zoneHint}>Data refreshes every 5 minutes</span>
                        </div>
                    </div>
                </div>

                <div className={zoneStyles.metricsGrid}>
                    {metrics.map((metric) => (
                        <DataWidget
                            key={metric.title}
                            title={metric.title}
                            value={metric.value}
                            icon=""
                            tone={metric.tone}
                            meta={metric.meta}
                        />
                    ))}
                </div>
            </section>

            <section className={zoneStyles.sectionBlock}>
                <div className={styles.configHeader}>
                    <h2>Monitored High-Yield Zones</h2>
                    <p>Tracked regions with a high probability of successful catches.</p>
                </div>

                <MonitoredZones />
            </section>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <ProtectedRoute>
            <DashboardContent />
        </ProtectedRoute>
    );
}
