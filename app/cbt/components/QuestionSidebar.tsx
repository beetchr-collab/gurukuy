/**
 * Komponen QuestionSidebar
 * Sidebar navigasi soal dengan status visual
 * Feature:
 * - Menampilkan semua nomor soal
 * - Status warna: Belum (abu), Dijawab (hijau), Ragu (kuning), Aktif (biru)
 * - Sticky sidebar
 * - Responsive horizontal scroll di mobile
 * - Click untuk navigate ke soal
 * - Statistik jawaban
 */

'use client';

import React, { useMemo } from 'react';
import { Question, StudentAnswer } from '../types/exam';
import { getAnswerStatus, getStatusColor, calculateAnswerStats } from '../utils/helpers';

interface QuestionSidebarProps {
  questions: Question[];
  answers: StudentAnswer[];
  currentQuestionIndex: number;
  onQuestionSelect: (index: number) => void;
  isDarkMode: boolean;
}

export const QuestionSidebar: React.FC<QuestionSidebarProps> = ({
  questions,
  answers,
  currentQuestionIndex,
  onQuestionSelect,
  isDarkMode,
}) => {
  // Hitung statistik jawaban
  const stats = useMemo(() => calculateAnswerStats(answers, questions.length), [answers, questions.length]);

  return (
    <div
      className={`h-100 ${
        isDarkMode ? 'bg-dark border-end border-secondary' : 'bg-light border-end'
      }`}
      style={{ overflowY: 'auto' }}
    >
      {/* Statistik Header */}
      <div className={`p-3 border-bottom sticky-top ${isDarkMode ? 'border-secondary bg-darker' : 'bg-white'}`}>
        <h6 className={`mb-3 fw-bold ${isDarkMode ? 'text-white' : ''}`}>
          <i className="bi bi-list-task me-2" />
          Navigasi Soal
        </h6>

        {/* Stats */}
        <div className="row row-cols-3 g-2 mb-3">
          <div className="col">
            <div className={`text-center p-2 rounded ${isDarkMode ? 'bg-success bg-opacity-10' : 'bg-success bg-opacity-10'}`}>
              <div className={`small fw-semibold ${isDarkMode ? 'text-success' : 'text-success'}`}>
                {stats.answered}
              </div>
              <div className={`text-xs ${isDarkMode ? 'text-muted' : 'text-muted'}`} style={{ fontSize: '0.7rem' }}>
                Dijawab
              </div>
            </div>
          </div>
          <div className="col">
            <div className={`text-center p-2 rounded ${isDarkMode ? 'bg-warning bg-opacity-10' : 'bg-warning bg-opacity-10'}`}>
              <div className={`small fw-semibold ${isDarkMode ? 'text-warning' : 'text-warning'}`}>
                {stats.unsure}
              </div>
              <div className={`text-xs ${isDarkMode ? 'text-muted' : 'text-muted'}`} style={{ fontSize: '0.7rem' }}>
                Ragu
              </div>
            </div>
          </div>
          <div className="col">
            <div className={`text-center p-2 rounded ${isDarkMode ? 'bg-secondary bg-opacity-10' : 'bg-secondary bg-opacity-10'}`}>
              <div className={`small fw-semibold ${isDarkMode ? 'text-secondary' : 'text-secondary'}`}>
                {stats.unanswered}
              </div>
              <div className={`text-xs ${isDarkMode ? 'text-muted' : 'text-muted'}`} style={{ fontSize: '0.7rem' }}>
                Belum
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="progress" style={{ height: '6px' }}>
          <div
            className="progress-bar bg-success"
            role="progressbar"
            style={{ width: `${stats.answeredPercentage}%` }}
          />
        </div>
        <p className={`text-center mt-2 mb-0 small ${isDarkMode ? 'text-muted' : 'text-muted'}`}>
          {stats.answered} dari {questions.length} terjawab
        </p>
      </div>

      {/* Daftar Soal */}
      <div className={`p-2 ${isDarkMode ? 'bg-dark' : ''}`}>
        {/* Mobile Horizontal Scroll */}
        <div className="d-none d-lg-none overflow-x-auto pb-2">
          <div className="d-flex gap-2" style={{ minWidth: 'min-content' }}>
            {questions.map((question, index) => {
              const status = getAnswerStatus(question.id, answers);
              const statusColor = getStatusColor(
                currentQuestionIndex === index ? 'aktif' : status
              );
              const isActive = currentQuestionIndex === index;

              return (
                <button
                  key={question.id}
                  onClick={() => onQuestionSelect(index)}
                  className={`btn btn-sm rounded-3 flex-shrink-0 ${
                    isActive ? `btn-primary` : `btn-outline-secondary`
                  }`}
                  style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: isActive ? statusColor.hex : 'transparent',
                    borderColor: statusColor.hex,
                    color: isActive ? 'white' : statusColor.hex,
                  }}
                  title={`Soal ${index + 1} - ${status}`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Desktop Vertical Grid */}
        <div className="d-none d-lg-block">
          <div className="row row-cols-3 g-2">
            {questions.map((question, index) => {
              const status = getAnswerStatus(question.id, answers);
              const statusColor = getStatusColor(
                currentQuestionIndex === index ? 'aktif' : status
              );
              const isActive = currentQuestionIndex === index;

              return (
                <div key={question.id} className="col">
                  <button
                    onClick={() => onQuestionSelect(index)}
                    className={`btn w-100 rounded-3 fw-semibold transition ${
                      isActive ? 'btn-primary shadow-sm' : ''
                    }`}
                    style={{
                      backgroundColor: isActive ? statusColor.hex : 'transparent',
                      borderColor: statusColor.hex,
                      color: isActive ? 'white' : statusColor.hex,
                      border: `2px solid ${statusColor.hex}`,
                      padding: '0.5rem 0',
                      fontSize: '0.9rem',
                    }}
                    title={`Soal ${index + 1} - ${status}`}
                  >
                    <span className="me-1">{index + 1}</span>
                    {status === 'ragu-ragu' && <i className="bi bi-exclamation-circle-fill small" />}
                    {status === 'sudah-dijawab' && <i className="bi bi-check-circle-fill small" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Keterangan Status */}
      <div className={`p-3 border-top ${isDarkMode ? 'border-secondary' : ''}`}>
        <p className={`mb-2 small fw-semibold ${isDarkMode ? 'text-white' : ''}`}>Keterangan:</p>
        <div className="d-flex flex-column gap-1">
          {(['belum-dijawab', 'sudah-dijawab', 'ragu-ragu'] as const).map((status) => {
            const color = getStatusColor(status);
            return (
              <div key={status} className="d-flex align-items-center gap-2 small">
                <span
                  className="rounded-circle"
                  style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: color.hex,
                  }}
                />
                <span className={isDarkMode ? 'text-muted' : 'text-muted'}>
                  {color.label} = {status.split('-').join(' ')}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
