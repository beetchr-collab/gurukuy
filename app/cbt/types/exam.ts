/**
 * Types dan Interfaces untuk CBT/E-Ujian Siswa
 */

// Tipe-tipe soal yang didukung
export type QuestionType = 'pilihan-ganda' | 'pilihan-ganda-kompleks' | 'menjodohkan' | 'isian-singkat' | 'essay';

// Status jawaban siswa
export type AnswerStatus = 'belum-dijawab' | 'sudah-dijawab' | 'ragu-ragu';

// Interface untuk soal individual
export interface Question {
  id: string;
  pertanyaan: string;
  tipe: QuestionType;
  opsi?: Array<{
    id: string;
    teks: string;
  }>;
  pasangan?: Array<{
    id: string;
    kiri: string;
    kanan: string;
  }>;
  gambar?: string;
  jawabanBenar?: string | string[]; // String untuk pilihan ganda, array untuk kompleks
  poin: number;
  catatan?: string;
}

// Interface untuk jawaban siswa
export interface StudentAnswer {
  questionId: string;
  jawaban: string | string[] | Record<string, string>; // Fleksibel untuk berbagai tipe
  status: AnswerStatus;
  timestamp: number;
}

// Interface untuk session ujian
export interface ExamSession {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  examName: string;
  mapel: string;
  token: string;
  totalQuestions: number;
  totalTime: number; // dalam detik
  startTime: number;
  endTime?: number;
  answers: StudentAnswer[];
  currentQuestion: number;
  isOnline: boolean;
  lastSeen: number;
  isDarkMode: boolean;
  isFullscreen: boolean;
}

// Interface untuk ujian (bank soal)
export interface Exam {
  id: string;
  nama: string;
  mapel: string;
  totalSoal: number;
  durasi: number; // dalam menit
  bankSoalId: string;
}

// Interface untuk data soal dari Firestore
export interface BankSoalData {
  id: string;
  soal: Question[];
}

// Interface untuk response timer
export interface TimerState {
  timeLeft: number; // dalam detik
  isRunning: boolean;
  isExpired: boolean;
  percentage: number;
}

// Interface untuk status koneksi
export interface ConnectionStatus {
  isOnline: boolean;
  lastSync: number;
  syncStatus: 'synced' | 'syncing' | 'error';
}
