/**
 * Custom Hook untuk Autosave ke Firebase Firestore
 * Menyimpan jawaban secara otomatis dengan debounce
 */

import { useCallback, useEffect, useRef } from 'react';
import { StudentAnswer } from '../types/exam';
import { TIMER_CONFIG } from '../utils/constants';

interface UseAutoSaveProps {
  answers: StudentAnswer[];
  sessionId: string;
  onSaveStart?: () => void;
  onSaveSuccess?: (message: string) => void;
  onSaveError?: (error: Error) => void;
  debounceDelay?: number;
  autoSyncInterval?: number;
}

/**
 * Hook untuk autosave jawaban ke Firestore
 * Implementasi dengan debounce untuk mengurangi write calls
 */
export const useAutoSave = ({
  answers,
  sessionId,
  onSaveStart,
  onSaveSuccess,
  onSaveError,
  debounceDelay = 2000,
  autoSyncInterval = TIMER_CONFIG.SYNC_INTERVAL,
}: UseAutoSaveProps) => {
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const syncTimer = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef<number>(0);
  const isSavingRef = useRef<boolean>(false);

  // Fungsi untuk menyimpan ke Firestore (mock implementation)
  const saveToFirestore = useCallback(
    async (answersToSave: StudentAnswer[]) => {
      if (isSavingRef.current || answersToSave.length === 0) return;

      isSavingRef.current = true;
      onSaveStart?.();

      try {
        // TODO: Implementasi Firebase Firestore save
        // const docRef = doc(db, 'exam-sessions', sessionId);
        // await updateDoc(docRef, {
        //   answers: answersToSave,
        //   lastSeen: serverTimestamp(),
        //   updatedAt: serverTimestamp(),
        // });

        // Simulasi delay API
        await new Promise((resolve) => setTimeout(resolve, 300));

        lastSaveRef.current = Date.now();
        onSaveSuccess?.('Jawaban tersimpan');

        console.log('✓ Autosave:', answersToSave.length, 'jawaban');
      } catch (error) {
        console.error('✗ Autosave error:', error);
        onSaveError?.(error instanceof Error ? error : new Error('Save failed'));
      } finally {
        isSavingRef.current = false;
      }
    },
    [sessionId, onSaveStart, onSaveSuccess, onSaveError]
  );

  // Debounced save
  const debouncedSave = useCallback(
    (answersToSave: StudentAnswer[]) => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        saveToFirestore(answersToSave);
      }, debounceDelay);
    },
    [debounceDelay, saveToFirestore]
  );

  // Effect untuk debounced save
  useEffect(() => {
    debouncedSave(answers);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [answers, debouncedSave]);

  // Effect untuk periodic sync
  useEffect(() => {
    syncTimer.current = setInterval(() => {
      // Jika ada perubahan yang belum disimpan, simpan sekarang
      if (Date.now() - lastSaveRef.current > autoSyncInterval && answers.length > 0) {
        saveToFirestore(answers);
      }
    }, autoSyncInterval);

    return () => {
      if (syncTimer.current) {
        clearInterval(syncTimer.current);
      }
    };
  }, [answers, autoSyncInterval, saveToFirestore]);

  // Manual save
  const manualSave = useCallback(async () => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    await saveToFirestore(answers);
  }, [answers, saveToFirestore]);

  return {
    manualSave,
  };
};
