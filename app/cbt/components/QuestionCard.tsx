/**
 * Komponen QuestionCard
 * Menampilkan soal dengan support berbagai tipe soal
 * Support:
 * 1. Pilihan Ganda (radio button)
 * 2. Pilihan Ganda Kompleks (checkbox)
 * 3. Menjodohkan (pairing)
 * 4. Isian Singkat (input text)
 * 5. Essay (textarea)
 *
 * Feature:
 * - Rendering dinamis berdasarkan tipe soal
 * - Support gambar soal
 * - Responsive design
 * - Dark mode support
 * - Typography nyaman dibaca
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Question, StudentAnswer } from '../types/exam';

interface QuestionCardProps {
  question: Question;
  questionIndex: number;
  currentAnswer?: StudentAnswer;
  isDarkMode: boolean;
  onAnswerChange: (jawaban: any) => void;
  onMarkUnsure: () => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  questionIndex,
  currentAnswer,
  isDarkMode,
  onAnswerChange,
  onMarkUnsure,
}) => {
  const [pairingAnswers, setPairingAnswers] = useState<Record<string, string>>(
    (currentAnswer?.jawaban as Record<string, string>) || {}
  );

  // Handle perubahan jawaban
  const handleRadioChange = (value: string) => {
    onAnswerChange(value);
  };

  const handleCheckboxChange = (value: string, checked: boolean) => {
    const current = Array.isArray(currentAnswer?.jawaban) ? currentAnswer.jawaban : [];
    const updated = checked ? [...current, value] : current.filter((v) => v !== value);
    onAnswerChange(updated);
  };

  const handleTextChange = (value: string) => {
    onAnswerChange(value);
  };

  const handlePairingChange = (leftId: string, rightValue: string) => {
    const updated = { ...pairingAnswers, [leftId]: rightValue };
    setPairingAnswers(updated);
    onAnswerChange(updated);
  };

  const currentAnswerValue = currentAnswer?.jawaban || '';

  return (
    <div className="h-100 d-flex flex-column">
      {/* Card */}
      <div
        className={`card border-0 shadow-sm rounded-4 flex-grow-1 d-flex flex-column ${
          isDarkMode ? 'bg-dark' : 'bg-white'
        }`}
      >
        <div className="card-body p-4 d-flex flex-column">
          {/* Header */}
          <div className="mb-4">
            <span className="badge bg-primary mb-2">
              Soal {questionIndex + 1} dari {question.id}
            </span>
            <span className={`badge ${isDarkMode ? 'bg-secondary' : 'bg-light'} ms-2`}>
              {question.poin} Poin
            </span>

            {/* Tipe Soal */}
            <div className={`small mt-2 ${isDarkMode ? 'text-muted' : 'text-muted'}`}>
              Tipe: <span className="fw-semibold">{getTipeLabel(question.tipe)}</span>
            </div>
          </div>

          {/* Pertanyaan */}
          <h5 className={`mb-3 fw-bold lh-lg ${isDarkMode ? 'text-white' : ''}`}>
            {question.pertanyaan}
          </h5>

          {/* Gambar (jika ada) */}
          {question.gambar && (
            <div className="mb-4 text-center">
              <img
                src={question.gambar}
                alt="Soal"
                className="img-fluid rounded-3 shadow-sm"
                style={{ maxHeight: '300px', maxWidth: '100%' }}
              />
            </div>
          )}

          {/* Catatan (jika ada) */}
          {question.catatan && (
            <div
              className={`alert alert-info mb-4 rounded-3 py-2 px-3 small ${
                isDarkMode ? 'alert-info bg-info bg-opacity-10' : ''
              }`}
            >
              <i className="bi bi-info-circle me-2" />
              {question.catatan}
            </div>
          )}

          {/* Konten berdasarkan tipe soal */}
          <div className="flex-grow-1">
            {/* 1. Pilihan Ganda */}
            {question.tipe === 'pilihan-ganda' && (
              <div className="d-flex flex-column gap-3">
                {question.opsi?.map((opsi) => (
                  <div key={opsi.id} className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name={`question-${question.id}`}
                      id={`opsi-${opsi.id}`}
                      value={opsi.id}
                      checked={currentAnswerValue === opsi.id}
                      onChange={() => handleRadioChange(opsi.id)}
                    />
                    <label className={`form-check-label ${isDarkMode ? 'text-white' : ''}`} htmlFor={`opsi-${opsi.id}`}>
                      <span className={`fw-semibold ${isDarkMode ? 'text-primary' : 'text-primary'}`}>
                        {opsi.id.toUpperCase()}.
                      </span>{' '}
                      {opsi.teks}
                    </label>
                  </div>
                ))}
              </div>
            )}

            {/* 2. Pilihan Ganda Kompleks */}
            {question.tipe === 'pilihan-ganda-kompleks' && (
              <div className="d-flex flex-column gap-3">
                {question.opsi?.map((opsi) => (
                  <div key={opsi.id} className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      name={`question-${question.id}`}
                      id={`opsi-${opsi.id}`}
                      value={opsi.id}
                      checked={(Array.isArray(currentAnswerValue) ? currentAnswerValue : []).includes(opsi.id)}
                      onChange={(e) => handleCheckboxChange(opsi.id, e.target.checked)}
                    />
                    <label className={`form-check-label ${isDarkMode ? 'text-white' : ''}`} htmlFor={`opsi-${opsi.id}`}>
                      <span className={`fw-semibold ${isDarkMode ? 'text-primary' : 'text-primary'}`}>
                        {opsi.id.toUpperCase()}.
                      </span>{' '}
                      {opsi.teks}
                    </label>
                  </div>
                ))}
              </div>
            )}

            {/* 3. Menjodohkan */}
            {question.tipe === 'menjodohkan' && (
              <div className="table-responsive">
                <table className={`table ${isDarkMode ? 'table-dark' : ''}`}>
                  <tbody>
                    {question.pasangan?.map((pair) => (
                      <tr key={pair.id}>
                        <td className="fw-semibold" style={{ width: '40%' }}>
                          {pair.kiri}
                        </td>
                        <td>
                          <select
                            className={`form-select form-select-sm rounded-2 ${
                              isDarkMode ? 'bg-secondary text-white' : ''
                            }`}
                            value={pairingAnswers[pair.id] || ''}
                            onChange={(e) => handlePairingChange(pair.id, e.target.value)}
                          >
                            <option value="">Pilih...</option>
                            {question.pasangan?.map((p) => (
                              <option key={p.id} value={p.kanan}>
                                {p.kanan}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 4. Isian Singkat */}
            {question.tipe === 'isian-singkat' && (
              <div>
                <input
                  type="text"
                  className={`form-control form-control-lg rounded-3 ${isDarkMode ? 'bg-secondary text-white border-secondary' : ''}`}
                  placeholder="Ketik jawaban Anda di sini..."
                  value={typeof currentAnswerValue === 'string' ? currentAnswerValue : ''}
                  onChange={(e) => handleTextChange(e.target.value)}
                />
              </div>
            )}

            {/* 5. Essay */}
            {question.tipe === 'essay' && (
              <div>
                <textarea
                  className={`form-control rounded-3 ${isDarkMode ? 'bg-secondary text-white border-secondary' : ''}`}
                  placeholder="Ketik jawaban Anda di sini. Minimal 3 paragraf untuk essay..."
                  rows={8}
                  value={typeof currentAnswerValue === 'string' ? currentAnswerValue : ''}
                  onChange={(e) => handleTextChange(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tombol Aksi */}
      <div className="mt-3 d-flex gap-2">
        <button
          onClick={onMarkUnsure}
          className={`btn btn-outline-warning rounded-3 ${currentAnswer?.status === 'ragu-ragu' ? 'active' : ''}`}
        >
          <i className="bi bi-exclamation-circle me-1" />
          Tandai Ragu
        </button>
      </div>
    </div>
  );
};

/**
 * Helper function untuk mendapatkan label tipe soal
 */
function getTipeLabel(tipe: string): string {
  const labels: Record<string, string> = {
    'pilihan-ganda': 'Pilihan Ganda',
    'pilihan-ganda-kompleks': 'Pilihan Ganda Kompleks',
    'menjodohkan': 'Menjodohkan',
    'isian-singkat': 'Isian Singkat',
    'essay': 'Essay',
  };
  return labels[tipe] || tipe;
}
