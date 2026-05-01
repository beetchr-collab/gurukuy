"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  runTransaction,
  query,
  where,
  getDocs,
} from "firebase/firestore";

export default function ProfilePage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);

  const [form, setForm] = useState({
    nama: "",
    nip: "",
    tahunAjaran: "",
  });

  const [editId, setEditId] = useState<string | null>(null);

  const colRef = collection(db, "kepala_sekolah");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);

  // 🔥 realtime per sekolah
  useEffect(() => {
    if (!user?.schoolId) return;

    const q = query(
      colRef,
      where("schoolId", "==", user.schoolId)
    );

    const unsub = onSnapshot(q, (snap) => {
      const result = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setData(result);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  // 🔥 validasi tahun ajaran
  const isValidTahunAjaran = (val: string) => {
    return /^\d{4}\/\d{4} (Ganjil|Genap)$/.test(val);
  };

  // 🔥 submit
  const handleSubmit = async () => {
    if (!user?.schoolId) {
      alert("User tidak memiliki schoolId");
      return;
    }

    if (!form.nama || !form.nip || !form.tahunAjaran) {
      alert("Semua field wajib diisi!");
      return;
    }

    if (!isValidTahunAjaran(form.tahunAjaran)) {
      alert("Format harus: 2025/2026 Genap");
      return;
    }

    if (editId) {
      await updateDoc(doc(db, "kepala_sekolah", editId), {
        ...form,
        updatedAt: serverTimestamp(),
      });
    } else {
      await addDoc(colRef, {
        ...form,
        aktif: false,
        schoolId: user.schoolId, // 🔥 penting
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    setForm({ nama: "", nip: "", tahunAjaran: "" });
    setEditId(null);
  };

  // 🔥 set aktif (hanya dalam sekolah yang sama)
  const setActive = async (id: string) => {
    if (!user?.schoolId) return;

    const q = query(
      colRef,
      where("schoolId", "==", user.schoolId),
      where("aktif", "==", true)
    );

    const activeSnap = await getDocs(q);

    await runTransaction(db, async (transaction) => {
      // nonaktifkan yang aktif di sekolah ini saja
      activeSnap.forEach((d) => {
        transaction.update(d.ref, { aktif: false });
      });

      // aktifkan yang dipilih
      const targetRef = doc(db, "kepala_sekolah", id);
      transaction.update(targetRef, { aktif: true });
    });
  };

  const handleEdit = (item: any) => {
    setForm({
      nama: item.nama,
      nip: item.nip,
      tahunAjaran: item.tahunAjaran,
    });
    setEditId(item.id);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Yakin hapus data?")) {
      await deleteDoc(doc(db, "kepala_sekolah", id));
    }
  };

  // Pagnition
  const totalData = data.length;
  const totalPage = Math.ceil(totalData / limit);

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  const currentData = data.slice(startIndex, endIndex);

  // 🔥 loading + guard user
  if (!user) return <p className="p-3">Harus login</p>;
  if (!user.schoolId) return <p className="p-3">User belum punya sekolah</p>;
  if (loading) return <p className="p-3">Memuat data...</p>;

  return (
    <main className="app-main">
      <div className="container-fluid">

        {/* HEADER */}
        <div className="app-content-header">
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0">Pengaturan Kepala Sekolah</h4>
          </div>
        </div>

        {/* INFO */}
        <div className="callout callout-info mb-3">
          <div className="card-body">
            <h5 className="fw-bold mb-2">Informasi</h5>
            <p className="mb-0 small">
              Data kepala sekolah hanya berlaku untuk sekolah Anda.
            </p>
          </div>
        </div>

        {/* FORM */}
        <h6>Form Tambah/Edit Kepala Sekolah</h6>
        <div className="card p-3 mb-3 bg-info">
          <div className="row">
            <div className="col-md-4">
              <input
                className="form-control"
                placeholder="Nama Kepala Sekolah"
                value={form.nama}
                onChange={(e) =>
                  setForm({ ...form, nama: e.target.value })
                }
              />
            </div>

            <div className="col-md-3">
              <input
                className="form-control"
                placeholder="NIP"
                value={form.nip}
                onChange={(e) =>
                  setForm({ ...form, nip: e.target.value })
                }
              />
            </div>

            <div className="col-md-3">
              <input
                className="form-control"
                placeholder="2025/2026 Genap"
                value={form.tahunAjaran}
                onChange={(e) =>
                  setForm({ ...form, tahunAjaran: e.target.value })
                }
              />
            </div>

            <div className="col-md-2">
              <button
                className="btn btn-primary w-100"
                onClick={handleSubmit}
              >
                {editId ? "Update" : "Tambah"}
              </button>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="">
          <div className="card-body table-responsive">
            <h6>Data Kepala Sekolah</h6>
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th style={{ width: "50px" }}>No</th>
                  <th>Nama</th>
                  <th>NIP</th>
                  <th>Tahun Ajaran</th>
                  <th>Status</th>
                  <th style={{ width: "220px" }}>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {currentData.map((d, i) => (
                  <tr key={d.id}>
                    <td className="text-center">
                      {startIndex + i + 1}
                    </td>
                    <td>{d.nama}</td>
                    <td>{d.nip}</td>
                    <td>{d.tahunAjaran}</td>

                    <td>
                      {d.aktif ? (
                        <span className="badge bg-success">Aktif</span>
                      ) : (
                        <span className="badge bg-secondary">
                          Tidak Aktif
                        </span>
                      )}
                    </td>

                    <td className="d-flex gap-2">
                      <button
                        className="btn btn-success btn-sm"
                        disabled={d.aktif}
                        onClick={() => setActive(d.id)}
                      >
                        {d.aktif ? "Aktif" : "Aktifkan"}
                      </button>

                      <button
                        className="btn btn-warning btn-sm"
                        onClick={() => handleEdit(d)}
                      >
                        Edit
                      </button>

                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(d.id)}
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="d-flex justify-content-between align-items-center mt-3">

              {/* LIMIT */}
              <div>
                <select
                  className="form-select form-select-sm"
                  style={{ width: "80px" }}
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                </select>
              </div>

              {/* PAGE INFO */}
              <div>
                Halaman {page} dari {totalPage || 1}
              </div>

              {/* BUTTON */}
              <div className="d-flex gap-2">
                <button
                  className="btn btn-sm btn-secondary"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Prev
                </button>

                <button
                  className="btn btn-sm btn-secondary"
                  disabled={page === totalPage || totalPage === 0}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </button>
              </div>

            </div>
          </div>
        </div>

      </div>
    </main>
  );
}