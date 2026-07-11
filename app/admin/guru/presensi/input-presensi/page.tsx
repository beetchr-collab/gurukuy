"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
    getActiveTahunAjaran,
    TahunAjaran,
} from "@/services/tahunajaran.service";
import {
    collection,
    getDocs,
    addDoc,
    serverTimestamp,
    query,
    where,
    doc,
    getDoc,
    orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
    getClassById,
    ClassData,
    getClassesByOwner,
} from "@/services/kelas.service";

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

export default function PresensiPage() {

    // State untuk menyimpan data tahun ajaran
    const [tahunAjaran, setTahunAjaran] =
        useState<TahunAjaran | null>(null);
    const { user } = useAuth();

    useEffect(() => {
        if (!user?.schoolId) return;

        loadTahunAjaran();
    }, [user]);

    const loadTahunAjaran = async () => {
        if (!user?.schoolId) return;

        try {
            const schoolId = user.schoolId;
            const data = await getActiveTahunAjaran(schoolId);

            setTahunAjaran(data);

            if (data) {
                await loadKelas(data.tahunAjaran);
            }
        } catch (error) {
            console.error(error);
        }
    };

    // Mengambil data kelas dan siswa saat halaman dimuat
    const [kelasList, setKelasList] = useState<ClassData[]>([]);
    const [selectedKelasId, setSelectedKelasId] = useState("");
    const loadKelas = async (tahun: string) => {
        if (!user?.uid) return;

        try {
            const data = await getClassesByOwner(user.uid);

            const filtered = data.filter(
                (item) => item.tahunAjaran === tahun
            );

            setKelasList(filtered);

            // Jangan memilih kelas secara otomatis
            setSelectedKelasId("");

            // Kosongkan daftar siswa
            setStudents([]);

        } catch (error) {
            console.error(error);
        }
    };

    // Mengambil data siswa dari Firestore
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState<Student[]>([]);

    async function loadStudents(classId: string) {

        if (!classId) {
            setStudents([]);
            return;
        }

        setLoading(true);

        try {
            const anggotaRef = query(
                collection(db, "classes", classId, "anggotakelas"),
                orderBy("nama", "asc")
            );

            const snapshot = await getDocs(anggotaRef);

            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Student[];

            setStudents(data);

        } catch (error) {

            console.error(error);

        } finally {

            setLoading(false);

        }
    }
    useEffect(() => {
        if (!selectedKelasId) return;

        loadStudents(selectedKelasId);
    }, [selectedKelasId]);

    // Filter siswa berdasarkan pencarian
    const [search, setSearch] = useState("");
    const filteredStudents = students.filter((student) => {
        const keyword = search.toLowerCase().trim();

        return (
            String(student.nama ?? "").toLowerCase().includes(keyword) ||
            String(student.nis ?? "").includes(keyword) ||
            String(student.nisn ?? "").includes(keyword)
        );
    });

    // Status otomatis di set ke "Hadir" untuk semua siswa saat halaman dimuat
    const [attendance, setAttendance] = useState<Record<string, string>>({});
    useEffect(() => {
        if (!students.length) return;

        const initial: Record<string, string> = {};

        students.forEach((student) => {
            initial[student.id] = "Hadir";
        });

        setAttendance(initial);
    }, [students]);

    // State untuk menyimpan tanggal presensi
    const [tanggal, setTanggal] = useState(
        new Date().toISOString().split("T")[0]
    );

    // Fungsi untuk menyimpan presensi ke Firestore
    const saveAttendance = async () => {

        if (!user) return;

        if (!selectedKelasId) {
            alert("Silakan pilih kelas.");
            return;
        }

        if (!tahunAjaran) {
            alert("Tahun ajaran belum tersedia.");
            return;
        }

        try {

            const selectedKelas = kelasList.find(
                (item) => item.id === selectedKelasId
            );

            const dataSiswa = students.map((student) => ({
                studentId: student.id,
                nis: student.nis,
                nisn: student.nisn,
                nama: student.nama,
                jk: student.jk,
                status: attendance[student.id] || "Hadir",
            }));

            await addDoc(collection(db, "presensi"), {

                schoolId: user.schoolId,

                kelasId: selectedKelasId,

                kelas: selectedKelas?.namaKelas ?? "",

                tingkatKelas: selectedKelas?.tingkatKelas ?? 0,

                tahunAjaran: tahunAjaran.tahunAjaran,

                tanggal,

                createdBy: user.uid,

                createdAt: serverTimestamp(),

                siswa: dataSiswa,

            });

            alert("Presensi berhasil disimpan");
            window.location.reload();

        } catch (error) {

            console.error(error);

            alert("Gagal menyimpan presensi");

        }

    };

    // Statistik presensi
    const totalSiswa = students.length;

    const totalHadir = Object.values(attendance).filter(
        (status) => status === "Hadir"
    ).length;

    const totalIzin = Object.values(attendance).filter(
        (status) => status === "Izin"
    ).length;

    const totalSakit = Object.values(attendance).filter(
        (status) => status === "Sakit"
    ).length;

    const totalAlpha = Object.values(attendance).filter(
        (status) => status === "Alpha"
    ).length;

    return (
        <div className="content-wrapper py-2">

            {/* Header */}
            <section className="content-header">
                <div className="container-fluid">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h3>Presensi Siswa</h3>
                        </div>

                    </div>
                </div>
            </section>

            <section className="content py-2">
                <div className="container-fluid">
                    {/* Statistik Presensi */}
                    <div className="row g-3 mb-4">

                        {/* Total Siswa */}
                        <div className="col-12 col-sm-6 col-lg col-xl">
                            <div className="statpresensi-card statpresensi-primary">

                                <div className="statpresensi-icon bg-primary">
                                    <i className="fas fa-users"></i>
                                </div>

                                <div className="statpresensi-content">
                                    <h3>{totalSiswa}</h3>
                                    <p>Total Siswa</p>
                                </div>

                            </div>
                        </div>

                        {/* Hadir */}
                        <div className="col-12 col-sm-6 col-lg col-xl">
                            <div className="statpresensi-card statpresensi-success">

                                <div className="statpresensi-icon bg-success">
                                    <i className="fas fa-check-circle"></i>
                                </div>

                                <div className="statpresensi-content">
                                    <h3>{totalHadir}</h3>
                                    <p>Hadir</p>
                                </div>

                            </div>
                        </div>

                        {/* Izin */}
                        <div className="col-12 col-sm-6 col-lg col-xl">
                            <div className="statpresensi-card statpresensi-warning">

                                <div className="statpresensi-icon bg-warning text-dark">
                                    <i className="fas fa-user-clock"></i>
                                </div>

                                <div className="statpresensi-content">
                                    <h3>{totalIzin}</h3>
                                    <p>Izin</p>
                                </div>

                            </div>
                        </div>

                        {/* Sakit */}
                        <div className="col-12 col-sm-6 col-lg col-xl">
                            <div className="statpresensi-card statpresensi-info">

                                <div className="statpresensi-icon bg-info">
                                    <i className="fas fa-notes-medical"></i>
                                </div>

                                <div className="statpresensi-content">
                                    <h3>{totalSakit}</h3>
                                    <p>Sakit</p>
                                </div>

                            </div>
                        </div>

                        {/* Alpha */}
                        <div className="col-12 col-sm-6 col-lg col-xl">
                            <div className="statpresensi-card statpresensi-danger">

                                <div className="statpresensi-icon bg-danger">
                                    <i className="fas fa-times-circle"></i>
                                </div>

                                <div className="statpresensi-content">
                                    <h3>{totalAlpha}</h3>
                                    <p>Alpha</p>
                                </div>

                            </div>
                        </div>

                    </div>

                    {/* Filter */}
                    <div className="card shadow-sm border-0 mb-4 filter-rekap-card">

                        <div className="card-header bg-white border-0 pb-0">
                            <small className="text-muted">
                                Pilih tahun ajaran, kelas, dan mata pelajaran untuk menampilkan data.
                            </small>
                        </div>

                        <div className="card-body">
                            <div className="row g-3">
                                {/* Tahun Ajaran */}
                                <div className="col-12 col-md-6 col-xl-4">
                                    <label className="form-label fw-semibold">
                                        <i className="fas fa-calendar-alt text-primary me-2"></i>
                                        Tahun Ajaran
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={tahunAjaran?.tahunAjaran ?? ""}
                                        readOnly
                                    />
                                </div>

                                {/* Kelas */}
                                <div className="col-12 col-md-6 col-xl-4">

                                    <label className="form-label fw-semibold">
                                        <i className="fas fa-users text-success me-2"></i>
                                        Kelas
                                    </label>

                                    <select
                                        className="form-select"
                                        value={selectedKelasId}
                                        onChange={(e) => setSelectedKelasId(e.target.value)}
                                    >
                                        <option value="">Pilih Kelas</option>

                                        {kelasList.map((kelas) => (
                                            <option
                                                key={kelas.id}
                                                value={kelas.id}
                                            >
                                                {kelas.namaKelas}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Tanggal */}
                                <div className="col-12 col-md-6 col-xl-4">
                                    <label className="form-label fw-semibold">
                                        <i className="fas fa-calendar-alt text-primary me-2"></i>
                                        Tanggal Presensi
                                    </label>

                                    <input
                                        type="date"
                                        className="form-control"
                                        value={tanggal}
                                        onChange={(e) => setTanggal(e.target.value)}
                                    />
                                </div>


                            </div>

                        </div>

                    </div>

                    {/* Table Daftar Presensi */}
                    <div className="card shadow-sm">

                        <div className="card-header">

                            <h3 className="card-title">
                                Daftar Presensi Siswa
                            </h3>

                        </div>

                        <div className="card-body p-0">

                            {loading && (
                                <p>Loading...</p>
                            )}
                            {!loading && (
                                <table className="table table-bordered table-striped table-hover">
                                    <thead>
                                        <tr>
                                            <th>No</th>
                                            <th>NIS</th>
                                            <th>NISN</th>
                                            <th>Nama</th>
                                            <th>Jenis Kelamin</th>
                                            <th>Hadir</th>
                                            <th>Izin</th>
                                            <th>Sakit</th>
                                            <th>Alpha</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {filteredStudents.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={6}
                                                    className="text-center"
                                                >
                                                    Tidak ada anggota kelas
                                                </td>
                                            </tr>
                                        )}
                                        {filteredStudents.map((student, index) => (
                                            <tr key={student.id}>
                                                <td>{index + 1}</td>
                                                <td>{student.nis}</td>
                                                <td>{student.nisn}</td>
                                                <td>{student.nama}</td>
                                                <td>{student.jk}</td>
                                                <td className="text-center align-middle">
    <div className="d-flex justify-content-center gap-2 flex-wrap">

        {/* Hadir */}
        <div>
            <input
                type="radio"
                className="btn-check"
                id={`hadir-${student.id}`}
                name={`presensi-${student.id}`}
                checked={attendance[student.id] === "Hadir"}
                onChange={() =>
                    setAttendance((prev) => ({
                        ...prev,
                        [student.id]: "Hadir",
                    }))
                }
            />
            <label
                className="btn btn-outline-success btn-presensi"
                htmlFor={`hadir-${student.id}`}
            >
                H
            </label>
        </div>

        {/* Izin */}
        <div>
            <input
                type="radio"
                className="btn-check"
                id={`izin-${student.id}`}
                name={`presensi-${student.id}`}
                checked={attendance[student.id] === "Izin"}
                onChange={() =>
                    setAttendance((prev) => ({
                        ...prev,
                        [student.id]: "Izin",
                    }))
                }
            />
            <label
                className="btn btn-outline-primary btn-presensi"
                htmlFor={`izin-${student.id}`}
            >
                I
            </label>
        </div>

        {/* Sakit */}
        <div>
            <input
                type="radio"
                className="btn-check"
                id={`sakit-${student.id}`}
                name={`presensi-${student.id}`}
                checked={attendance[student.id] === "Sakit"}
                onChange={() =>
                    setAttendance((prev) => ({
                        ...prev,
                        [student.id]: "Sakit",
                    }))
                }
            />
            <label
                className="btn btn-outline-warning btn-presensi"
                htmlFor={`sakit-${student.id}`}
            >
                S
            </label>
        </div>

        {/* Alpha */}
        <div>
            <input
                type="radio"
                className="btn-check"
                id={`alpha-${student.id}`}
                name={`presensi-${student.id}`}
                checked={attendance[student.id] === "Alpha"}
                onChange={() =>
                    setAttendance((prev) => ({
                        ...prev,
                        [student.id]: "Alpha",
                    }))
                }
            />
            <label
                className="btn btn-outline-danger btn-presensi"
                htmlFor={`alpha-${student.id}`}
            >
                A
            </label>
        </div>

    </div>
</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                            )}

                            <div className="card-footer">
                                <div className="d-flex justify-content-end">
                                    <button
                                        className="btn btn-primary"
                                        onClick={saveAttendance}
                                    >
                                        <i className="fas fa-save mr-2"></i>
                                        Simpan Presensi
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>

                </div>

            </section>

        </div>
    );
}