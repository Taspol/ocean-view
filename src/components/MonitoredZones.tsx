'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './MonitoredZones.module.css';
import { formatProbability, getLocationPredictions, MOCK_PREDICTIONS } from '@/lib/mockPredictions';

const LOCATION_PREDICTIONS = getLocationPredictions(MOCK_PREDICTIONS);
const DEFAULT_MONITORED_IDS = LOCATION_PREDICTIONS.slice(0, 3).map((zone) => zone.id);

// Type guard to filter out undefined values
const isDefined = <T,>(value: T | undefined): value is T => value !== undefined;

export default function MonitoredZones() {
    const router = useRouter();
    const [monitoredIds, setMonitoredIds] = useState<string[]>(DEFAULT_MONITORED_IDS);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    const searchContainerRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setIsSearching(false);
            }
            if (!(event.target as Element).closest(`.${styles.menuContainer}`)) {
                setOpenMenuId(null);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAddZone = (id: string) => {
        if (!monitoredIds.includes(id)) {
            setMonitoredIds(prev => [...prev, id]);
        }
        setSearchQuery('');
        setIsSearching(false);
    };

    const handleRemoveZone = (id: string) => {
        setMonitoredIds(prev => prev.filter(z => z !== id));
    };

    const searchResults = LOCATION_PREDICTIONS.filter((zone) =>
        !monitoredIds.includes(zone.id) &&
        `${zone.location_name} ${zone.common_name} ${zone.species_thai}`.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const displayedZones = monitoredIds
        .map((id) => LOCATION_PREDICTIONS.find((zone) => zone.id === id))
        .filter(isDefined);

    const top5Zones = [...LOCATION_PREDICTIONS]
        .sort((a, b) => b.probability - a.probability)
        .slice(0, 5);

    return (
        <div className={styles.container}>
            <div className={styles.mainColumn}>
                {/* Search Add Feature */}
                <div className={styles.searchHeader} ref={searchContainerRef}>

                    {isSearching && searchQuery.length > 0 && (
                        <div className={styles.searchDropdown}>
                            {searchResults.length > 0 ? (
                                searchResults.map(zone => (
                                    <button
                                        key={zone.id}
                                        type="button"
                                        className={styles.dropdownItem}
                                        onClick={() => handleAddZone(zone.id)}
                                    >
                                        <span className={styles.dropdownName}>{zone.location_name}</span>
                                        <span className={styles.dropdownChance}>{formatProbability(zone.probability)}</span>
                                    </button>
                                ))
                            ) : (
                                <div className={styles.emptyState}>No matching zones found.</div>
                            )}
                        </div>
                    )}
                </div>

                {/* Monitored List */}
                {displayedZones.length === 0 ? (
                    <div className={styles.emptyState}>You are not monitoring any zones. Search above to add one!</div>
                ) : (
                    displayedZones.map((spot) => (
                        <div key={spot.id} className={styles.configItemRow}>
                            <div className={styles.zoneInfo}>
                                <div className={styles.zoneName}>{spot.location_name}</div>
                                <div className={styles.zoneCoords}>
                                    Coordinates: {spot.coords} | {spot.common_name} ({spot.species_thai})
                                </div>
                            </div>
                            <div className={styles.zoneRate}>
                                <div className={styles.rateLabel}>{spot.advisory} Advisory</div>
                                <div className={styles.rateValue}>{formatProbability(spot.probability)}</div>
                            </div>
                            <div className={styles.actions}>
                                <button
                                    className={styles.actionBtn}
                                    onClick={() => router.push(`/maps?lat=${spot.lat}&lon=${spot.lon}&zoom=9`)}
                                >
                                    Explore in Map
                                </button>
                                <div className={styles.menuContainer}>
                                    <button
                                        className={styles.moreBtn}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenMenuId(openMenuId === spot.id ? null : spot.id);
                                        }}
                                        title="More options"
                                        aria-label={`More options for ${spot.location_name}`}
                                    >
                                        ⋮
                                    </button>
                                    {openMenuId === spot.id && (
                                        <div className={styles.popupMenu}>
                                            <button
                                                className={styles.deleteOption}
                                                onClick={() => {
                                                    handleRemoveZone(spot.id);
                                                    setOpenMenuId(null);
                                                }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className={styles.sideColumn}>
                <h3 className={styles.sideTitle}>Top 5 Fishing Rates</h3>
                <ul className={styles.topList}>
                    {top5Zones.map((z, idx) => (
                        <li key={z.id} className={styles.topListItem}>
                            <span className={styles.rankNumber}>#{idx + 1}</span>
                            <div className={styles.topInfo}>
                                <div className={styles.topName}>{z.location_name}</div>
                                <div className={styles.topChance}>{formatProbability(z.probability)}</div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
