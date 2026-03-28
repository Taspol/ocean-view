'use client';

import React, { useState } from 'react';
import styles from './PredictionControls.module.css';
import { PredictionHistoryEntry, upsertPredictionHistory } from '@/lib/predictionHistory';

interface PredictionControlsProps {
  source: 'dashboard' | 'maps' | 'prediction';
  locationId: string;
  locationLabel: string;
  onHistoryChange?: (entries: PredictionHistoryEntry[]) => void;
}

function getTodayDateString(): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.toISOString().slice(0, 10);
}

export default function PredictionControls({ source, locationId, locationLabel, onHistoryChange }: PredictionControlsProps) {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [isPredicting, setIsPredicting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const handlePredict = () => {
    setIsPredicting(true);

    window.setTimeout(() => {
      const result = upsertPredictionHistory({
        source,
        locationId,
        locationLabel,
        days: 1,
        targetDate: selectedDate,
      });

      onHistoryChange?.(result.entries);
      setStatusMessage(
        result.created
          ? `Prediction saved for ${result.entry.targetDate}`
          : `Already predicted for ${result.entry.targetDate}`
      );
      setIsPredicting(false);
    }, 700);
  };

  return (
    <section className={styles.panel} aria-label="Prediction run controls">
      <div className={styles.headerRow}>
        <div>
          <h3 className={styles.title}>Prediction Run</h3>
          <p className={styles.subtitle}>{locationLabel}</p>
        </div>
      </div>

      <div className={styles.controlsRow}>
        <label htmlFor={`${source}-date`} className={styles.label}>Prediction Date</label>
        <div className={styles.inputGroup}>
          <input
            id={`${source}-date`}
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className={styles.select}
          />
          <button
            type="button"
            className={styles.predictButton}
            onClick={handlePredict}
            disabled={isPredicting || !selectedDate}
          >
            {isPredicting ? 'Predicting...' : 'Predict'}
          </button>
        </div>
        <p className={styles.preview}>Selected date: {selectedDate}</p>
        {statusMessage && <p className={styles.status}>{statusMessage}</p>}
      </div>
    </section>
  );
}
