"use client";

import { useEffect, useState } from "react";
import Select from "react-select";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  onSnapshot,
  updateDoc, // edit kelas
  deleteDoc, // hapus kelas
} from "firebase/firestore";

export default function KelasPage() {
  const { user } = useAuth();

  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    namaKelas: "",
    mataPelajaran: "",
    tingkat: "",
    schoolId: "",
    kepalaSekolah: "",
    tahunAjaran: "",
  });

  //state
  const [tingkatOptions, setTingkatOptions] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]); // 🔥 state data kelas
  const [editId, setEditId] = useState<string | null>(null); // edit kelas

  // ================= LOAD DATA USER =================
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();

      if (!userData?.schoolId) return;

      const schoolId = userData.schoolId;

      // ================= AMBIL KEPALA SEKOLAH + TAHUN AJARAN =================
      const q = query(
        collection(db, "kepala_sekolah"),
        where("schoolId", "==", schoolId),
        where("aktif", "==", true) // 🔥 hanya yang aktif
      );

      const snap = await getDocs(q);

      let kepalaSekolah = "Belum diatur";
      let tahunAjaran = "Belum diatur";

      if (!snap.empty) {
        const data = snap.docs[0].data();

        kepalaSekolah = data.nama || "-";
        tahunAjaran = data.tahunAjaran || "-"; // ✅ FIX DI SINI
      }

      // ================= SET FORM SEKALI SAJA =================
      setForm((prev) => ({
        ...prev,
        schoolId: schoolId,
        kepalaSekolah,
        tahunAjaran,
      }));
    };

    loadData();

    // ================= TINGKAT =================
    const tingkat = Array.from({ length: 12 }, (_, i) => ({
      value: `Kelas ${i + 1}`,
      label: `Kelas ${i + 1}`,
    }));
    setTingkatOptions(tingkat);

  }, [user]);

  // ================= REALTIME CLASSES =================
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "classes"),
      where("ownerId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const result: any[] = [];

      snapshot.forEach((doc) => {
        result.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      setClasses(result);
    });

    return () => unsubscribe(); // cleanup
  }, [user]);

  // ================= SUBMIT =================
  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!user) return alert("User belum login");

    try {
      if (editId) {
        // 🔥 UPDATE
        await updateDoc(doc(db, "classes", editId), {
          namaKelas: form.namaKelas,
          mataPelajaran: form.mataPelajaran,
          tingkat: form.tingkat,
          updatedAt: serverTimestamp(),
        });

        alert("Kelas berhasil diupdate");
      } else {
        // 🔥 CREATE
        await addDoc(collection(db, "classes"), {
          ...form,
          ownerId: user.uid,
          createdAt: serverTimestamp(),
        });

        alert("Kelas berhasil ditambahkan");
      }

      // reset
      setShowModal(false);
      setEditId(null);

      setForm((prev) => ({
        ...prev,
        namaKelas: "",
        mataPelajaran: "",
        tingkat: "",
      }));

    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan");
    }
  };

  // ================= EDIT KELAS =================
  const handleEdit = (item: any) => {
    setEditId(item.id);
    setShowModal(true);

    setForm((prev) => ({
      ...prev,
      namaKelas: item.namaKelas || "",
      mataPelajaran: item.mataPelajaran || "",
      tingkat: item.tingkat || "",
    }));
  };

  // ================= HAPUS KELAS =================
  const handleDelete = async (id: string) => {
    const confirmDelete = confirm("Yakin ingin menghapus kelas?");
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "classes", id));
      alert("Kelas berhasil dihapus");
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus");
    }
  };

  // ================= MATA PELAJARAN =================
  const mataPelajaran = [
    // UMUM
    "Guru Kelas",

    // WAJIB
    "Pendidikan Agama dan Budi Pekerti",
    "Pendidikan Pancasila (PP)",
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

  // ================= TINGKAT KELAS =================
  const getTingkatNumber = (tingkat?: string) => {
    if (!tingkat) return 1;
    return tingkat.replace("Kelas ", "");
  };

  return (
    <main className="app-main">
      <div className="container-fluid py-2">

        {/* HEADER */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4>Data Kelas</h4>
        </div>

        {/* CALLOUT */}
        <div className="callout callout-info mb-3">
          <h5><i className="fas fa-chalkboard mr-2"></i> Informasi Kelas</h5>
          <p>
            Halaman ini digunakan untuk mengelola data kelas atau rombongan belajar (rombel).
            Anda dapat menambahkan, mengubah, dan menghapus data kelas sesuai kebutuhan sekolah.
          </p>
          <ul className="mb-0">
            <li>Kelola data ruang kelas / rombongan belajar</li>
            <li>Setiap kelas dapat memiliki wali kelas</li>
            <li>Kelas berisi daftar siswa sesuai rombel</li>
            <li>Gunakan tombol tambah untuk membuat kelas baru</li>
          </ul>
        </div>
        <hr />
        <button
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
        >
          <i className="fas fa-plus mr-2"></i> Tambah Kelas
        </button>

        {/* TAMPIL KELAS */}
        <div className="row mt-3">
          {classes.length === 0 ? (
            <div className="col-12 text-center">
              <p className="text-muted">Belum ada data kelas</p>
            </div>
          ) : (
            classes.map((item) => {
              const tingkatNum = getTingkatNumber(item.tingkat);

              return (
                <div className="col-md-4 col-lg-3 mb-4" key={item.id}>
                  <div className="binbin-card shadow-sm h-100">

                    {/* HEADER */}
                    <div className={`binbin-card-header-custom tingkat-${tingkatNum}`}>
                      <div className="d-flex justify-content-between align-items-center">
                        <span>{item.namaKelas}</span>
                        <span className="badge bg-light text-dark badge-tingkat">
                          {item.tingkat}
                        </span>
                      </div>
                    </div>

                    {/* BODY */}
                    <div className="binbin-card-body px-3 py-3">

                      <p>
                        <i className="fas fa-book text-primary mr-2"></i>
                        {item.mataPelajaran || "-"}
                      </p>

                      <p className="mb-0">
                        <i className="fas fa-calendar text-warning mr-2"></i>
                        {item.tahunAjaran || "-"}
                      </p>

                    </div>

                    {/* FOOTER */}
                    <div className="binbin-card-footer bg-white border-0 d-flex justify-content-between align-items-center">

                      <button
                        className="btn btn-warning text-white shadow-sm"
                        onClick={() => handleEdit(item)}
                      >
                        <i className="fas fa-edit"></i>
                      </button>

                      <button
                        className="btn btn-danger text-white shadow-sm"
                        onClick={() => handleDelete(item.id)}
                      >
                        <i className="fas fa-trash"></i>
                      </button>

                      <button className="btn btn-success text-white shadow-sm">
                        <i className="fas fa-users"></i>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* MODAL */}
        {showModal && (
          <div className="modal fade show d-block">
            <div className="modal-dialog">
              <div className="modal-content">

                <div className="modal-header">
                  <h5 className="modal-title">
                    {editId ? "Edit Kelas" : "Tambah Kelas"}
                  </h5>
                  <button
                    className="close"
                    onClick={() => setShowModal(false)}
                  >
                    <span>&times;</span>
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="modal-body">

                    <div className="form-group">
                      <label>Nama Kelas</label>
                      <input
                        className="form-control"
                        placeholder="Contoh: 7A"
                        value={form.namaKelas}
                        onChange={(e) =>
                          setForm({ ...form, namaKelas: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Mata Pelajaran</label>
                      <Select
                        options={mapelOptions}
                        placeholder="Pilih mata pelajaran"
                        value={mapelOptions.find(
                          (opt) => opt.value === form.mataPelajaran
                        )}
                        onChange={(val: any) =>
                          setForm({ ...form, mataPelajaran: val.value })
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label>Tingkat</label>
                      <Select
                        options={tingkatOptions}
                        placeholder="Pilih tingkat"
                        value={tingkatOptions.find(
                          (opt) => opt.value === form.tingkat
                        )}
                        onChange={(val: any) =>
                          setForm({ ...form, tingkat: val?.value || "" })
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label>School ID</label>
                      <input className="form-control" value={form.schoolId} disabled />
                    </div>

                    <div className="form-group">
                      <label>Kepala Sekolah</label>
                      <input className="form-control" value={form.kepalaSekolah} disabled />
                    </div>
                    <div className="form-group">
                      <label>Tahun Ajaran</label>
                      <input className="form-control" value={form.tahunAjaran} disabled />
                    </div>

                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowModal(false)}
                    >
                      Batal
                    </button>

                    <button type="submit" className="btn btn-primary">
                      Simpan
                    </button>
                  </div>
                </form>

              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}