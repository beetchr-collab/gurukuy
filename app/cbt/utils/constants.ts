/**
 * Konstanta untuk CBT/E-Ujian
 */

// Warna status soal untuk UI
export const QUESTION_STATUS_COLORS = {
  'belum-dijawab': {
    bg: 'bg-secondary',
    text: 'text-secondary',
    label: 'Abu-abu',
    hex: '#6c757d',
  },
  'sudah-dijawab': {
    bg: 'bg-success',
    text: 'text-success',
    label: 'Hijau',
    hex: '#198754',
  },
  'ragu-ragu': {
    bg: 'bg-warning',
    text: 'text-warning',
    label: 'Kuning',
    hex: '#ffc107',
  },
  'aktif': {
    bg: 'bg-primary',
    text: 'text-primary',
    label: 'Biru',
    hex: '#0d6efd',
  },
};

// Konfigurasi timer
export const TIMER_CONFIG = {
  WARNING_THRESHOLD: 300, // 5 menit (dalam detik)
  CRITICAL_THRESHOLD: 60, // 1 menit (dalam detik)
  SYNC_INTERVAL: 5000, // 5 detik
};

// Pesan-pesan aplikasi
export const MESSAGES = {
  CONFIRM_FINISH: 'Apakah Anda yakin ingin menyelesaikan ujian? Ujian tidak dapat dilanjutkan.',
  CONFIRM_MARK_RAGU: 'Soal ini akan ditandai sebagai ragu-ragu.',
  TIME_EXPIRED: 'Waktu ujian telah habis. Sistem akan otomatis menyelesaikan ujian.',
  CONNECTION_LOST: 'Koneksi internet terputus. Data akan disimpan ketika koneksi kembali.',
  CONNECTION_RESTORED: 'Koneksi tersemat kembali.',
  AUTO_SAVE_SUCCESS: 'Jawaban tersimpan otomatis',
  AUTO_SAVE_ERROR: 'Gagal menyimpan jawaban',
  FULLSCREEN_NOT_SUPPORTED: 'Browser Anda tidak mendukung fullscreen',
  CONFIRM_EXIT_FULLSCREEN: 'Keluar dari mode fullscreen akan menyelesaikan ujian.',
};

// Local Storage Keys
export const STORAGE_KEYS = {
  EXAM_SESSION: 'exam_session',
  ANSWERS: 'exam_answers',
  DARK_MODE: 'exam_dark_mode',
  FULLSCREEN: 'exam_fullscreen',
};

// Durasi animasi (ms)
export const ANIMATION_DURATION = {
  SHORT: 150,
  MEDIUM: 300,
  LONG: 500,
};
