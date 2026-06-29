// Halaman anggota kelas

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useModal } from "@/components/modals/useModal";
import { useParams } from "next/navigation";
import {
    collection,
    getDocs,
    doc,
    getDoc,
    deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useConfirm } from "@/context/ConfirmModalContext";
import SearchInput from "@/components/search/SearchInput";

// Rekap Presensi
import { getAttendanceRecap } from "@/services/presensi.service";
import { AttendanceRecap } from "@/types/presensi";
import { useAuth } from "@/context/AuthContext";

// Interface untuk data siswa
interface Student {
    id: string;
    nama: string;
    jk: string;
    nis: string;
    nisn: string;
    kelas: string;
    kelasId: string;
    tingkatKelas: number;
    jenisKelamin: string;
}

export default function AnggotaKelasPage() {

    const { kelasId } = useParams<{
        kelasId: string;
    }>();
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState<Student[]>([]);
    const [kelasData, setKelasData] = useState<any>(null);
    const [search, setSearch] = useState("");

    // Mengambil data kelas dan siswa saat halaman dimuat
    useEffect(() => {

        if (!kelasId) return;

        loadKelas();
        loadStudents();

    }, [kelasId]);

    // Mengambil data siswa dari Firestore
    async function loadStudents() {
        setLoading(true);
        try {
            const anggotaRef = collection(
                db,
                "classes",
                kelasId,
                "anggotakelas"
            );
            const snapshot = await getDocs(anggotaRef);
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Student[];
            setStudents(data);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    }

    // Menampilkan Informasi Kelas
    async function loadKelas() {
        try {
            const kelasRef = doc(db, "classes", kelasId);
            const kelasSnap = await getDoc(kelasRef);
            if (kelasSnap.exists()) setKelasData({ id: kelasSnap.id, ...kelasSnap.data() });
        } catch (error) {
            console.log(error);
        }
    }

    // Menghitung jumlah siswa berdasarkan jenis kelamin
    const totalSiswa = students.length;
    const jumlahLakiLaki = students.filter(
        (item) => item.jk === "L"
    ).length;
    const jumlahPerempuan = students.filter(
        (item) => item.jk === "P"
    ).length;

    // Menghapus siswa dari anggota kelas
    const { confirm } = useConfirm();
    const { showModal } = useModal();
    async function handleRemoveStudent(student: Student) {
        const confirmDelete = await confirm({
            title: "Konfirmasi",
            message: `Apakah yakin ingin menghapus ${student.nama} dari anggota kelas?`,
        });
        if (!confirmDelete) return;
        try {
            await deleteDoc(
                doc(
                    db,
                    "classes",
                    kelasId,
                    "anggotakelas",
                    student.id
                )
            );

            // Refresh data
            loadStudents();
            showModal({
                title: "Berhasil",
                message: `${student.nama} berhasil dihapus dari anggota kelas.`,
                type: "success",
            });
        } catch (error) {
            console.error(error);
            alert("Gagal menghapus anggota kelas.");
        }
    }

    // Filter siswa berdasarkan pencarian
    const filteredStudents = students.filter((student) => {
        const keyword = search.toLowerCase().trim();

        return (
            String(student.nama ?? "").toLowerCase().includes(keyword) ||
            String(student.nis ?? "").includes(keyword) ||
            String(student.nisn ?? "").includes(keyword)
        );
    });

    // Rekap Presensi
    const { user } = useAuth();

    const [rekap, setRekap] = useState<AttendanceRecap[]>([]);
    useEffect(() => {
        if (!kelasId || !user?.schoolId) return;

        loadKelas();
        loadStudents();
        loadRekap();

    }, [kelasId, user]);

    async function loadRekap() {

        if (!user?.schoolId) return;

        const data = await getAttendanceRecap(
            user.schoolId,
            kelasId
        );

        setRekap(data);

    }
    function getStudentRecap(studentId: string) {
        return rekap.find(
            (item) => item.studentId === studentId
        );
    }


    const getProgressColor = (persentase: number) => {
        if (persentase >= 90) return "bg-success";
        if (persentase >= 75) return "bg-primary";
        if (persentase >= 60) return "bg-warning";
        return "bg-danger";
    };

    return (
        <main className="content-wrapper">
            <div className="container-fluid py-2">
                <h3 className="mb-2">Anggota Kelas</h3>

                {/* Menampilkan Informasi Kelas */}
                {kelasData && (
                    <div className="row mb-3">

                        {/* Informasi Kelas */}
                        <div className="col-lg-8">

                            <div className="card card-primary shadow-sm">

                                <div className="card-header">
                                    <h3 className="card-title">
                                        <i className="fas fa-school mr-2"></i>
                                        Informasi Kelas
                                    </h3>
                                </div>

                                <div className="card-body p-0">

                                    <table className="table table-bordered mb-0">

                                        <tbody>

                                            <tr>
                                                <th style={{ width: 220 }}>Nama Guru</th>
                                                <td>{kelasData.ownerName}</td>
                                            </tr>

                                            <tr>
                                                <th>Nama Kelas</th>
                                                <td>{kelasData.namaKelas}</td>
                                            </tr>

                                            <tr>
                                                <th>Tingkat Kelas</th>
                                                <td>{kelasData.tingkatKelas}</td>
                                            </tr>

                                            <tr>
                                                <th>Tahun Ajaran</th>
                                                <td>{kelasData.tahunAjaran}</td>
                                            </tr>

                                            <tr>
                                                <th>Mata Pelajaran</th>
                                                <td>{kelasData.mataPelajaran}</td>
                                            </tr>

                                        </tbody>

                                    </table>

                                </div>

                            </div>

                        </div>

                        {/* Statistik */}
                        <div className="col-lg-4">
                            <div className="card shadow-sm border-0">
                                <div className="card-body">
                                    <h5 className="fw-bold mb-4">
                                        Statistik Anggota
                                    </h5>
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <div>
                                            <i className="fas fa-mars text-primary me-2"></i>
                                            Laki-laki
                                        </div>
                                        <span className="badge bg-primary rounded-pill px-3 py-2">
                                            {jumlahLakiLaki}
                                        </span>
                                    </div>

                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <div>
                                            <i className="fas fa-venus text-danger me-2"></i>
                                            Perempuan
                                        </div>
                                        <span className="badge bg-danger rounded-pill px-3 py-2">
                                            {jumlahPerempuan}
                                        </span>
                                    </div>

                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <i className="fas fa-users text-success me-2"></i>
                                            Total Siswa
                                        </div>
                                        <span className="badge bg-success rounded-pill px-3 py-2">
                                            {totalSiswa}
                                        </span>

                                    </div>

                                </div>

                            </div>

                        </div>
                    </div>
                )}

                {/* ================= ACTION CARD ================= */}
                <div
                    className="layout-aksi mb-3"
                    style={{
                        background:
                            "linear-gradient(135deg,#0d6efd 0%,#3b5bdb 50%,#6f42c1 100%)",
                        borderRadius: "12px",
                        padding: "16px",
                        color: "#fff"
                    }}
                >
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h5 className="mb-1 text-white">
                                Pengelolaan Anggota Kelas
                            </h5>
                            <small className="text-white">
                                Gunakan menu aksi untuk mengelola anggota kelas, seperti
                                menambahkan siswa baru, menghapus siswa, atau melakukan
                                tindakan lainnya.
                            </small>
                        </div>

                        <div className="d-flex gap-2">
                            <div className="dropdown">
                                <button
                                    className="btn btn-outline-light dropdown-toggle"
                                    data-bs-toggle="dropdown"
                                >
                                    <i className="bi bi-sliders me-2"></i>
                                    Menu Aksi
                                </button>

                                <ul className="dropdown-menu dropdown-menu-end" style={{
                                    zIndex: 9999
                                }}>
                                    <li><a className="dropdown-item" href={`/admin/guru/kelas/${kelasId}/tambah`}>Tambah Anggota</a></li>
                                    <li><a className="dropdown-item" href={`/admin/guru/kelas/${kelasId}/presensi`}>Presensi</a></li>
                                    <li><a className="dropdown-item" href={`/admin/guru/kelas/${kelasId}/penilaian`}>Penilaian</a></li>
                                    <li><a className="dropdown-item" href={`/admin/guru/kelas/${kelasId}/cetak`}>Cetak Data</a></li>
                                    <li><hr className="dropdown-divider" /></li>
                                    <li><a className="dropdown-item" href="/admin/guru/kelas/[kelasId]/refresh">Refresh Data</a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ================= TABLE ANGGOTA KELAS ================= */}
                <div className="card">
                    <div className="card-header bg-white border-bottom py-3">
                        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                            <div>
                                <h4 className="mb-0 fw-bold">
                                    Daftar Siswa
                                </h4>
                            </div>
                            <div className="ms-md-auto" style={{ width: "100%", maxWidth: 380 }}>
                                <SearchInput
                                    value={search}
                                    onChange={setSearch}
                                    placeholder="Cari nama, NIS atau NISN..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="card-body">
                        {loading && (
                            <p>Loading...</p>
                        )}
                        {!loading && (
                            <table className="table table-bordered table-striped">
                                <thead>
                                    <tr>
                                        <th>No</th>
                                        <th>NIS</th>
                                        <th>NISN</th>
                                        <th>Nama</th>
                                        <th>L/P</th>
                                        <th>% Kehadiran</th>
                                        <th style={{ width: 120 }}>Aksi</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredStudents.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="text-center">
                                                Tidak ada anggota kelas
                                            </td>
                                        </tr>
                                    )}

                                    {[...filteredStudents]
                                        .sort((a, b) =>
                                            a.nama.localeCompare(b.nama, "id", {
                                                sensitivity: "base",
                                                numeric: true,
                                            })
                                        )
                                        .map((student, index) => (
                                            <tr key={student.id}>
                                                <td>{index + 1}</td>
                                                <td>{student.nis}</td>
                                                <td>{student.nisn}</td>
                                                <td>{student.nama}</td>
                                                <td>{student.jk}</td>

                                                <td style={{ minWidth: 220 }}>
                                                    {(() => {
                                                        const recap = getStudentRecap(student.id);

                                                        return (
                                                            <Link
                                                                href={`/admin/guru/kelas/${kelasId}/presensi/siswa-presensi/${student.id}`}
                                                                className="text-decoration-none text-reset"
                                                            >
                                                                <div className="riwayat-presensi-link p-2 rounded">

                                                                    <div className="d-flex align-items-center mb-2">
                                                                        <div
                                                                            className="progress flex-grow-1 me-2"
                                                                            style={{ height: 8 }}
                                                                        >
                                                                            <div
                                                                                className={`progress-bar ${getProgressColor(
                                                                                    recap?.persentase ?? 0
                                                                                )}`}
                                                                                style={{
                                                                                    width: `${recap?.persentase ?? 0}%`,
                                                                                }}
                                                                            />
                                                                        </div>

                                                                        <small
                                                                            className="fw-bold"
                                                                            style={{ width: 45, textAlign: "right" }}
                                                                        >
                                                                            {recap?.persentase ?? 0}%
                                                                        </small>
                                                                    </div>

                                                                    <div className="d-flex flex-wrap gap-1">
                                                                        <span className="badge bg-success">
                                                                            H {recap?.hadir ?? 0}
                                                                        </span>

                                                                        <span className="badge bg-warning text-dark">
                                                                            I {recap?.izin ?? 0}
                                                                        </span>

                                                                        <span className="badge bg-info">
                                                                            S {recap?.sakit ?? 0}
                                                                        </span>

                                                                        <span className="badge bg-danger">
                                                                            A {recap?.alpha ?? 0}
                                                                        </span>
                                                                    </div>

                                                                </div>
                                                            </Link>
                                                        );
                                                    })()}
                                                </td>

                                                <td>
                                                    <button
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => handleRemoveStudent(student)}
                                                    >
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>

                        )}

                    </div>

                </div>

            </div>
        </main>
    );

}