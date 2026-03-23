'use client';

import React, { Suspense } from "react";
import MapVisualization from "@/components/MapVisualization";
import { ProtectedRoute } from "@/lib/protectedRoute";
import styles from "../page.module.css";
import MapsContent from "./MapsContent";

export default function MapsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProtectedRoute>
        <MapsContent />
      </ProtectedRoute>
    </Suspense>
  );
}
