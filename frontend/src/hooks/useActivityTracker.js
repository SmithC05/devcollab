import { useEffect, useRef } from 'react';
import { wsClient } from '../api/websocketClient';

const IDLE_TIMEOUT_MS = 60000; // 1 minute for demo purposes

export const useActivityTracker = (isAuthenticated) => {
  const idleTimeoutRef = useRef(null);
  const isIdle = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      wsClient.disconnect();
      return;
    }

    wsClient.connect();

    const resetIdleTimeout = () => {
      if (isIdle.current) {
        isIdle.current = false;
        wsClient.setStatus('ACTIVE');
      }
      wsClient.sendActivity();

      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
      idleTimeoutRef.current = setTimeout(() => {
        isIdle.current = true;
        wsClient.setStatus('IDLE');
      }, IDLE_TIMEOUT_MS);
    };

    const handleActivity = () => {
      // Throttle activity to avoid spamming the websocket (e.g. every 5s)
      resetIdleTimeout();
    };

    // Throttle the actual sendActivity calls
    let lastActivitySent = 0;
    const throttledHandleActivity = () => {
      const now = Date.now();
      if (now - lastActivitySent > 5000) {
        handleActivity();
        lastActivitySent = now;
      }
    };

    window.addEventListener('mousemove', throttledHandleActivity);
    window.addEventListener('keydown', throttledHandleActivity);
    window.addEventListener('click', throttledHandleActivity);
    window.addEventListener('scroll', throttledHandleActivity);

    // Initial timeout set
    resetIdleTimeout();

    return () => {
      window.removeEventListener('mousemove', throttledHandleActivity);
      window.removeEventListener('keydown', throttledHandleActivity);
      window.removeEventListener('click', throttledHandleActivity);
      window.removeEventListener('scroll', throttledHandleActivity);
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
    };
  }, [isAuthenticated]);
};
