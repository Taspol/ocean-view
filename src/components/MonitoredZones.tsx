'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './MonitoredZones.module.css';
import { ALL_ZONES } from '@/lib/zones';

export default function MonitoredZones() {
    const router = useRouter();
    // Initialize with the original 3 defaults
    const [monitoredIds, setMonitoredIds] = useState<string[]>(['z1', 'z2', 'z3']);
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

    const searchResults = ALL_ZONES.filter(z =>
        !monitoredIds.includes(z.id) &&
        z.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const displayedZones = monitoredIds
        .map(id => ALL_ZONES.find(z => z.id === id))
        .filter(Boolean) as typeof ALL_ZONES;

    const top5Zones = [...ALL_ZONES]
        .sort((a, b) => parseInt(b.chance) - parseInt(a.chance))
        .slice(0, 5);

    return (
        <div className={styles.container}>
            <div className={styles.mainColumn}>
                {/* Search Add Feature */}
                <div className={styles.searchHeader} ref={searchContainerRef}>
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="Search for a new zone to monitor... (e.g. 'Delta')"
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
                                searchResults.map(zone => (
                                    <div key={zone.id} className={styles.dropdownItem} onClick={() => handleAddZone(zone.id)}>
                                        <span className={styles.dropdownName}>{zone.name}</span>
                                        <span className={styles.dropdownChance}>{zone.chance}</span>
                                    </div>
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
                                <div className={styles.zoneName}>{spot.name}</div>
                                <div className={styles.zoneCoords}>Coordinates: {spot.coords}</div>
                            </div>
                            <div className={styles.zoneRate}>
                                <div className={styles.rateLabel}>Predicted Catch Rate</div>
                                <div className={styles.rateValue}>{spot.chance}</div>
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
                                <div className={styles.topName}>{z.name}</div>
                                <div className={styles.topChance}>{z.chance}</div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
