/**
 * Offline Map Data Manager
 * Handles caching of map tiles and data for offline access
 */

const DB_NAME = 'OceanFishingMaps';
const DB_VERSION = 1;
const TILES_STORE = 'map-tiles';
const REGIONS_STORE = 'cached-regions';

interface CachedRegion {
  id: string;
  name: string;
  bounds: {
    minLat: number;
    minLon: number;
    maxLat: number;
    maxLon: number;
  };
  zoom: number;
  timestamp: number;
  tileCount: number;
}

/**
 * Initialize IndexedDB for persistent tile storage
 */
export async function initializeOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Store for map tiles
      if (!db.objectStoreNames.contains(TILES_STORE)) {
        db.createObjectStore(TILES_STORE, { keyPath: 'url' });
      }

      // Store for cached region metadata
      if (!db.objectStoreNames.contains(REGIONS_STORE)) {
        db.createObjectStore(REGIONS_STORE, { keyPath: 'id' });
      }
    };
  });
}

/**
 * Generate tile URLs for a given bounding box and zoom level
 * Uses OpenStreetMap tile grid
 */
export function generateTileUrls(
  minLat: number,
  minLon: number,
  maxLat: number,
  maxLon: number,
  zoom: number
): string[] {
  const tiles: string[] = [];

  // Convert lat/lon to tile numbers
  function latLonToTile(lat: number, lon: number, z: number) {
    const n = Math.pow(2, z);
    const x = Math.floor(((lon + 180) / 360) * n);
    const y = Math.floor(((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) * n);
    return { x, y };
  }

  const nwTile = latLonToTile(maxLat, minLon, zoom);
  const seTile = latLonToTile(minLat, maxLon, zoom);

  for (let x = nwTile.x; x <= seTile.x; x++) {
    for (let y = nwTile.y; y <= seTile.y; y++) {
      // OpenStreetMap tiles
      tiles.push(`https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`);
    }
  }

  return tiles;
}

/**
 * Download and cache map tiles for offline use
 */
export async function downloadMapTiles(
  minLat: number,
  minLon: number,
  maxLat: number,
  maxLon: number,
  zoom: number,
  regionName?: string,
  onProgress?: (current: number, total: number) => void
): Promise<{ success: boolean; tileCount: number; regionId: string }> {
  try {
    const regionId = `region_${Date.now()}`;
    const db = await initializeOfflineDB();
    const tileUrls = generateTileUrls(minLat, minLon, maxLat, maxLon, zoom);

    // Store region metadata
    const region: CachedRegion = {
      id: regionId,
      name: regionName || `Map cache ${new Date().toLocaleDateString()}`,
      bounds: { minLat, minLon, maxLat, maxLon },
      zoom,
      timestamp: Date.now(),
      tileCount: tileUrls.length,
    };

    const regionStore = db.transaction(REGIONS_STORE, 'readwrite').objectStore(REGIONS_STORE);
    regionStore.add(region);

    // Download tiles via service worker message for better performance
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_TILES',
        tiles: tileUrls,
      });
    }

    // Also cache via IndexedDB for offline access
    const transaction = db.transaction(TILES_STORE, 'readwrite');
    const store = transaction.objectStore(TILES_STORE);

    let completedCount = 0;
    for (const url of tileUrls) {
      try {
        const response = await fetch(url, { mode: 'cors' });
        if (response.ok) {
          const blob = await response.blob();
          store.put({ url, blob, timestamp: Date.now() });
          completedCount++;

          if (onProgress) {
            onProgress(completedCount, tileUrls.length);
          }
        }
      } catch (error) {
        console.debug(`Failed to cache tile: ${url}`);
      }
    }

    return {
      success: completedCount > 0,
      tileCount: completedCount,
      regionId,
    };
  } catch (error) {
    console.error('Failed to download map tiles:', error);
    throw error;
  }
}

/**
 * Get list of cached regions
 */
export async function getCachedRegions(): Promise<CachedRegion[]> {
  try {
    const db = await initializeOfflineDB();
    return new Promise((resolve, reject) => {
      const store = db.transaction(REGIONS_STORE, 'readonly').objectStore(REGIONS_STORE);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as CachedRegion[]);
    });
  } catch (error) {
    console.error('Failed to get cached regions:', error);
    return [];
  }
}

/**
 * Delete a cached region
 */
export async function deleteCachedRegion(regionId: string): Promise<void> {
  try {
    const db = await initializeOfflineDB();
    const regionStore = db.transaction(REGIONS_STORE, 'readwrite').objectStore(REGIONS_STORE);
    regionStore.delete(regionId);
  } catch (error) {
    console.error('Failed to delete cached region:', error);
  }
}

/**
 * Clear all cached tiles
 */
export async function clearAllTiles(): Promise<void> {
  try {
    const db = await initializeOfflineDB();
    const transaction = db.transaction([TILES_STORE, REGIONS_STORE], 'readwrite');
    transaction.objectStore(TILES_STORE).clear();
    transaction.objectStore(REGIONS_STORE).clear();

    // Also notify service worker to clear cache
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CLEAR_TILE_CACHE',
      });
    }
  } catch (error) {
    console.error('Failed to clear tiles:', error);
  }
}

/**
 * Get cached tile blob if available
 */
export async function getCachedTile(url: string): Promise<Blob | null> {
  try {
    const db = await initializeOfflineDB();
    return new Promise((resolve, reject) => {
      const store = db.transaction(TILES_STORE, 'readonly').objectStore(TILES_STORE);
      const request = store.get(url);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result as { blob: Blob } | undefined;
        resolve(result?.blob || null);
      };
    });
  } catch (error) {
    return null;
  }
}

/**
 * Get storage usage statistics
 */
export async function getStorageUsage(): Promise<{
  tileCount: number;
  regionCount: number;
  approximateSize: number;
}> {
  try {
    const db = await initializeOfflineDB();
    
    const tilesTransaction = db.transaction(TILES_STORE, 'readonly');
    const tilesCount = await new Promise<number>((resolve, reject) => {
      const request = tilesTransaction.objectStore(TILES_STORE).count();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });

    const regionsTransaction = db.transaction(REGIONS_STORE, 'readonly');
    const regionsCount = await new Promise<number>((resolve, reject) => {
      const request = regionsTransaction.objectStore(REGIONS_STORE).count();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });

    // Approximate size (256KB per tile)
    const approximateSize = tilesCount * 256000;

    return {
      tileCount: tilesCount,
      regionCount: regionsCount,
      approximateSize,
    };
  } catch (error) {
    console.error('Failed to get storage usage:', error);
    return {
      tileCount: 0,
      regionCount: 0,
      approximateSize: 0,
    };
  }
}

/**
 * Register service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
      updateViaCache: 'none',
    });
    console.log('Service Worker registered:', registration);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}
