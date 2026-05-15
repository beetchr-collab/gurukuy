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
                    <h1>Data Peserta Didik</h1>
                </div>

                {/* ================= TABLE CARD ================= */}

                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Daftar Siswa</h3>
                    </div>
                    <div className="card-body d-flex justify-content-between align-items-center">

                        {/* TOMBOL TAMBAH */}
                        <a
                            href="/admin/adminsekolah/siswa/tambahsiswa"
                            className="btn btn-primary"
                        >
                            <i className="fas fa-plus"></i> Tambah Siswa
                        </a>
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
                                                {s.tempatLahir}, {s.tanggalLahir}
                                            </td>
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