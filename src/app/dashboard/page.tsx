'use client';

import React, { useEffect, useMemo, useState } from "react";
import { ProtectedRoute } from "@/lib/protectedRoute";
import DataWidget from "@/components/DataWidget";
import MonitoredZones from "@/components/MonitoredZones";
import OceanNews from "@/components/OceanNews";
import { advisoryTone, formatProbability, getLocationPredictions, MOCK_PREDICTIONS, toCelsius } from "@/lib/mockPredictions";
import { getPredictionHistory, PredictionHistoryEntry } from "@/lib/predictionHistory";
import styles from "../page.module.css";
import zoneStyles from "../dashboard.module.css";

function DashboardContent() {
    const locationPredictions = getLocationPredictions(MOCK_PREDICTIONS);
    const [history, setHistory] = useState<PredictionHistoryEntry[]>([]);
    const [selectedHistoryId, setSelectedHistoryId] = useState('');

    useEffect(() => {
        const loadHistory = () => {
            const entries = getPredictionHistory();
            setHistory(entries);

            if (entries.length === 0) {
                setSelectedHistoryId('');
                return;
            }

            setSelectedHistoryId((prev) => (entries.some((entry) => entry.id === prev) ? prev : entries[0].id));
        };

        loadHistory();
        window.addEventListener('storage', loadHistory);
        return () => window.removeEventListener('storage', loadHistory);
    }, []);

    const selectedHistoryEntry = useMemo(
        () => history.find((entry) => entry.id === selectedHistoryId),
        [history, selectedHistoryId]
    );

    const selectedZone = locationPredictions.find((zone) => zone.id === selectedHistoryEntry?.locationId) ?? locationPredictions[0];

    if (!selectedZone) {
        return null;
    }

    const metrics = [
        {
            title: 'Sea Surface Temp',
            value: `${toCelsius(selectedZone.sst_mean).toFixed(1)}°C`,
            tone: 'info' as const,
            meta: `${selectedZone.sst_mean.toFixed(2)} K from model output`,
        },
        {
            title: 'Chlorophyll',
            value: `${selectedZone.chl_mean.toFixed(2)} mg/m³`,
            tone: 'warning' as const,
            meta: 'Plankton proxy for feeding activity',
        },
        {
            title: 'Depth',
            value: `${selectedZone.depth.toFixed(1)} m`,
            tone: 'neutral' as const,
            meta: `Gear: ${selectedZone.gear_recommendation}`,
        },
        {
            title: 'Catch Probability',
            value: `${formatProbability(selectedZone.probability)} (${selectedZone.suitability_level})`,
            tone: advisoryTone(selectedZone.advisory),
            meta: `${selectedZone.advisory}: ${selectedZone.advisory_reason}`,
        },
    ];

    return (
        <div className={zoneStyles.dashboardPage}>
            <section className={zoneStyles.sectionBlock}>
                <div className={styles.configHeader}>
                    <h2>Marine News</h2>
                    <p>Critical weather and safety updates across monitored waters.</p>
                </div>
                <OceanNews />
            </section>

            <section className={zoneStyles.sectionBlock}>
                <div className={styles.configHeader}>
                    <div className={zoneStyles.envHeader}>
                        <div>
                            <h2>Overall Environment</h2>
                            <p>
                                {selectedZone.common_name} ({selectedZone.species_thai}) | Predicted date: {selectedHistoryEntry?.targetDate ?? 'No predicted data selected'}
                            </p>
                        </div>

                        <div className={zoneStyles.zoneControl}>
                            <label htmlFor="active-zone" className={zoneStyles.zoneLabel}>Predicted Data</label>
                            <select
                                id="active-zone"
                                name="active-zone"
                                className={zoneStyles.zoneSelect}
                                value={selectedHistoryId}
                                onChange={(e) => setSelectedHistoryId(e.target.value)}
                                disabled={history.length === 0}
                            >
                                {history.length === 0 ? (
                                    <option value="">No predicted data yet</option>
                                ) : (
                                    history.map((entry) => (
                                        <option key={entry.id} value={entry.id}>{entry.locationLabel} | {entry.targetDate}</option>
                                    ))
                                )}
                            </select>
                            <span className={zoneStyles.zoneHint}>
                                {history.length === 0 ? 'Create predictions from Prediction menu first' : 'Select predicted run to view in dashboard'}
                            </span>
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
