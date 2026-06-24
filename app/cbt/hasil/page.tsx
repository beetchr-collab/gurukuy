/**
 * Halaman Hasil Ujian
 * Path: app/ujian/hasil/page.tsx
 *
 * Menampilkan:
 * - Nilai akhir
 * - Statistik jawaban
 * - Rincian soal
 * - Perbandingan dengan rata-rata kelas
 */

'use client';

import React from 'react';

export default function HasilUjianPage() {
  return (
    <div className="container-fluid py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="card border-0 shadow-lg rounded-4">
            <div className="card-body text-center p-5">
              <h2 className="mb-4">🎉 Ujian Selesai!</h2>
              <p className="text-muted mb-4">
                Terima kasih telah menyelesaikan ujian. Hasil Anda telah disimpan.
              </p>

              <div className="alert alert-info rounded-3" role="alert">
                <p className="mb-0">
                  <strong>Fitur hasil ujian</strong> akan segera ditampilkan di halaman ini.
                </p>
              </div>

              <button className="btn btn-primary mt-4" onClick={() => (window.location.href = '/')}>
                <i className="bi bi-house me-2" />
                Kembali ke Beranda
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
