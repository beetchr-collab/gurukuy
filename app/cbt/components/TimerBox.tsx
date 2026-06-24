/**
 * Komponen TimerBox
 * Menampilkan timer countdown dan status koneksi
 * Feature:
 * - Timer countdown realtime dengan format MM:SS
 * - Progress bar dengan warna dinamis (hijau/kuning/merah)
 * - Indikator status koneksi
 * - Responsive design
 */

'use client';

import React, { useMemo } from 'react';
import { TimerState, ConnectionStatus } from '../types/exam';
import { formatTime, getTimerColorClass } from '../utils/helpers';
import { MESSAGES } from '../utils/constants';

interface TimerBoxProps {
  timer: TimerState;
  connectionStatus: ConnectionStatus;
  isDarkMode: boolean;
  isFullscreen: boolean;
  onFullscreenClick: () => void;
}

export const TimerBox: React.FC<TimerBoxProps> = ({
  timer,
  connectionStatus,
  isDarkMode,
  isFullscreen,
  onFullscreenClick,
}) => {
  // Tentukan warna timer berdasarkan sisa waktu
  const timerColor = getTimerColorClass(timer.timeLeft);

  // Cek apakah timer dalam status kritis
  const isCritical = timer.timeLeft <= 300; // 5 menit

  // Animasi pulse ketika kritis
  const pulseClass = isCritical ? 'animate-pulse' : '';

  return (
    <div
      className={`sticky-top py-2 px-3 border-bottom ${isDarkMode ? 'bg-dark border-secondary' : 'bg-light border-light'}`}
    >
      <div className="row align-items-center gap-2">
        {/* Timer Section */}
        <div className="col-auto">
          <div className={`card border-0 shadow-sm ${isDarkMode ? 'bg-dark' : ''} ${pulseClass}`}>
            <div className="card-body p-2">
              {/* Timer Display */}
              <div className="text-center">
                <p className={`mb-1 small fw-semibold ${isDarkMode ? 'text-muted' : 'text-secondary'}`}>
                  Sisa Waktu
                </p>
                <div className={`h5 mb-2 fw-bold ${isCritical ? 'text-danger' : 'text-primary'}`}>
                  {formatTime(timer.timeLeft)}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="progress" style={{ height: '4px' }}>
                <div
                  className={`progress-bar ${timerColor}`}
                  role="progressbar"
                  style={{ width: `${timer.percentage}%` }}
                  aria-valuenow={timer.percentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>

              {/* Warning Message */}
              {isCritical && (
                <p className="mb-0 mt-2 small text-danger text-center">
                  <i className="bi bi-exclamation-circle me-1" />
                  Waktu Terbatas!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Status Section */}
        <div className="col-auto">
          <div className="d-flex flex-column gap-2">
            {/* Connection Status */}
            <div className="d-flex align-items-center gap-2">
              <div
                className={`badge rounded-pill ${connectionStatus.isOnline ? 'bg-success' : 'bg-danger'}`}
                title={connectionStatus.isOnline ? 'Online' : 'Offline'}
              >
                <i className={`bi bi-${connectionStatus.isOnline ? 'wifi' : 'wifi-off'} me-1`} />
                {connectionStatus.isOnline ? 'Online' : 'Offline'}
              </div>

              {/* Sync Status */}
              {connectionStatus.syncStatus === 'syncing' && (
                <span className="badge bg-info">
                  <i className="bi bi-arrow-repeat spinner-border spinner-border-sm me-1" />
                  Menyimpan...
                </span>
              )}
              {connectionStatus.syncStatus === 'error' && (
                <span className="badge bg-warning">
                  <i className="bi bi-exclamation-triangle me-1" />
                  Gagal Simpan
                </span>
              )}
            </div>

            {/* Fullscreen Button */}
            <button
              onClick={onFullscreenClick}
              className={`btn btn-sm ${isDarkMode ? 'btn-outline-secondary' : 'btn-outline-secondary'}`}
              title={isFullscreen ? 'Keluar Fullscreen' : 'Masuk Fullscreen'}
            >
              <i className={`bi bi-${isFullscreen ? 'fullscreen-exit' : 'fullscreen'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Connection Lost Message */}
      {!connectionStatus.isOnline && (
        <div className="alert alert-warning mb-0 mt-2 py-1 px-2 small">
          <i className="bi bi-exclamation-triangle me-1" />
          {MESSAGES.CONNECTION_LOST}
        </div>
      )}
    </div>
  );
};
