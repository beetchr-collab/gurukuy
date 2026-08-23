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
import {
    getMapelPenilaian,
    getPenilaianRekap,
} from "@/services/penilaian.service";
import { getBobotPenilaian } from "@/services/bobotpenilaian.service";

// pagination
import { usePagination } from "@/hooks/usePagination";
import TableFooter from "@/components/pagination/TableFooter";

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

type NilaiAkhirPerMapel = Record<string, Record<string, number>>;

function getMapelSingkatan(mapel: string) {
    const normalizedMapel = mapel.toLowerCase().replace(/\s+/g, " ").trim();
    const singkatan: Record<string, string> = {
        "pendidikan agama islam": "PAI",
        "pendidikan pancasila (pp)": "PP",
        "bahasa indonesia": "BIN",
        "matematika": "MAT",
        "ilmu pengetahuan alam dan sosial (ipas)": "IPAS",
        "bahasa inggris": "BIG",
        "seni budaya": "SB",
        "pendidikan olahraga dan kesehatan": "PJOK",
    };

    return singkatan[normalizedMapel] ?? mapel;
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

            if (!kelasSnap.exists()) return;

            const data = kelasSnap.data();
            let ownerName = data.ownerName || data.namaGuru || "";

            if (!ownerName && data.ownerId) {
                const ownerSnap = await getDoc(doc(db, "users", data.ownerId));
                const ownerData = ownerSnap.data();

                ownerName =
                    ownerData?.nama ||
                    ownerData?.displayName ||
                    ownerData?.username ||
                    "";
            }

            setKelasData({
                id: kelasSnap.id,
                ...data,
                ownerName,
            });
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
    // Urutkan berdasarkan nama
    const sortedStudents = [...filteredStudents].sort((a, b) =>
        a.nama.localeCompare(b.nama, "id", {
            sensitivity: "base",
            numeric: true,
        })
    );

    // Pagination
    const {
        currentPage,
        pageSize,
        totalPages,
        startIndex,
        currentData,
        setCurrentPage,
        setPageSize,
    } = usePagination({
        data: sortedStudents,
        pageSize: 10, // jumlah data default per halaman
        resetDeps: [search],
    });

    // Rekap Presensi
    const { user } = useAuth();

    const [rekap, setRekap] = useState<AttendanceRecap[]>([]);
    const [mapelList, setMapelList] = useState<string[]>([]);
    const [nilaiAkhir, setNilaiAkhir] = useState<NilaiAkhirPerMapel>({});
    useEffect(() => {
        if (!kelasId || !user?.schoolId) return;

        loadKelas();
        loadStudents();
        loadRekap();

    }, [kelasId, user]);

    useEffect(() => {
        if (!kelasId || !user?.uid || !kelasData?.tahunAjaran) return;

        loadNilaiAkhir();
    }, [kelasId, user, kelasData?.tahunAjaran, students]);

    async function loadRekap() {

        if (!user?.schoolId) return;

        const data = await getAttendanceRecap(
            user.schoolId,
            kelasId
        );

        setRekap(data);

    }

    async function loadNilaiAkhir() {
        if (!user?.uid || !kelasData?.tahunAjaran) return;

        try {
            const mapelData = await getMapelPenilaian(
                user.uid,
                kelasData.tahunAjaran,
                kelasId
            );
            const mapel = mapelData.map((item) => item.mapel);

            const nilaiPerMapel = await Promise.all(
                mapel.map(async (namaMapel) => {
                    const [penilaian, bobotData] = await Promise.all([
                        getPenilaianRekap(
                            user.uid,
                            kelasId,
                            namaMapel,
                            kelasData.tahunAjaran
                        ),
                        getBobotPenilaian(
                            user.uid,
                            kelasData.tahunAjaran,
                            kelasId,
                            namaMapel
                        ),
                    ]);

                    const bobot = bobotData ?? {
                        formatif: 50,
                        sumatif: 25,
                        sas: 25,
                    };
                    const formatif = penilaian.filter((item) =>
                        item.jenisPenilaian.toLowerCase().includes("formatif")
                    );
                    const sumatif = penilaian.filter((item) =>
                        item.jenisPenilaian.toLowerCase().includes("sumatif") &&
                        !item.jenisPenilaian.toLowerCase().includes("sumatif akhir semester")
                    );
                    const sas = penilaian.find((item) =>
                        item.jenisPenilaian.toLowerCase().includes("sumatif akhir semester")
                    );

                    const getScore = (studentId: string, items: typeof penilaian) => {
                        if (items.length === 0) return 0;

                        const total = items.reduce((sum, item) => {
                            const score = item.nilai.find((value) => value.studentId === studentId)?.nilai;
                            return sum + Number(score ?? 0);
                        }, 0);

                        return total / items.length;
                    };

                    const scores = Object.fromEntries(
                        students.map((student) => {
                            const nilaiFormatif = getScore(student.id, formatif);
                            const nilaiSumatif = getScore(student.id, sumatif);
                            const nilaiSAS = sas
                                ? Number(sas.nilai.find((value) => value.studentId === student.id)?.nilai ?? 0)
                                : 0;

                            return [
                                student.id,
                                (nilaiFormatif * bobot.formatif) / 100 +
                                (nilaiSumatif * bobot.sumatif) / 100 +
                                (nilaiSAS * bobot.sas) / 100,
                            ];
                        })
                    );

                    return [namaMapel, scores] as const;
                })
            );

            setMapelList(mapel);
            setNilaiAkhir(Object.fromEntries(nilaiPerMapel));
        } catch (error) {
            console.error("Gagal mengambil nilai akhir:", error);
        }
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

    const getStudentAverage = (studentId: string) => {
        if (mapelList.length === 0) return null;

        const total = mapelList.reduce(
            (sum, mapel) => sum + (nilaiAkhir[mapel]?.[studentId] ?? 0),
            0
        );

        return total / mapelList.length;
    };

    const ranking = [...students]
        .sort((a, b) => {
            const averageDifference =
                (getStudentAverage(b.id) ?? 0) - (getStudentAverage(a.id) ?? 0);

            if (averageDifference !== 0) return averageDifference;

            return a.nama.localeCompare(b.nama, "id", {
                sensitivity: "base",
                numeric: true,
            });
        })
        .reduce<Record<string, number>>((result, student, index) => {
            result[student.id] = index + 1;
            return result;
        }, {});


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

                                    <div className="table-responsive">
                                        <table className="table table-bordered mb-0">

                                            <tbody>

                                                <tr>
                                                    <th style={{ width: 220, minWidth: 150 }}>Nama Guru</th>
                                                    <td>{kelasData.ownerName || "-"}</td>
                                                </tr>

                                                <tr>
                                                    <th>Nama Kelas</th>
                                                    <td>{kelasData.namaKelas || "-"}</td>
                                                </tr>

                                                <tr>
                                                    <th>Tingkat Kelas</th>
                                                    <td>{kelasData.tingkatKelas || "-"}</td>
                                                </tr>

                                                <tr>
                                                    <th>Tahun Ajaran</th>
                                                    <td>{kelasData.tahunAjaran || "-"}</td>
                                                </tr>

                                                <tr>
                                                    <th>Mata Pelajaran</th>
                                                    <td>{kelasData.mataPelajaran ? getMapelSingkatan(kelasData.mataPelajaran) : "-"}</td>
                                                </tr>

                                            </tbody>

                                        </table>
                                    </div>

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
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-stretch align-items-md-center gap-3">
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

                        <div className="d-flex gap-2 align-self-start align-self-md-center">
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
                                    <li><a className="dropdown-item" href="/admin/guru/presensi/rekap-presensi">Presensi</a></li>
                                    <li><a className="dropdown-item" href="/admin/guru/penilaian">Penilaian</a></li>
                                    <li><a className="dropdown-item" href={`/admin/guru/kelas/${kelasId}/cetak`}>Cetak Data</a></li>
                                    <li><hr className="dropdown-divider" /></li>
                                    <li><a className="dropdown-item" href={`/admin/guru/kelas/${kelasId}`}>Refresh Data</a></li>
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
                            <>
                                <div className="table-responsive">
                                <table className="table table-bordered table-striped align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th className="text-center" style={{ minWidth: 55 }}>No</th>
                                            <th style={{ minWidth: 100 }}>NIS</th>
                                            <th style={{ minWidth: 120 }}>NISN</th>
                                            <th style={{ minWidth: 180 }}>Nama</th>
                                            <th className="text-center" style={{ minWidth: 65 }}>L/P</th>
                                            {mapelList.map((mapel) => (
                                                <th key={mapel} className="text-center" style={{ minWidth: 110 }}>
                                                    {getMapelSingkatan(mapel)}
                                                </th>
                                            ))}
                                            <th className="text-center" style={{ minWidth: 110 }}>Rata-rata</th>
                                            <th className="text-center" style={{ minWidth: 90 }}>Peringkat</th>
                                            <th style={{ minWidth: 220 }}> % Kehadiran</th>
                                            <th className="text-center" style={{ minWidth: 80 }}>Aksi</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {sortedStudents.length === 0 && (
                                            <tr>
                                                <td colSpan={9 + mapelList.length} className="text-center">
                                                    Tidak ada anggota kelas
                                                </td>
                                            </tr>
                                        )}

                                        {currentData.map((student, index) => (
                                            <tr key={student.id}>
                                                <td>{startIndex + index + 1}</td>

                                                <td>{student.nis}</td>

                                                <td>{student.nisn}</td>

                                                <td>{student.nama}</td>

                                                <td>{student.jk}</td>

                                                {mapelList.map((mapel) => (
                                                    <td key={mapel} className="text-center">
                                                        {nilaiAkhir[mapel]?.[student.id] === undefined
                                                            ? "-"
                                                            : nilaiAkhir[mapel][student.id].toFixed(2)}
                                                    </td>
                                                ))}

                                                <td className="text-center">
                                                    {getStudentAverage(student.id)?.toFixed(2) ?? "-"}
                                                </td>

                                                <td className="text-center">
                                                    {ranking[student.id] ?? "-"}
                                                </td>

                                                <td style={{ minWidth: 220 }}>
                                                    {(() => {
                                                        const recap = getStudentRecap(student.id);

                                                        return (
                                                            <Link
                                                                href={`/admin/guru/presensi/detail-presensi/${student.id}?kelasId=${kelasId}`}
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
                                                                            style={{
                                                                                width: 45,
                                                                                textAlign: "right",
                                                                            }}
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
                                </div>

                                <TableFooter
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    pageSize={pageSize}
                                    totalData={sortedStudents.length}
                                    onPageChange={setCurrentPage}
                                    onPageSizeChange={(size) => {
                                        setPageSize(size);
                                        setCurrentPage(1);
                                    }}
                                />
                            </>
                        )}
                    </div>
                </div>

            </div>
        </main>
    );

}