import { useState, useEffect, useCallback, useRef } from 'react';
import { isOnline as checkOnline, syncPendingActions, getPendingActions } from '../services/offlineCache';

/**
 * Hook qui surveille l'état du réseau et gère la synchro
 * des actions en attente quand la connexion revient.
 */
export default function useOffline(api) {
  const [online, setOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(getPendingActions().length);
  const [lastSyncResult, setLastSyncResult] = useState(null);
  const apiRef = useRef(api);
  apiRef.current = api;

  // écouter les évènements réseau
  useEffect(() => {
    const goOnline = async () => {
      setOnline(true);
      // Synchro automatique quand le réseau revient
      if (getPendingActions().length > 0 && apiRef.current) {
        setSyncing(true);
        try {
          const result = await syncPendingActions(apiRef.current);
          setLastSyncResult(result);
          setPendingCount(getPendingActions().length);
        } catch {
          // silent
        } finally {
          setSyncing(false);
        }
      }
    };

    const goOffline = () => setOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Rafraîchir le compteur périodiquement
  useEffect(() => {
    const interval = setInterval(() => {
      setPendingCount(getPendingActions().length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const manualSync = useCallback(async () => {
    if (!checkOnline() || !apiRef.current) return;
    setSyncing(true);
    try {
      const result = await syncPendingActions(apiRef.current);
      setLastSyncResult(result);
      setPendingCount(getPendingActions().length);
      return result;
    } finally {
      setSyncing(false);
    }
  }, []);

  return { online, syncing, pendingCount, lastSyncResult, manualSync };
}
