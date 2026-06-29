"use client";

import Link from "next/link";
import { useParams, } from "next/navigation";
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
} from "firebase/firestore";
import { db } from "@/lib/firebase";


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
    const params = useParams();
    const kelasId = params.kelasId as string;

    // State untuk menyimpan data tahun ajaran
    const [tahunAjaran, setTahunAjaran] =
        useState<TahunAjaran | null>(null);
    const { user } = useAuth();

    useEffect(() => {
        if (!user?.schoolId) return;

        loadTahunAjaran();
    }, [user]);

    const loadTahunAjaran = async () => {
        try {
            const data = await getActiveTahunAjaran(user?.schoolId!);

            setTahunAjaran(data);
        } catch (error) {
            console.error(error);
        }
    };

    // Mengambil data kelas dan siswa saat halaman dimuat
    useEffect(() => {

        if (!kelasId) return;

        loadStudents();

    }, [kelasId]);

    // Mengambil data siswa dari Firestore
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState<Student[]>([]);

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

        try {

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

                kelasId,

                kelas: students[0]?.kelas ?? "",

                tanggal,

                tahunAjaran: tahunAjaran?.tahunAjaran ?? "",

                createdBy: user.uid,

                createdAt: serverTimestamp(),

                siswa: dataSiswa,

            });

            alert("Presensi berhasil disimpan");

        } catch (error) {

            console.error(error);

            alert("Gagal menyimpan presensi");

        }

    };


    return (
        <div className="content-wrapper py-2">

            {/* Header */}
            <section className="content-header">
                <div className="container-fluid">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h3>Presensi Siswa</h3>
                        </div>

                        <Link
                            href={`/admin/guru/kelas/${kelasId}`}
                            className="btn btn-secondary"
                        >
                            <i className="fas fa-arrow-left mr-2"></i>
                            Kembali
                        </Link>
                    </div>
                </div>
            </section>

            <section className="content py-2">
                <div className="container-fluid">
                    {/* Statistik */}
                    <div className="row">
                        <div className="col-md-3">
                            <div className="small-box bg-info">
                                <div className="inner">
                                    <h3>0</h3>
                                    <p>Total Siswa</p>
                                </div>
                                <div className="icon">
                                    <i className="fas fa-users"></i>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-3">
                            <div className="small-box bg-success">
                                <div className="inner">
                                    <h3>0</h3>
                                    <p>Hadir</p>
                                </div>

                                <div className="icon">
                                    <i className="fas fa-check"></i>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-3">
                            <div className="small-box bg-warning">
                                <div className="inner">
                                    <h3>0</h3>
                                    <p>Izin</p>
                                </div>

                                <div className="icon">
                                    <i className="fas fa-user-clock"></i>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-3">
                            <div className="small-box bg-danger">
                                <div className="inner">
                                    <h3>0</h3>
                                    <p>Alpha</p>
                                </div>

                                <div className="icon">
                                    <i className="fas fa-times"></i>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Informasi */}
                    <div className="card shadow-sm mb-3">

                        <div className="card-body">

                            <div className="row">

                                <div className="col-md-3">
                                    <label>Tanggal</label>

                                    <input
                                        type="date"
                                        className="form-control"
                                        value={tanggal}
                                        onChange={(e) => setTanggal(e.target.value)}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label>Tahun Ajaran</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={tahunAjaran?.tahunAjaran ?? ""}
                                        readOnly
                                    />
                                </div>

                                {/* Tombol Simpan Presensi dan Rekap Presensi */}
                                <div className="col-md-6 d-flex align-items-end gap-2">
                                    <button
                                        className="btn btn-primary"
                                        onClick={saveAttendance}
                                    >
                                        <i className="fas fa-save mr-2"></i>
                                        Simpan Presensi
                                    </button>

                                    <Link
                                        href={`/admin/guru/kelas/${kelasId}/presensi/rekap`}
                                        className="btn btn-success"
                                    >
                                        <i className="fas fa-chart-line mr-2"></i>
                                        Rekap Presensi
                                    </Link>
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
                                                    <div className="icheck-success d-inline">
                                                        <input
                                                            type="radio"
                                                            name={`presensi-${student.id}`}
                                                            checked={attendance[student.id] === "Hadir"}
                                                            onChange={() =>
                                                                setAttendance((prev) => ({
                                                                    ...prev,
                                                                    [student.id]: "Hadir",
                                                                }))
                                                            }
                                                        />
                                                        <label htmlFor={`hadir-${student.id}`}></label>
                                                    </div>
                                                </td>

                                                <td className="text-center align-middle">
                                                    <div className="icheck-primary d-inline">
                                                        <input
                                                            type="radio"
                                                            name={`presensi-${student.id}`}
                                                            checked={attendance[student.id] === "Izin"}
                                                            onChange={() =>
                                                                setAttendance((prev) => ({
                                                                    ...prev,
                                                                    [student.id]: "Izin",
                                                                }))
                                                            }
                                                        />
                                                        <label htmlFor={`izin-${student.id}`}></label>
                                                    </div>
                                                </td>

                                                <td className="text-center align-middle">
                                                    <div className="icheck-warning d-inline">
                                                        <input
                                                            type="radio"
                                                            id={`sakit-${student.id}`}
                                                            name={`presensi-${student.id}`}
                                                            value="Sakit"
                                                            checked={attendance[student.id] === "Sakit"}
                                                            onChange={() =>
                                                                setAttendance((prev) => ({
                                                                    ...prev,
                                                                    [student.id]: "Sakit",
                                                                }))
                                                            }
                                                        />
                                                        <label htmlFor={`sakit-${student.id}`}></label>
                                                    </div>
                                                </td>

                                                <td className="text-center align-middle">
                                                    <div className="icheck-danger d-inline">
                                                        <input
                                                            type="radio"
                                                            id={`alpha-${student.id}`}
                                                            name={`presensi-${student.id}`}
                                                            value="Alpha"
                                                            checked={attendance[student.id] === "Alpha"}
                                                            onChange={() =>
                                                                setAttendance((prev) => ({
                                                                    ...prev,
                                                                    [student.id]: "Alpha",
                                                                }))
                                                            }
                                                        />
                                                        <label htmlFor={`alpha-${student.id}`}></label>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                            )}
                        </div>

                    </div>

                </div>

            </section>

        </div>
    );
}