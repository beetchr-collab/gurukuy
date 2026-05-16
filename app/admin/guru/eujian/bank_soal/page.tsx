"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { getAuth } from "firebase/auth";
import {
    collection,
    addDoc,
    serverTimestamp,
    query,
    where,
    onSnapshot,
    updateDoc,
    doc,
    deleteDoc,
} from "firebase/firestore";
import DeleteModal from "@/components/modals/DeleteModal";
import Modal from "bootstrap/js/dist/modal";

export default function BankSoalPage() {
    const auth = getAuth();
    const router = useRouter();

    const [formData, setFormData] = useState({
        namaBankSoal: "",
        mataPelajaran: "",
        kelas: "",
        jenisPaket: "",
        ownerId: "",
        status: "Tidak Aktif",
        examStatus: "draft",
        allowAccess: false,
        token: "",
        examDate: "",
        startTime: "",
        endTime: "",
        duration: 0,
    });

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    // LOADING
    const [loading, setLoading] = useState(false);

    // SIMPAN DATA
    const handleSubmit = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();

        // LOADING START
        setLoading(true);

        try {
            const user = auth.currentUser;

            if (!user) {
                alert("User belum login");
                return;
            }

            const data = {
                ...formData,
                ownerId: user.uid,
                createdAt: serverTimestamp(),
            };

            if (editId) {

                // UPDATE
                await updateDoc(
                    doc(db, "bank_soal", editId),
                    {
                        ...formData,
                    }
                );

            } else {

                // TAMBAH
                await addDoc(collection(db, "bank_soal"), data);
            }

            // TUTUP MODAL
            const modalElement = document.getElementById(
                "modalTambahBankSoal"
            );

            if (modalElement) {
                const modal =
                    Modal.getInstance(modalElement) ||
                    new Modal(modalElement);
                modal.hide();
                if (modalElement) {
                    const modal =
                        Modal.getInstance(modalElement) ||
                        new Modal(modalElement);

                    modal.hide();

                    // HAPUS BACKDROP
                    document
                        .querySelectorAll(".modal-backdrop")
                        .forEach((el) => el.remove());

                    // HAPUS CLASS BODY
                    document.body.classList.remove("modal-open");

                    // RESET STYLE BODY
                    document.body.style.removeProperty("padding-right");
                }
            }

            // RESET FORM
            setFormData({
                namaBankSoal: "",
                mataPelajaran: "",
                kelas: "",
                jenisPaket: "",
                ownerId: "",
                status: "Tidak Aktif",
                examStatus: "draft",
                allowAccess: false,
                token: "",
                examDate: "",
                startTime: "",
                endTime: "",
                duration: 0,
            });

            // RESET EDIT
            setEditId(null);

            console.log("BERHASIL:", data);

        } catch (error) {
            console.error("Gagal simpan:", error);
            alert("Terjadi kesalahan saat menyimpan");

        } finally {

            // LOADING END
            setLoading(false);
        }
    };

    // DATA MAPEL
    const mataPelajaran = [
        // UMUM
        "Guru Kelas",

        // WAJIB
        "Pendidikan Agama dan Budi Pekerti",
        "Pendidikan Pancasila(PP)",
        "Bahasa Indonesia",
        "Matematika",
        "Ilmu Pengetahuan Alam (IPA)",
        "Ilmu Pengetahuan Sosial (IPS)",
        "Bahasa Inggris",

        // SENI & OLAHRAGA
        "Seni Budaya",
        "Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)",

        // PRAKARYA
        "Prakarya",
        "Informatika",

        // SMA TAMBAHAN
        "Fisika",
        "Kimia",
        "Biologi",
        "Ekonomi",
        "Geografi",
        "Sosiologi",
        "Sejarah",
        "Sejarah Indonesia",

        // BAHASA
        "Bahasa Arab",
        "Bahasa Jepang",
        "Bahasa Jerman",
        "Bahasa Mandarin",
        "Bahasa Daerah",

        // KEJURUAN / OPSIONAL
        "Informatika / TIK",
        "Kewirausahaan"
    ];
    const mapelOptions = mataPelajaran.map((item) => ({
        label: item,
        value: item,
    }));

    // DATA BANK SOAL
    const [bankSoalList, setBankSoalList] = useState<any[]>([]);
    useEffect(() => {
        const user = auth.currentUser;

        if (!user) return;

        const q = query(
            collection(db, "bank_soal"),
            where("ownerId", "==", user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data: any[] = [];

            snapshot.forEach((doc) => {
                data.push({
                    id: doc.id,
                    ...doc.data(),
                });
            });

            setBankSoalList(data);
        });

        return () => unsubscribe();

    }, []);

    // PENCARIAN & PAGINASI
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const itemsPerPage = 5;
    const filteredData = bankSoalList.filter((item) =>
        item.namaBankSoal
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(
        filteredData.length / itemsPerPage
    );

    const startIndex = (currentPage - 1) * itemsPerPage;

    const currentData = filteredData.slice(
        startIndex,
        startIndex + itemsPerPage
    );

    // TOGGLE STATUS
    const toggleStatus = async (
        id: string,
        currentStatus: string
    ) => {
        try {
            const newStatus =
                currentStatus === "Aktif"
                    ? "Tidak Aktif"
                    : "Aktif";

            await updateDoc(
                doc(db, "bank_soal", id),
                {
                    status: newStatus,
                }
            );

        } catch (error) {
            console.error("Gagal update status:", error);
        }
    };

    // EDIT
    const [editId, setEditId] = useState<string | null>(null);
    const handleEdit = (item: any) => {
        setEditId(item.id);

        setFormData({
            namaBankSoal: item.namaBankSoal || "",
            mataPelajaran: item.mataPelajaran || "",
            kelas: item.kelas || "",
            jenisPaket: item.jenisPaket || "",
            ownerId: item.ownerId || "",
            status: item.status || "Tidak Aktif",
            examStatus: "draft",
            allowAccess: false,
            token: "",
            examDate: "",
            startTime: "",
            endTime: "",
            duration: 0,
        });

        const modalElement = document.getElementById(
            "modalTambahBankSoal"
        );

        if (modalElement) {
            const modal =
                Modal.getInstance(modalElement) ||
                new Modal(modalElement);

            modal.show();
        }
    };

    // HAPUS
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // BUKA MODAL HAPUS
    const handleDelete = (id: string) => {
        setDeleteId(id);

        const modalElement = document.getElementById(
            "globalDeleteModal"
        );

        if (modalElement) {
            const modal =
                Modal.getInstance(modalElement) ||
                new Modal(modalElement);

            modal.show();
        }
    };

    // KONFIRMASI HAPUS
    const confirmDelete = async () => {
        if (!deleteId) return;

        setDeleteLoading(true);

        try {
            await deleteDoc(doc(db, "bank_soal", deleteId));

            // TUTUP MODAL
            const modalElement = document.getElementById(
                "globalDeleteModal"
            );

            if (modalElement) {
                Modal.getInstance(modalElement)?.hide();
            }

            // RESET
            setDeleteId(null);

        } catch (error) {
            console.error("Gagal hapus:", error);
            alert("Gagal menghapus data");

        } finally {
            setDeleteLoading(false);
        }
    };

    // JUMLAH SOAL PER BANK SOAL
    const [jumlahSoalMap, setJumlahSoalMap] = useState<{
        [key: string]: number;
    }>({});
    useEffect(() => {
        if (bankSoalList.length === 0) return;

        const unsubscribes: any[] = [];

        bankSoalList.forEach((bankSoal) => {

            const q = query(
                collection(
                    db,
                    "bank_soal",
                    bankSoal.id,
                    "soal"
                )
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {

                setJumlahSoalMap((prev) => ({
                    ...prev,
                    [bankSoal.id]: snapshot.size,
                }));
            });

            unsubscribes.push(unsubscribe);
        });

        return () => {
            unsubscribes.forEach((unsub) => unsub());
        };

    }, [bankSoalList]);

    return (
        <>
            <div className="app-main">
                <div className="app-content-header">
                    <h4 className="app-content-headerText">Bank Soal</h4>
                </div>

                {/* CALLOUT */}
                <div className="container-fluid">
                    <div
                        className="callout border-0 shadow-sm rounded-4 p-4 mb-3"
                        style={{
                            background:
                                "linear-gradient(135deg, #0d6efd 0%, #4f46e5 100%)",
                            color: "#fff",
                        }}
                    >
                        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-4">

                            {/* INFO */}
                            <div className="flex-grow-1">
                                <div className="d-flex align-items-center mb-3">
                                    <div
                                        className="me-3 d-flex align-items-center justify-content-center"
                                        style={{
                                            width: "60px",
                                            height: "60px",
                                            borderRadius: "18px",
                                            background: "rgba(255,255,255,0.15)",
                                            fontSize: "26px",
                                        }}
                                    >
                                        <i className="fas fa-book-open"></i>
                                    </div>

                                    <div>
                                        <h4 className="fw-bold mb-1">
                                            Bank Soal E-Ujian
                                        </h4>

                                        <p
                                            className="mb-0"
                                            style={{ opacity: 0.9 }}
                                        >
                                            Kelola seluruh soal ujian CBT mulai dari
                                            pilihan ganda, essay, hingga paket soal
                                            ujian sekolah.
                                        </p>
                                    </div>
                                </div>

                                {/* BADGE */}
                                <div className="d-flex flex-wrap gap-2">

                                    <span className="badge bg-light text-primary px-3 py-2">
                                        <a href="/admin/guru/eujian" className="text-decoration-none text-primary fw-semibold">
                                            <i className="fas fa-layer-group me-1"></i>
                                            Status Ujian
                                        </a>
                                    </span>

                                    <span className="badge bg-light text-primary px-3 py-2">
                                        <i className="fas fa-file-import me-1"></i>
                                        Import Soal
                                    </span>

                                    <span className="badge bg-light text-primary px-3 py-2">
                                        <i className="fas fa-random me-1"></i>
                                        Acak Soal
                                    </span>

                                    <span className="badge bg-light text-primary px-3 py-2">
                                        <i className="fas fa-chart-pie me-1"></i>
                                        Analisis
                                    </span>

                                </div>
                            </div>

                            {/* BUTTON */}
                            <div>
                                <button
                                    className="btn btn-light text-primary fw-semibold px-4 py-3 rounded-3 shadow-sm"
                                    data-bs-toggle="modal"
                                    data-bs-target="#modalTambahBankSoal"
                                >
                                    <i className="fas fa-plus-circle me-2"></i>
                                    Tambah Bank Soal
                                </button>
                            </div>

                        </div>
                    </div>
                </div>

                {/* CARD */}
                <div className="container-fluid">
                    <div className="card">
                        <div className="card-header d-flex justify-content-between">
                            <h3 className="card-title">
                                Daftar Bank Soal
                            </h3>
                        </div>

                        <div className="card-body">

                            {/* TOPBAR */}
                            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">

                                {/* SEARCH */}
                                <div style={{ maxWidth: "350px", width: "100%" }}>
                                    <div className="input-group">

                                        <span className="input-group-text bg-white border-end-0">
                                            <i className="fas fa-search text-muted"></i>
                                        </span>

                                        <input
                                            type="text"
                                            className="form-control border-start-0"
                                            placeholder="Cari bank soal..."
                                            value={searchTerm}
                                            onChange={(e) => {
                                                setSearchTerm(e.target.value);
                                                setCurrentPage(1);
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* TOTAL */}
                                <div>
                                    <span className="badge bg-primary px-3 py-2">
                                        Total: {filteredData.length} Bank Soal
                                    </span>
                                </div>

                            </div>

                            {/* TABLE */}
                            <div className="table-responsive">
                                <table className="table table-hover align-middle">

                                    <thead className="table-light">
                                        <tr>
                                            <th>No</th>
                                            <th>Nama Bank Soal</th>
                                            <th>Mapel</th>
                                            <th>Kelas</th>
                                            <th>Jenis</th>
                                            <th>Status</th>
                                            <th>Soal</th>
                                            <th className="text-center">Aksi</th>
                                        </tr>
                                    </thead>

                                    <tbody>

                                        {currentData.length > 0 ? (
                                            currentData.map((item, index) => (
                                                <tr key={item.id}>

                                                    <td>
                                                        {startIndex + index + 1}
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

                                                    <td>
                                                        <span className="badge bg-info">
                                                            {item.jenisPaket}
                                                        </span>
                                                    </td>

                                                    {/* STATUS */}
                                                    <td>
                                                        <button
                                                            onClick={() =>
                                                                toggleStatus(item.id, item.status)
                                                            }
                                                            className={`btn btn-sm rounded-pill px-2 py-1 d-inline-flex align-items-center gap-1 ${item.status === "Aktif"
                                                                ? "btn-success"
                                                                : "btn-danger"
                                                                }`}
                                                            style={{
                                                                fontSize: "12px",
                                                                minWidth: "120px",
                                                                justifyContent: "center",
                                                            }}
                                                        >
                                                            {item.status === "Aktif" ? (
                                                                <>
                                                                    Aktif
                                                                    <i
                                                                        className="fas fa-toggle-on ms-1"
                                                                        style={{ fontSize: "15px" }}
                                                                    ></i>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <i
                                                                        className="fas fa-toggle-off me-1"
                                                                        style={{ fontSize: "15px" }}
                                                                    ></i>
                                                                    Tidak Aktif
                                                                </>
                                                            )}
                                                        </button>
                                                    </td>
                                                    {/* JUMLAH SOAL */}
                                                    <td>
                                                        <div className="d-flex align-items-center gap-2">

                                                            {/* JUMLAH SOAL */}
                                                            <span className="badge bg-dark px-3 py-2">
                                                                {jumlahSoalMap[item.id] || 0} Soal
                                                            </span>

                                                            {/* TAMBAH SOAL */}
                                                            <button
                                                                className="btn btn-xs btn-primary d-flex align-items-center gap-1 px-2 py-1"
                                                                title="Tambah Soal"
                                                                style={{
                                                                    fontSize: "12px",
                                                                    borderRadius: "6px",
                                                                    lineHeight: "1",
                                                                    height: "30px",
                                                                    whiteSpace: "nowrap",
                                                                }}
                                                                onClick={() =>
                                                                    router.push(
                                                                        `/admin/guru/eujian/bank_soal/${item.id}/tambah_soal`
                                                                    )
                                                                }
                                                            >
                                                                <i
                                                                    className="fas fa-plus"
                                                                    style={{ fontSize: "10px" }}
                                                                ></i>

                                                                Tambah
                                                            </button>
                                                        </div>
                                                    </td>

                                                    {/* AKSI */}
                                                    <td>

                                                        <div className="d-flex justify-content-center gap-2">

                                                            {/* PREVIEW */}
                                                            <button
                                                                className="btn btn-sm btn-light border"
                                                                title="Preview"
                                                            >
                                                                <i className="fas fa-eye text-primary"></i>
                                                            </button>

                                                            {/* EDIT */}
                                                            <button
                                                                className="btn btn-sm btn-light border"
                                                                title="Edit"
                                                                onClick={() => handleEdit(item)}
                                                            >
                                                                <i className="fas fa-pen text-warning"></i>
                                                            </button>

                                                            {/* HAPUS */}
                                                            <button
                                                                className="btn btn-sm btn-light border"
                                                                title="Hapus"
                                                                onClick={() => handleDelete(item.id)}
                                                            >
                                                                <i className="fas fa-trash text-danger"></i>
                                                            </button>

                                                        </div>

                                                    </td>

                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan={8}
                                                    className="text-center py-5 text-muted"
                                                >
                                                    <i className="fas fa-folder-open fa-2x mb-3 d-block"></i>
                                                    Belum ada bank soal
                                                </td>
                                            </tr>
                                        )}

                                    </tbody>

                                </table>
                            </div>

                            {/* PAGINATION */}
                            {totalPages > 1 && (
                                <div className="d-flex justify-content-end mt-4">

                                    <nav>
                                        <ul className="pagination mb-0">

                                            <li
                                                className={`page-item ${currentPage === 1 ? "disabled" : ""
                                                    }`}
                                            >
                                                <button
                                                    className="page-link"
                                                    onClick={() =>
                                                        setCurrentPage(currentPage - 1)
                                                    }
                                                >
                                                    Previous
                                                </button>
                                            </li>

                                            {[...Array(totalPages)].map((_, index) => (
                                                <li
                                                    key={index}
                                                    className={`page-item ${currentPage === index + 1
                                                        ? "active"
                                                        : ""
                                                        }`}
                                                >
                                                    <button
                                                        className="page-link"
                                                        onClick={() =>
                                                            setCurrentPage(index + 1)
                                                        }
                                                    >
                                                        {index + 1}
                                                    </button>
                                                </li>
                                            ))}

                                            <li
                                                className={`page-item ${currentPage === totalPages
                                                    ? "disabled"
                                                    : ""
                                                    }`}
                                            >
                                                <button
                                                    className="page-link"
                                                    onClick={() =>
                                                        setCurrentPage(currentPage + 1)
                                                    }
                                                >
                                                    Next
                                                </button>
                                            </li>

                                        </ul>
                                    </nav>

                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>

            {/* INFO PENTING */}
            <div className="container-fluid">
                <div className="callout callout-warning shadow-sm rounded-3">
                    <h5 className="fw-bold">
                        <i className="fas fa-exclamation-circle mr-2"></i>
                        Informasi Penting
                    </h5>

                    <p className="mb-2">
                        Bank soal yang belum memiliki isi soal tidak dapat digunakan saat ujian berlangsung.
                    </p>

                    <div className="d-flex flex-wrap gap-2">
                        <span className="badge bg-warning">Cek Status</span>
                        <span className="badge bg-info">Validasi Soal</span>
                        <span className="badge bg-success">Siap Digunakan</span>
                    </div>
                </div>
            </div>


            {/* MODAL */}
            <div
                className="modal"
                id="modalTambahBankSoal"
                tabIndex={-1}
                aria-hidden="true"
            >
                <div className="modal-dialog modal-dialog-centered modal-lg">
                    <div className="modal-content border-0 rounded-4 shadow">

                        {/* HEADER */}
                        <div className="modal-header border-0 pb-0">
                            <div>
                                <h4 className="fw-bold mb-1">
                                    <i className="fas fa-book-open text-primary me-2"></i>
                                    {editId ? "Edit Bank Soal" : "Tambah Bank Soal"}
                                </h4>

                                <p className="text-muted mb-0">
                                    Tambahkan paket bank soal baru
                                </p>
                            </div>

                            <button
                                type="button"
                                className="btn-close"
                                data-bs-dismiss="modal"
                            ></button>
                        </div>

                        {/* FORM */}
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body pt-4">

                                {/* NAMA */}
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">
                                        Nama Bank Soal
                                    </label>

                                    <input
                                        type="text"
                                        className="form-control rounded-3"
                                        name="namaBankSoal"
                                        placeholder="Contoh: Bank Soal Matematika"
                                        value={formData.namaBankSoal}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                {/* MAPEL */}
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">
                                        Mata Pelajaran
                                    </label>
                                    <select
                                        className="form-select rounded-3"
                                        name="mataPelajaran"
                                        value={formData.mataPelajaran}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">
                                            -- Pilih Mata Pelajaran --
                                        </option>

                                        {mapelOptions.map((mapel, index) => (
                                            <option
                                                key={index}
                                                value={mapel.value}
                                            >
                                                {mapel.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* KELAS */}
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">
                                        Kelas
                                    </label>

                                    <input
                                        type="text"
                                        className="form-control rounded-3"
                                        name="kelas"
                                        value={formData.kelas}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                {/* JENIS */}
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">
                                        Jenis Paket Soal
                                    </label>

                                    <select
                                        className="form-select rounded-3"
                                        name="jenisPaket"
                                        value={formData.jenisPaket}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">
                                            -- Pilih Jenis Paket --
                                        </option>

                                        <option value="Formatif">
                                            Formatif
                                        </option>

                                        <option value="STS Ganjil">
                                            STS Ganjil
                                        </option>

                                        <option value="STS Genap">
                                            STS Genap
                                        </option>

                                        <option value="SAS Ganjil">
                                            SAS Ganjil
                                        </option>

                                        <option value="SAS Genap">
                                            SAS Genap
                                        </option>

                                        <option value="Try Out">
                                            Try Out
                                        </option>

                                        <option value="CBT">
                                            CBT
                                        </option>

                                        <option value="TKA">
                                            TKA
                                        </option>
                                    </select>
                                </div>

                                {/* OWNER */}
                                <input
                                    type="hidden"
                                    name="ownerId"
                                    value={formData.ownerId}
                                />

                            </div>

                            {/* FOOTER */}
                            <div className="modal-footer border-0 pt-0">

                                <button
                                    type="button"
                                    className="btn btn-light border rounded-3 px-4"
                                    data-bs-dismiss="modal"
                                >
                                    Batal
                                </button>

                                <button
                                    type="submit"
                                    className="btn btn-primary rounded-3 px-4"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-save me-2"></i>
                                            Simpan
                                        </>
                                    )}
                                </button>

                            </div>
                        </form>

                    </div>
                </div>
            </div>

            <DeleteModal
                title="Hapus Bank Soal"
                message="Bank soal yang dihapus tidak dapat dikembalikan."
                loading={deleteLoading}
                onConfirm={confirmDelete}
            />
        </>
    );
}