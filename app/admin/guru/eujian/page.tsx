"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function UsersPage() {
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [edit, setEdit] = useState(false);

    const [profil, setProfil] = useState({
        username: "",
        nip: "",
        kelas: "",
        email: "",
        foto: "",
    });

    const [file, setFile] = useState<File | null>(null);

    // ambil data berdasarkan UID
    useEffect(() => {
        const getProfilGuru = async () => {
            try {
                // tunggu sampai auth siap
                if (!user?.uid) return;

                setLoading(true);

                const ref = doc(db, "users", user.uid);
                const snap = await getDoc(ref);

                if (snap.exists()) {
                    setProfil({
                        username: snap.data().username || "",
                        nip: snap.data().nip || "",
                        kelas: snap.data().kelas || "",
                        email: snap.data().email || user.email || "",
                        foto: snap.data().foto || "",
                    });
                }

                setLoading(false); // 🔥 WAJIB
            } catch (err) {
                console.log("Gagal ambil profil:", err);
                setLoading(false);
            }
        };

        getProfilGuru();
    }, [user?.uid]);


    return (
        <main className="app-main">
            <div className="app-content-header">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-sm-6">
                            <h4>E-Ujian</h4>
                        </div>
                        <div className="col-sm-6">
                            <ol className="breadcrumb float-sm-end">
                                <li className="breadcrumb-item">
                                    <a href="/admin/guru/dashboard">E-Ujian</a>
                                </li>
                                <li className="breadcrumb-item active">E-Ujian</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>

            <div className="app-content">
                <div className="container-fluid">
                    <div
                        className="callout border-0 shadow-sm rounded-4 p-4 mb-3"
                        style={{
                            background: "linear-gradient(135deg, #0d6efd 0%, #4f46e5 100%)",
                            color: "#fff"
                        }}
                    >
                        <div className="d-flex align-items-start">

                            <div
                                className="me-3 d-flex align-items-center justify-content-center"
                                style={{
                                    width: "60px",
                                    height: "60px",
                                    borderRadius: "18px",
                                    background: "rgba(255,255,255,0.15)",
                                    fontSize: "26px"
                                }}
                            >
                                <i className="fas fa-file-signature"></i>
                            </div>

                            <div>
                                <h4 className="fw-bold mb-2">Master Ujian E-Ujian</h4>

                                <p className="mb-3" style={{ opacity: 0.9 }}>
                                    Kelola seluruh data ujian CBT sekolah mulai dari pembuatan ujian,
                                    pengaturan jadwal, bank soal, hingga monitoring pelaksanaan ujian siswa.
                                </p>

                                <div className="d-flex flex-wrap gap-2">
                                    <span className="badge bg-light px-3 py-2">
                                        <a
                                            href="/admin/guru/eujian/bank_soal"
                                            className="text-decoration-none text-primary fw-semibold"
                                        >
                                            <i className="fas fa-book-open me-1"></i>
                                            Bank Soal
                                        </a>
                                    </span>

                                    <span className="badge bg-light text-primary px-3 py-2">
                                        <i className="fas fa-clock me-1"></i>
                                        Jadwal Ujian
                                    </span>

                                    <span className="badge bg-light text-primary px-3 py-2">
                                        <i className="fas fa-users me-1"></i>
                                        Peserta
                                    </span>

                                    <span className="badge bg-light text-primary px-3 py-2">
                                        <i className="fas fa-chart-line me-1"></i>
                                        Monitoring
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header d-flex justify-content-between">
                            <h3 className="card-title">Daftar Ujian Aktif</h3>
                        </div>
                        <div className="card-body">

                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
