"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import * as XLSX from "xlsx";
import UploadProgress from "@/components/ui/UploadProgress";
import useUploadProgress from "@/hooks/useUploadProgress";
import { useRouter } from "next/navigation";

export default function AdminSiswaPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [excelData, setExcelData] = useState<any[]>([]);

  // AMBIL TAHUN AJARAN TERAKHIR
  const [tahunAjaran, setTahunAjaran] = useState("");
  useEffect(() => {
    if (!user?.schoolId) return;

    const getTahunAjaran = async () => {
      try {
        const q = query(
          collection(db, "kepala_sekolah"),
          where("schoolId", "==", user.schoolId),
          where("aktif", "==", true)
        );

        const snap = await getDocs(q);

        if (!snap.empty) {
          const data = snap.docs[0].data();
          setTahunAjaran(data.tahunAjaran || "");
        }
      } catch (error) {
        console.log(error);
      }
    };

    getTahunAjaran();
  }, [user]);

  // =========================
  // 📥 IMPORT EXCEL
  // =========================
  const handleImport = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data: any[] = XLSX.utils.sheet_to_json(sheet);

    setExcelData(data);
  };

  // =========================
  // 💾 SIMPAN KE FIRESTORE
  // =========================
  const upload = useUploadProgress();
  // Menampilkan label kolom
  const fieldLabels: Record<string, string> = {
    nama: "Nama",
    nis: "NIS",
    nisn: "NISN",
    jk: "Jenis Kelamin",
    tempatLahir: "Tempat Lahir",
    tanggalLahir: "Tanggal Lahir",
    notlpn: "No. Telepon",
    kelas: "Kelas",
  };

  // Menyimpan data ke Firestore
  const handleSave = async () => {
    if (!user?.schoolId) {
      alert("User tidak punya schoolId");
      return;
    }

    if (!tahunAjaran) {
      alert("Belum ada Tahun Pelajaran yang aktif.");
      return;
    }

    if (excelData.length === 0) {
      alert("Belum ada data yang akan diimport.");
      return;
    }

    try {
      const total = excelData.length;
      upload.start(total);
      let success = 0;

      for (let i = 0; i < total; i++) {
        const item = excelData[i];

        // Skip data yang tidak valid
        // Kolom yang wajib diisi
        const requiredFields = [
          "nama",
          "nis",
          "nisn",
          "jk",
          "tempatLahir",
          "tanggalLahir",
          "kelas",
        ];

        // Cari kolom yang kosong
        const emptyFields = requiredFields.filter((field) => {
          const value = item[field];

          return (
            value === undefined ||
            value === null ||
            String(value).trim() === ""
          );
        });

        if (emptyFields.length > 0) {

          upload.addFailed({
            row: i + 2,
            reason: `${emptyFields.join(", ")} wajib diisi`,
            data: item,
          });

          upload.update(i + 1);

          continue;
        }

        const data = {
          nama: item.nama || "",
          nis: item.nis || "",
          jk: item.jk || "",
          nisn: item.nisn || "",
          tempatLahir: item.tempatLahir || "",
          tanggalLahir: item.tanggalLahir || "",
          notlpn: item.notlpn || "",
          kelas: item.kelas || "",

          schoolId: user.schoolId,
          ownerId: user.uid,
          tahunAjaran,
          createdAt: serverTimestamp(),
        };

        try {

          await addDoc(collection(db, "students"), data);

          upload.addSuccess();

        } catch (err: any) {
          // Jika gagal simpan, catat data yang gagal
          const emptyLabels = emptyFields.map(
            (field) => fieldLabels[field] || field
          );
          upload.addFailed({
            row: i + 2,
            reason: `${emptyLabels.join(", ")} wajib diisi`,
            data: item,
          });

        }

        upload.addSuccess();

        // Update progress
        upload.update(i + 1);
      }

      upload.finish();

      setExcelData([]);
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat import data.");
    }
  };

  // =========================
  // 📄 DOWNLOAD TEMPLATE
  // =========================
  const downloadTemplate = () => {
    const data = [
      {
        nama: "Budi",
        nis: "12345",
        jk: "L",
        nisn: "999999",
        tempatLahir: "Surabaya",
        tanggalLahir: "2010-01-01",
        notlpn: "08123456789",
        kelas: "5A",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");

    XLSX.writeFile(wb, "template_siswa.xlsx");
  };

  return (
    <main className="app-main py-3">
      <div className="container-fluid">

        {/* ================= HEADER ================= */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
          <div>
            <h3 className="mb-1 fw-bold">
              Tambah Data Peserta Didik
            </h3>
          </div>
        </div>

        {/* ================= INFORMASI ================= */}

        <div className="callout callout-info shadow-sm">
          <h5>
            <i className="fas fa-circle-info me-2"></i>
            Informasi
          </h5>

          <ul className="mb-0">
            <li>Download template terlebih dahulu.</li>
            <li>Isi data sesuai format.</li>
            <li>Upload file Excel.</li>
            <li>Pastikan tidak ada NIS yang sama.</li>
            <li>Data otomatis tersimpan pada Tahun Pelajaran Aktif.</li>
          </ul>
        </div>

        {/* ================= UPLOAD ================= */}

        <div className="card shadow-sm border-0 mt-4 upload-card">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">
              <i className="fas fa-file-import me-2"></i>
              Import Data Excel
            </h5>
          </div>

          <div className="card-body">

            {/* Tahun Ajaran */}
            <div className="alert alert-success d-flex justify-content-between align-items-center mb-4">
              <div>
                <i className="fas fa-calendar-alt me-2"></i>
                <strong>Tahun Ajaran Aktif</strong>
              </div>

              <span className="badge bg-success">
                {tahunAjaran || "-"}
              </span>
            </div>

            <div className="row">

              {/* Upload File */}
              <div className="col-md-6 mb-3">
                <label className="form-label">
                  File Excel
                </label>

                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="form-control"
                  onChange={handleImport}
                />

                <small className="text-muted">
                  Format: .xlsx, .xls atau .csv
                </small>
              </div>

              {/* Tombol */}
              <div className="col-md-6 mb-3">

                <label className="form-label">
                  Aksi
                </label>

                <div className="d-flex flex-wrap gap-2">

                  <button
                    className="btn btn-success"
                    onClick={downloadTemplate}
                  >
                    <i className="fas fa-download me-1"></i>
                    Download Template
                  </button>

                  {excelData.length > 0 && (
                    <button
                      className="btn btn-primary"
                      onClick={handleSave}
                    >
                      <i className="fas fa-save me-1"></i>
                      Simpan ke Database
                    </button>
                  )}

                </div>

              </div>

            </div>

            {/* Progress */}
            <UploadProgress
              loading={upload.loading}
              progress={upload.progress}
              finished={upload.finished}
              total={upload.total}
              success={upload.success}
              failed={upload.failed}
              title="Mengimport Data Siswa"
              subtitle="Mohon tunggu, sistem sedang menyimpan data ke database..."
              onFinish={() => {
                upload.reset();
                router.push("/admin/adminsekolah/siswa/daftarsiswa");
              }}
            />

          </div>
        </div>

        {/* ================= PREVIEW ================= */}

        {excelData.length > 0 && (

          <div className="card shadow-sm border-0 mt-4">

            <div className="card-header d-flex justify-content-between align-items-center">

              <h5 className="mb-0">
                <i className="fas fa-table me-2 text-primary"></i>
                Preview Data
              </h5>

              <span className="badge bg-primary fs-6">
                {excelData.length} Siswa
              </span>

            </div>

            <div className="card-body p-0">

              <div className="table-responsive">

                <table className="table table-hover table-striped align-middle mb-0">

                  <thead className="table-light">

                    <tr>

                      <th>No</th>
                      <th>Nama</th>
                      <th>NIS</th>
                      <th>NISN</th>
                      <th>JK</th>
                      <th>Tempat Lahir</th>
                      <th>Tanggal Lahir</th>
                      <th>Kelas</th>

                    </tr>

                  </thead>

                  <tbody>

                    {excelData.map((row, i) => (

                      <tr key={i}>

                        <td>{i + 1}</td>

                        <td className="fw-semibold">
                          {row.nama}
                        </td>

                        <td>{row.nis}</td>

                        <td>{row.nisn}</td>

                        <td>
                          <span
                            className={`badge ${row.jk === "L"
                              ? "bg-primary"
                              : "bg-danger"
                              }`}
                          >
                            {row.jk}
                          </span>
                        </td>

                        <td>{row.tempatLahir}</td>

                        <td>{row.tanggalLahir}</td>

                        <td>

                          <span className="badge bg-secondary">
                            {row.kelas}
                          </span>

                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            </div>

          </div>

        )}

      </div>
    </main>
  );
}