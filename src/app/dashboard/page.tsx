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

    return (
        <>
            <div className={styles.configHeader}>
                <h2>News</h2>
                <p>Real-time oceanic conditions across your active zones.</p>
            </div>
            <OceanNews />

            <div className={styles.configHeader}>
                <div className={zoneStyles.envHeader}>
                    <div>
                        <h2>Overall Environment</h2>
                        <p>Real-time oceanic conditions across your active zones.</p>
                    </div>
                    <select
                        className={zoneStyles.zoneSelect}
                        value={selectedZoneId}
                        onChange={(e) => setSelectedZoneId(e.target.value)}
                    >
                        {ALL_ZONES.map(z => (
                            <option key={z.id} value={z.id}>{z.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className={styles.widgetsContainer}>
                <DataWidget title="Sea Surface Temp" value={selectedZone.env.temp} icon="" />
                <DataWidget title="Wave Height" value={selectedZone.env.waveHeight} icon="" />
                <DataWidget title="Active Vessels" value={selectedZone.env.vessels} icon="" />
                <DataWidget title="Predicted Catch" value={selectedZone.env.catchRate} icon="" />
            </div>

            <div className={styles.configHeader}>
                <h2>Monitored High-Yield Zones</h2>
                <p>Tracked regions with a high probability of successful catches.</p>
            </div>

            <MonitoredZones />
        </>
    );
}

export default function DashboardPage() {
    return (
        <ProtectedRoute>
            <DashboardContent />
        </ProtectedRoute>
    );
}
