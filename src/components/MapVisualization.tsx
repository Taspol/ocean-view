'use client';

import React, { useEffect, useRef, useState } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import styles from './MapVisualization.module.css';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat, toLonLat } from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Polygon from 'ol/geom/Polygon';
import { Style, Circle as CircleStyle, Fill, Stroke, Text } from 'ol/style';
import { FeatureLike } from 'ol/Feature';
import Cluster from 'ol/source/Cluster';
import { formatProbability, getLocationPredictions, MOCK_PREDICTIONS } from '@/lib/mockPredictions';
import { downloadMapTiles, getStorageUsage } from '@/lib/offlineMapManager';

const LOCATION_PREDICTIONS = getLocationPredictions(MOCK_PREDICTIONS);

const SEARCH_AREAS = LOCATION_PREDICTIONS.map((row) => ({
    name: `${row.location_name} | ${formatProbability(row.probability)}`,
    lon: row.lon,
    lat: row.lat,
    zoom: row.advisory === 'NO_GO' ? 8 : 9,
}));

function createProbabilityPoints(lon: number, lat: number, probability: number, zoneName: string): Feature<Point>[] {
    const points: Feature<Point>[] = [];
    const count = Math.max(8, Math.round(probability * 48));
    const spread = 0.18;

    for (let i = 0; i < count; i++) {
        const angle = ((i * 137.5) % 360) * (Math.PI / 180);
        const radius = spread * ((i % 9) + 1) / 9;
        const lonOffset = Math.cos(angle) * radius;
        const latOffset = Math.sin(angle) * radius;
        const feature = new Feature(new Point(fromLonLat([lon + lonOffset, lat + latOffset])));
        feature.set('zoneName', zoneName);
        feature.set('probability', probability);
        points.push(feature);
    }

    return points;
}

function createRestrictedRing(lon: number, lat: number, radius = 0.22): number[][] {
    return [
        fromLonLat([lon - radius, lat - radius]),
        fromLonLat([lon + radius, lat - radius]),
        fromLonLat([lon + radius, lat + radius]),
        fromLonLat([lon - radius, lat + radius]),
        fromLonLat([lon - radius, lat - radius]),
    ];
}

interface MapVisualizationProps {
    initialLat?: number;
    initialLon?: number;
    initialZoom?: number;
}

export default function MapVisualization({ initialLat, initialLon, initialZoom }: MapVisualizationProps = {}) {
    const mapElement = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<Map | null>(null);

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setIsSearching(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Visibility toggles
    const [showAlpha, setShowAlpha] = useState(true);
    const [showClusters, setShowClusters] = useState(true);
    const [showRestricted, setShowRestricted] = useState(true);

    // Offline map caching state
    const [isCaching, setIsCaching] = useState(false);
    const [cacheProgress, setCacheProgress] = useState(0);
    const [totalTiles, setTotalTiles] = useState(0);
    const [storageUsage, setStorageUsage] = useState<{ tileCount: number; approximateSize: number }>({ tileCount: 0, approximateSize: 0 });

    // Layer Refs for programmatic control
    const alphaLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
    const clusterLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
    const restrictedLayerRef = useRef<VectorLayer<VectorSource> | null>(null);

    useEffect(() => {
        if (!map || !initialLat || !initialLon) return;
        map.getView().animate({
            center: fromLonLat([initialLon, initialLat]),
            zoom: initialZoom ?? 9,
            duration: 1200,
        });
    }, [map, initialLat, initialLon, initialZoom]);

    useEffect(() => {
        if (!mapElement.current) return;

        const initialCenter = fromLonLat([101.5, 9.5]);
        const hotspotSource = new VectorSource();

        hotspotSource.addFeatures(
            LOCATION_PREDICTIONS.map((row) => new Feature({
                geometry: new Point(fromLonLat([row.lon, row.lat])),
                advisory: row.advisory,
            }))
        );

        const hotspotStyleMap: Record<string, Style> = {
            GO: new Style({
                image: new CircleStyle({
                    radius: 12,
                    fill: new Fill({ color: 'rgba(16, 185, 129, 0.45)' }),
                    stroke: new Stroke({ color: 'rgba(5, 150, 105, 0.95)', width: 2 }),
                }),
            }),
            CAUTION: new Style({
                image: new CircleStyle({
                    radius: 12,
                    fill: new Fill({ color: 'rgba(245, 158, 11, 0.5)' }),
                    stroke: new Stroke({ color: 'rgba(217, 119, 6, 1)', width: 2 }),
                }),
            }),
            NO_GO: new Style({
                image: new CircleStyle({
                    radius: 12,
                    fill: new Fill({ color: 'rgba(239, 68, 68, 0.45)' }),
                    stroke: new Stroke({ color: 'rgba(220, 38, 38, 1)', width: 2 }),
                }),
            }),
        };

        const styleFunction = (feature: FeatureLike) => {
            const advisory = (feature.get('advisory') as string) || 'CAUTION';
            return hotspotStyleMap[advisory] ?? hotspotStyleMap.CAUTION;
        };

        const vectorLayer = new VectorLayer({
            source: hotspotSource,
            style: styleFunction,
            visible: showAlpha,
        });
        alphaLayerRef.current = vectorLayer;

        const baseLayer = new TileLayer({
            source: new OSM(),
            opacity: 0.8,
        });

        const fishPoints = LOCATION_PREDICTIONS.flatMap((row) =>
            createProbabilityPoints(row.lon, row.lat, row.probability, row.location_name)
        );

        const fishSource = new VectorSource({
            features: fishPoints,
        });

        const clusterSource = new Cluster({
            distance: 80,
            source: fishSource,
        });

        const clusterStyleCache: { [key: string]: Style } = {};
        const clusterLayer = new VectorLayer({
            source: clusterSource,
            style: (feature) => {
                const members = feature.get('features') as Feature<Point>[];
                const size = members.length;

                if (size < 10) return;

                const zoneCounts: Record<string, { count: number; probability: number }> = {};
                members.forEach((member) => {
                    const zoneName = (member.get('zoneName') as string) || 'Unknown Zone';
                    const probability = (member.get('probability') as number) || 0;
                    if (zoneCounts[zoneName]) {
                        zoneCounts[zoneName].count += 1;
                    } else {
                        zoneCounts[zoneName] = { count: 1, probability };
                    }
                });

                let labelZone = 'Unknown Zone';
                let labelPercent = '0%';
                let maxCount = 0;
                for (const zoneName in zoneCounts) {
                    if (zoneCounts[zoneName].count > maxCount) {
                        maxCount = zoneCounts[zoneName].count;
                        labelZone = zoneName;
                        labelPercent = `${Math.round(zoneCounts[zoneName].probability * 100)}%`;
                    }
                }
                const textLabel = `${labelZone}\n${labelPercent}`;

                const styleKey = `${size}-${labelZone}-${labelPercent}`;
                let style = clusterStyleCache[styleKey];
                if (!style) {
                    style = new Style({
                        image: new CircleStyle({
                            radius: 10 + Math.min(size / 5, 15),
                            stroke: new Stroke({
                                color: '#fff',
                            }),
                            fill: new Fill({
                                color: 'rgba(6, 182, 212, 0.8)', // cyan-500
                            }),
                        }),
                        text: new Text({
                            text: textLabel,
                            fill: new Fill({
                                color: '#fff',
                            }),
                            font: '11px "Noto Sans", sans-serif',
                            textAlign: 'center',
                            offsetY: -24,
                            stroke: new Stroke({ color: 'rgba(0, 0, 0, 0.6)', width: 2 })
                        }),
                    });
                    clusterStyleCache[styleKey] = style;
                }
                return style;
            },
            visible: showClusters,
        });
        clusterLayerRef.current = clusterLayer;



        const restrictedFeatures = LOCATION_PREDICTIONS
            .filter((row) => row.mpa_flag || row.closure_flag || row.spawning_flag)
            .map((row) => new Feature({
                geometry: new Polygon([createRestrictedRing(row.lon, row.lat)]),
            }));

        const restrictedStyle = new Style({
            fill: new Fill({ color: 'rgba(239, 68, 68, 0.3)' }),
            stroke: new Stroke({ color: '#ef4444', width: 2 }),
        });

        const restrictedLayer = new VectorLayer({
            source: new VectorSource({ features: restrictedFeatures }),
            style: restrictedStyle,
            visible: showRestricted,
        });
        restrictedLayerRef.current = restrictedLayer;

        const initialMap = new Map({
            target: mapElement.current,
            layers: [baseLayer, restrictedLayer, clusterLayer, vectorLayer],
            view: new View({
                center: initialCenter,
                zoom: 7,
            }),
        });

        setMap(initialMap);

        return () => {
            initialMap.setTarget(undefined);
        };
    }, []);

    // Sync visibility states with actual OpenLayers visibility
    useEffect(() => {
        if (alphaLayerRef.current) alphaLayerRef.current.setVisible(showAlpha);
    }, [showAlpha]);

    useEffect(() => {
        if (clusterLayerRef.current) clusterLayerRef.current.setVisible(showClusters);
    }, [showClusters]);

    useEffect(() => {
        if (restrictedLayerRef.current) restrictedLayerRef.current.setVisible(showRestricted);
    }, [showRestricted]);

    // Load storage usage on mount
    useEffect(() => {
        getStorageUsage().then(setStorageUsage).catch(console.error);
    }, []);

    // Map Controls
    const handleZoomIn = () => {
        if (map) {
            const view = map.getView();
            const currentZoom = view.getZoom();
            if (currentZoom !== undefined) view.setZoom(currentZoom + 1);
        }
    };

    const handleZoomOut = () => {
        if (map) {
            const view = map.getView();
            const currentZoom = view.getZoom();
            if (currentZoom !== undefined) view.setZoom(currentZoom - 1);
        }
    };

    const handleSelectArea = (area: typeof SEARCH_AREAS[0]) => {
        if (!map) return;
        const view = map.getView();
        view.animate({
            center: fromLonLat([area.lon, area.lat]),
            zoom: area.zoom,
            duration: 1000,
        });
        setSearchQuery(area.name);
        setIsSearching(false);
    };

    const handleDownloadMap = () => {
        if (!map) return;
        
        map.once('rendercomplete', () => {
            const canvas = document.querySelector('canvas') as HTMLCanvasElement;
            if (canvas) {
                canvas.toBlob((blob) => {
                    if (blob) {
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `ocean-fishing-map-${new Date().toISOString().slice(0, 10)}.png`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                    }
                });
            }
        });
        map.renderSync();
    };

    const handleCacheMapForOffline = async () => {
        if (!map || isCaching) return;

        setIsCaching(true);
        setCacheProgress(0);

        try {
            const view = map.getView();
            const center = view.getCenter();
            const zoom = view.getZoom();

            if (!center || zoom === undefined) return;

            // Convert from Web Mercator to lat/lon
            const [centerLon, centerLat] = toLonLat(center);

            // Calculate bounding box based on current view (roughly 2 degrees in each direction)
            const delta = 2;
            const minLat = centerLat - delta;
            const maxLat = centerLat + delta;
            const minLon = centerLon - delta;
            const maxLon = centerLon + delta;

            // Limit zoom level for offline caching (max 15 to keep file size reasonable)
            const cacheZoom = Math.min(Math.floor(zoom), 15);

            await downloadMapTiles(
                minLat,
                minLon,
                maxLat,
                maxLon,
                cacheZoom,
                `Map at ${centerLat.toFixed(2)}, ${centerLon.toFixed(2)}`,
                (current, total) => {
                    setTotalTiles(total);
                    setCacheProgress(Math.round((current / total) * 100));
                }
            );

            // Refresh storage usage
            const usage = await getStorageUsage();
            setStorageUsage(usage);

            alert(`Successfully cached ${Math.round(totalTiles)} map tiles for offline use!`);
        } catch (error) {
            console.error('Failed to cache map:', error);
            alert('Failed to cache map for offline use. Please try again.');
        } finally {
            setIsCaching(false);
            setCacheProgress(0);
        }
    };

    const searchResults = SEARCH_AREAS.filter(area =>
        area.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className={`glass-panel ${styles.container}`}>
            <div className={styles.searchOverlay} ref={searchRef}>
                {isSearching && searchQuery.length > 0 && (
                    <div className={styles.searchDropdown}>
                        {searchResults.length > 0 ? (
                            searchResults.map((area, idx) => (
                                <div key={idx} className={styles.dropdownItem} onClick={() => handleSelectArea(area)}>
                                    {area.name}
                                </div>
                            ))
                        ) : (
                            <div className={styles.emptySearch}>No areas found</div>
                        )}
                    </div>
                )}
            </div>

            <div ref={mapElement} className={styles.mapElement} style={{ position: 'relative' }}>
                <div className={styles.controls}>
                    <button className={`glass-button ${styles.zoomBtn}`} title="Zoom In" onClick={handleZoomIn}>+</button>
                    <button className={`glass-button ${styles.zoomBtn}`} title="Zoom Out" onClick={handleZoomOut}>−</button>
                </div>

                {storageUsage.tileCount > 0 && (
                    <div className={styles.storageInfo} style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        background: 'rgba(255, 255, 255, 0.9)',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontSize: 'clamp(0.65rem, 1.5vw, 0.75rem)',
                        color: '#475569',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(217, 225, 236, 0.5)'
                    }}>
                        <div>Cached: {storageUsage.tileCount} tiles</div>
                        <div>~{(storageUsage.approximateSize / 1024 / 1024).toFixed(1)} MB</div>
                    </div>
                )}
            </div>

            <div style={{
                display: 'flex',
                gap: '8px',
                width: '100%',
                padding: '12px',
                flexDirection: 'column'
            }}>
                <button 
                    className="glass-button"
                    onClick={handleDownloadMap}
                    style={{
                        padding: 'clamp(10px, 3vw, 14px) clamp(12px, 4vw, 16px)',
                        fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                        fontWeight: '600',
                        minHeight: '44px',
                        touchAction: 'manipulation'
                    }}
                >
                    Download Map Image
                </button>
                <button 
                    className="glass-button"
                    onClick={handleCacheMapForOffline}
                    disabled={isCaching}
                    style={{
                        padding: 'clamp(10px, 3vw, 14px) clamp(12px, 4vw, 16px)',
                        fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                        fontWeight: '600',
                        minHeight: '44px',
                        opacity: isCaching ? 0.6 : 1,
                        touchAction: 'manipulation'
                    }}
                >
                    {isCaching ? `Caching ${cacheProgress}%` : 'Store Offline Map'}
                </button>
            </div>

            <div className={styles.legend}>
                <h4 className={styles.legendTitle}>Oceanic Data Layers</h4>
                <label className={`${styles.legendItem} ${styles.mb}`}>
                    <input type="checkbox" checked={showAlpha} onChange={(e) => setShowAlpha(e.target.checked)} className={styles.checkbox} />
                    <span className={`${styles.legendColor} ${styles.colorAlpha}`}></span> <span style={{ fontSize: 'clamp(0.75rem, 2vw, 0.85rem)' }}>Species Predictions</span>
                </label>
                <label className={`${styles.legendItem} ${styles.mb}`}>
                    <input type="checkbox" checked={showClusters} onChange={(e) => setShowClusters(e.target.checked)} className={styles.checkbox} />
                    <span className={`${styles.legendColor} ${styles.colorCluster}`}></span> <span style={{ fontSize: 'clamp(0.75rem, 2vw, 0.85rem)' }}>Fish Clusters</span>
                </label>
                <label className={styles.legendItem}>
                    <input type="checkbox" checked={showRestricted} onChange={(e) => setShowRestricted(e.target.checked)} className={styles.checkbox} />
                    <span className={`${styles.legendColor} ${styles.colorRestricted}`}></span> <span style={{ fontSize: 'clamp(0.75rem, 2vw, 0.85rem)' }}>Restricted Zones</span>
                </label>
            </div>
        </div>
    );
}
