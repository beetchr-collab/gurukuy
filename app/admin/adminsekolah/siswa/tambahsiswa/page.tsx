"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import * as XLSX from "xlsx";

export default function AdminSiswaPage() {
  const { user } = useAuth();

  const [excelData, setExcelData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

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
  const handleSave = async () => {
    if (!user?.schoolId) {
      alert("User tidak punya schoolId");
      return;
    }

    setLoading(true);
    setProgress(0);

    for (let i = 0; i < excelData.length; i++) {
      const item = excelData[i];

      // validasi
      if (!item.nama || !item.nis) continue;

      const data = {
        nama: item.nama || "",
        nis: item.nis || "",
        nisn: item.nisn || "",
        jk: item.jk || "",
        tempatLahir: item.tempatLahir || "",
        tanggalLahir: item.tanggalLahir || "",

        schoolId: user.schoolId,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "students"), data);

      setProgress(Math.round(((i + 1) / excelData.length) * 100));
    }

    setLoading(false);
    alert("Import selesai!");
    setExcelData([]);
  };

  // =========================
  // 📄 DOWNLOAD TEMPLATE
  // =========================
  const downloadTemplate = () => {
    const data = [
      {
        nama: "Budi",
        nis: "12345",
        nisn: "999999",
        jk: "L",
        tempatLahir: "Surabaya",
        tanggalLahir: "2010-01-01",
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

        {/* HEADER */}
        <div className="content-header mb-3">
          <h4>Informasi Peserta Didik</h4>
        </div>

        {/* CALLOUT */}
        <div className="callout callout-info mb-3">
          <h5><i className="fas fa-info-circle"></i> Informasi</h5>
          <p>
            Import data siswa menggunakan file Excel. Pastikan format sesuai template.
          </p>
        </div>

        {/* ACTION */}
        <div className="card mb-3">
          <div className="card-body d-flex gap-2 flex-wrap">

            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              className="form-control"
              style={{ maxWidth: 300 }}
              onChange={handleImport}
            />

            <button className="btn btn-success" onClick={downloadTemplate}>
              Download Template
            </button>

            {excelData.length > 0 && (
              <button className="btn btn-primary" onClick={handleSave}>
                Simpan ke Database
              </button>
            )}
          </div>
        </div>

        {/* PROGRESS */}
        {loading && (
          <div className="progress mb-3">
            <div
              className="progress-bar progress-bar-striped progress-bar-animated"
              style={{ width: `${progress}%` }}
            >
              {progress}%
            </div>
          </div>
        )}

        {/* PREVIEW TABLE */}
        {excelData.length > 0 && (
          <div className="card">
            <div className="card-header">Preview Data</div>
            <div className="card-body table-responsive">
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>NIS</th>
                    <th>NISN</th>
                    <th>JK</th>
                    <th>Tempat Lahir</th>
                    <th>Tanggal Lahir</th>
                  </tr>
                </thead>
                <tbody>
                  {excelData.map((row, i) => (
                    <tr key={i}>
                      <td>{row.nama}</td>
                      <td>{row.nis}</td>
                      <td>{row.nisn}</td>
                      <td>{row.jk}</td>
                      <td>{row.tempatLahir}</td>
                      <td>{row.tanggalLahir}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}