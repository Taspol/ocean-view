// Shared zone data used across the dashboard and map components

export interface Zone {
    id: string;
    name: string;
    coords: string;
    chance: string;
    lat: number;
    lon: number;
    env: {
        temp: string;
        waveHeight: string;
        vessels: string;
        catchRate: string;
    };
}

export const ALL_ZONES: Zone[] = [
    {
        id: 'z1',
        name: 'Alpha Ridge (Tuna Zone)',
        coords: '9.82°N, 101.21°E',
        chance: '85% Probability',
        lat: 9.82,
        lon: 101.21,
        env: { temp: '28.1°C', waveHeight: '1.2m', vessels: '3', catchRate: 'High' },
    },
    {
        id: 'z2',
        name: 'Beta Trench (Deep Sea)',
        coords: '9.20°N, 101.88°E',
        chance: '72% Probability',
        lat: 9.20,
        lon: 101.88,
        env: { temp: '26.5°C', waveHeight: '1.8m', vessels: '1', catchRate: 'Medium' },
    },
    {
        id: 'z3',
        name: 'Coastal Shelf (Mackerel)',
        coords: '10.15°N, 100.90°E',
        chance: '64% Probability',
        lat: 10.15,
        lon: 100.90,
        env: { temp: '27.3°C', waveHeight: '0.8m', vessels: '5', catchRate: 'Medium' },
    },
    {
        id: 'z4',
        name: 'Gamma Shallows',
        coords: '11.05°N, 100.45°E',
        chance: '55% Probability',
        lat: 11.05,
        lon: 100.45,
        env: { temp: '29.0°C', waveHeight: '0.5m', vessels: '2', catchRate: 'Low' },
    },
    {
        id: 'z5',
        name: 'Delta Dropoff',
        coords: '8.45°N, 102.10°E',
        chance: '91% Probability',
        lat: 8.45,
        lon: 102.10,
        env: { temp: '27.8°C', waveHeight: '2.1m', vessels: '0', catchRate: 'High' },
    },
    {
        id: 'z6',
        name: 'Epsilon Reef',
        coords: '10.50°N, 101.05°E',
        chance: '42% Probability',
        lat: 10.50,
        lon: 101.05,
        env: { temp: '26.0°C', waveHeight: '1.0m', vessels: '4', catchRate: 'Low' },
    },
    {
        id: 'z7',
        name: 'Zeta Current Sweep',
        coords: '9.15°N, 100.85°E',
        chance: '78% Probability',
        lat: 9.15,
        lon: 100.85,
        env: { temp: '28.6°C', waveHeight: '1.5m', vessels: '2', catchRate: 'High' },
    },
];
