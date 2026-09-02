"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { MATA_PELAJARAN } from "@/lib/mata-pelajaran";
import { getClassesByOwner } from "@/services/kelas.service";
import { getKepalaSekolahBySchool } from "@/services/kepalaSekolah.service";
import SearchInput from "@/components/search/SearchInput";
import TableFooter from "@/components/pagination/TableFooter";
import { usePagination } from "@/hooks/usePagination";

type JurnalEntry = {
  id: string;
  tanggal: string;
  tahunAjaran: string;
  kelasId: string;
  mapelId: string;
  jamKe: string;
  materi: string;
  tujuanPembelajaran: string;
  kegiatanPembelajaran: string;
  metodePembelajaran: string[];
  mediaPembelajaran: string[];
  jumlahSiswa: number | string;
  siswaHadir: number | string;
  siswaIzin: number | string;
  siswaSakit: number | string;
  siswaAlpha: number | string;
  catatan: string;
  catatanLainnya: string;
  status: "Draft" | "Selesai";
  createdAt?: string | null;
  updatedAt?: string | null;
  ownerId?: string;
  schoolId?: string;
};

type EditFormState = {
  tanggal: string;
  kelasId: string;
  mapelId: string;
  jamKe: string;
  materi: string;
  tujuanPembelajaran: string;
  kegiatanPembelajaran: string;
  catatan: string;
  status: "Draft" | "Selesai";
};

const mapelLabelMap = new Map(
  MATA_PELAJARAN.map((item) => [item.idMataPelajaran, item.namaMataPelajaran]),
);

const monthOptions = [
  { label: "Semua bulan", value: "all" },
  { label: "Januari", value: "01" },
  { label: "Februari", value: "02" },
  { label: "Maret", value: "03" },
  { label: "April", value: "04" },
  { label: "Mei", value: "05" },
  { label: "Juni", value: "06" },
  { label: "Juli", value: "07" },
  { label: "Agustus", value: "08" },
  { label: "September", value: "09" },
  { label: "Oktober", value: "10" },
  { label: "November", value: "11" },
  { label: "Desember", value: "12" },
];

const yearOptions = Array.from({ length: 6 }, (_, index) => {
  const year = new Date().getFullYear() - index;
  return { label: String(year), value: String(year) };
});

const formatDate = (value: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const getMonthLabel = (month: string) =>
  monthOptions.find((item) => item.value === month)?.label ?? "Semua Bulan";

export default function RekapJurnalPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JurnalEntry[]>([]);
  const [kelasList, setKelasList] = useState<{ id: string; namaKelas: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPrintConfirmModal, setShowPrintConfirmModal] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.uid || !user?.schoolId) {
        setEntries([]);
        setKelasList([]);
        setLoading(false);
        return;
      }

      try {
        const kelasData = await getClassesByOwner(user.uid);
        setKelasList(kelasData);

        const q = query(
          collection(db, "jurnal_mengajar"),
          where("ownerId", "==", user.uid),
          where("schoolId", "==", user.schoolId),
        );

        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<JurnalEntry, "id">),
        }));

        setEntries(
          data.sort(
            (a, b) =>
              new Date(b.tanggal || "1970-01-01").getTime() -
              new Date(a.tanggal || "1970-01-01").getTime(),
          ),
        );
      } catch (error) {
        console.error("Gagal memuat data jurnal:", error);
        setEntries([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.uid, user?.schoolId]);

  const filteredEntries = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return entries.filter((entry) => {
      const yearMatch = selectedYear === "all" || (entry.tanggal || "").slice(0, 4) === selectedYear;
      const monthMatch =
        selectedMonth === "all" || (entry.tanggal || "").slice(5, 7) === selectedMonth;

      const kelasNama = kelasList.find((item) => item.id === entry.kelasId)?.namaKelas ?? "";
      const mapelNama = mapelLabelMap.get(entry.mapelId) ?? "";

      const haystack = [
        entry.tanggal,
        kelasNama,
        mapelNama,
        entry.materi,
        entry.tujuanPembelajaran,
        entry.kegiatanPembelajaran,
        entry.catatan,
        entry.status,
        entry.jamKe,
      ]
        .join(" ")
        .toLowerCase();

      const searchMatch = !keyword || haystack.includes(keyword);
      return yearMatch && monthMatch && searchMatch;
    });
  }, [entries, kelasList, search, selectedMonth, selectedYear]);

  const {
    currentPage,
    pageSize,
    totalPages,
    startIndex,
    currentData,
    setCurrentPage,
    setPageSize,
  } = usePagination({
    data: filteredEntries,
    pageSize: 10,
    resetDeps: [search, selectedMonth, selectedYear],
  });

  const handleDelete = async (id: string) => {
    setDeleteTargetId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;

    try {
      await deleteDoc(doc(db, "jurnal_mengajar", deleteTargetId));
      setEntries((prev) => prev.filter((item) => item.id !== deleteTargetId));
      setShowDeleteModal(false);
      setDeleteTargetId(null);
    } catch (error) {
      console.error("Gagal menghapus jurnal:", error);
      alert("Gagal menghapus jurnal.");
    }
  };

  const openEditModal = (entry: JurnalEntry) => {
    setEditingId(entry.id);
    setEditForm({
      tanggal: entry.tanggal,
      kelasId: entry.kelasId,
      mapelId: entry.mapelId,
      jamKe: entry.jamKe,
      materi: entry.materi,
      tujuanPembelajaran: entry.tujuanPembelajaran,
      kegiatanPembelajaran: entry.kegiatanPembelajaran,
      catatan: entry.catatan,
      status: entry.status,
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingId || !editForm) return;

    setSaving(true);

    try {
      const payload = {
        ...editForm,
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(doc(db, "jurnal_mengajar", editingId), payload);

      setEntries((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? {
                ...item,
                ...payload,
              }
            : item,
        ),
      );

      setIsEditOpen(false);
      setEditingId(null);
      setEditForm(null);
    } catch (error) {
      console.error("Gagal memperbarui jurnal:", error);
      alert("Gagal mengubah data jurnal.");
    } finally {
      setSaving(false);
    }
  };

  const printJournal = (entry: JurnalEntry) => {
    const kelasNama = kelasList.find((item) => item.id === entry.kelasId)?.namaKelas ?? "-";
    const mapelNama = mapelLabelMap.get(entry.mapelId) ?? "-";
    const printWindow = window.open("", "_blank", "width=900,height=700");

    if (!printWindow) {
      alert("Popup diblokir. Izinkan popup browser untuk mencetak jurnal.");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Jurnal Mengajar</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #1f2937; }
            h2 { margin-bottom: 12px; }
            .meta { margin-bottom: 16px; }
            .meta p { margin: 4px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #d1d5db; padding: 8px 10px; text-align: left; vertical-align: top; }
            th { background: #f3f4f6; }
          </style>
        </head>
        <body>
          <h2>Jurnal Mengajar</h2>
          <div class="meta">
            <p><strong>Tanggal:</strong> ${formatDate(entry.tanggal)}</p>
            <p><strong>Kelas:</strong> ${kelasNama}</p>
            <p><strong>Mata Pelajaran:</strong> ${mapelNama}</p>
            <p><strong>Jam Ke:</strong> ${entry.jamKe}</p>
            <p><strong>Status:</strong> ${entry.status}</p>
          </div>
          <table>
            <tr><th>Materi</th><td>${entry.materi || "-"}</td></tr>
            <tr><th>Tujuan Pembelajaran</th><td>${entry.tujuanPembelajaran || "-"}</td></tr>
            <tr><th>Kegiatan Pembelajaran</th><td>${entry.kegiatanPembelajaran || "-"}</td></tr>
            <tr><th>Catatan</th><td>${entry.catatan || "-"}</td></tr>
          </table>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  };

  const printMonthlyJournal = async () => {
    if (filteredEntries.length === 0) {
      alert("Tidak ada data jurnal untuk dicetak pada filter saat ini.");
      return;
    }

    if (!user?.schoolId || !user?.uid) {
      alert("Data pengguna belum siap untuk mencetak jurnal.");
      return;
    }

    const title = "Jurnal mengajar";

    const printWindow = window.open("", "_blank", "width=1200,height=900");

    if (!printWindow) {
      alert("Popup diblokir. Izinkan popup browser untuk mencetak rekap jurnal.");
      return;
    }

    try {
      const [kepalaSekolahResult, userSnapshot, schoolSnapshot] = await Promise.all([
        getKepalaSekolahBySchool(user.schoolId),
        getDoc(doc(db, "users", user.uid)),
        getDoc(doc(db, "sekolah", user.schoolId)),
      ]);

      const kepalaSekolah = kepalaSekolahResult.find((item) => item.aktif) ?? kepalaSekolahResult[0] ?? null;
      const schoolData = schoolSnapshot.exists() ? schoolSnapshot.data() : null;
      const guruData = userSnapshot.exists() ? userSnapshot.data() : null;
      const guruName = guruData?.username || user.username || "Guru";
      const guruNip = guruData?.nip || "-";
      const kepalaNama = kepalaSekolah?.nama || "-";
      const kepalaNip = kepalaSekolah?.nip || "-";
      const schoolName = schoolData?.namaSekolah || "-";
      const activeYear =
        selectedYear !== "all"
          ? selectedYear
          : (kepalaSekolah?.tahunAjaran || schoolData?.tahunAjaran || "Semua Tahun");

      const rows = await Promise.all(
        filteredEntries.map(async (entry, index) => {
          const kelasNama = kelasList.find((item) => item.id === entry.kelasId)?.namaKelas ?? "-";
          const mapelNama = mapelLabelMap.get(entry.mapelId) ?? "-";

          let presensiText = "-";

          const presensiQuery = query(
            collection(db, "presensi"),
            where("schoolId", "==", user.schoolId),
            where("kelasId", "==", entry.kelasId),
            where("tanggal", "==", entry.tanggal),
          );

          const presensiSnapshot = await getDocs(presensiQuery);
          const siswaTidakHadir = presensiSnapshot.docs.flatMap((docSnap) => {
            const data = docSnap.data();
            return Array.isArray(data?.siswa)
              ? (data.siswa as Array<{ nama?: string; status?: string }>).filter((siswa) => {
                  const status = (siswa.status ?? "").trim();
                  return ["Izin", "Ijin", "Sakit", "Alpha"].includes(status);
                })
              : [];
          });

          if (siswaTidakHadir.length > 0) {
            presensiText = siswaTidakHadir
              .map((siswa) => {
                const status = (siswa.status ?? "").trim();
                const statusLabel = status === "Ijin" ? "Izin" : status;
                return `${siswa.nama || "-"} (${statusLabel})`;
              })
              .join("<br>");
          }

          return `
            <tr>
              <td style="text-align:center;">${index + 1}</td>
              <td>${formatDate(entry.tanggal)}</td>
              <td>${entry.jamKe}</td>
              <td>${kelasNama}</td>
              <td>${mapelNama}</td>
              <td>${entry.materi || "-"}</td>
              <td>${entry.kegiatanPembelajaran || "-"}</td>
              <td>${presensiText}</td>
            </tr>
          `;
        }),
      );

      const printDate = new Date().toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

      const periodText =
        selectedMonth === "all"
          ? selectedYear === "all"
            ? "Semua Tahun"
            : selectedYear
          : `${getMonthLabel(selectedMonth)} ${selectedYear}`;

      printWindow.document.write(`
        <html>
          <head>
            <title>${title}</title>
            <style>
              @page { size: A4 landscape; margin: 14mm; }
              body {
                font-family: Arial, sans-serif;
                color: #111827;
                margin: 0;
                padding: 14px;
              }
              h2 {
                margin: 0 0 8px 0;
                text-align: center;
                font-size: 22px;
                font-weight: 700;
              }
              .subtitle {
                text-align: center;
                font-size: 12px;
                color: #374151;
                margin-bottom: 8px;
              }
              .school-info {
                text-align: center;
                font-size: 12px;
                color: #374151;
                margin-bottom: 12px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                font-size: 11px;
                table-layout: fixed;
              }
              th, td {
                border: 1px solid #374151;
                padding: 7px 6px;
                vertical-align: top;
                text-align: left;
                word-wrap: break-word;
              }
              th {
                background: #f3f4f6;
                font-weight: 700;
                text-align: center;
              }
              .footer {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-top: 24px;
                gap: 16px;
              }
              .sign-box {
                width: 42%;
                text-align: center;
              }
              .sign-line {
                height: 58px;
              }
              .small-text {
                font-size: 11px;
              }
            </style>
          </head>
          <body>
            <h2>${title}</h2>
            <div class="subtitle">${schoolName}</div>
            <div class="school-info">Tahun Ajaran: ${activeYear}</div>
            <div class="subtitle">Periode: ${periodText}</div>
            <table>
              <thead>
                <tr>
                  <th style="width:5%;">No</th>
                  <th style="width:10%;">Tanggal</th>
                  <th style="width:7%;">Jam Ke</th>
                  <th style="width:12%;">Kelas</th>
                  <th style="width:12%;">Mapel</th>
                  <th style="width:18%;">Materi/Topik</th>
                  <th style="width:22%;">Kegiatan Pembelajaran</th>
                  <th style="width:14%;">Presensi</th>
                </tr>
              </thead>
              <tbody>
                ${rows.join("")}
              </tbody>
            </table>

            <div class="footer">
              <div class="sign-box">
                <div class="small-text">Mengetahui,</div>
                <div class="small-text">Kepala Sekolah</div>
                <div class="sign-line"></div>
                <div><strong>${kepalaNama}</strong></div>
                <div class="small-text">NIP. ${kepalaNip}</div>
              </div>

              <div class="sign-box">
                <div style="text-align:right; margin-bottom:12px;" class="small-text">Tanggal: ${printDate}</div>
                <div class="small-text">Guru Mata Pelajaran</div>
                <div class="sign-line"></div>
                <div><strong>${guruName}</strong></div>
                <div class="small-text">NIP. ${guruNip}</div>
              </div>
            </div>
          </body>
        </html>
      `);

      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 500);
    } catch (error) {
      console.error("Gagal mencetak jurnal bulanan:", error);
      alert("Gagal menyiapkan data cetak jurnal bulanan.");
    }
  };

  return (
    <main className="app-main">
      <div className="app-content-header">
        <div className="container-fluid">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h4 className="mb-0">Rekap Jurnal Mengajar</h4>
            </div>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/admin/guru/dashboard">Dashboard</Link>
                </li>
                <li className="breadcrumb-item active">Rekap Jurnal</li>
              </ol>
            </nav>
          </div>
        </div>
      </div>

      <div className="app-content">
        <div className="container-fluid">
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body">
              <div className="row g-3 align-items-end">
                <div className="col-md-3">
                  <label className="form-label">Bulan</label>
                  <select
                    className="form-select"
                    value={selectedMonth}
                    onChange={(event) => setSelectedMonth(event.target.value)}
                  >
                    {monthOptions.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-3">
                  <label className="form-label">Tahun</label>
                  <select
                    className="form-select"
                    value={selectedYear}
                    onChange={(event) => setSelectedYear(event.target.value)}
                  >
                    <option value="all">Semua tahun</option>
                    {yearOptions.map((year) => (
                      <option key={year.value} value={year.value}>
                        {year.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6 d-flex justify-content-md-end gap-2 flex-wrap">
                  <Link href="/admin/guru/jurnal-mengajar/tambah" className="btn btn-primary">
                    <i className="fas fa-plus me-2"></i>
                    Tambah Jurnal
                  </Link>
                  <button
                    type="button"
                    className="btn btn-outline-success"
                    onClick={() => {
                      if (filteredEntries.length === 0) {
                        alert("Tidak ada data jurnal untuk dicetak pada filter saat ini.");
                        return;
                      }
                      setShowPrintConfirmModal(true);
                    }}
                  >
                    <i className="fas fa-print me-2"></i>
                    Cetak Bulan
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="card shadow-sm border-0">
            <div className="card-header bg-white border-bottom py-3">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                <h5 className="mb-0">Daftar jurnal</h5>
                <div style={{ width: "100%", maxWidth: 420 }}>
                  <SearchInput
                    value={search}
                    onChange={setSearch}
                    placeholder="Cari materi, kelas, mapel, atau tanggal..."
                  />
                </div>
              </div>
            </div>

            <div className="card-body">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="table-responsive">
                    <table className="table table-bordered table-striped table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th className="text-center" style={{ width: 60 }}>No</th>
                          <th style={{ minWidth: 130 }}>Tanggal</th>
                          <th style={{ minWidth: 140 }}>Kelas</th>
                          <th style={{ minWidth: 180 }}>Mapel</th>
                          <th style={{ minWidth: 90 }}>Jam</th>
                          <th style={{ minWidth: 220 }}>Materi</th>
                          <th style={{ minWidth: 90 }}>Status</th>
                          <th className="text-center" style={{ minWidth: 95 }}>Cetak</th>
                          <th className="text-center" style={{ minWidth: 150 }}>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEntries.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="text-center text-muted py-4">
                              Tidak ada data jurnal sesuai filter.
                            </td>
                          </tr>
                        ) : (
                          currentData.map((entry, index) => {
                            const kelasNama = kelasList.find((item) => item.id === entry.kelasId)?.namaKelas ?? "-";
                            const mapelNama = mapelLabelMap.get(entry.mapelId) ?? "-";

                            return (
                              <tr key={entry.id}>
                                <td className="text-center">{startIndex + index + 1}</td>
                                <td>{formatDate(entry.tanggal)}</td>
                                <td>{kelasNama}</td>
                                <td>{mapelNama}</td>
                                <td>{entry.jamKe}</td>
                                <td>{entry.materi || "-"}</td>
                                <td>
                                  <span
                                    className={`badge ${
                                      entry.status === "Selesai"
                                        ? "bg-success"
                                        : "bg-secondary"
                                    }`}
                                  >
                                    {entry.status}
                                  </span>
                                </td>
                                <td className="text-center">
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => printJournal(entry)}
                                  >
                                    <i className="fas fa-print"></i>
                                  </button>
                                </td>
                                <td className="text-center">
                                  <div className="d-flex justify-content-center gap-2">
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-warning"
                                      onClick={() => openEditModal(entry)}
                                    >
                                      <i className="fas fa-edit"></i>
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() => handleDelete(entry.id)}
                                    >
                                      <i className="fas fa-trash"></i>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  <TableFooter
                    currentPage={currentPage}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    totalData={filteredEntries.length}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={(size) => {
                      setPageSize(size);
                      setCurrentPage(1);
                    }}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Konfirmasi Hapus</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteTargetId(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <p className="mb-0">Apakah Anda yakin ingin menghapus data jurnal ini?</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteTargetId(null);
                  }}
                >
                  Batal
                </button>
                <button type="button" className="btn btn-danger" onClick={confirmDelete}>
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPrintConfirmModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Konfirmasi Cetak Bulan</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowPrintConfirmModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p className="mb-0">
                  Anda akan mencetak rekap jurnal untuk periode {selectedMonth === "all" ? "semua bulan" : getMonthLabel(selectedMonth)} {selectedYear === "all" ? "semua tahun" : selectedYear}. Lanjutkan?
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPrintConfirmModal(false)}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={async () => {
                    setShowPrintConfirmModal(false);
                    await printMonthlyJournal();
                  }}
                >
                  Cetak
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isEditOpen && editForm && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Jurnal Mengajar</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setIsEditOpen(false);
                    setEditForm(null);
                    setEditingId(null);
                  }}
                ></button>
              </div>

              <form onSubmit={handleEditSubmit}>
                <div className="modal-body row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Tanggal</label>
                    <input
                      type="date"
                      className="form-control"
                      value={editForm.tanggal}
                      onChange={(event) =>
                        setEditForm((prev) =>
                          prev ? { ...prev, tanggal: event.target.value } : prev,
                        )
                      }
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={editForm.status}
                      onChange={(event) =>
                        setEditForm((prev) =>
                          prev
                            ? { ...prev, status: event.target.value as "Draft" | "Selesai" }
                            : prev,
                        )
                      }
                    >
                      <option value="Draft">Draft</option>
                      <option value="Selesai">Selesai</option>
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Kelas</label>
                    <select
                      className="form-select"
                      value={editForm.kelasId}
                      onChange={(event) =>
                        setEditForm((prev) =>
                          prev ? { ...prev, kelasId: event.target.value } : prev,
                        )
                      }
                      required
                    >
                      <option value="">Pilih kelas</option>
                      {kelasList.map((kelas) => (
                        <option key={kelas.id} value={kelas.id}>
                          {kelas.namaKelas}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Mata Pelajaran</label>
                    <select
                      className="form-select"
                      value={editForm.mapelId}
                      onChange={(event) =>
                        setEditForm((prev) =>
                          prev ? { ...prev, mapelId: event.target.value } : prev,
                        )
                      }
                      required
                    >
                      <option value="">Pilih mata pelajaran</option>
                      {MATA_PELAJARAN.map((mapel) => (
                        <option key={mapel.idMataPelajaran} value={mapel.idMataPelajaran}>
                          {mapel.namaMataPelajaran}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Jam Ke</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editForm.jamKe}
                      onChange={(event) =>
                        setEditForm((prev) =>
                          prev ? { ...prev, jamKe: event.target.value } : prev,
                        )
                      }
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Materi</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editForm.materi}
                      onChange={(event) =>
                        setEditForm((prev) =>
                          prev ? { ...prev, materi: event.target.value } : prev,
                        )
                      }
                    />
                  </div>

                  <div className="col-md-12">
                    <label className="form-label">Tujuan Pembelajaran</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={editForm.tujuanPembelajaran}
                      onChange={(event) =>
                        setEditForm((prev) =>
                          prev
                            ? { ...prev, tujuanPembelajaran: event.target.value }
                            : prev,
                        )
                      }
                    />
                  </div>

                  <div className="col-md-12">
                    <label className="form-label">Kegiatan Pembelajaran</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={editForm.kegiatanPembelajaran}
                      onChange={(event) =>
                        setEditForm((prev) =>
                          prev
                            ? { ...prev, kegiatanPembelajaran: event.target.value }
                            : prev,
                        )
                      }
                    />
                  </div>

                  <div className="col-md-12">
                    <label className="form-label">Catatan</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={editForm.catatan}
                      onChange={(event) =>
                        setEditForm((prev) =>
                          prev ? { ...prev, catatan: event.target.value } : prev,
                        )
                      }
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setIsEditOpen(false);
                      setEditForm(null);
                      setEditingId(null);
                    }}
                  >
                    Batal
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
