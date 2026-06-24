'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PetunjukUjianPage() {
    const router = useRouter();

    const [agree, setAgree] = useState(false);
    const [peserta, setPeserta] = useState<any>(null);
    const [examData, setExamData] = useState<any>(null);

    useEffect(() => {
        const pesertaData =
            localStorage.getItem('peserta_ujian');

        const exam =
            localStorage.getItem('exam_data');

        if (!pesertaData || !exam) {
            router.push('/cbt/beranda');
            return;
        }

        setPeserta(JSON.parse(pesertaData));
        setExamData(JSON.parse(exam));
    }, [router]);

    const handleStartExam = () => {
        const token =
            localStorage.getItem('exam_token');

        if (!token) {
            alert('Token ujian tidak ditemukan');
            return;
        }

        router.push(
            `/ujian/exam?token=${token}`
        );
    };

    if (!peserta || !examData) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <div className="spinner-border text-primary"></div>
            </div>
        );
    }

    return (
        <div
            className="min-vh-100 py-4"
            style={{
                background:
                    'linear-gradient(135deg,#eef2ff,#f8fafc,#eff6ff)',
            }}
        >
            <div className="container">

                <div
                    className="card border-0 shadow-lg overflow-hidden"
                    style={{
                        borderRadius: '24px',
                    }}
                >

                    {/* HEADER */}
                    <div
                        className="text-white"
                        style={{
                            background:
                                'linear-gradient(135deg,#2563eb,#4f46e5)',
                            padding: '24px',
                        }}
                    >
                        <div className="d-flex align-items-center gap-3">
                            <div
                                style={{
                                    width: 60,
                                    height: 60,
                                    borderRadius: 18,
                                    background:
                                        'rgba(255,255,255,0.15)',
                                }}
                                className="d-flex align-items-center justify-content-center"
                            >
                                <i className="bi bi-journal-check fs-2"></i>
                            </div>

                            <div>
                                <h2 className="fw-bold mb-1">
                                    Petunjuk Ujian
                                </h2>

                                <p className="mb-0 text-white-50">
                                    Bacalah seluruh informasi sebelum memulai ujian.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* BODY */}
                    <div className="card-body p-4 p-lg-5">

                        {/* ALERT */}
                        <div
                            className="alert alert-danger border-0 shadow-sm"
                            style={{
                                borderRadius: '16px',
                            }}
                        >
                            <h5 className="fw-bold">
                                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                Perhatian
                            </h5>

                            <ul className="mb-0">
                                <li>
                                    Waktu ujian akan langsung berjalan setelah tombol
                                    <strong> Mulai Ujian </strong>
                                    ditekan.
                                </li>

                                <li>
                                    Jawaban tersimpan secara otomatis.
                                </li>

                                <li>
                                    Ujian akan berakhir otomatis ketika waktu habis.
                                </li>

                                <li>
                                    Jangan menutup browser selama ujian berlangsung.
                                </li>
                            </ul>
                        </div>

                        {/* INFO PESERTA */}
                        <div className="card border-0 shadow-sm mb-4">
                            <div className="card-header bg-light">
                                <h5 className="mb-0 fw-bold">
                                    Data Peserta
                                </h5>
                            </div>

                            <div className="card-body">
                                <div className="row g-3">

                                    <div className="col-md-6">
                                        <label className="text-muted small">
                                            Nama Peserta
                                        </label>

                                        <div className="fw-semibold">
                                            {peserta.nama}
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <label className="text-muted small">
                                            NISN
                                        </label>

                                        <div className="fw-semibold">
                                            {peserta.nisn}
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <label className="text-muted small">
                                            Kelas
                                        </label>

                                        <div className="fw-semibold">
                                            {peserta.kelas || '-'}
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <label className="text-muted small">
                                            Mata Pelajaran
                                        </label>

                                        <div className="fw-semibold">
                                            {examData.namaMapel ||
                                                examData.mapel ||
                                                'Mata Pelajaran'}
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>

                        {/* INFO UJIAN */}
                        <div className="row g-3 mb-4">

                            <div className="col-md-4">
                                <div
                                    className="card border-0 shadow-sm h-100"
                                    style={{
                                        borderRadius: '18px',
                                    }}
                                >
                                    <div className="card-body text-center">
                                        <i className="bi bi-file-earmark-text fs-1 text-primary"></i>

                                        <h3 className="fw-bold mt-2">
                                            {examData.jumlahSoal || 50}
                                        </h3>

                                        <div className="text-muted">
                                            Jumlah Soal
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-4">
                                <div
                                    className="card border-0 shadow-sm h-100"
                                    style={{
                                        borderRadius: '18px',
                                    }}
                                >
                                    <div className="card-body text-center">
                                        <i className="bi bi-clock-history fs-1 text-success"></i>

                                        <h3 className="fw-bold mt-2">
                                            {examData.durasi || 90}
                                        </h3>

                                        <div className="text-muted">
                                            Menit
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-4">
                                <div
                                    className="card border-0 shadow-sm h-100"
                                    style={{
                                        borderRadius: '18px',
                                    }}
                                >
                                    <div className="card-body text-center">
                                        <i className="bi bi-check2-square fs-1 text-warning"></i>

                                        <h3 className="fw-bold mt-2">
                                            Pilihan Ganda
                                        </h3>

                                        <div className="text-muted">
                                            Jenis Soal
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* PETUNJUK */}
                        <div className="card border-0 shadow-sm mb-4">
                            <div className="card-header bg-light">
                                <h5 className="fw-bold mb-0">
                                    Petunjuk Pengerjaan
                                </h5>
                            </div>

                            <div className="card-body">
                                <ol className="mb-0">
                                    <li>
                                        Bacalah soal dengan teliti sebelum menjawab.
                                    </li>

                                    <li>
                                        Pilih jawaban yang dianggap paling benar.
                                    </li>

                                    <li>
                                        Gunakan tombol nomor soal untuk berpindah soal.
                                    </li>

                                    <li>
                                        Jawaban tersimpan otomatis.
                                    </li>

                                    <li>
                                        Periksa kembali jawaban sebelum mengakhiri ujian.
                                    </li>

                                    <li>
                                        Jangan melakukan refresh halaman selama ujian.
                                    </li>

                                    <li>
                                        Pastikan koneksi internet tetap stabil.
                                    </li>
                                </ol>
                            </div>
                        </div>

                        {/* LEGENDA */}
                        <div className="card border-0 shadow-sm mb-4">
                            <div className="card-header bg-light">
                                <h5 className="fw-bold mb-0">
                                    Status Nomor Soal
                                </h5>
                            </div>

                            <div className="card-body">

                                <div className="d-flex flex-wrap gap-4">

                                    <div>
                                        🟢 Sudah Dijawab
                                    </div>

                                    <div>
                                        🟡 Ragu-ragu
                                    </div>

                                    <div>
                                        ⚪ Belum Dijawab
                                    </div>

                                </div>

                            </div>
                        </div>

                        {/* CHECKBOX */}
                        <div className="form-check mb-4">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                id="agree"
                                checked={agree}
                                onChange={(e) =>
                                    setAgree(e.target.checked)
                                }
                            />

                            <label
                                htmlFor="agree"
                                className="form-check-label"
                            >
                                Saya telah membaca dan memahami seluruh
                                petunjuk ujian yang diberikan.
                            </label>
                        </div>

                        {/* BUTTON */}
                        <div className="d-flex justify-content-end">

                            <button
                                className="btn btn-lg px-5 text-white"
                                disabled={!agree}
                                onClick={handleStartExam}
                                style={{
                                    background:
                                        'linear-gradient(135deg,#2563eb,#4f46e5)',
                                    border: 'none',
                                    borderRadius: '14px',
                                }}
                            >
                                <i className="bi bi-play-fill me-2"></i>
                                Mulai
                            </button>

                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}