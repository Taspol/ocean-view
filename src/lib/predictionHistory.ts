export interface PredictionHistoryEntry {
  id: string;
  source: 'dashboard' | 'maps' | 'prediction';
  locationId: string;
  locationLabel: string;
  targetDate: string;
  days: number;
  windowStart: string;
  windowEnd: string;
  predictedAt: string;
}

const STORAGE_KEY = 'ocean_fishing_prediction_history_v1';

function safeParse(value: string | null): PredictionHistoryEntry[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item) => (
      typeof item?.id === 'string' &&
      (item?.source === 'dashboard' || item?.source === 'maps' || item?.source === 'prediction') &&
      typeof item?.locationId === 'string' &&
      typeof item?.locationLabel === 'string' &&
      typeof item?.targetDate === 'string' &&
      typeof item?.days === 'number' &&
      typeof item?.windowStart === 'string' &&
      typeof item?.windowEnd === 'string' &&
      typeof item?.predictedAt === 'string'
    ));
  } catch {
    return [];
  }
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function computeWindow(days: number): { windowStart: string; windowEnd: string } {
  const normalizedDays = Math.max(1, Math.floor(days));
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + normalizedDays - 1);

  return {
    windowStart: formatDate(start),
    windowEnd: formatDate(end),
  };
}

export function getPredictionHistory(): PredictionHistoryEntry[] {
  if (typeof window === 'undefined') {
    return [];
  }

  return safeParse(window.localStorage.getItem(STORAGE_KEY)).sort(
    (a, b) => new Date(b.predictedAt).getTime() - new Date(a.predictedAt).getTime()
  );
}

export function savePredictionHistory(entries: PredictionHistoryEntry[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function upsertPredictionHistory(entry: Omit<PredictionHistoryEntry, 'id' | 'predictedAt' | 'windowStart' | 'windowEnd'>): {
  created: boolean;
  entry: PredictionHistoryEntry;
  entries: PredictionHistoryEntry[];
} {
  const targetDate = entry.targetDate;
  const windowStart = targetDate;
  const windowEnd = targetDate;
  const existing = getPredictionHistory();

  const duplicate = existing.find((item) => (
    item.locationId === entry.locationId &&
    item.targetDate === targetDate
  ));

  if (duplicate) {
    return {
      created: false,
      entry: duplicate,
      entries: existing,
    };
  }

  const next: PredictionHistoryEntry = {
    ...entry,
    windowStart,
    windowEnd,
    id: `${entry.locationId}-${targetDate}`,
    predictedAt: new Date().toISOString(),
  };

  const updated = [next, ...existing];
  savePredictionHistory(updated);

  return {
    created: true,
    entry: next,
    entries: updated,
  };
}
