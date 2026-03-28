'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/offlineMapManager';

export default function OfflineProvider() {
  useEffect(() => {
    // Register service worker for offline support
    registerServiceWorker().catch(console.error);
  }, []);

  return null;
}
