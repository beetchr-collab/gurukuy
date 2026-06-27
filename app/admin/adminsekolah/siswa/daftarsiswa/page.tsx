"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
    collection,
    onSnapshot,
    query,
    where,
    doc,
    deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { usePagination } from "@/hooks/usePagination";
import Pagination from "@/components/Pagination";

export default function AdminSiswaPage() {
    const { user } = useAuth();

    const [dataSiswa, setDataSiswa] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // SEARCH
    const [search, setSearch] = useState("");

    // PAGINATION
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 5;

    // ================= FETCH DATA =================
    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, "students"),
            where("schoolId", "==", user.uid)
        );

        const unsub = onSnapshot(q, (snap) => {
            const result: any[] = [];
            snap.forEach((doc) => {
                result.push({ id: doc.id, ...doc.data() });
            });

            setDataSiswa(result);
            setLoading(false);
        });

        return () => unsub();
    }, [user]);

    // ================= DELETE =================
    const handleDelete = async (id: string) => {
        const confirmDelete = confirm("Yakin ingin menghapus siswa?");
        if (!confirmDelete) return;

        await deleteDoc(doc(db, "students", id));
    };

    // ================= FILTER SEARCH =================
    const filteredData = dataSiswa.filter((s) =>
        `${s.nama} ${s.nis} ${s.nisn}`
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    // ================= PAGINATION =================
    const totalPages = Math.ceil(filteredData.length / perPage);

    const startIndex = (currentPage - 1) * perPage;
    const currentData = filteredData.slice(
        startIndex,
        startIndex + perPage
    );

    return (
        <main className="app-main py-3">
            <div className="container-fluid">

                {/* HEADER */}
                <div className="content-header">
                    <h3>Data Peserta Didik</h3>
                </div>

                {/* ================= INFO CALL OUT ================= */}
                <div className="callout callout-info mb-3">
                    <h5>
                        <i className="bi bi-info-circle-fill me-2"></i>
                        Informasi Peserta Didik
                    </h5>

                    <p className="mb-0">
                        Halaman ini digunakan untuk mengelola data peserta didik meliputi
                        identitas, kelas, alamat, serta informasi akademik. Pastikan data
                        yang diinput lengkap dan sesuai dokumen resmi agar informasi tetap
                        akurat dan mudah diperbarui.
                    </p>
                </div>

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
                                ⚡ Menu Aksi Peserta Didik
                            </h5>
                            <small className="text-white">
                                Tambah, impor, ekspor, dan kelola data siswa.
                            </small>
                        </div>

                        <div className="d-flex gap-2">
                            <a
                                href="/admin/adminsekolah/siswa/tambahsiswa"
                                className="btn btn-light"
                            >
                                <i className="bi bi-person-plus-fill me-2"></i>
                                Tambah Siswa
                            </a>

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
                                    <li><a className="dropdown-item" href="#">Lanjut Semester</a></li>
                                    <li><a className="dropdown-item" href="/admin/adminsekolah/siswa/kenaikan-tingkat">Kenaikan Tingkat</a></li>
                                    <li><a className="dropdown-item" href="#">Export Excel</a></li>
                                    <li><a className="dropdown-item" href="#">Cetak Data</a></li>
                                    <li><hr className="dropdown-divider" /></li>
                                    <li><a className="dropdown-item" href="#">Refresh Data</a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ================= TABLE CARD ================= */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Daftar Siswa</h3>
                    </div>
                    <div className="card-body d-flex justify-content-between align-items-center">

                        {/* TOMBOL TAMBAH */}
                        <a
                            href="/admin/adminsekolah/siswa/assignkelas"
                            className="btn btn-success"
                        >
                            <i className="fas fa-plus"></i> Assign Clases
                        </a>

                        {/* SEARCH */}
                        <input
                            type="text"
                            className="form-control w-25"
                            placeholder="Cari nama / NIS / NISN..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>

                    <div className="card-body p-3">
                        <table className="table table-striped">
                            <thead>
                                <tr>
                                    <th>No</th>
                                    <th>Nama</th>
                                    <th>NIS</th>
                                    <th>NISN</th>
                                    <th>JK</th>
                                    <th>TTL</th>
                                    <th>Kelas</th>
                                    <th>Tingkat</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="table-group-divider">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="text-center">
                                            Loading...
                                        </td>
                                    </tr>
                                ) : currentData.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center">
                                            Data tidak ditemukan
                                        </td>
                                    </tr>
                                ) : (
                                    currentData.map((s, i) => (
                                        <tr key={s.id}>
                                            <td>{startIndex + i + 1}</td>
                                            <td>{s.nama}</td>
                                            <td>{s.nis}</td>
                                            <td>{s.nisn}</td>
                                            <td>{s.jk}</td>
                                            <td>
                                                {s.tempatLahir},{" "}
                                                {new Date(s.tanggalLahir).toLocaleDateString("id-ID", {
                                                    day: "2-digit",
                                                    month: "long",
                                                    year: "numeric",
                                                })}
                                            </td>
                                            <td>{s.kelas}</td>
                                            <td>{s.tingkatKelas}</td>
                                            <td>
                                                <div className="d-flex gap-1">

                                                    {/* VIEW */}
                                                    <button className="btn btn-info btn-sm">
                                                        <i className="fas fa-eye"></i>
                                                    </button>

                                                    {/* EDIT */}
                                                    <button className="btn btn-warning btn-sm">
                                                        <i className="fas fa-edit"></i>
                                                    </button>

                                                    {/* DELETE */}
                                                    <button
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => handleDelete(s.id)}
                                                    >
                                                        <i className="fas fa-trash"></i>
                                                    </button>

                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        {/* ================= PAGINATION ================= */}
                        <div className="card-footer d-flex justify-content-between align-items-center">
                            <span>
                                Total: {filteredData.length} siswa
                            </span>

                            <ul className="pagination pagination-sm m-0">
                                <li className={`page-item ${currentPage === 1 && "disabled"}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => setCurrentPage(currentPage - 1)}
                                    >
                                        «
                                    </button>
                                </li>

                                {Array.from({ length: totalPages }, (_, i) => (
                                    <li
                                        key={i}
                                        className={`page-item ${currentPage === i + 1 ? "active" : ""
                                            }`}
                                    >
                                        <button
                                            className="page-link"
                                            onClick={() => setCurrentPage(i + 1)}
                                        >
                                            {i + 1}
                                        </button>
                                    </li>
                                ))}

                                <li
                                    className={`page-item ${currentPage === totalPages && "disabled"
                                        }`}
                                >
                                    <button
                                        className="page-link"
                                        onClick={() => setCurrentPage(currentPage + 1)}
                                    >
                                        »
                                    </button>
                                </li>
                            </ul>
                        </div>

                    </div>
                </div>

            </div>
        </main>
    );
}