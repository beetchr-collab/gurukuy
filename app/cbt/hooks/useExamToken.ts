/**
 * Custom Hook untuk Fetch Soal Berdasarkan Token
 * Path: app/ujian/hooks/useExamToken.ts
 *
 * Fungsi:
 * - Validasi token
 * - Fetch soal berdasarkan token
 * - Manage loading, error, dan success states
 */

import { useState, useCallback } from 'react';
import { Question } from '../types/exam';

interface ExamTokenData {
  examId: string;
  examName: string;
  mapel: string;
  totalTime: number;
  totalQuestions: number;
  questions: Question[];
}

interface UseExamTokenResult {
  loading: boolean;
  error: string | null;
  data: ExamTokenData | null;
  validateAndFetch: (token: string, examId: string) => Promise<boolean>;
}

/**
 * Hook untuk validasi dan fetch soal berdasarkan token
 */
export const useExamToken = (): UseExamTokenResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ExamTokenData | null>(null);

  const validateAndFetch = useCallback(
    async (token: string, examId: string): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        // Fetch soal berdasarkan token
        const response = await fetch(
          `/api/exam/questions?bankSoalId=${examId}&token=${token}`
        );

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Gagal memuat soal ujian');
        }

        setData(result.data);
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan';
        setError(errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    data,
    validateAndFetch,
  };
};
