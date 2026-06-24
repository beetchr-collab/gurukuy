/**
 * Komponen QuestionNavigation
 * Navigasi soal dengan tombol:
 * - Sebelumnya
 * - Selanjutnya
 * - Tandai ragu-ragu (status indicator)
 * - Selesai Ujian
 *
 * Feature:
 * - Disabled state untuk soal pertama/terakhir
 * - Konfirmasi untuk selesai ujian
 * - Responsive design
 * - Dark mode support
 */

'use client';

import React from 'react';

interface QuestionNavigationProps {
  questionIndex: number;
  totalQuestions: number;
  hasNext: boolean;
  hasPrevious: boolean;
  isMarkedUnsure: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onMarkUnsure: () => void;
  onFinish: () => void;
  isDarkMode: boolean;
}

export const QuestionNavigation: React.FC<QuestionNavigationProps> = ({
  questionIndex,
  totalQuestions,
  hasNext,
  hasPrevious,
  isMarkedUnsure,
  onPrevious,
  onNext,
  onMarkUnsure,
  onFinish,
  isDarkMode,
}) => {
  const handleFinish = () => {
    const confirmFinish = window.confirm(
      'Apakah Anda yakin ingin menyelesaikan ujian?\n\nUjian tidak dapat dilanjutkan lagi.'
    );
    if (confirmFinish) {
      onFinish();
    }
  };

  return (
    <div
      className={`border-top py-3 px-3 ${isDarkMode ? 'bg-dark border-secondary' : 'bg-light border-light'}`}
    >
      <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center">
        {/* Tombol Sebelumnya */}
        <button
          onClick={onPrevious}
          disabled={!hasPrevious}
          className={`btn rounded-3 ${
            hasPrevious ? 'btn-outline-secondary' : 'btn-outline-secondary disabled'
          }`}
        >
          <i className="bi bi-chevron-left me-2" />
          Sebelumnya
        </button>

        {/* Status & Informasi */}
        <div className="d-flex align-items-center gap-2">
          {/* Nomor Soal */}
          <span className={`small ${isDarkMode ? 'text-muted' : 'text-muted'}`}>
            Soal <span className="fw-bold">{questionIndex + 1}</span> dari <span className="fw-bold">{totalQuestions}</span>
          </span>

          {/* Indikator Ragu */}
          {isMarkedUnsure && (
            <span className="badge bg-warning">
              <i className="bi bi-exclamation-circle me-1" />
              Ragu
            </span>
          )}
        </div>

        {/* Tombol Selanjutnya */}
        <button
          onClick={onNext}
          disabled={!hasNext}
          className={`btn rounded-3 ${
            hasNext ? 'btn-outline-secondary' : 'btn-outline-secondary disabled'
          }`}
        >
          Selanjutnya
          <i className="bi bi-chevron-right ms-2" />
        </button>
      </div>

      {/* Tombol Selesai Ujian */}
      <div className="mt-3">
        <button
          onClick={handleFinish}
          className="btn btn-danger w-100 rounded-3 fw-semibold"
        >
          <i className="bi bi-check-circle me-2" />
          Selesai & Kumpulkan Ujian
        </button>
        <p className={`text-center mt-2 small ${isDarkMode ? 'text-muted' : 'text-muted'}`}>
          <i className="bi bi-info-circle me-1" />
          Pastikan semua soal sudah dijawab sebelum mengumpulkan
        </p>
      </div>
    </div>
  );
};
