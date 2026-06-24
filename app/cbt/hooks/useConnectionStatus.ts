/**
 * Custom Hook untuk Status Koneksi
 * Mendeteksi online/offline dan status sinkronisasi
 */

import { useCallback, useEffect, useState } from 'react';
import { ConnectionStatus } from '../types/exam';

/**
 * Hook untuk mendeteksi status koneksi internet
 */
export const useConnectionStatus = () => {
  const [status, setStatus] = useState<ConnectionStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    lastSync: Date.now(),
    syncStatus: 'synced',
  });

  const handleOnline = useCallback(() => {
    setStatus((prev) => ({
      ...prev,
      isOnline: true,
      syncStatus: 'syncing',
    }));

    // Simulasi sinkronisasi
    setTimeout(() => {
      setStatus((prev) => ({
        ...prev,
        syncStatus: 'synced',
        lastSync: Date.now(),
      }));
    }, 1000);
  }, []);

  const handleOffline = useCallback(() => {
    setStatus((prev) => ({
      ...prev,
      isOnline: false,
      syncStatus: 'error',
    }));
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return status;
};

/**
 * Hook untuk deteksi visibility dokumen
 * Mendeteksi ketika user meninggalkan tab/window ujian
 */
export const useDocumentVisibility = () => {
  const [isVisible, setIsVisible] = useState<boolean>(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
};
