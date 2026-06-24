/**
 * Dummy Data untuk Testing CBT/E-Ujian
 * Struktur data sesuai dengan Firebase Firestore
 */

import { Question, ExamSession } from '../types/exam';

// Dummy soal dengan berbagai tipe
export const DUMMY_QUESTIONS: Question[] = [
  {
    id: 'soal-1',
    pertanyaan: 'Berapakah hasil dari 2 + 2?',
    tipe: 'pilihan-ganda',
    opsi: [
      { id: 'a', teks: '3' },
      { id: 'b', teks: '4' },
      { id: 'c', teks: '5' },
      { id: 'd', teks: '6' },
    ],
    jawabanBenar: 'b',
    poin: 10,
    catatan: 'Soal mudah tentang penjumlahan dasar',
  },
  {
    id: 'soal-2',
    pertanyaan: 'Manakah dari pernyataan berikut yang BENAR? (Pilih semua yang sesuai)',
    tipe: 'pilihan-ganda-kompleks',
    opsi: [
      { id: 'a', teks: 'Bumi berbentuk bulat' },
      { id: 'b', teks: 'Gravitasi adalah gaya tarik bumi' },
      { id: 'c', teks: 'Cahaya dapat menembus benda padat' },
      { id: 'd', teks: 'Matahari adalah sumber energi utama' },
    ],
    jawabanBenar: ['a', 'b', 'd'],
    poin: 15,
  },
  {
    id: 'soal-3',
    pertanyaan: 'Pasangkan istilah di sebelah kiri dengan definisinya di sebelah kanan',
    tipe: 'menjodohkan',
    pasangan: [
      { id: '1', kiri: 'Fotosintesis', kanan: 'Proses perubahan cahaya menjadi energi kimia' },
      { id: '2', kiri: 'Respirasi', kanan: 'Proses pengeluaran zat sisa metabolisme' },
      { id: '3', kiri: 'Ekskresi', kanan: 'Proses pengambilan oksigen dan penggunaan energi' },
    ],
    poin: 15,
  },
  {
    id: 'soal-4',
    pertanyaan: 'Ibu Kota Indonesia adalah ...',
    tipe: 'isian-singkat',
    poin: 5,
    catatan: 'Ketik dengan huruf kapital',
  },
  {
    id: 'soal-5',
    pertanyaan: 'Jelaskan perbedaan antara mitosis dan meiosis beserta fungsinya!',
    tipe: 'essay',
    poin: 25,
    catatan: 'Jawaban minimal 3 paragraf, tulisan rapi dan mudah dipahami',
  },
  {
    id: 'soal-6',
    pertanyaan:
      'Bagaimana proses terjadinya hujan? Jelaskan dengan menggunakan siklus hidrologi yang tepat.',
    tipe: 'essay',
    poin: 20,
    gambar: 'https://via.placeholder.com/400x300?text=Siklus+Hidrologi',
  },
  {
    id: 'soal-7',
    pertanyaan: 'Negara-negara ASEAN berapa banyak?',
    tipe: 'pilihan-ganda',
    opsi: [
      { id: 'a', teks: '8' },
      { id: 'b', teks: '9' },
      { id: 'c', teks: '10' },
      { id: 'd', teks: '11' },
    ],
    jawabanBenar: 'c',
    poin: 10,
  },
  {
    id: 'soal-8',
    pertanyaan: 'Rumus luas lingkaran adalah ...',
    tipe: 'isian-singkat',
    poin: 5,
    catatan: 'Gunakan simbol π atau pi',
  },
  {
    id: 'soal-9',
    pertanyaan: 'Manakah pernyataan yang benar tentang sistem peredaran darah? (Pilih semua yang benar)',
    tipe: 'pilihan-ganda-kompleks',
    opsi: [
      { id: 'a', teks: 'Jantung memiliki 4 ruang' },
      { id: 'b', teks: 'Darah merah membawa CO2' },
      { id: 'c', teks: 'Vena membawa darah menuju jantung' },
      { id: 'd', teks: 'Arteri membawa darah dari jantung' },
    ],
    jawabanBenar: ['a', 'c', 'd'],
    poin: 15,
  },
  {
    id: 'soal-10',
    pertanyaan:
      'Dengan bantuan diagram, jelaskan bagaimana proses fotosintesis terjadi dan produk apa saja yang dihasilkan.',
    tipe: 'essay',
    poin: 20,
    gambar: 'https://via.placeholder.com/400x250?text=Proses+Fotosintesis',
  },
];

// Dummy session ujian
export const DUMMY_EXAM_SESSION: ExamSession = {
  id: 'session-001',
  examId: 'exam-001',
  studentId: 'siswa-001',
  studentName: 'Ahmad Reza Pratama',
  examName: 'Ujian Tengah Semester Biologi',
  mapel: 'Biologi',
  token: 'TOKEN-2024-BIO-001',
  totalQuestions: DUMMY_QUESTIONS.length,
  totalTime: 3600, // 1 jam
  startTime: Date.now() - 300000, // Dimulai 5 menit yang lalu
  answers: [
    {
      questionId: 'soal-1',
      jawaban: 'b',
      status: 'sudah-dijawab',
      timestamp: Date.now() - 250000,
    },
    {
      questionId: 'soal-2',
      jawaban: ['a', 'b', 'd'],
      status: 'sudah-dijawab',
      timestamp: Date.now() - 180000,
    },
    {
      questionId: 'soal-3',
      jawaban: {
        '1': 'Fotosintesis',
        '2': 'Respirasi',
        '3': 'Ekskresi',
      },
      status: 'sudah-dijawab',
      timestamp: Date.now() - 150000,
    },
  ],
  currentQuestion: 3,
  isOnline: true,
  lastSeen: Date.now(),
  isDarkMode: false,
  isFullscreen: false,
};

// Dummy data untuk Bank Soal dari Firestore
export const DUMMY_BANK_SOAL = {
  id: 'bank-soal-001',
  nama: 'Bank Soal Biologi Kelas XII',
  soal: DUMMY_QUESTIONS,
};
