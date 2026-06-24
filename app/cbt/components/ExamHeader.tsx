/**
 * Komponen ExamHeader
 * Header utama ujian menampilkan:
 * - Nama ujian
 * - Mata pelajaran
 * - Nama siswa
 * - Token ujian
 * - Status koneksi
 * Feature:
 * - Sticky header
 * - Responsive design
 * - Dark mode support
 * - Icon profesional
 */

'use client';

import React from 'react';
import { ExamSession } from '../types/exam';

interface ExamHeaderProps {
  session: ExamSession;
  isDarkMode: boolean;
}

export const ExamHeader: React.FC<ExamHeaderProps> = ({ session, isDarkMode }) => {
  return (
    <div
      className={`border-bottom sticky-top py-3 px-3 ${
        isDarkMode ? 'bg-dark border-secondary' : 'bg-white border-light shadow-sm'
      }`}
    >
      <div className="container-fluid">
        <div className="row align-items-center">
          {/* Logo & Ujian Info */}
          <div className="col-12 col-md-auto mb-3 mb-md-0">
            <div className="d-flex align-items-center gap-3">
              {/* Logo */}
              <div
                className={`rounded-circle d-flex align-items-center justify-content-center ${
                  isDarkMode ? 'bg-secondary' : 'bg-primary'
                }`}
                style={{ width: '45px', height: '45px' }}
              >
                <i className={`bi bi-file-text-fill text-white fs-5`} />
              </div>

              {/* Ujian Info */}
              <div>
                <h6 className={`mb-1 fw-bold ${isDarkMode ? 'text-white' : ''}`}>{session.examName}</h6>
                <p className={`mb-0 small ${isDarkMode ? 'text-muted' : 'text-muted'}`}>
                  <i className="bi bi-book me-1" />
                  {session.mapel}
                </p>
              </div>
            </div>
          </div>

          {/* Student & Token Info */}
          <div className="col-12 col-md">
            <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-2">
              {/* Nama Siswa */}
              <div className="col">
                <div className={`small ${isDarkMode ? 'text-muted' : 'text-muted'}`}>Nama Siswa</div>
                <div className={`fw-semibold ${isDarkMode ? 'text-white' : ''}`}>{session.studentName}</div>
              </div>

              {/* ID Siswa */}
              <div className="col">
                <div className={`small ${isDarkMode ? 'text-muted' : 'text-muted'}`}>ID Siswa</div>
                <div className={`fw-semibold ${isDarkMode ? 'text-white' : ''}`}>{session.studentId}</div>
              </div>

              {/* Token Ujian */}
              <div className="col">
                <div className={`small ${isDarkMode ? 'text-muted' : 'text-muted'}`}>Token Ujian</div>
                <div
                  className={`fw-semibold font-monospace small ${isDarkMode ? 'text-info' : 'text-primary'}`}
                >
                  {session.token}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Bar */}
        <div className="row mt-3">
          <div className="col-12">
            <div className="d-flex flex-wrap gap-2">
              {/* Total Soal */}
              <span className={`badge ${isDarkMode ? 'bg-secondary' : 'bg-light border'}`}>
                <i className="bi bi-file-earmark-text me-1" />
                {session.totalQuestions} Soal
              </span>

              {/* Status */}
              <span className={`badge ${isDarkMode ? 'bg-secondary' : 'bg-light border'}`}>
                <i className={`bi bi-${session.isOnline ? 'wifi' : 'wifi-off'} me-1`} />
                {session.isOnline ? 'Online' : 'Offline'}
              </span>

              {/* Session ID (untuk debugging) */}
              <span className={`badge ${isDarkMode ? 'bg-secondary' : 'bg-light border'}`}>
                <i className="bi bi-key me-1" />
                Session: {session.id.slice(0, 8)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
