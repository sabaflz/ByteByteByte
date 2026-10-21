import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

// Used when location permission is denied or unavailable: Fresno, CA,
// in the middle of California's Central Valley farmland.
export const DEFAULT_LOCATION = { lat: 36.7378, lon: -119.7871, label: 'Fresno, CA (default)' };

export type FarmLocation = { lat: number; lon: number; label: string };

// If the permission prompt is ignored (or the browser never answers), don't
// leave the app on "Loading..." forever.
const LOCATION_TIMEOUT_MS = 8000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('location timed out')), ms)),
  ]);
}

export function useFarmLocation() {
  const [location, setLocation] = useState<FarmLocation | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const pos = await withTimeout(
          (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') throw new Error('permission denied');
            return Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          })(),
          LOCATION_TIMEOUT_MS,
        );
        if (!cancelled) {
          setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude, label: 'Your location' });
        }
      } catch {
        if (!cancelled) setLocation(DEFAULT_LOCATION);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return location;
}
