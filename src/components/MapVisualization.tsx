'use client';

import React, { useEffect, useRef, useState } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import styles from './MapVisualization.module.css';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Polygon from 'ol/geom/Polygon';
import { Style, Circle as CircleStyle, Fill, Stroke, Text } from 'ol/style';
import { FeatureLike } from 'ol/Feature';
import Cluster from 'ol/source/Cluster';

const SEARCH_AREAS = [
    { name: 'Gulf of Thailand (Center)', lon: 101.5, lat: 9.5, zoom: 7 },
    { name: 'Andaman Sea Coast', lon: 98.5, lat: 8.5, zoom: 7 },
    { name: 'Phuket, Thailand', lon: 98.39, lat: 7.89, zoom: 10 },
    { name: 'Hua Hin, Prachuap Khiri Khan', lon: 99.95, lat: 12.57, zoom: 10 },
    { name: 'Alpha Zone (Hotspot)', lon: 101.2, lat: 9.8, zoom: 9 },
    { name: 'Beta Zone (Hotspot)', lon: 101.8, lat: 9.2, zoom: 9 },
];

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
    const [showVessels, setShowVessels] = useState(true);
    const [showRestricted, setShowRestricted] = useState(true);

    // Layer Refs for programmatic control
    const alphaLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
    const clusterLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
    const vesselLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
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

        // Center on generic ocean coordinates (e.g. Gulf of Thailand roughly)
        const initialCenter = fromLonLat([101.5, 9.5]);

        // Create a vector layer for Fishing Hotspots (Predictions)
        const hotspotSource = new VectorSource();

        // Alpha Zone
        // const alphaZone = new Feature({
        //     geometry: new Point(fromLonLat([101.2, 9.8])),
        //     name: 'Alpha Zone (85%)',
        // });

        // // Beta Zone
        // const betaZone = new Feature({
        //     geometry: new Point(fromLonLat([101.8, 9.2])),
        //     name: 'Beta Zone (72%)',
        // });

        // hotspotSource.addFeatures([alphaZone, betaZone]);

        // Style the hotspots to look like radar pings / predicted zones
        const hotspotStyle = new Style({
            image: new CircleStyle({
                radius: 12,
                fill: new Fill({ color: 'rgba(245, 158, 11, 0.5)' }),
                stroke: new Stroke({
                    color: 'rgba(245, 158, 11, 1)',
                    width: 2,
                }),
            }),
            text: new Text({
                font: '14px "Noto Sans", sans-serif',
                fill: new Fill({ color: '#fff' }),
                stroke: new Stroke({ color: '#000', width: 3 }),
                offsetY: -25,
            }),
        });

        const styleFunction = (feature: FeatureLike) => {
            const text = hotspotStyle.getText();
            if (text) {
                text.setText(feature.get('name') as string);
            }
            return hotspotStyle;
        };

        const vectorLayer = new VectorLayer({
            source: hotspotSource,
            style: styleFunction,
            visible: showAlpha,
        });
        alphaLayerRef.current = vectorLayer;

        // Darker / customized tile layer if possible, using standard OSM for now
        // but tuning opacity so our background color blends through slightly
        const baseLayer = new TileLayer({
            source: new OSM(),
            opacity: 0.8,
        });

        // Fish Clusters (Predictions/Aggregations)
        const fishPoints = [];
        // Spawn a large number of points explicitly avoiding the main Thai peninsula
        for (let i = 0; i < 500; i++) {
            // tightly constrained to open water in Gulf of Thailand
            const lon = 100.5 + Math.random() * 2.5;
            const lat = 8.0 + Math.random() * 3.5;
            fishPoints.push(new Feature(new Point(fromLonLat([lon, lat]))));
        }

        const fishSource = new VectorSource({
            features: fishPoints,
        });

        const clusterSource = new Cluster({
            distance: 80,
            source: fishSource,
        });

        const clusterStyleCache: { [key: number]: Style } = {};
        const clusterLayer = new VectorLayer({
            source: clusterSource,
            style: (feature) => {
                const size = feature.get('features').length;

                // Only render clusters with at least 10 items
                if (size < 10) return;

                let style = clusterStyleCache[size];
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
                            text: size.toString(),
                            fill: new Fill({
                                color: '#fff',
                            }),
                            font: '12px "Noto Sans", sans-serif',
                            stroke: new Stroke({ color: 'rgba(0, 0, 0, 0.6)', width: 2 })
                        }),
                    });
                    clusterStyleCache[size] = style;
                }
                return style;
            },
            visible: showClusters,
        });
        clusterLayerRef.current = clusterLayer;

        // Vessel Tracking (Placeholder Data)
        const vesselPoints = [];
        for (let i = 0; i < 20; i++) {
            const lon = 100.5 + Math.random() * 3.0;
            const lat = 8.5 + Math.random() * 3.0;
            vesselPoints.push(new Feature(new Point(fromLonLat([lon, lat]))));
        }

        const vesselStyle = new Style({
            image: new CircleStyle({
                radius: 4,
                fill: new Fill({ color: '#10B981' }), // Emerald Green
                stroke: new Stroke({ color: '#fff', width: 1 }),
            })
        });

        const vesselLayer = new VectorLayer({
            source: new VectorSource({ features: vesselPoints }),
            style: vesselStyle,
            visible: showVessels,
        });
        vesselLayerRef.current = vesselLayer;

        // Restricted Zones (Mock Polygons in Ocean Areas)
        const restrictedZones = [
            [
                [99.958486,11.367476],[99.980257,11.852257],[100.133646,12.201833],[100.109182,12.453915],[100.359028,12.335880],[100.292168,11.850442],[100.203743,11.313610]
            ],
            // Detailed Area in the Central Gulf of Thailand
            [
                [99.446441, 9.445660], [99.279115, 9.826591], [99.345849, 10.118198], [99.512665, 10.525407], [99.977694, 10.781088], [100.314514,10.366466],[100.236197,10.058698] ,[100.458260,9.622593], [100.217062,9.222093]
            ],
            // Area near the deeper trench east of Phuket
            [
                [97.8, 7.5], [98.2, 7.7], [98.4, 7.3], [98.0, 7.1], [97.8, 7.5]
            ],
        ];

        const restrictedFeatures = restrictedZones.map(coords => {
            return new Feature({
                geometry: new Polygon([coords.map(c => fromLonLat(c))])
            });
        });

        const restrictedStyle = new Style({
            fill: new Fill({ color: 'rgba(239, 68, 68, 0.3)' }), // red-500
            stroke: new Stroke({ color: '#ef4444', width: 2 })
        });

        const restrictedLayer = new VectorLayer({
            source: new VectorSource({ features: restrictedFeatures }),
            style: restrictedStyle,
            visible: showRestricted
        });
        restrictedLayerRef.current = restrictedLayer;

        // Initialize the OpenLayers Map
        const initialMap = new Map({
            target: mapElement.current,
            layers: [baseLayer, restrictedLayer, clusterLayer, vectorLayer, vesselLayer],
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
        if (vesselLayerRef.current) vesselLayerRef.current.setVisible(showVessels);
    }, [showVessels]);

    useEffect(() => {
        if (restrictedLayerRef.current) restrictedLayerRef.current.setVisible(showRestricted);
    }, [showRestricted]);

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

    const searchResults = SEARCH_AREAS.filter(area =>
        area.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className={`glass-panel ${styles.container}`}>
            <div className={styles.searchOverlay} ref={searchRef}>
                <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Search for an area..."
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setIsSearching(true);
                    }}
                    onFocus={() => setIsSearching(true)}
                />
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

            <div ref={mapElement} className={styles.mapElement} />

            <div className={styles.controls}>
                <button className={`glass-button ${styles.zoomBtn}`} title="Zoom In" onClick={handleZoomIn}>+</button>
                <button className={`glass-button ${styles.zoomBtn}`} title="Zoom Out" onClick={handleZoomOut}>-</button>
            </div>

            <div className={styles.legend}>
                <h4 className={styles.legendTitle}>Oceanic Data Layers</h4>
                <label className={`${styles.legendItem} ${styles.mb}`}>
                    <input type="checkbox" checked={showAlpha} onChange={(e) => setShowAlpha(e.target.checked)} className={styles.checkbox} />
                    <span className={`${styles.legendColor} ${styles.colorAlpha}`}></span> Alpha Predictions
                </label>
                <label className={`${styles.legendItem} ${styles.mb}`}>
                    <input type="checkbox" checked={showClusters} onChange={(e) => setShowClusters(e.target.checked)} className={styles.checkbox} />
                    <span className={`${styles.legendColor} ${styles.colorCluster}`}></span> Fish Clusters
                </label>
                <label className={`${styles.legendItem} ${styles.mb}`}>
                    <input type="checkbox" checked={showVessels} onChange={(e) => setShowVessels(e.target.checked)} className={styles.checkbox} />
                    <span className={`${styles.legendColor} ${styles.colorVessel}`}></span> Vessel Tracking
                </label>
                <label className={styles.legendItem}>
                    <input type="checkbox" checked={showRestricted} onChange={(e) => setShowRestricted(e.target.checked)} className={styles.checkbox} />
                    <span className={`${styles.legendColor} ${styles.colorRestricted}`}></span> Restricted Zones
                </label>
            </div>
        </div>
    );
}
