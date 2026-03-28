'use client';

import React, { Suspense } from "react";
import { ProtectedRoute } from "@/lib/protectedRoute";
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
