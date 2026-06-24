/**
 * Custom Hook untuk Timer CBT
 * Menangani countdown waktu ujian dengan perbaruan realtime
 */

import { useEffect, useCallback, useState } from 'react';
import { TimerState } from '../types/exam';
import { calculateTimePercentage } from '../utils/helpers';

interface UseTimerProps {
  totalTime: number; // dalam detik
  isActive: boolean;
  onTimeExpired?: () => void;
  syncInterval?: number; // interval untuk sync
}

/**
 * Hook untuk mengelola timer countdown
 */
export const useTimer = ({
  totalTime,
  isActive,
  onTimeExpired,
  syncInterval = 1000,
}: UseTimerProps): TimerState => {
  // State untuk waktu yang tersisa
  const [timeLeft, setTimeLeft] = useState<number>(totalTime);
  const [isRunning, setIsRunning] = useState<boolean>(isActive);

  // Callback ketika waktu habis
  const handleTimeExpired = useCallback(() => {
    setIsRunning(false);
    onTimeExpired?.();
  }, [onTimeExpired]);

  // Effect untuk menjalankan timer
  useEffect(() => {
    if (!isActive) {
      setIsRunning(false);
      return;
    }

    setIsRunning(true);

    // Interval untuk countdown
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, syncInterval);

    return () => clearInterval(interval);
  }, [isActive, syncInterval, handleTimeExpired]);

  // Hitung persentase waktu tersisa
  const percentage = calculateTimePercentage(timeLeft, totalTime);

  return {
    timeLeft,
    isRunning,
    isExpired: timeLeft === 0,
    percentage,
  };
};

/**
 * Hook untuk pause/resume timer
 */
export const useTimerControl = (initialTime: number) => {
  const [timeLeft, setTimeLeft] = useState<number>(initialTime);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const pause = useCallback(() => setIsPaused(true), []);
  const resume = useCallback(() => setIsPaused(false), []);
  const reset = useCallback(() => setTimeLeft(initialTime), [initialTime]);
  const setTime = useCallback((time: number) => setTimeLeft(time), []);

  return {
    timeLeft,
    isPaused,
    pause,
    resume,
    reset,
    setTime,
  };
};
