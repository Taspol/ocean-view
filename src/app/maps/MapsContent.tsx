'use client';

import React, { Suspense } from "react";
import { useSearchParams } from 'next/navigation';
import MapVisualization from "@/components/MapVisualization";
import styles from "../page.module.css";

function MapsInner() {
  const searchParams = useSearchParams();
  const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : undefined;
  const lon = searchParams.get('lon') ? parseFloat(searchParams.get('lon')!) : undefined;
  const zoom = searchParams.get('zoom') ? parseInt(searchParams.get('zoom')!) : undefined;

  return (
    <>
      <div className={styles.configHeader}>
        <h2>Current Area Navigation</h2>
        <p>High-resolution zone predictions and contour mappings for your next trip.</p>
      </div>

      <div className={styles.mapWrapper}>
        <MapVisualization initialLat={lat} initialLon={lon} initialZoom={zoom} />
      </div>
    </>
  );
}

export default function MapsContent() {
  return (
    <Suspense fallback={<div>Loading map...</div>}>
      <MapsInner />
    </Suspense>
  );
}
