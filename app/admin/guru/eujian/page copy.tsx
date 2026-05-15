"use client";

import React, { useState } from 'react';

export default function BankSoalPage() {

    return (
        <div className="app-main">
            <div className="app-content-header">
                <h4 className="app-content-headerText">Bank Soal</h4>
            </div>

            <div
                className="callout border-0 shadow-sm rounded-4 p-4 mb-4"
                style={{
                    background: "linear-gradient(135deg, #0d6efd 0%, #4f46e5 100%)",
                    color: "#fff",
                }}
            >
                <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-4">

                    {/* INFO */}
                    <div className="flex-grow-1">
                        <div className="d-flex align-items-center mb-3">
                            <div
                                className="me-3 d-flex align-items-center justify-content-center"
                                style={{
                                    width: "60px",
                                    height: "60px",
                                    borderRadius: "18px",
                                    background: "rgba(255,255,255,0.15)",
                                    fontSize: "26px",
                                }}
                            >
                                <i className="fas fa-book-open"></i>
                            </div>

                            <div>
                                <h4 className="fw-bold mb-1">Bank Soal E-Ujian</h4>
                                <p className="mb-0" style={{ opacity: 0.9 }}>
                                    Kelola seluruh soal ujian CBT mulai dari pilihan ganda,
                                    essay, hingga paket soal ujian sekolah.
                                </p>
                            </div>
                        </div>

                        {/* BADGE MENU */}
                        <div className="d-flex flex-wrap gap-2">

                            <span className="badge bg-light text-primary px-3 py-2">
                                <i className="fas fa-layer-group me-1"></i>
                                Paket Soal
                            </span>

                            <span className="badge bg-light text-primary px-3 py-2">
                                <i className="fas fa-file-import me-1"></i>
                                Import Soal
                            </span>

                            <span className="badge bg-light text-primary px-3 py-2">
                                <i className="fas fa-random me-1"></i>
                                Acak Soal
                            </span>

                            <span className="badge bg-light text-primary px-3 py-2">
                                <i className="fas fa-chart-pie me-1"></i>
                                Analisis
                            </span>

                        </div>
                    </div>

                    {/* BUTTON */}
                    <div>
                        <button
                            className="btn btn-light text-primary fw-semibold px-4 py-3 rounded-3 shadow-sm"
                        >
                            <i className="fas fa-plus-circle me-2"></i>
                            Tambah Bank Soal
                        </button>
                    </div>

                </div>
            </div>

            <div className="container-fluid">
                <div className="card">
                    <div className="card-header d-flex justify-content-between">
                        <h3 className="card-title">Daftar Bank Soal</h3>
                    </div>
                    <div className="card-body">
                        {/* Konten daftar bank soal akan ditampilkan di sini */}
                    </div>
                </div>
            </div>
        </div>
    );
}