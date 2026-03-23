'use client';

import React, { Suspense } from "react";
import { ProtectedRoute } from "@/lib/protectedRoute";
import WeatherContent from "./WeatherContent";

export default function WeatherPage() {
    return (
        <ProtectedRoute>
            <Suspense fallback={<div>Loading weather...</div>}>
                <WeatherContent />
            </Suspense>
        </ProtectedRoute>
    );
}
