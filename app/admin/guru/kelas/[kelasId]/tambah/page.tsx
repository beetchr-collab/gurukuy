"use client";

import { useEffect, useState } from "react";
import { useModal } from "@/components/modals/useModal";
import { useParams, useRouter } from "next/navigation";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Student {
  id: string;
  nama: string;
  jk: string;
  nis: number;
  nisn?: string;
  kelas?: string;
  tingkatKelas: number;
  schoolId: string;
}

interface ClassData {
  namaKelas: string;
  tingkatKelas: number;
  schoolId: string;
}

export default function TambahSiswaPage() {
  const { kelasId } = useParams();
  const [kelas, setKelas] = useState<ClassData | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { showModal } = useModal();

  // Menampilkan data kelas dan siswa saat komponen dimuat
  useEffect(() => {
    loadData();
  }, []);

  // Fungsi untuk memuat data kelas dan siswa dari Firestore
  const loadData = async () => {
    try {
      setLoading(true);

      const kelasRef = doc(db, "classes", kelasId as string);
      const kelasSnap = await getDoc(kelasRef);

      if (!kelasSnap.exists()) {
        console.log("Data kelas tidak ditemukan");
        return;
      }

      const kelasData = kelasSnap.data() as ClassData;

      setKelas(kelasData);

      console.log("===== DATA KELAS =====");
      console.log(kelasData);

      console.log("tingkatKelas :", kelasData.tingkatKelas);
      console.log("schoolId :", kelasData.schoolId);

      const siswaQuery = query(
        collection(db, "students"),
        where("schoolId", "==", kelasData.schoolId),
        where("tingkatKelas", "==", Number(kelasData.tingkatKelas)),
        where("status", "==", "Aktif")
      );

      const siswaSnap = await getDocs(siswaQuery);

      console.log("Jumlah siswa :", siswaSnap.size);

      const siswa: Student[] = [];

      siswaSnap.forEach((doc) => {
        console.log(doc.id, doc.data());

        siswa.push({
          id: doc.id,
          ...(doc.data() as Omit<Student, "id">),
        });
      });

      setStudents(siswa);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Cek box untuk memilih siswa
  const toggleStudent = (id: string) => {
    setSelectedStudents((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  // Select semua siswa yang ditampilkan
  const filteredStudents = students.filter((student) => {
    const keyword = search.toLowerCase();

    return (
      student.nama.toLowerCase().includes(keyword) ||
      String(student.nis).includes(keyword) ||
      (student.nisn ?? "").includes(keyword)
    );
  });
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(filteredStudents.map((s) => s.id));
    } else {
      setSelectedStudents([]);
    }
  };

  // Simpan siswa yang dipilih ke kelas
  const saveAnggotakelas = async () => {
    if (selectedStudents.length === 0) {
      alert("Pilih minimal satu siswa.");
      return;
    }

    try {
      setSaving(true);

      const batch = writeBatch(db);

      selectedStudents.forEach((studentId) => {
        const student = students.find((s) => s.id === studentId);

        if (!student) return;

        const memberRef = doc(
          db,
          "classes",
          kelasId as string,
          "anggotakelas",
          student.id
        );

        batch.set(memberRef, {
          studentId: student.id,
          nama: student.nama,
          jk: student.jk,
          nis: student.nis,
          nisn: student.nisn ?? "",
          kelas: student.kelas ?? "",
          tingkatKelas: student.tingkatKelas,
          schoolId: student.schoolId,
          kelasId: kelasId as string,
          createdAt: serverTimestamp(),
        });
      });

      await batch.commit();

      showModal({
        title: "Berhasil",
        message: `${selectedStudents.length} siswa berhasil ditambahkan.`,
        type: "success",
        onConfirm: () => {
          router.push(`/admin/guru/kelas/${kelasId}`);
        },
      });

      setSelectedStudents([]);
    } catch (error) {
      console.error(error);
      showModal({
        title: "Gagal",
        message: "Gagal menyimpan anggota kelas.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-fluid py-2">
      <h3 className="mb-2">Tambah Anggota Kelas</h3>
      {/* Breadcrumbs */}
      <div className="callout callout-info mb-3">
        <h5>
          <i className="bi bi-info-circle-fill me-2"></i>
          Informasi Penambahan Anggota Kelas
        </h5>

        <p className="mb-0">
          Pilih peserta didik yang akan ditambahkan ke dalam kelas. Pastikan siswa
          yang dipilih belum terdaftar pada kelas yang sama agar data tetap akurat
          dan tidak terjadi duplikasi.
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
              Informasi Aksi Kelas
            </h5>
            <small className="text-white">
              {kelas && (
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <span className="badge text-bg-light">
                    Nama Kelas : {kelas.namaKelas}
                  </span>

                  <span className="badge text-bg-warning">
                    Tingkat : {kelas.tingkatKelas}
                  </span>
                </div>
              )}
            </small>
          </div>

          <div className="d-flex gap-2">
            {/* Pencarian siswa */}
            <div className="row">
              <div className="col-md-6">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Cari Nama / NIS / NISN..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="col-md-6 text-end">
                <button
                  className="btn btn-outline-light"
                  disabled={saving}
                  onClick={saveAnggotakelas}
                >
                  <i className="fas fa-save me-2"></i>

                  {saving ? "Menyimpan..." : "Simpan Anggota"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-header">
          <h3 className="card-title">
            Daftar Siswa
          </h3>
        </div>
        <div className="card-body">




          {/* statistik jumlah siswa */}
          <div className="alert alert-secondary">
            Jumlah siswa :
            <b> {filteredStudents.length}</b>
            <br />
            Dipilih :
            <b> {selectedStudents.length}</b>
          </div>

          {/* Tabel daftar siswa */}
          {loading ? (
            <p>Memuat data...</p>
          ) : (
            <table className="table table-bordered">

              <thead>

                <tr>

                  <th style={{ width: 50 }}>

                    <input
                      type="checkbox"
                      checked={
                        filteredStudents.length > 0 &&
                        selectedStudents.length === filteredStudents.length
                      }
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />

                  </th>

                  <th>NIS</th>
                  <th>NISN</th>
                  <th>Nama</th>
                  <th>Jenis Kelamin</th>
                  <th>Kelas</th>
                  <th>Tingkat</th>

                </tr>

              </thead>

              <tbody>

                {students.length == 0 && (
                  <tr>

                    <td colSpan={4} className="text-center">

                      Tidak ada siswa

                    </td>

                  </tr>
                )}

                {filteredStudents.map((student) => (

                  <tr key={student.id}>

                    <td>

                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => toggleStudent(student.id)}
                      />

                    </td>

                    <td>{student.nis}</td>
                    <td>{student.nisn}</td>
                    <td>{student.nama}</td>
                    <td>{student.jk}</td>
                    <td>{student.kelas}</td>
                    <td>{student.tingkatKelas}</td>

                  </tr>

                ))}

              </tbody>

            </table>
          )}

        </div>

      </div>

    </div>
  );
}