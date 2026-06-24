/**
 * Utility Functions untuk CBT/E-Ujian
 */

import { StudentAnswer, AnswerStatus, Question } from '../types/exam';
import { QUESTION_STATUS_COLORS, TIMER_CONFIG } from './constants';

/**
 * Format waktu dalam format MM:SS
 * @param seconds Total detik
 * @returns String format MM:SS
 */
export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Hitung persentase waktu yang tersisa
 * @param timeLeft Sisa waktu (detik)
 * @param totalTime Total waktu (detik)
 * @returns Persentase (0-100)
 */
export const calculateTimePercentage = (timeLeft: number, totalTime: number): number => {
  return Math.round((timeLeft / totalTime) * 100);
};

/**
 * Tentukan warna progress bar berdasarkan sisa waktu
 * @param timeLeft Sisa waktu (detik)
 * @returns Kelas Bootstrap untuk warna
 */
export const getTimerColorClass = (timeLeft: number): string => {
  if (timeLeft <= TIMER_CONFIG.CRITICAL_THRESHOLD) {
    return 'bg-danger'; // Merah - Kritis
  }
  if (timeLeft <= TIMER_CONFIG.WARNING_THRESHOLD) {
    return 'bg-warning'; // Kuning - Peringatan
  }
  return 'bg-success'; // Hijau - Normal
};

/**
 * Dapatkan status jawaban berdasarkan tipe soal
 * @param questionId ID soal
 * @param answers Array jawaban siswa
 * @returns Status jawaban
 */
export const getAnswerStatus = (questionId: string, answers: StudentAnswer[]): AnswerStatus => {
  const answer = answers.find((a) => a.questionId === questionId);
  return answer?.status || 'belum-dijawab';
};

/**
 * Dapatkan informasi warna status soal
 * @param status Status jawaban
 * @returns Object dengan warna dan label
 */
export const getStatusColor = (status: AnswerStatus | 'aktif') => {
  return QUESTION_STATUS_COLORS[status] || QUESTION_STATUS_COLORS['belum-dijawab'];
};

/**
 * Hitung statistik jawaban
 * @param answers Array jawaban siswa
 * @param totalQuestions Total soal
 * @returns Object dengan statistik
 */
export const calculateAnswerStats = (answers: StudentAnswer[], totalQuestions: number) => {
  const answered = answers.filter((a) => a.status === 'sudah-dijawab').length;
  const unsure = answers.filter((a) => a.status === 'ragu-ragu').length;
  const unanswered = totalQuestions - answered - unsure;

  return {
    answered,
    unsure,
    unanswered,
    answeredPercentage: Math.round((answered / totalQuestions) * 100),
  };
};

/**
 * Validasi jawaban untuk tipe soal tertentu
 * @param answer Jawaban siswa
 * @param question Data soal
 * @returns Boolean apakah jawaban valid
 */
export const validateAnswer = (answer: any, question: Question): boolean => {
  if (!answer) return false;

  switch (question.tipe) {
    case 'pilihan-ganda':
      return typeof answer === 'string' && answer.length > 0;

    case 'pilihan-ganda-kompleks':
      return Array.isArray(answer) && answer.length > 0;

    case 'menjodohkan':
      return typeof answer === 'object' && Object.keys(answer).length > 0;

    case 'isian-singkat':
      return typeof answer === 'string' && answer.trim().length > 0;

    case 'essay':
      return typeof answer === 'string' && answer.trim().length > 0;

    default:
      return false;
  }
};

/**
 * Format jawaban untuk ditampilkan
 * @param answer Jawaban siswa
 * @param question Data soal
 * @returns String formatted jawaban
 */
export const formatAnswerDisplay = (answer: any, question: Question): string => {
  if (!answer) return '-';

  switch (question.tipe) {
    case 'pilihan-ganda': {
      const option = question.opsi?.find((o) => o.id === answer);
      return option?.teks || '-';
    }

    case 'pilihan-ganda-kompleks': {
      const options = Array.isArray(answer)
        ? question.opsi?.filter((o) => answer.includes(o.id)).map((o) => o.teks)
        : [];
      return options?.join(', ') || '-';
    }

    case 'menjodohkan':
      return Object.values(answer).join(', ');

    case 'isian-singkat':
    case 'essay':
      return answer;

    default:
      return '-';
  }
};

/**
 * Simpan data ke localStorage
 * @param key Kunci penyimpanan
 * @param data Data untuk disimpan
 */
export const saveToLocalStorage = (key: string, data: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving to localStorage:`, error);
  }
};

/**
 * Ambil data dari localStorage
 * @param key Kunci penyimpanan
 * @returns Data yang tersimpan atau null
 */
export const getFromLocalStorage = <T>(key: string): T | null => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Error reading from localStorage:`, error);
    return null;
  }
};

/**
 * Hapus data dari localStorage
 * @param key Kunci penyimpanan
 */
export const removeFromLocalStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing from localStorage:`, error);
  }
};

/**
 * Cek apakah perangkat mendukung fullscreen
 * @returns Boolean
 */
export const isFullscreenSupported = (): boolean => {
  return (
    document.fullscreenEnabled ||
    (document as any).webkitFullscreenEnabled ||
    (document as any).mozFullScreenEnabled ||
    (document as any).msFullscreenEnabled ||
    false
  );
};

/**
 * Request fullscreen untuk element
 * @param element HTML Element
 */
export const requestFullscreen = async (element: HTMLElement): Promise<void> => {
  try {
    if (element.requestFullscreen) {
      await element.requestFullscreen();
    } else if ((element as any).webkitRequestFullscreen) {
      await (element as any).webkitRequestFullscreen();
    } else if ((element as any).mozRequestFullScreen) {
      await (element as any).mozRequestFullScreen();
    } else if ((element as any).msRequestFullscreen) {
      await (element as any).msRequestFullscreen();
    }
  } catch (error) {
    console.error('Error requesting fullscreen:', error);
  }
};

/**
 * Exit fullscreen
 */
export const exitFullscreen = async (): Promise<void> => {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else if ((document as any).webkitFullscreenElement) {
      await (document as any).webkitExitFullscreen();
    } else if ((document as any).mozFullScreenElement) {
      await (document as any).mozCancelFullScreen();
    } else if ((document as any).msFullscreenElement) {
      await (document as any).msExitFullscreen();
    }
  } catch (error) {
    console.error('Error exiting fullscreen:', error);
  }
};
