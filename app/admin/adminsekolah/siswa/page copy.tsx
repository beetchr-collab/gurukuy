"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
    collection,
    onSnapshot,
    doc,
    getDoc,
    query,           // ✅ TAMBAHAN
    where,            // ✅ TAMBAHAN
    updateDoc,
    serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AdminSiswaPage() {
    const { user } = useAuth();

    return (
        <main className="app-main py-3">
            <div className="container-fluid">

                {/* HEADER */}
                <div className="content-header">
                    <div className="container-fluid">
                        <h1 className="m-0">Informasi Peserta Didik</h1>
                    </div>
                </div>

                {/* CONTENT */}
                <section className="content">
                    <div className="container-fluid">

                        {/* CALL OUT UTAMA */}
                        <div className="callout callout-info">
                            <h5><i className="fas fa-info-circle"></i> Informasi Umum</h5>
                            <p>
                                Halaman ini digunakan untuk mengelola data peserta didik seperti
                                identitas, kelas, dan status aktif siswa.
                            </p>
                        </div>

                        {/* CALL OUT FITUR */}
                        <div className="callout callout-success">
                            <h5><i className="fas fa-check-circle"></i> Fitur Tersedia</h5>
                            <ul className="mb-0">
                                <li>Tambah data peserta didik</li>
                                <li>Edit dan update data</li>
                                <li>Hapus data siswa</li>
                                <li>Import data dari Excel</li>
                                <li>Pencarian & filter siswa</li>
                            </ul>
                        </div>

                        {/* CALL OUT PERINGATAN */}
                        <div className="callout callout-warning">
                            <h5><i className="fas fa-exclamation-triangle"></i> Perhatian</h5>
                            <p className="mb-0">
                                Pastikan data yang dimasukkan sudah benar. Kesalahan data dapat
                                mempengaruhi laporan akademik.
                            </p>
                        </div>

                        {/* CALL OUT KHUSUS ADMIN */}
                        <div className="callout callout-danger">
                            <h5><i className="fas fa-user-shield"></i> Akses Admin</h5>
                            <p className="mb-0">
                                Hanya admin yang dapat menghapus data peserta didik secara permanen.
                            </p>
                        </div>

                    </div>
                </section>
            </div>
        </main>
    );
}