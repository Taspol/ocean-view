export interface PredictionOutput {
  lat: number;
  lon: number;
  time_start: string;
  time_end: string;
  species: string;
  species_thai: string;
  common_name: string;
  probability: number;
  suitable: boolean;
  suitability_level: 'high' | 'moderate' | 'low';
  gear_recommendation: string;
  sst_mean: number;
  chl_mean: number;
  depth: number;
  mpa_flag: boolean;
  closure_flag: boolean;
  spawning_flag: boolean;
  advisory: 'GO' | 'CAUTION' | 'NO_GO';
  advisory_reason: string;
}

export interface LocationPrediction extends PredictionOutput {
  id: string;
  location_name: string;
  coords: string;
}

export const MOCK_PREDICTIONS: PredictionOutput[] = [
  {
    lat: 9.3,
    lon: 100.5,
    time_start: '2024-01-01',
    time_end: '2024-01-15',
    species: 'short_mackerel',
    species_thai: 'ปลาทู',
    common_name: 'Short mackerel',
    probability: 0.9979,
    suitable: true,
    suitability_level: 'high',
    gear_recommendation: 'Purse seine (อวนล้อมจับ)',
    sst_mean: 301.59,
    chl_mean: 1.52,
    depth: 57.06,
    mpa_flag: false,
    closure_flag: false,
    spawning_flag: false,
    advisory: 'GO',
    advisory_reason: 'Safe to fish',
  },
  {
    lat: 9.8,
    lon: 101.2,
    time_start: '2024-01-01',
    time_end: '2024-01-15',
    species: 'indian_mackerel',
    species_thai: 'ปลาอินทรี',
    common_name: 'Indian mackerel',
    probability: 0.931,
    suitable: true,
    suitability_level: 'high',
    gear_recommendation: 'Drift gillnet (อวนลอย)',
    sst_mean: 300.94,
    chl_mean: 1.21,
    depth: 49.7,
    mpa_flag: false,
    closure_flag: false,
    spawning_flag: false,
    advisory: 'GO',
    advisory_reason: 'Strong biomass signal and safe sea state',
  },
  {
    lat: 8.9,
    lon: 101.8,
    time_start: '2024-01-01',
    time_end: '2024-01-15',
    species: 'anchovy',
    species_thai: 'ปลากะตัก',
    common_name: 'Anchovy',
    probability: 0.842,
    suitable: true,
    suitability_level: 'moderate',
    gear_recommendation: 'Lift net (อวนยก)',
    sst_mean: 301.1,
    chl_mean: 1.74,
    depth: 38.4,
    mpa_flag: false,
    closure_flag: false,
    spawning_flag: false,
    advisory: 'CAUTION',
    advisory_reason: 'Good catch potential, monitor weather updates',
  },
  {
    lat: 10.1,
    lon: 100.7,
    time_start: '2024-01-01',
    time_end: '2024-01-15',
    species: 'sardine',
    species_thai: 'ปลาซาร์ดีน',
    common_name: 'Sardine',
    probability: 0.743,
    suitable: true,
    suitability_level: 'moderate',
    gear_recommendation: 'Purse seine (อวนล้อมจับ)',
    sst_mean: 302.05,
    chl_mean: 1.43,
    depth: 62.8,
    mpa_flag: false,
    closure_flag: false,
    spawning_flag: false,
    advisory: 'CAUTION',
    advisory_reason: 'Catch potential is moderate, avoid night squalls',
  },
  {
    lat: 9.15,
    lon: 99.95,
    time_start: '2024-01-01',
    time_end: '2024-01-15',
    species: 'yellowstripe_scad',
    species_thai: 'ปลาทูแถบเหลือง',
    common_name: 'Yellowstripe scad',
    probability: 0.612,
    suitable: true,
    suitability_level: 'moderate',
    gear_recommendation: 'Trawl (อวนลาก)',
    sst_mean: 301.48,
    chl_mean: 1.18,
    depth: 71.4,
    mpa_flag: false,
    closure_flag: false,
    spawning_flag: false,
    advisory: 'CAUTION',
    advisory_reason: 'Moderate signal with vessel congestion risk',
  },
  {
    lat: 8.5,
    lon: 102.1,
    time_start: '2024-01-01',
    time_end: '2024-01-15',
    species: 'longtail_tuna',
    species_thai: 'ปลาทูน่าครีบยาว',
    common_name: 'Longtail tuna',
    probability: 0.458,
    suitable: false,
    suitability_level: 'low',
    gear_recommendation: 'Longline (เบ็ดราว)',
    sst_mean: 303.12,
    chl_mean: 0.88,
    depth: 96.2,
    mpa_flag: true,
    closure_flag: false,
    spawning_flag: false,
    advisory: 'NO_GO',
    advisory_reason: 'Area is inside marine protected boundary',
  },
  {
    lat: 10.6,
    lon: 101.4,
    time_start: '2024-01-01',
    time_end: '2024-01-15',
    species: 'skipjack_tuna',
    species_thai: 'ปลาทูน่าท้องแถบ',
    common_name: 'Skipjack tuna',
    probability: 0.395,
    suitable: false,
    suitability_level: 'low',
    gear_recommendation: 'Pole and line (เบ็ดคัน)',
    sst_mean: 302.64,
    chl_mean: 0.79,
    depth: 112.9,
    mpa_flag: false,
    closure_flag: true,
    spawning_flag: true,
    advisory: 'NO_GO',
    advisory_reason: 'Seasonal closure and spawning activity detected',
  },
  {
    lat: 7.9,
    lon: 98.4,
    time_start: '2024-01-01',
    time_end: '2024-01-15',
    species: 'frigate_tuna',
    species_thai: 'ปลาทูน่าฟริเกต',
    common_name: 'Frigate tuna',
    probability: 0.681,
    suitable: true,
    suitability_level: 'moderate',
    gear_recommendation: 'Purse seine (อวนล้อมจับ)',
    sst_mean: 301.02,
    chl_mean: 1.11,
    depth: 84.6,
    mpa_flag: false,
    closure_flag: false,
    spawning_flag: false,
    advisory: 'GO',
    advisory_reason: 'Open waters with moderate-to-good catch likelihood',
  },
];

export function toCelsius(kelvin: number): number {
  return kelvin - 273.15;
}

export function formatProbability(probability: number): string {
  return `${(probability * 100).toFixed(1)}%`;
}

export function formatCoordinates(lat: number, lon: number): string {
  return `${lat.toFixed(2)} deg N, ${lon.toFixed(2)} deg E`;
}

export function getLocationPredictions(rows: PredictionOutput[]): LocationPrediction[] {
  return rows
    .map((row, index) => ({
      ...row,
      id: `pred-${index + 1}`,
      location_name: `${row.common_name} Zone ${index + 1}`,
      coords: formatCoordinates(row.lat, row.lon),
    }))
    .sort((a, b) => b.probability - a.probability);
}

export function advisoryTone(advisory: PredictionOutput['advisory']): 'info' | 'warning' | 'success' | 'neutral' {
  if (advisory === 'GO') {
    return 'success';
  }

  if (advisory === 'CAUTION') {
    return 'warning';
  }

  return 'neutral';
}
