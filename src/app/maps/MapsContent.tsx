'use client';

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from 'next/navigation';
import MapVisualization from "@/components/MapVisualization";
import { getLocationPredictions, MOCK_PREDICTIONS } from "@/lib/mockPredictions";
import { getPredictionHistory, PredictionHistoryEntry } from "@/lib/predictionHistory";
import styles from "../page.module.css";

function MapsInner() {
  const searchParams = useSearchParams();
  const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : undefined;
  const lon = searchParams.get('lon') ? parseFloat(searchParams.get('lon')!) : undefined;
  const zoom = searchParams.get('zoom') ? parseInt(searchParams.get('zoom')!) : undefined;
  const locations = getLocationPredictions(MOCK_PREDICTIONS);
  const defaultLocation = locations.find((row) => (
    lat !== undefined && lon !== undefined && Math.abs(row.lat - lat) < 0.05 && Math.abs(row.lon - lon) < 0.05
  )) ?? locations[0];
  const [history, setHistory] = useState<PredictionHistoryEntry[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string>('');

  useEffect(() => {
    const loadHistory = () => {
      const entries = getPredictionHistory();
      setHistory(entries);
      setSelectedHistoryId((prev) => (entries.some((entry) => entry.id === prev) ? prev : entries[0]?.id ?? ''));
    };

    loadHistory();
    window.addEventListener('storage', loadHistory);
    return () => window.removeEventListener('storage', loadHistory);
  }, []);

  const selectedHistoryEntry = useMemo(
    () => history.find((entry) => entry.id === selectedHistoryId),
    [history, selectedHistoryId]
  );

  const selectedPredictedLocation = useMemo(
    () => locations.find((row) => row.id === selectedHistoryEntry?.locationId),
    [locations, selectedHistoryEntry]
  );

  const selectedLocation = selectedPredictedLocation ?? defaultLocation;
  const mapLat = selectedPredictedLocation?.lat ?? lat;
  const mapLon = selectedPredictedLocation?.lon ?? lon;
  const mapZoom = selectedPredictedLocation ? 10 : zoom;

  useEffect(() => {
    if (history.length === 0) {
      setSelectedHistoryId('');
      return;
    }

    if (!history.some((entry) => entry.id === selectedHistoryId)) {
      setSelectedHistoryId(history[0].id);
    }
  }, [history, selectedHistoryId]);
  const advisoryCount = MOCK_PREDICTIONS.reduce(
    (acc, row) => {
      acc[row.advisory] += 1;
      return acc;
    },
    { GO: 0, CAUTION: 0, NO_GO: 0 }
  );

  return (
    <>
      <div className={styles.configHeader}>
        <h2>Current Area Navigation</h2>
        <p>
          Mock backend dataset loaded ({MOCK_PREDICTIONS.length} records) | GO: {advisoryCount.GO}, CAUTION: {advisoryCount.CAUTION}, NO_GO: {advisoryCount.NO_GO}
          {selectedHistoryEntry ? ` | Selected date: ${selectedHistoryEntry.targetDate}` : ''}
        </p>
      </div>

      <div style={{ marginBottom: '14px', border: '1px solid #d9e1ec', borderRadius: '12px', padding: '12px', background: '#ffffff' }}>
        <label htmlFor="predicted-run-select" style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#0f172a', marginBottom: '8px' }}>
          Visualize Predicted Data
        </label>
        {history.length === 0 ? (
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.86rem' }}>
            No prediction history yet. Create a prediction from the Prediction menu first.
          </p>
        ) : (
          <>
            <select
              id="predicted-run-select"
              value={selectedHistoryId}
              onChange={(e) => setSelectedHistoryId(e.target.value)}
              style={{ width: '100%', minHeight: '44px', borderRadius: '10px', border: '1px solid #c9d4e3', padding: '10px 12px', fontSize: '0.92rem', color: '#0f172a', fontFamily: 'inherit', marginBottom: '8px' }}
            >
              {history.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.locationLabel} | {entry.targetDate}
                </option>
              ))}
            </select>
            {selectedHistoryEntry && (
              <p style={{ margin: 0, color: '#475569', fontSize: '0.84rem' }}>
                Showing {selectedHistoryEntry.locationLabel} for {selectedHistoryEntry.targetDate}
              </p>
            )}
          </>
        )}
      </div>

      <div className={styles.mapWrapper}>
        <MapVisualization initialLat={mapLat} initialLon={mapLon} initialZoom={mapZoom} />
      </div>
    </>
  );
}

export default function MapsContent() {
  return (
    <Suspense fallback={<div>Loading map...</div>}>
      <MapsInner />
    </Suspense>
  );
}
