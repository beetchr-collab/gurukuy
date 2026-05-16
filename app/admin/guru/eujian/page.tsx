"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
    collection,
    query,
    where,
    onSnapshot,
} from "firebase/firestore";

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

    // DATA UJIAN
    const [ujianList, setUjianList] = useState<any[]>([]);
    // AMBIL UJIAN AKTIF
    useEffect(() => {

        if (!user?.uid) return;

        const q = query(
            collection(db, "bank_soal"),
            where("ownerId", "==", user.uid),
            where("status", "==", "Aktif")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {

            const data: any[] = [];

            snapshot.forEach((doc) => {
                data.push({
                    id: doc.id,
                    ...doc.data(),
                });
            });

            setUjianList(data);
        });

        return () => unsubscribe();

    }, [user?.uid]);

    // GENERATE TOKEN
    const generateToken = () => {
        return Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase();
    };

    // MULAI UJIAN
    const mulaiUjian = async (id: string) => {

        try {

            const token = generateToken();

            await updateDoc(
                doc(db, "bank_soal", id),
                {
                    examStatus: "mulai",

                    allowAccess: true,

                    token,

                    startedAt: new Date(),
                }
            );

        } catch (error) {
            console.log(error);
        }
    };

    // AKHIRI UJIAN
    const akhiriUjian = async (id: string) => {

        try {

            await updateDoc(
                doc(db, "bank_soal", id),
                {
                    examStatus: "selesai",

                    allowAccess: false,

                    endedAt: new Date(),
                }
            );

        } catch (error) {
            console.log(error);
        }
    };

    // PARSE TANGGAL UJIAN
    const parseExamDateTime = (examDate: string, time: string) => {
        if (!examDate || !time) return null;

        const dateTime = new Date(`${examDate}T${time}`);

        return Number.isNaN(dateTime.getTime()) ? null : dateTime;
    };

    // HITUNG SISA WAKTU UJIAN
    const getRemainingTimeText = (exam: any) => {
        const endAt = parseExamDateTime(exam.examDate, exam.endTime);
        if (!endAt) return null;

        const diffMs = endAt.getTime() - Date.now();
        if (diffMs <= 0) return "Waktu selesai";

        const totalSeconds = Math.floor(diffMs / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (hours > 0) {
            return `Sisa durasi: ${hours} jam ${minutes} menit`;
        }

        return `Sisa durasi: ${minutes} menit ${seconds} detik`;
    };

    // CEK JADWAL UJIAN
    const isBeforeSchedule = (exam: any) => {
        const startAt = parseExamDateTime(exam.examDate, exam.startTime);
        return startAt ? Date.now() < startAt.getTime() : false;
    };

    // CEK UJIAN YANG AKAN DIMULAI/DISELESAIKAN OTOMATIS
    const checkScheduledExams = (exams: any[]) => {
        exams.forEach((exam) => {
            const startAt = parseExamDateTime(exam.examDate, exam.startTime);
            const endAt = parseExamDateTime(exam.examDate, exam.endTime);
            const now = Date.now();

            if (!startAt || !endAt) return;

            if (exam.examStatus !== "selesai" && now > endAt.getTime()) {
                void akhiriUjian(exam.id);
                return;
            }

            if (
                exam.examStatus !== "mulai" &&
                exam.examStatus !== "selesai" &&
                now >= startAt.getTime()
            ) {
                void mulaiUjian(exam.id);
            }
        });
    };

    // UPDATE STATUS UJIAN BERDASARKAN JADWAL
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        if (!ujianList.length) return;

        checkScheduledExams(ujianList);

        const scheduleInterval = window.setInterval(() => {
            checkScheduledExams(ujianList);
        }, 30 * 1000);

        const clockInterval = window.setInterval(() => {
            setNow(Date.now());
        }, 1000);

        return () => {
            window.clearInterval(scheduleInterval);
            window.clearInterval(clockInterval);
        };
    }, [ujianList]);

    // MODAL UJIAN
    const [selectedUjian, setSelectedUjian] =
        useState<any>(null);

    const [scheduleData, setScheduleData] =
        useState({
            examDate: "",
            startTime: "",
            endTime: "",
        });

    // HITUNG DURASI UJIAN
    const calculateDuration = (
        start: string,
        end: string
    ) => {

        const startTime = new Date(
            `2026-01-01 ${start}`
        );

        const endTime = new Date(
            `2026-01-01 ${end}`
        );

        const diff =
            (endTime.getTime() -
                startTime.getTime()) /
            1000 /
            60;

        return diff;
    };

    // SIMPAN JADWAL UJIAN
    const saveSchedule = async () => {

        if (!selectedUjian) return;

        try {

            const duration = calculateDuration(
                scheduleData.startTime,
                scheduleData.endTime
            );

            await updateDoc(
                doc(db, "bank_soal", selectedUjian.id),
                {
                    examDate:
                        scheduleData.examDate,

                    startTime:
                        scheduleData.startTime,

                    endTime:
                        scheduleData.endTime,

                    duration,
                }
            );

            alert("Jadwal berhasil disimpan");

        } catch (error) {
            console.log(error);
        }
    };

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
                            <div className="card-body">

                                <div className="table-responsive">

                                    <table className="table table-hover align-middle">

                                        <thead className="table-light">
                                            <tr>
                                                <th>No</th>
                                                <th>Nama Ujian</th>
                                                <th>Mapel</th>
                                                <th>Kelas</th>
                                                <th>Token</th>
                                                <th>Status</th>
                                                <th>Setting</th>
                                                <th>Jadwal</th>
                                                <th className="text-center">
                                                    Aksi
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>

                                            {ujianList.length > 0 ? (

                                                ujianList.map((item, index) => (

                                                    <tr key={item.id}>

                                                        <td>
                                                            {index + 1}
                                                        </td>

                                                        <td>
                                                            <div className="fw-semibold">
                                                                {item.namaBankSoal}
                                                            </div>
                                                        </td>

                                                        <td>
                                                            {item.mataPelajaran}
                                                        </td>

                                                        <td>
                                                            {item.kelas}
                                                        </td>

                                                        {/* TOKEN */}
                                                        <td>

                                                            {item.token ? (
                                                                <span className="badge bg-success px-3 py-2">
                                                                    {item.token}
                                                                </span>
                                                            ) : (
                                                                <span className="badge bg-secondary">
                                                                    Belum Ada
                                                                </span>
                                                            )}

                                                        </td>

                                                        {/* STATUS */}
                                                        <td>

                                                            {item.examStatus === "mulai" && (
                                                                <div>
                                                                    <span className="badge bg-success">
                                                                        Sedang Berlangsung
                                                                    </span>
                                                                    {getRemainingTimeText(item) && (
                                                                        <div className="small text-white-50 mt-1">
                                                                            {getRemainingTimeText(item)}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {item.examStatus === "draft" && (
                                                                <div>
                                                                    <span className="badge bg-secondary">
                                                                        Draft
                                                                    </span>
                                                                    {item.examDate && item.startTime && isBeforeSchedule(item) && (
                                                                        <div className="small text-muted mt-1">
                                                                            Terjadwal mulai {item.startTime}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {item.examStatus === "selesai" && (
                                                                <span className="badge bg-danger">
                                                                    Selesai
                                                                </span>
                                                            )}

                                                            {!item.examStatus && (
                                                                <div>
                                                                    <span className="badge bg-secondary">
                                                                        Draft
                                                                    </span>
                                                                    {item.examDate && item.startTime && isBeforeSchedule(item) && (
                                                                        <div className="small text-muted mt-1">
                                                                            Terjadwal mulai {item.startTime}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}

                                                        </td>

                                                        {/* SETTING */}
                                                        <td>
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-warning"
                                                                data-bs-toggle="modal"
                                                                data-bs-target="#modalJadwal"
                                                                onClick={() => {
                                                                    setSelectedUjian(item);

                                                                    setScheduleData({
                                                                        examDate:
                                                                            item.examDate || "",

                                                                        startTime:
                                                                            item.startTime || "",

                                                                        endTime:
                                                                            item.endTime || "",
                                                                    });
                                                                }}
                                                            >
                                                                <i className="fas fa-clock"></i>
                                                            </button>
                                                        </td>
                                                        {/* JADWAL UJIAN */}
                                                        <td>

                                                            {
                                                                item.examDate ? (

                                                                    <div>

                                                                        <div className="fw-semibold">
                                                                            {item.examDate}
                                                                        </div>

                                                                        <small className="text-muted">
                                                                            {item.startTime} -
                                                                            {item.endTime}
                                                                        </small>

                                                                    </div>

                                                                ) : (

                                                                    <span className="badge bg-warning">
                                                                        Belum Diatur
                                                                    </span>

                                                                )
                                                            }

                                                        </td>

                                                        {/* AKSI */}
                                                        <td>

                                                            <div className="d-flex justify-content-center">

                                                                <div
                                                                    className="btn-group shadow-sm rounded-pill overflow-hidden"
                                                                    role="group"
                                                                >

                                                                    {/* MULAI */}
                                                                    <button
                                                                        type="button"
                                                                        className={`btn btn-sm px-3 d-flex align-items-center gap-2 ${item.examStatus === "mulai"
                                                                            ? "btn-success"
                                                                            : "btn-light text-success border"
                                                                            }`}
                                                                        onClick={() => mulaiUjian(item.id)}
                                                                        disabled={
                                                                            item.examStatus === "mulai" ||
                                                                            !item.examDate ||
                                                                            !item.startTime ||
                                                                            !item.endTime ||
                                                                            isBeforeSchedule(item)
                                                                        }
                                                                    >
                                                                        <div
                                                                            className="d-flex align-items-center justify-content-center rounded-circle"
                                                                            style={{
                                                                                width: "24px",
                                                                                height: "24px",
                                                                                background:
                                                                                    item.examStatus === "mulai"
                                                                                        ? "rgba(255,255,255,0.2)"
                                                                                        : "#19875420",
                                                                            }}
                                                                        >
                                                                            <i className="fas fa-play"></i>
                                                                        </div>

                                                                        <span className="fw-semibold">
                                                                            Mulai
                                                                        </span>
                                                                    </button>

                                                                    {/* AKHIRI */}
                                                                    <button
                                                                        type="button"
                                                                        className={`btn btn-sm px-3 d-flex align-items-center gap-2 ${item.examStatus === "selesai"
                                                                            ? "btn-danger"
                                                                            : "btn-light text-danger border"
                                                                            }`}
                                                                        onClick={() => akhiriUjian(item.id)}
                                                                        disabled={item.examStatus === "selesai"}
                                                                    >
                                                                        <div
                                                                            className="d-flex align-items-center justify-content-center rounded-circle"
                                                                            style={{
                                                                                width: "24px",
                                                                                height: "24px",
                                                                                background:
                                                                                    item.examStatus === "selesai"
                                                                                        ? "rgba(255,255,255,0.2)"
                                                                                        : "#dc354520",
                                                                            }}
                                                                        >
                                                                            <i className="fas fa-stop"></i>
                                                                        </div>

                                                                        <span className="fw-semibold">
                                                                            Akhiri
                                                                        </span>
                                                                    </button>

                                                                </div>

                                                            </div>
                                                        </td>

                                                    </tr>
                                                ))

                                            ) : (

                                                <tr>
                                                    <td
                                                        colSpan={7}
                                                        className="text-center py-5 text-muted"
                                                    >
                                                        <i className="fas fa-folder-open fa-2x mb-3 d-block"></i>

                                                        Belum ada ujian aktif
                                                    </td>
                                                </tr>
                                            )}

                                        </tbody>

                                    </table>

                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </div >
            <div
                className="modal fade"
                id="modalJadwal"
                tabIndex={-1}
            >

                <div className="modal-dialog modal-dialog-centered">

                    <div className="modal-content border-0 rounded-4">

                        {/* HEADER */}
                        <div className="modal-header border-0">

                            <h5 className="fw-bold">
                                <i className="fas fa-calendar-alt text-warning me-2"></i>

                                Setting Jadwal Ujian
                            </h5>

                            <button
                                type="button"
                                className="btn-close"
                                data-bs-dismiss="modal"
                            ></button>
                        </div>

                        {/* BODY */}
                        <div className="modal-body">

                            {/* TANGGAL */}
                            <div className="mb-3">

                                <label className="form-label fw-semibold">
                                    Tanggal Ujian
                                </label>

                                <input
                                    type="date"
                                    className="form-control rounded-3"
                                    value={
                                        scheduleData.examDate
                                    }
                                    onChange={(e) =>
                                        setScheduleData({
                                            ...scheduleData,
                                            examDate:
                                                e.target.value,
                                        })
                                    }
                                />
                            </div>

                            {/* JAM MULAI */}
                            <div className="mb-3">

                                <label className="form-label fw-semibold">
                                    Jam Mulai
                                </label>

                                <input
                                    type="time"
                                    className="form-control rounded-3"
                                    value={
                                        scheduleData.startTime
                                    }
                                    onChange={(e) =>
                                        setScheduleData({
                                            ...scheduleData,
                                            startTime:
                                                e.target.value,
                                        })
                                    }
                                />
                            </div>

                            {/* JAM SELESAI */}
                            <div className="mb-3">

                                <label className="form-label fw-semibold">
                                    Jam Selesai
                                </label>

                                <input
                                    type="time"
                                    className="form-control rounded-3"
                                    value={
                                        scheduleData.endTime
                                    }
                                    onChange={(e) =>
                                        setScheduleData({
                                            ...scheduleData,
                                            endTime:
                                                e.target.value,
                                        })
                                    }
                                />
                            </div>

                        </div>

                        {/* FOOTER */}
                        <div className="modal-footer border-0">

                            <button
                                className="btn btn-light border rounded-pill px-4"
                                data-bs-dismiss="modal"
                            >
                                Batal
                            </button>

                            <button
                                className="btn btn-warning rounded-pill px-4"
                                onClick={saveSchedule}
                            >
                                <i className="fas fa-save me-2"></i>
                                Simpan Jadwal
                            </button>

                        </div>

                    </div>

                </div>

            </div>
        </main >
    );
}
