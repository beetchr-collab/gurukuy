'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    collection,
    getDocs,
    updateDoc,
    doc,
    query,
    where,
    limit,
    serverTimestamp,
} from 'firebase/firestore';

import { auth, db } from '@/lib/firebase';
import styles from '../login/login.module.css';

export default function LoginUjianPage() {

    const router = useRouter();

    // =========================
    // STATE
    // =========================
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // =========================
    // LOGIN SISWA
    // =========================
    const handleLogin = async (
        e: React.FormEvent
    ) => {
        e.preventDefault();

        setLoading(true);
        setError('');

        try {

            if (!username.trim()) {
                throw new Error('NISN wajib diisi');
            }

            if (!password.trim()) {
                throw new Error('NIS wajib diisi');
            }

            // CARI SISWA DI COLLECTION STUDENTS
            const siswaQuery = query(
                collection(db, 'students'),
                where(
                    'nisn',
                    '==',
                    username.trim()
                ),
                where(
                    'nis',
                    '==',
                    Number(password)
                ),
                limit(1)
            );

            const snapshot =
                await getDocs(siswaQuery);

            if (snapshot.empty) {
                throw new Error(
                    'NISN atau NIS salah'
                );
            }

            const siswaDoc =
                snapshot.docs[0];

            const siswa = {
                id: siswaDoc.id,
                ...(siswaDoc.data() as {
                    nama?: string;
                    nis?: string;
                    nisn?: string;
                    kelas?: string;
                    jk?: string;
                    schoolId?: string;
                    ownerId?: string;
                }),
            };

            // UPDATE LAST LOGIN
            await updateDoc(
                doc(
                    db,
                    'students',
                    siswaDoc.id
                ),
                {
                    lastLogin:
                        serverTimestamp(),
                }
            );

            router.push('/cbt/beranda');

        } catch (err: any) {

            console.error(err);

            setError(
                err.message ||
                'Login gagal'
            );

        } finally {

            setLoading(false);

        }
    };

    return (
        <div
            className={`container-fluid min-vh-100 ${styles.loginWrapper}`}
        >
            <div className="row min-vh-100">

                {/* ================= HERO ================= */}
                <div className="col-lg-7 d-none d-lg-block p-0">
                    <div className={styles.heroSection}>

                        {/* OVERLAY */}
                        <div className={styles.overlay}></div>

                        {/* CONTENT */}
                        <div className={styles.heroContent}>
                            <div>
                                <h1>
                                    <span className={styles.blue}>CBT</span>
                                    <span className={styles.orange}>Guru Kuy</span>
                                </h1>
                            </div>

                            {/* IMAGE */}
                            <div className={styles.heroImage}>
                                <img
                                    src="/images/info_cbt.png"
                                    alt="E-Ujian"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ================= LOGIN ================= */}
                <div className="col-lg-5 col-md-6 d-flex align-items-center justify-content-center order-lg-2">
                    <div
                        className={`${styles.loginCard} w-100 px-4`}
                    >
                        {/* LOGO */}
                        <div className="text-center mb-2">
                            <div className="d-flex justify-content-center">
                                <img
                                    src="/images/logo_cbt.png"
                                    alt="GuruKuy"
                                    style={{
                                        width: '150px',
                                    }}
                                />
                            </div>

                            <h2 className="fw-bold mb-1">
                                Login Siswa
                            </h2>

                            <p className="text-muted">
                                Silakan login untuk memulai
                                ujian
                            </p>
                        </div>

                        {/* ERROR */}
                        {error && (
                            <div className="alert alert-danger">
                                <i className="bi bi-exclamation-triangle me-2"></i>
                                {error}
                            </div>
                        )}

                        {/* FORM */}
                        {/* FORM */}
                        <form onSubmit={handleLogin}>

                            {/* NAMA SISWA */}
                            <div className="mb-3">
                                <label className="form-label fw-semibold">
                                    NISN
                                </label>

                                <div className="input-group">
                                    <span className="input-group-text">
                                        <i className="bi bi-person"></i>
                                    </span>

                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Masukkan NISN"
                                        value={username}
                                        onChange={(e) =>
                                            setUsername(e.target.value)
                                        }
                                        required
                                    />
                                </div>

                                <small className="text-muted">
                                    Gunakan nama lengkap siswa
                                </small>
                            </div>

                            {/* NISN */}
                            <div className="mb-4">
                                <label className="form-label fw-semibold">
                                    NIS
                                </label>

                                <div className="input-group">
                                    <span className="input-group-text">
                                        <i className="bi bi-card-text"></i>
                                    </span>

                                    <input
                                        type="password"
                                        className="form-control"
                                        placeholder="Masukkan NIS"
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        required
                                    />
                                </div>

                                <small className="text-muted">
                                    Password menggunakan NIS siswa
                                </small>
                            </div>

                            {/* BUTTON */}
                            <button
                                type="submit"
                                className="btn btn-primary w-100"
                                disabled={loading}
                                style={{
                                    height: '50px',
                                    borderRadius: '14px',
                                    fontWeight: 600,
                                }}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        Loading...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-box-arrow-in-right me-2"></i>
                                        Masuk Ujian
                                    </>
                                )}
                            </button>

                        </form>
                        {/* FOOTER */}
                        <p className="text-center text-muted mt-4 mb-0">
                            © 2026 CBT Guru Kuy
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}