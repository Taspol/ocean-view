'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ProtectedRoute } from '@/lib/protectedRoute';
import { getLocationPredictions, MOCK_PREDICTIONS } from '@/lib/mockPredictions';
import { getPredictionHistory, PredictionHistoryEntry, upsertPredictionHistory } from '@/lib/predictionHistory';
import styles from '../page.module.css';
import zoneStyles from '../dashboard.module.css';

type ZoneMode = 'single' | 'multiple' | 'all';
type DateMode = 'single' | 'multiple';

function getTodayDateString(): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.toISOString().slice(0, 10);
}

function buildDateRange(startDate: string, endDate: string): string[] {
  if (!startDate || !endDate) {
    return [];
  }

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return [];
  }

  const dates: string[] = [];
  const cursor = new Date(start);
  let guard = 0;
  while (cursor <= end && guard < 366) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
    guard += 1;
  }

  return dates;
}

function PredictionContent() {
  const locationPredictions = getLocationPredictions(MOCK_PREDICTIONS);
  const [zoneMode, setZoneMode] = useState<ZoneMode>('single');
  const [dateMode, setDateMode] = useState<DateMode>('single');
  const [singleZoneId, setSingleZoneId] = useState(locationPredictions[0]?.id ?? '');
  const [multipleZoneIds, setMultipleZoneIds] = useState<string[]>([]);
  const [singleDate, setSingleDate] = useState(getTodayDateString());
  const [dateRangeStart, setDateRangeStart] = useState(getTodayDateString());
  const [dateRangeEnd, setDateRangeEnd] = useState(getTodayDateString());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [history, setHistory] = useState<PredictionHistoryEntry[]>([]);

  useEffect(() => {
    const loadHistory = () => {
      setHistory(getPredictionHistory());
    };

    loadHistory();
    window.addEventListener('storage', loadHistory);
    return () => window.removeEventListener('storage', loadHistory);
  }, []);

  const locationLabelById = useMemo(() => {
    return new Map(locationPredictions.map((location) => [location.id, location.location_name]));
  }, [locationPredictions]);

  const toggleZone = (zoneId: string) => {
    setMultipleZoneIds((prev) => (
      prev.includes(zoneId)
        ? prev.filter((id) => id !== zoneId)
        : [...prev, zoneId]
    ));
  };

  const handlePredict = () => {
    const selectedZoneIds = (
      zoneMode === 'all'
        ? locationPredictions.map((location) => location.id)
        : zoneMode === 'single'
          ? [singleZoneId]
          : multipleZoneIds
    ).filter(Boolean);

    if (selectedZoneIds.length === 0) {
      setStatusMessage('Please select at least one zone.');
      return;
    }

    const selectedDates = dateMode === 'single'
      ? (singleDate ? [singleDate] : [])
      : buildDateRange(dateRangeStart, dateRangeEnd);

    if (selectedDates.length === 0) {
      setStatusMessage('Please select a valid date or date range.');
      return;
    }

    setIsSubmitting(true);

    window.setTimeout(() => {
      let createdCount = 0;
      let existingCount = 0;

      selectedZoneIds.forEach((zoneId) => {
        const zoneLabel = locationLabelById.get(zoneId);
        if (!zoneLabel) {
          return;
        }

        selectedDates.forEach((targetDate) => {
          const result = upsertPredictionHistory({
            source: 'prediction',
            locationId: zoneId,
            locationLabel: zoneLabel,
            days: 1,
            targetDate,
          });

          if (result.created) {
            createdCount += 1;
          } else {
            existingCount += 1;
          }
        });
      });

      const updatedHistory = getPredictionHistory();
      setHistory(updatedHistory);
      setStatusMessage(`Prediction completed. Created: ${createdCount}, Already exists: ${existingCount}`);
      setIsSubmitting(false);
    }, 700);
  };

  return (
    <div className={zoneStyles.dashboardPage}>
      <section className={zoneStyles.sectionBlock}>
        <div className={styles.configHeader}>
          <div className={zoneStyles.envHeader}>
            <div>
              <h2>Prediction Menu</h2>
              <p>Select zones and dates to create predictions</p>
            </div>
          </div>
        </div>

        <div className={zoneStyles.metricsGrid} style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px' }}>
          <div className={zoneStyles.zoneControl}>
            <label htmlFor="zone-mode" className={zoneStyles.zoneLabel}>Zone Mode</label>
            <select
              id="zone-mode"
              className={zoneStyles.zoneSelect}
              value={zoneMode}
              onChange={(e) => setZoneMode(e.target.value as ZoneMode)}
            >
              <option value="single">Single Zone</option>
              <option value="multiple">Multiple Zones</option>
              <option value="all">All Zones</option>
            </select>
            <span className={zoneStyles.zoneHint} style={{ fontSize: '0.8rem', color: '#64748b' }}>Choose how many zones</span>
          </div>

          <div className={zoneStyles.zoneControl}>
            <label htmlFor="date-mode" className={zoneStyles.zoneLabel}>Date Mode</label>
            <select
              id="date-mode"
              className={zoneStyles.zoneSelect}
              value={dateMode}
              onChange={(e) => setDateMode(e.target.value as DateMode)}
            >
              <option value="single">Single Date</option>
              <option value="multiple">Date Range</option>
            </select>
            <span className={zoneStyles.zoneHint} style={{ fontSize: '0.8rem', color: '#64748b' }}>Choose date selection</span>
          </div>
        </div>

        {zoneMode === 'single' && (
          <div className={zoneStyles.zoneControl}>
            <label htmlFor="single-zone" className={zoneStyles.zoneLabel}>Select a Zone</label>
            <select
              id="single-zone"
              className={zoneStyles.zoneSelect}
              value={singleZoneId}
              onChange={(e) => setSingleZoneId(e.target.value)}
            >
              {locationPredictions.map((location) => (
                <option key={location.id} value={location.id}>{location.location_name}</option>
              ))}
            </select>
          </div>
        )}

        {zoneMode === 'multiple' && (
          <div className={zoneStyles.zoneControl}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <label className={zoneStyles.zoneLabel} style={{ marginBottom: 0 }}>Select Zones</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className={styles.configItemAction}
                  style={{ marginLeft: 0, padding: '8px 12px', fontSize: '0.8rem', background: '#0f172a', color: '#fff' }}
                  onClick={() => setMultipleZoneIds(locationPredictions.map((location) => location.id))}
                >
                  Select All
                </button>
                <button
                  type="button"
                  className={styles.configItemAction}
                  style={{ marginLeft: 0, padding: '8px 12px', fontSize: '0.8rem', background: '#e2e8f0', color: '#0f172a' }}
                  onClick={() => setMultipleZoneIds([])}
                >
                  Clear
                </button>
              </div>
            </div>
            <div style={{ display: 'grid', gap: '8px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              {locationPredictions.map((location) => (
                <label key={location.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontSize: '0.9rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={multipleZoneIds.includes(location.id)}
                    onChange={() => toggleZone(location.id)}
                    style={{ cursor: 'pointer' }}
                  />
                  {location.location_name}
                </label>
              ))}
            </div>
          </div>
        )}

        {zoneMode === 'all' && (
          <div className={zoneStyles.zoneControl}>
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>All zones selected ({locationPredictions.length} zones)</p>
          </div>
        )}

        {dateMode === 'single' ? (
          <div className={zoneStyles.zoneControl}>
            <label htmlFor="single-date" className={zoneStyles.zoneLabel}>Select Date</label>
            <input
              id="single-date"
              type="date"
              className={zoneStyles.zoneSelect}
              value={singleDate}
              onChange={(e) => setSingleDate(e.target.value)}
            />
          </div>
        ) : (
          <div className={zoneStyles.metricsGrid} style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px' }}>
            <div className={zoneStyles.zoneControl}>
              <label htmlFor="range-start" className={zoneStyles.zoneLabel}>Start Date</label>
              <input
                id="range-start"
                type="date"
                className={zoneStyles.zoneSelect}
                value={dateRangeStart}
                onChange={(e) => setDateRangeStart(e.target.value)}
              />
            </div>
            <div className={zoneStyles.zoneControl}>
              <label htmlFor="range-end" className={zoneStyles.zoneLabel}>End Date</label>
              <input
                id="range-end"
                type="date"
                className={zoneStyles.zoneSelect}
                value={dateRangeEnd}
                onChange={(e) => setDateRangeEnd(e.target.value)}
              />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
          <button
            type="button"
            className={styles.configItemAction}
            style={{ marginLeft: 0, background: '#0284c7', color: '#fff', padding: '10px 16px', fontSize: '0.9rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '500' }}
            onClick={handlePredict}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Running...' : 'Run Prediction'}
          </button>
          {statusMessage && <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{statusMessage}</span>}
        </div>
      </section>

      <section className={zoneStyles.sectionBlock}>
        <div className={styles.configHeader}>
          <h2>Prediction History</h2>
          <p>All your created predictions</p>
        </div>

        <div className={styles.configList} style={{ maxWidth: '100%' }}>
          {history.length === 0 ? (
            <div className={styles.configItemRow}>
              <div className={styles.zoneInfo}>
                <div className={styles.zoneCoords} style={{ color: '#64748b' }}>No predictions yet. Create one above to get started</div>
              </div>
            </div>
          ) : (
            history.map((entry) => (
              <div key={entry.id} className={styles.configItemRow}>
                <div className={styles.zoneInfo}>
                  <div className={styles.zoneName}>{entry.locationLabel}</div>
                  <div className={styles.zoneCoords} style={{ color: '#64748b', fontSize: '0.85rem' }}>Target Date: {entry.targetDate}</div>
                </div>
                <div className={styles.zoneRate}>
                  <div className={styles.rateLabel}>Created</div>
                  <div className={styles.rateValue} style={{ fontSize: '0.85rem' }}>{new Date(entry.predictedAt).toLocaleDateString()}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default function PredictionPage() {
  return (
    <ProtectedRoute>
      <PredictionContent />
    </ProtectedRoute>
  );
}
