// Halaman anggota kelas

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

interface Student {
    id: string;
    nama: string;
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

    useEffect(() => {

        if (!kelasId) return;

        loadKelas();
        loadStudents();

    }, [kelasId]);

    async function loadStudents() {

        setLoading(true);

        try {

            const q = query(
                collection(db, "students"),
                where("kelasId", "==", kelasId)
            );

            const snapshot = await getDocs(q);

            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Student[];

            setStudents(data);

        } catch (error) {

            console.log(error);

        }

        setLoading(false);
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
        (item) => item.jenisKelamin === "Laki-laki"
    ).length;
    const jumlahPerempuan = students.filter(
        (item) => item.jenisKelamin === "Perempuan"
    ).length;

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

                                    <h5 className="font-weight-bold mb-4">
                                        Statistik Anggota
                                    </h5>

                                    <div className="d-flex justify-content-between align-items-center py-3 border-bottom">
                                        <div>
                                            <i className="fas fa-mars text-primary mr-2"></i>
                                            Laki-laki
                                        </div>

                                        <span className="badge badge-primary px-3 py-2">
                                            {jumlahLakiLaki}
                                        </span>
                                    </div>

                                    <div className="d-flex justify-content-between align-items-center py-3 border-bottom">
                                        <div>
                                            <i className="fas fa-venus text-danger mr-2"></i>
                                            Perempuan
                                        </div>

                                        <span className="badge badge-danger px-3 py-2">
                                            {jumlahPerempuan}
                                        </span>
                                    </div>

                                    <div className="d-flex justify-content-between align-items-center py-3">
                                        <div>
                                            <i className="fas fa-users text-success mr-2"></i>
                                            Total Siswa
                                        </div>

                                        <span className="badge badge-success px-3 py-2">
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
                                    <li><a className="dropdown-item" href="#">Tambah Anggota</a></li>
                                    <li><a className="dropdown-item" href="#">Presensi</a></li>
                                    <li><a className="dropdown-item" href="#">Penilaian</a></li>
                                    <li><a className="dropdown-item" href="#">Cetak Data</a></li>
                                    <li><hr className="dropdown-divider" /></li>
                                    <li><a className="dropdown-item" href="#">Refresh Data</a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ================= TABLE ANGGOTA KELAS ================= */}
                <div className="card">

                    <div className="card-header">

                        <h3 className="card-title">
                            Anggota Kelas
                        </h3>

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

                                        <th>Jenis Kelamin</th>

                                        <th>Kelas</th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {students.length === 0 && (

                                        <tr>

                                            <td
                                                colSpan={6}
                                                className="text-center"
                                            >
                                                Tidak ada anggota kelas
                                            </td>

                                        </tr>

                                    )}

                                    {students.map((student, index) => (

                                        <tr key={student.id}>

                                            <td>{index + 1}</td>

                                            <td>{student.nis}</td>

                                            <td>{student.nisn}</td>

                                            <td>{student.nama}</td>

                                            <td>{student.jenisKelamin}</td>

                                            <td>{student.kelas}</td>

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