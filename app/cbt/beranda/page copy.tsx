'use client';

import { useEffect, useState } from 'react';
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from 'next/navigation';


export default function KonfirmasiDataPesertaPage() {

    const router = useRouter();

    // STATE
    const [loading, setLoading] =
        useState(true);

    const [validatingToken, setValidatingToken] =
        useState(false);

    const [tokenError, setTokenError] =
        useState('');

    const [formData, setFormData] =
        useState({
            nama: '',
            nisn: '',
            tanggalLahir: '',
            jenisKelamin: '',
            kelas: '',
            token: '',

            // REKOMENDASI
            ruang: '',
            mapel: '',
            sesi: '',
            nomorPeserta: '',
            sekolah: '',
        });


    // LOAD USER

    useEffect(() => {

        const user =
            localStorage.getItem('user');

        if (!user) {
            router.push('/cbt/login');
            return;
        }

        const data = JSON.parse(user);

        setFormData((prev) => ({
            ...prev,

            // 🔥 AUTO DARI LOGIN
            nama:
                data.username || '',

            nisn:
                data.nisn || '',
        }));

        setLoading(false);

    }, [router]);


    // HANDLE CHANGE

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement |
            HTMLSelectElement
        >
    ) => {

        setFormData({
            ...formData,
            [e.target.name]:
                e.target.value,
        });
    };


    // SUBMIT

    const handleSubmit = async (
        e: React.FormEvent
    ) => {

        e.preventDefault();

        // RESET ERROR
        setTokenError('');

        // VALIDASI TOKEN
        if (!formData.token.trim()) {
            setTokenError('Token ujian harus diisi');
            return;
        }

        setValidatingToken(true);

        try {
            // CALL API VALIDASI TOKEN
            const response = await fetch(
                '/api/exam/validate-token',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        token: formData.token.trim(),
                    }),
                }
            );

            const result = await response.json();

            if (!result.success) {
                setTokenError(
                    result.error ||
                    'Token tidak valid'
                );
                setValidatingToken(false);
                return;
            }

            // TOKEN VALID
            const examData = result.data;

            // SIMPAN DATA PESERTA
            localStorage.setItem(
                'peserta_ujian',
                JSON.stringify(formData)
            );

            // SIMPAN EXAM DATA
            localStorage.setItem(
                'exam_data',
                JSON.stringify(examData)
            );

            // SIMPAN TOKEN (fallback jika nama field berbeda)
            const tokenToUse = examData.token || examData.Token || examData.token || '';
            const examIdToUse = examData.examId || examData.bankSoalId || examData.id || '';

            localStorage.setItem('exam_token', tokenToUse);

            // REDIRECT HALAMAN UJIAN DENGAN TOKEN (gunakan fallback examId)
            router.push(`/ujian/exam?token=${encodeURIComponent(tokenToUse)}&examId=${encodeURIComponent(examIdToUse)}`);

        } catch (error) {
            console.error('Error validating token:', error);
            setTokenError(
                'Gagal validasi token. Silakan coba lagi.'
            );
            setValidatingToken(false);
        }
    };


    // LOADING

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <div className="spinner-border text-primary"></div>
            </div>
        );
    }

    // HANDLE LOGOUT
    const handleLogout = async () => {
        try {

            await signOut(auth);

            // hapus local storage jika ada
            localStorage.clear();

            // redirect ke login
            router.push("/cbt");

        } catch (error) {

            console.error("Logout gagal:", error);

        }
    };

    // MOCK DATA KELAS
    const kelasList = Array.from(
        { length: 12 },
        (_, i) => `Kelas ${i + 1}`
    );

    return (
        <div
            className="min-h-screen py-4"
            style={{
                background:
                    "linear-gradient(135deg, #eef2ff 0%, #f8fafc 50%, #eff6ff 100%)",
            }}
        >
            <div className="container">
                <div
                    className="card border-0 shadow-lg overflow-hidden"
                    style={{
                        borderRadius: "24px",
                    }}
                >
                    {/* HEADER */}
                    <div
                        className="text-white"
                        style={{
                            background:
                                "linear-gradient(135deg,#2563eb,#4f46e5)",
                            padding: "1.5rem 2rem",
                        }}
                    >
                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                            <div>
                                <h2 className="fw-bold mb-1">
                                    Konfirmasi Data Peserta
                                </h2>

                                <p className="mb-0 text-white-50">
                                    Pastikan seluruh data peserta sudah benar sebelum memulai ujian.
                                </p>
                            </div>

                            <div
                                className="glass"
                                style={{
                                    padding: "12px 18px",
                                    borderRadius: "18px",
                                    minWidth: "170px",
                                }}
                            >
                                <small className="text-white-50 d-block">
                                    Status Ujian
                                </small>

                                <div className="fw-bold fs-5 text-white">
                                    Siap Dimulai
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* BODY */}
                    <div className="p-4 p-lg-5">
                        <div className="row g-4">

                            {/* LEFT SIDE - CALLOUT */}
                            <div className="col-lg-4">
                                <div
                                    className="callout callout-info h-100 shadow-sm border-0"
                                    style={{
                                        borderRadius: "20px",
                                        padding: "1.3rem",
                                    }}
                                >
                                    <div className="d-flex align-items-start gap-3 mb-3">
                                        <div
                                            className="d-flex align-items-center justify-content-center flex-shrink-0"
                                            style={{
                                                width: "50px",
                                                height: "50px",
                                                borderRadius: "16px",
                                                background: "#fff3cd",
                                                color: "#f59e0b",
                                                fontSize: "20px",
                                            }}
                                        >
                                            <i className="bi bi-exclamation-triangle-fill"></i>
                                        </div>

                                        <div>
                                            <h5 className="fw-bold mb-1">
                                                Informasi Peserta
                                            </h5>

                                            <p
                                                className="text-muted mb-0"
                                                style={{
                                                    fontSize: "13px",
                                                    lineHeight: 1.6,
                                                }}
                                            >
                                                Pastikan seluruh identitas peserta telah sesuai.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="d-flex flex-column gap-3">

                                        <div className="d-flex gap-2">
                                            <i className="bi bi-check-circle-fill text-success mt-1"></i>

                                            <small>
                                                Periksa nama lengkap dan NISN peserta.
                                            </small>
                                        </div>

                                        <div className="d-flex gap-2">
                                            <i className="bi bi-shield-lock-fill text-primary mt-1"></i>

                                            <small>
                                                Token ujian hanya berlaku untuk sesi saat ini.
                                            </small>
                                        </div>

                                        <div className="d-flex gap-2">
                                            <i className="bi bi-wifi text-info mt-1"></i>

                                            <small>
                                                Pastikan jaringan internet stabil selama ujian.
                                            </small>
                                        </div>

                                        <div className="d-flex gap-2">
                                            <i className="bi bi-clock-history text-danger mt-1"></i>

                                            <small>
                                                Timer akan langsung berjalan setelah ujian dimulai.
                                            </small>
                                        </div>
                                    </div>

                                    <div
                                        className="alert alert-warning mt-4 mb-0 border-0"
                                        style={{
                                            borderRadius: "14px",
                                            fontSize: "13px",
                                        }}
                                    >
                                        <i className="bi bi-exclamation-circle-fill me-2"></i>

                                        Data tidak dapat diubah setelah menekan tombol
                                        <strong> Mulai Ujian</strong>.
                                    </div>
                                </div>
                            </div>



                            {/* RIGHT SIDE - FORM */}
                            <div className="col-lg-8">
                                <form onSubmit={handleSubmit}>
                                    <div className="row g-3">

                                        {/* NAMA */}
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold small">
                                                Nama Siswa
                                            </label>

                                            <input
                                                type="text"
                                                value={formData?.nama || ""}
                                                readOnly
                                                className="form-control modern-input"
                                            />
                                        </div>

                                        {/* NISN */}
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold small">
                                                NISN
                                            </label>

                                            <input
                                                type="text"
                                                value={formData?.nisn || ""}
                                                readOnly
                                                className="form-control modern-input"
                                            />
                                        </div>

                                        {/* TANGGAL */}
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold small">
                                                Tanggal Lahir
                                            </label>

                                            <input
                                                type="date"
                                                className="form-control modern-input"
                                            />
                                        </div>

                                        {/* JK */}
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold small">
                                                Jenis Kelamin
                                            </label>

                                            <select className="form-select modern-input">
                                                <option>Laki-laki</option>
                                                <option>Perempuan</option>
                                            </select>
                                        </div>

                                        {/* KELAS */}
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold small">
                                                Kelas
                                            </label>

                                            <select className="form-select modern-input">
                                                <option value="">
                                                    Pilih Kelas
                                                </option>

                                                {Array.from({ length: 12 }, (_, i) => (
                                                    <option
                                                        key={i + 1}
                                                        value={`Kelas ${i + 1}`}
                                                    >
                                                        Kelas {i + 1}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* MAPEL */}
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold small">
                                                Mata Pelajaran
                                            </label>

                                            <input
                                                type="text"
                                                name="mapel"
                                                value={formData.mapel}
                                                onChange={handleChange}
                                                className="form-control modern-input"
                                            />
                                        </div>

                                        {/* ===== TOKEN UJIAN MODERN ===== */}
                                        <div className="col-12">
                                            <div
                                                className="token-card position-relative overflow-hidden"
                                            >
                                                {/* BACKGROUND EFFECT */}
                                                <div className="token-glow"></div>

                                                <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-3">
                                                    <div>
                                                        <h5 className="fw-bold mb-1 d-flex align-items-center gap-2">
                                                            <div className="token-icon">
                                                                <i className="bi bi-shield-lock-fill"></i>
                                                            </div>

                                                            Token Ujian
                                                        </h5>

                                                        <p className="text-muted mb-0 small">
                                                            Token diberikan oleh pengawas ujian
                                                        </p>
                                                    </div>

                                                    <div className="token-badge">
                                                        <i className="bi bi-lightning-charge-fill"></i>
                                                        Aman
                                                    </div>
                                                </div>

                                                {/* INPUT TOKEN */}
                                                <div className="position-relative">
                                                    <input
                                                        type="text"
                                                        placeholder="Masukkan token ujian"
                                                        maxLength={6}
                                                        className="form-control token-input text-uppercase"
                                                    />
                                                </div>

                                                {/* HINT */}
                                                <div className="d-flex align-items-center gap-2 mt-3">
                                                    <div className="pulse-dot"></div>

                                                    <small className="text-muted">
                                                        Pastikan token diisi dengan benar sebelum memulai ujian
                                                    </small>
                                                </div>
                                            </div>
                                        </div>


                                        {/* CHECKBOX */}
                                        <div className="col-12">
                                            <div
                                            >
                                                <div className="form-check">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id="check"
                                                    />

                                                    <label
                                                        className="form-check-label"
                                                        htmlFor="check"
                                                        style={{
                                                            lineHeight: 1.6,
                                                            color: "#475569",
                                                        }}
                                                    >
                                                        Saya menyatakan bahwa data yang saya isi sudah benar
                                                        dan siap mengikuti ujian berbasis komputer.
                                                    </label>
                                                </div>
                                            </div>
                                        </div>

                                        {/* BUTTON */}
                                        <div className="col-12">
                                            <div className="d-flex justify-content-end gap-2 flex-wrap mt-2">
                                                <button
                                                    onClick={handleLogout}
                                                    className="btn btn-danger border px-4">
                                                    <i className="bi bi-box-arrow-right me-2"></i>
                                                    Keluar
                                                </button>
                                                <button
                                                    type="submit"
                                                    className="btn text-white px-4"
                                                    style={{
                                                        background:
                                                            "linear-gradient(135deg,#2563eb,#4f46e5)",
                                                        border: "none",
                                                    }}
                                                >
                                                    <i className="bi bi-play-fill me-1"></i>
                                                    Mulai Ujian
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>


    );
}