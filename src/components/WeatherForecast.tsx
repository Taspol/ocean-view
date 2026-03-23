'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import styles from './WeatherForecast.module.css';

// OpenLayers imports for the Map
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { Style, Circle as CircleStyle, Fill, Stroke, Text } from 'ol/style';
import { fromLonLat } from 'ol/proj';

interface ForecastLocation {
    lat: number;
    lon: number;
    name: string;
}

// 12 Coordinates covering Gulf of Thailand
const GULF_LOCATIONS: ForecastLocation[] = [
    { name: 'Bangkok Bay', lat: 13.18, lon: 100.37 },
    { name: 'Hua Hin Coast', lat: 12.57, lon: 100.12 },
    { name: 'Rayong Coast', lat: 12.52, lon: 101.35 },
    { name: 'Chanthaburi Coast', lat: 12.25, lon: 102.15 },
    { name: 'Prachuap Bay', lat: 11.82, lon: 100.08 },
    { name: 'Chumphon Coast', lat: 10.45, lon: 99.45 },
    { name: 'Surat Thani', lat: 9.35, lon: 99.85 },
    { name: 'Koh Samui', lat: 9.55, lon: 100.15 },
    { name: 'Nakhon Si Thammarat', lat: 8.45, lon: 100.25 },
    { name: 'Songkhla Coast', lat: 7.25, lon: 100.65 },
    { name: 'Pattani Coast', lat: 6.85, lon: 101.15 },
    { name: 'Narathiwat Coast', lat: 6.45, lon: 101.85 },
];

const ANDAMAN_LOCATIONS: ForecastLocation[] = [
    { name: 'Phuket Coast', lat: 7.89, lon: 98.39 },
    { name: 'Krabi Bay', lat: 8.08, lon: 98.90 },
    { name: 'Phang Nga Bay', lat: 8.45, lon: 98.52 },
    { name: 'Ranong Coast', lat: 9.96, lon: 98.63 },
    { name: 'Trang Coast', lat: 7.55, lon: 99.61 },
    { name: 'Satun Coast', lat: 6.62, lon: 100.06 },
];

interface LocationForecast {
    location: ForecastLocation;
    time: string[];
    wave_height: (number | null)[];
}

interface HoverState {
    index: number;
    x: number;
    y: number;
    val: number;
    time: string;
}

interface SingleChartProps {
    data: LocationForecast;
    color: string;
}

function SingleZoneChart({ data, color }: SingleChartProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [hover, setHover] = useState<HoverState | null>(null);

    const chartLayout = useMemo(() => {
        const width = 800; // viewbox width
        const height = 300; // viewbox height
        const padXLeft = 60;
        const padXRight = 20;
        const padYTop = 30;
        const padYBot = 70;
        const graphW = width - padXLeft - padXRight;
        const graphH = height - padYTop - padYBot;

        // Filter valid wave heights & corresponding times to plot
        const validPoints = data.wave_height.map((h, i) => ({
            h, time: data.time[i]
        })).filter(p => p.h !== null) as { h: number, time: string }[];

        if (validPoints.length === 0) return null;

        const maxH = Math.max(...validPoints.map(p => p.h), 1.0); // Minimum graph height of 1
        const minH = 0; // anchor to 0 baseline for wave height

        // Calculate (x, y) scales
        const points = validPoints.map((pt, i) => {
            const x = padXLeft + (i / Math.max(1, validPoints.length - 1)) * graphW;
            const normalizedY = maxH === 0 ? 0 : (pt.h - minH) / (maxH - minH);
            const y = padYTop + graphH - (normalizedY * graphH);
            return { x, y, val: pt.h, time: pt.time };
        });

        // Construct SVG path strings
        const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

        // Construct filled area below path
        const areaData = `${pathData} L ${points[points.length - 1].x} ${padYTop + graphH} L ${points[0].x} ${padYTop + graphH} Z`;

        // Calculate sensible Y-axis ticks
        const yTicks = [0, maxH * 0.25, maxH * 0.5, maxH * 0.75, maxH].map(v => Number(v.toFixed(1)));

        // X-Axis day ticks (approx every 24 items since hourly data)
        const xTicks = [];
        for (let i = 0; i < points.length; i += 24) {
            if (points[i]) {
                const d = new Date(points[i].time);
                xTicks.push({
                    x: points[i].x,
                    label: `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}`
                });
            }
        }

        return {
            points, pathData, areaData, maxH, minH, yTicks, xTicks, padXLeft, padXRight, padYTop, padYBot, graphW, graphH, width, height
        };
    }, [data]);

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        if (!chartLayout || !svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();

        // Map mouse position to viewbox coordinate constraints
        const scaleX = chartLayout.width / rect.width;
        const mouseX = (e.clientX - rect.left) * scaleX;

        // Find closest data point
        let closestIndex = 0;
        let minDist = Infinity;
        chartLayout.points.forEach((pt, i) => {
            const dist = Math.abs(pt.x - mouseX);
            if (dist < minDist) {
                minDist = dist;
                closestIndex = i;
            }
        });

        const pt = chartLayout.points[closestIndex];
        // Only show tooltip if somewhat close to the X axis of data
        if (minDist < (chartLayout.graphW / chartLayout.points.length) * 4) {
            setHover({
                index: closestIndex,
                x: pt.x,
                y: pt.y,
                val: pt.val,
                time: pt.time
            });
        }
    };

    const handleMouseLeave = () => {
        setHover(null);
    };

    const formatTime = (isoString: string) => {
        const d = new Date(isoString);
        return d.toLocaleDateString([], { weekday: 'short' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (!chartLayout) return null;

    return (
        <div style={{ marginBottom: '24px' }}>
            <h4 style={{ color: 'var(--foreground)', fontSize: '1rem', fontWeight: 600, marginBottom: '8px' }}>
                {data.location.name}
            </h4>
            <div className={styles.chartContent}>
                <svg
                    ref={svgRef}
                    viewBox={`0 0 ${chartLayout.width} ${chartLayout.height}`}
                    className={styles.chartSvg}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                >
                    <defs>
                        <linearGradient id={`grad-${data.location.name.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
                        </linearGradient>
                    </defs>

                    {/* Y-Axis Title */}
                    <text x="15" y={chartLayout.padYTop + (chartLayout.graphH / 2)} fill="var(--foreground)" fontSize="12" fontWeight="600" transform={`rotate(-90 15, ${chartLayout.padYTop + (chartLayout.graphH / 2)})`} textAnchor="middle">
                        Wave Height (meters)
                    </text>

                    {/* Y-Axis grid lines & ticks */}
                    {chartLayout.yTicks.map((tick, i) => {
                        const y = chartLayout.padYTop + chartLayout.graphH - ((tick / chartLayout.maxH) * chartLayout.graphH) || chartLayout.padYTop + chartLayout.graphH;
                        return (
                            <g key={i}>
                                <line x1={chartLayout.padXLeft} y1={y} x2={chartLayout.padXLeft + chartLayout.graphW} y2={y} stroke="var(--border)" strokeDasharray="4 4" />
                                <text x={chartLayout.padXLeft - 8} y={y + 4} fill="var(--foreground-muted)" fontSize="12" textAnchor="end">{tick}</text>
                            </g>
                        )
                    })}

                    {/* X-Axis baseline */}
                    <line x1={chartLayout.padXLeft} y1={chartLayout.padYTop + chartLayout.graphH} x2={chartLayout.padXLeft + chartLayout.graphW} y2={chartLayout.padYTop + chartLayout.graphH} stroke="var(--border)" />

                    {/* X-Axis ticks */}
                    {chartLayout.xTicks.map((tick, i) => (
                        <g key={i}>
                            <line x1={tick.x} y1={chartLayout.padYTop + chartLayout.graphH} x2={tick.x} y2={chartLayout.padYTop + chartLayout.graphH + 5} stroke="var(--border)" />
                            <text x={tick.x} y={chartLayout.padYTop + chartLayout.graphH + 20} fill="var(--foreground-muted)" fontSize="12" textAnchor="middle">{tick.label}</text>
                        </g>
                    ))}

                    {/* X-Axis Title */}
                    <text x={chartLayout.padXLeft + (chartLayout.graphW / 2)} y={chartLayout.padYTop + chartLayout.graphH + 50} fill="var(--foreground)" fontSize="12" fontWeight="600" textAnchor="middle">
                        Date & Time
                    </text>

                    {/* Area Filter */}
                    <path d={chartLayout.areaData} fill={`url(#grad-${data.location.name.replace(/\s/g, '')})`} />

                    {/* Line */}
                    <path d={chartLayout.pathData} fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />

                    {/* Hover Interaction Guides */}
                    {hover && (
                        <g>
                            <line x1={hover.x} y1={chartLayout.padYTop} x2={hover.x} y2={chartLayout.padYTop + chartLayout.graphH} stroke="var(--foreground-muted)" strokeDasharray="2 2" />
                            <circle cx={hover.x} cy={hover.y} r="6" fill={color} stroke="#fff" strokeWidth="2" />
                        </g>
                    )}
                </svg>

                {/* DOM Tooltip tied to container not SVG */}
                {hover && (
                    <div className={styles.tooltip}>
                        <span className={styles.tooltipLabel}>Wave Height</span>
                        <span className={styles.tooltipValue} style={{ color }}>{hover.val.toFixed(1)} m</span>
                        <span className={styles.tooltipTime}>{formatTime(hover.time)}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function WeatherForecast() {
    const [locationsData, setLocationsData] = useState<LocationForecast[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedLocationIndices, setSelectedLocationIndices] = useState<number[]>([0]);
    const [selectedArea, setSelectedArea] = useState<'Gulf of Thailand' | 'Andaman'>('Gulf of Thailand');

    const activeLocations = selectedArea === 'Gulf of Thailand' ? GULF_LOCATIONS : ANDAMAN_LOCATIONS;

    const mapElement = useRef<HTMLDivElement>(null);

    // Fetch wave heights
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Construct URL with comma-separated coordinates
                const lats = activeLocations.map(l => l.lat.toFixed(2)).join(',');
                const lons = activeLocations.map(l => l.lon.toFixed(2)).join(',');

                const METEO_URL = `https://marine-api.open-meteo.com/v1/marine?latitude=${lats}&longitude=${lons}&hourly=wave_height`;

                const res = await fetch(METEO_URL);
                if (!res.ok) throw new Error('Failed to fetch from Open-Meteo');
                const json = await res.json();

                if (Array.isArray(json)) {
                    // API returns array if multiple locations requested
                    const parsedData: LocationForecast[] = json.map((locData, idx) => ({
                        location: activeLocations[idx],
                        time: locData.hourly.time,
                        wave_height: locData.hourly.wave_height,
                    }));
                    setLocationsData(parsedData);
                } else if (json.hourly && activeLocations.length === 1) {
                    // Single array fallback just in case
                    setLocationsData([{
                        location: activeLocations[0],
                        time: json.hourly.time,
                        wave_height: json.hourly.wave_height,
                    }]);
                } else {
                    throw new Error('Invalid data format received');
                }
            } catch (err: unknown) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError('An unknown error occurred');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [activeLocations]);

    // Initialize OpenLayers Map Component
    useEffect(() => {
        if (!mapElement.current || locationsData.length === 0) return;

        // Center dynamically based on area
        const centerLonLat = selectedArea === 'Gulf of Thailand'
            ? fromLonLat([100.99, 9.8])
            : fromLonLat([98.8, 8.5]);

        const features = locationsData.map((locData, index) => {
            // Get current wave height (first valid point)
            const currentWave = locData.wave_height.find(h => h !== null) || 0;

            const feature = new Feature({
                geometry: new Point(fromLonLat([locData.location.lon, locData.location.lat])),
                name: locData.location.name,
                wave: currentWave,
                index: index,
            });

            // Color logic based on wave height
            let color = '#10B981'; // Green < 0.5m
            if (currentWave >= 0.5 && currentWave < 1.0) color = '#F59E0B'; // Yellow 0.5-1.0
            if (currentWave >= 1.0) color = '#EF4444'; // Red > 1.0

            const isSelected = selectedLocationIndices.includes(index);

            feature.setStyle(new Style({
                image: new CircleStyle({
                    radius: isSelected ? 16 : 12,
                    fill: new Fill({ color: color }),
                    stroke: new Stroke({ color: isSelected ? '#FFFFFF' : '#000000', width: isSelected ? 3 : 1 }),
                }),
                text: new Text({
                    text: currentWave.toFixed(1),
                    fill: new Fill({ color: '#fff' }),
                    font: 'bold 12px "Noto Sans", sans-serif',
                    offsetY: isSelected ? 0 : 0,
                })
            }));

            return feature;
        });

        const vectorLayer = new VectorLayer({
            source: new VectorSource({ features: features }),
        });

        const mapInstance = new Map({
            target: mapElement.current,
            layers: [
                new TileLayer({ source: new OSM() }),
                vectorLayer,
            ],
            view: new View({
                center: centerLonLat,
                zoom: 5.5,
            }),
        });

        // Add click interaction to select map point to chart
        mapInstance.on('click', (e) => {
            mapInstance.forEachFeatureAtPixel(e.pixel, (feature) => {
                const idx = feature.get('index');
                if (idx !== undefined) {
                    setSelectedLocationIndices(prev =>
                        prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
                    );
                }
            });
        });

        // Set cursor to pointer on hover
        mapInstance.on('pointermove', function (e) {
            const hit = mapInstance.hasFeatureAtPixel(e.pixel);
            if (mapInstance.getTargetElement()) {
                mapInstance.getTargetElement().style.cursor = hit ? 'pointer' : '';
            }
        });

        return () => {
            mapInstance.setTarget(undefined);
        };
    }, [locationsData, selectedLocationIndices, selectedArea]);

    if (loading) return <div className={styles.forecastContainer}><div className={styles.loading}>Fetching marine forecast...</div></div>;
    if (error) return <div className={styles.forecastContainer}><div className={styles.error}>Error: {error}</div></div>;

    return (
        <div className={styles.forecastContainer}>

            {/* Map Panel */}
            <div className={styles.mapCard}>
                <div className={styles.mapHeader}>
                    <div className={styles.mapHeaderTop}>
                        <div>
                            <h3>{selectedArea} Areas</h3>
                            <p>Current wave predictions locally mapped.</p>
                        </div>
                        <select
                            className={styles.areaSelector}
                            value={selectedArea}
                            onChange={(e) => {
                                setSelectedArea(e.target.value as 'Gulf of Thailand' | 'Andaman');
                                setSelectedLocationIndices([0]); // Reset selected graphs
                            }}
                        >
                            <option value="Gulf of Thailand">Gulf of Thailand</option>
                            <option value="Andaman">Andaman Coast</option>
                        </select>
                    </div>

                    <div className={styles.pillContainer} style={{ marginTop: '16px' }}>
                        {locationsData.map((loc, i) => {
                            const isActive = selectedLocationIndices.includes(i);
                            return (
                                <button
                                    key={i}
                                    className={`${styles.pill} ${isActive ? styles.active : ''}`}
                                    onClick={() => setSelectedLocationIndices(prev => prev.includes(i) ? prev.filter(idx => idx !== i) : [...prev, i])}
                                >
                                    {loc.location.name}
                                </button>
                            );
                        })}
                    </div>
                </div>
                <div ref={mapElement} className={styles.mapContent} style={{ height: '450px' }} />
            </div>

            {/* Display Multiple Charts vertically */}
            <div className={styles.chartCard} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className={styles.chartHeader} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div>
                        <h3>7-Day Wave Height Forecasts</h3>
                        <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--foreground-muted)' }}>Interactive wave predictions for selected regions.</p>
                    </div>
                </div>

                <div className={styles.chartGrid}>
                    {selectedLocationIndices.map((locIdx) => {
                        const data = locationsData[locIdx];
                        if (!data) return null;
                        const color = '#0ea5e9';
                        return <SingleZoneChart key={locIdx} data={data} color={color} />;
                    })}
                </div>
            </div>

        </div>
    );
}

