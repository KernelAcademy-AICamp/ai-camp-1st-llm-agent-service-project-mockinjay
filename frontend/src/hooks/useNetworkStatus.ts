import { useState, useEffect, useCallback } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
}

/**
 * Hook to track network connectivity status
 *
 * Returns the current online/offline status and whether
 * the connection was recently restored.
 *
 * 네트워크 연결 상태를 추적하는 훅입니다.
 * 현재 온라인/오프라인 상태와 연결이 최근 복구되었는지 여부를 반환합니다.
 *
 * @returns {NetworkStatus} - { isOnline: boolean, wasOffline: boolean }
 *
 * @example
 * const { isOnline, wasOffline } = useNetworkStatus();
 *
 * if (!isOnline) {
 *   return <OfflineBanner />;
 * }
 *
 * if (wasOffline) {
 *   // Show reconnection message or reload data
 *   reloadData();
 * }
 */
export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    // SSR-safe initial value
    if (typeof window !== 'undefined') {
      return navigator.onLine;
    }
    return true;
  });

  const [wasOffline, setWasOffline] = useState<boolean>(false);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    setWasOffline(true);

    // Reset wasOffline after a short delay
    // so components can react to reconnection
    setTimeout(() => {
      setWasOffline(false);
    }, 3000);
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return { isOnline, wasOffline };
}

export default useNetworkStatus;
