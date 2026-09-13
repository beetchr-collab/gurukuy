"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { MATA_PELAJARAN } from "@/lib/mata-pelajaran";
import { getClassesByOwner } from "@/services/kelas.service";
import { getActiveTahunAjaran } from "@/services/tahunajaran.service";
import {
  MEDIA_PEMBELAJARAN_OPTIONS,
  METODE_PEMBELAJARAN_OPTIONS,
  REFLEKSI_PEMBELAJARAN_OPTIONS,
  type SelectOption,
} from "@/lib/jurnal-pembelajaran";

type ExcelRow = Record<string, string | number | boolean | null | undefined>;

type ImportReport = {
  total: number;
  success: number;
  failed: number;
  errors: string[];
  failedRows?: Array<ExcelRow & { error?: string }>;
};

type AttendanceSummary = {
  jumlahSiswa: number;
  siswaHadir: number;
  siswaIzin: number;
  siswaSakit: number;
  siswaAlpha: number;
};

type KelasOption = {
  id: string;
  namaKelas: string;
};

type ImportFieldKey =
  | "tanggal"
  | "jamKe"
  | "materi"
  | "tujuanPembelajaran"
  | "kegiatanPembelajaran"
  | "metodePembelajaran"
  | "mediaPembelajaran"
  | "catatan";

type FieldConfig = {
  key: ImportFieldKey;
  label: string;
  required: boolean;
};

const FIELD_CONFIG: FieldConfig[] = [
  { key: "tanggal", label: "Tanggal", required: true },
  { key: "jamKe", label: "Jam Ke", required: false },
  { key: "materi", label: "Materi", required: true },
  { key: "tujuanPembelajaran", label: "Tujuan Pembelajaran", required: true },
  { key: "kegiatanPembelajaran", label: "Kegiatan Pembelajaran", required: true },
  { key: "metodePembelajaran", label: "Metode Pembelajaran", required: false },
  { key: "mediaPembelajaran", label: "Media Pembelajaran", required: false },
  { key: "catatan", label: "Catatan / Refleksi", required: false },
];

const normalizeHeader = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .replace(/^id$/, "id");

const normalizeText = (value: unknown) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return String(value).trim();
};

const splitValues = (raw: string) =>
  raw
    .split(/[;,|\n]/)
    .map((item) => item.trim())
    .filter(Boolean);

const matchOption = (value: string, options: SelectOption[]) => {
  const input = value.trim();

  if (!input) return [];

  const matches = options.filter((option) => {
    const optionLabel = option.value.toLowerCase();
    const optionShort = option.label.toLowerCase();
    const inputLower = input.toLowerCase();

    return (
      optionLabel === inputLower ||
      optionShort === inputLower ||
      optionLabel.includes(inputLower) ||
      optionShort.includes(inputLower) ||
      inputLower.includes(optionLabel) ||
      inputLower.includes(optionShort)
    );
  });

  if (matches.length) return matches.map((item) => item.value);

  return [input];
};

const parseMultiValues = (raw: string, options: SelectOption[]) => {
  const values = splitValues(raw);

  const result: string[] = [];

  values.forEach((value) => {
    const matched = matchOption(value, options);
    matched.forEach((item) => {
      if (!result.includes(item)) {
        result.push(item);
      }
    });
  });

  return result;
};

export default function ImportJurnalPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ExcelRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [fieldMap, setFieldMap] = useState<Record<string, string>>({});
  const [fileName, setFileName] = useState("");
  const [saving, setSaving] = useState(false);
  const [tahunAjaran, setTahunAjaran] = useState("");
  const [kelasList, setKelasList] = useState<KelasOption[]>([]);
  const [kelasId, setKelasId] = useState("");
  const [mapelId, setMapelId] = useState("");
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [failedData, setFailedData] = useState<Array<ExcelRow & { error?: string }>>([]);
  const [attendanceByDate, setAttendanceByDate] = useState<
    Record<string, AttendanceSummary>
  >({});

  useEffect(() => {
    const loadMeta = async () => {
      if (!user?.schoolId || !user?.uid) {
        setLoading(false);
        return;
      }

      try {
        const [classes, activeYear] = await Promise.all([
          getClassesByOwner(user.uid),
          getActiveTahunAjaran(user.schoolId),
        ]);
        setKelasList(classes);
        setTahunAjaran(activeYear?.tahunAjaran ?? "");
      } catch (error) {
        console.error("Gagal memuat data meta jurnal:", error);
      } finally {
        setLoading(false);
      }
    };

    loadMeta();
  }, [user]);

  useEffect(() => {
    const loadAttendance = async () => {
      if (!user?.schoolId || !kelasId || !rows.length) {
        setAttendanceByDate({});
        return;
      }

      const dates = Array.from(
        new Set(
          rows
            .map((row) => normalizeText(row[fieldMap.tanggal]))
            .filter(Boolean),
        ),
      );

      try {
        const entries = await Promise.all(
          dates.map(async (tanggal) => {
            const attendanceQuery = query(
              collection(db, "presensi"),
              where("schoolId", "==", user.schoolId),
              where("kelasId", "==", kelasId),
              where("tanggal", "==", tanggal),
            );
            const snapshot = await getDocs(attendanceQuery);
            const students = snapshot.docs.flatMap((document) => {
              const value: unknown = document.data().siswa;
              return Array.isArray(value) ? value : [];
            }) as Array<{ status?: unknown }>;

            const countStatus = (status: string) =>
              students.filter(
                (student) =>
                  normalizeText(student.status).toLowerCase() ===
                  status.toLowerCase(),
              ).length;

            return [tanggal, {
              jumlahSiswa: students.length,
              siswaHadir: countStatus("Hadir"),
              siswaIzin: countStatus("Izin"),
              siswaSakit: countStatus("Sakit"),
              siswaAlpha: countStatus("Alpha"),
            }] as const;
          }),
        );

        setAttendanceByDate(Object.fromEntries(entries));
      } catch (error) {
        console.error("Gagal memuat presensi jurnal:", error);
        setAttendanceByDate({});
      }
    };

    loadAttendance();
  }, [user, kelasId, rows, fieldMap.tanggal]);

  const downloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Jurnal Mengajar");
    const referenceSheet = workbook.addWorksheet("Referensi");
    const headers = FIELD_CONFIG.map((field) => field.key);

    worksheet.addRow(headers);
    worksheet.addRow([
      "2026-09-01",
      "1-2",
      "Contoh materi pembelajaran",
      "Siswa mampu menjelaskan konsep utama materi",
      "Guru menjelaskan materi, siswa berdiskusi, lalu mengerjakan latihan",
      METODE_PEMBELAJARAN_OPTIONS[0].value,
      MEDIA_PEMBELAJARAN_OPTIONS[0].value,
      REFLEKSI_PEMBELAJARAN_OPTIONS[0].value,
    ]);
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0D6EFD" },
    };
    worksheet.views = [{ state: "frozen", ySplit: 1 }];
    worksheet.autoFilter = { from: "A1", to: "H1" };

    const referenceLists = [
      { name: "Metode", values: METODE_PEMBELAJARAN_OPTIONS.map((item) => item.value), column: "A" },
      { name: "Media", values: MEDIA_PEMBELAJARAN_OPTIONS.map((item) => item.value), column: "B" },
      { name: "Refleksi", values: REFLEKSI_PEMBELAJARAN_OPTIONS.map((item) => item.value), column: "C" },
    ];

    referenceLists.forEach(({ name, values, column }) => {
      referenceSheet.getCell(`${column}1`).value = name;
      values.forEach((value, index) => {
        referenceSheet.getCell(`${column}${index + 2}`).value = value;
      });
    });

    workbook.definedNames.add(
      "MetodeList",
      `'Referensi'!$A$2:$A$${METODE_PEMBELAJARAN_OPTIONS.length + 1}`,
    );
    workbook.definedNames.add(
      "MediaList",
      `'Referensi'!$B$2:$B$${MEDIA_PEMBELAJARAN_OPTIONS.length + 1}`,
    );
    workbook.definedNames.add(
      "RefleksiList",
      `'Referensi'!$C$2:$C$${REFLEKSI_PEMBELAJARAN_OPTIONS.length + 1}`,
    );
    const validationByField: Record<string, string> = {
      metodePembelajaran: "MetodeList",
      mediaPembelajaran: "MediaList",
      catatan: "RefleksiList",
    };

    headers.forEach((header, index) => {
      const column = worksheet.getColumn(index + 1);
      column.width = header === "catatan" || header.includes("Pembelajaran") ? 35 : 20;
      const formula = validationByField[header];

      if (formula) {
        for (let row = 2; row <= 501; row += 1) {
          worksheet.getCell(row, index + 1).dataValidation = {
            type: "list",
            allowBlank: true,
            formulae: [`=${formula}`],
            showErrorMessage: true,
            errorTitle: "Pilihan tidak valid",
            error: "Pilih nilai dari dropdown. Untuk beberapa pilihan, pisahkan dengan titik koma (;).",
            showInputMessage: true,
            promptTitle: "Pilihan jurnal",
            prompt: "Pilih dari dropdown. Untuk banyak pilihan, gunakan pemisah titik koma (;).",
          };
        }
      }
    });

    worksheet.getColumn(1).numFmt = "@";
    worksheet.getColumn(2).numFmt = "@";

    referenceSheet.getCell("E1").value = "Petunjuk";
    referenceSheet.getCell("E2").value = "Metode, media, dan catatan/refleksi menggunakan dropdown. Untuk beberapa pilihan, pisahkan dengan titik koma (;).";
    referenceSheet.state = "veryHidden";

    const output = await workbook.xlsx.writeBuffer();
    const blob = new Blob([output], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "template-import-jurnal-mengajar.xlsx";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, {
        type: "array",
        cellDates: false,
        raw: false,
      });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const importedData = XLSX.utils.sheet_to_json(worksheet, {
        defval: "",
        range: 0,
        raw: false,
      }) as ExcelRow[];

      const data = importedData.filter(
        (row) =>
          Object.values(row).filter((value) => normalizeText(value)).length >= 4,
      );

      if (!data.length) {
        alert("File Excel tidak berisi data.");
        setRows([]);
        setColumns([]);
        setFailedData([]);
        setReport(null);
        return;
      }

      const headers = Object.keys(data[0]);
      setColumns(headers);
      setRows(data);
      setFailedData([]);
      setReport(null);

      const nextMapping: Record<string, string> = {};

      FIELD_CONFIG.forEach((field) => {
        const match = headers.find((header) => {
          const normalizedHeader = normalizeHeader(header);
          return normalizedHeader === normalizeHeader(field.label) ||
            normalizedHeader === normalizeHeader(field.key) ||
            normalizedHeader.includes(normalizeHeader(field.key));
        });

        if (match) {
          nextMapping[field.key] = match;
        }
      });

      setFieldMap(nextMapping);
    } catch (error) {
      console.error("Gagal membaca file Excel:", error);
      alert("Gagal membaca file Excel. Pastikan format file .xlsx atau .xls.");
    }
  };

  const handleFieldMapChange = (fieldKey: string, columnName: string) => {
    setFieldMap((prev) => ({
      ...prev,
      [fieldKey]: columnName,
    }));
  };

  const buildPreparedRow = (
    row: ExcelRow,
    attendance: AttendanceSummary = {
      jumlahSiswa: 0,
      siswaHadir: 0,
      siswaIzin: 0,
      siswaSakit: 0,
      siswaAlpha: 0,
    },
  ) => {
    const getValue = (fieldKey: ImportFieldKey) => {
      const columnName = fieldMap[fieldKey];
      if (!columnName) return "";
      return normalizeText(row[columnName]);
    };

    const tanggal = getValue("tanggal");

    const metode = parseMultiValues(
      getValue("metodePembelajaran"),
      METODE_PEMBELAJARAN_OPTIONS,
    );

    const media = parseMultiValues(
      getValue("mediaPembelajaran"),
      MEDIA_PEMBELAJARAN_OPTIONS,
    );

    const catatanRaw = getValue("catatan");
    const catatan = parseMultiValues(
      catatanRaw,
      REFLEKSI_PEMBELAJARAN_OPTIONS,
    );

    return {
      tanggal: tanggal || new Date().toISOString().split("T")[0],
      jamKe: getValue("jamKe") || "1-2",
      materi: getValue("materi") || "",
      tujuanPembelajaran: getValue("tujuanPembelajaran") || "",
      kegiatanPembelajaran: getValue("kegiatanPembelajaran") || "",
      metodePembelajaran: metode,
      mediaPembelajaran: media,
      catatan: catatan.join("; ") || "",
      ...attendance,
    };
  };

  const tableRows = rows.map((row) => {
    const prepared = buildPreparedRow(row);
    return {
      ...prepared,
      ...(attendanceByDate[prepared.tanggal] ?? {
        jumlahSiswa: 0,
        siswaHadir: 0,
        siswaIzin: 0,
        siswaSakit: 0,
        siswaAlpha: 0,
      }),
    };
  });

  const downloadFailedRowsExcel = async (
    rowsToExport: Array<ExcelRow & { error?: string }>,
  ) => {
    if (!rowsToExport.length) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Data Gagal Import");
    const headers = Array.from(
      new Set(rowsToExport.flatMap((row) => Object.keys(row as Record<string, unknown>))),
    );

    worksheet.addRow(headers);

    rowsToExport.forEach((row) => {
      const values = headers.map((header) => {
        const value = (row as Record<string, unknown>)[header];
        return value === undefined || value === null ? "" : String(value);
      });
      worksheet.addRow(values);
    });

    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFDC3545" },
    };

    headers.forEach((_, index) => {
      worksheet.getColumn(index + 1).width = 22;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "data-jurnal-gagal.xlsx";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!user?.uid || !user?.schoolId) {
      alert("User belum login atau sekolah belum terdeteksi.");
      return;
    }

    if (!rows.length) {
      alert("Belum ada data Excel untuk diimport.");
      return;
    }

    const requiredFields = ["tanggal", "materi", "tujuanPembelajaran", "kegiatanPembelajaran"];
    const missingFields = requiredFields.filter((field) => !fieldMap[field]);

    if (missingFields.length) {
      alert(`Harap mapping kolom Excel untuk field: ${missingFields.join(", ")}.`);
      return;
    }

    if (!tahunAjaran || !kelasId || !mapelId) {
      alert("Tahun ajaran aktif, kelas, dan mata pelajaran harus tersedia.");
      return;
    }

    const selectedKelas = kelasList.find((item) => item.id === kelasId);
    const selectedMapel = MATA_PELAJARAN.find(
      (item) => item.idMataPelajaran === mapelId,
    );

    setSaving(true);
    setProgress(0);
    setReport(null);

    try {
      const payloads = rows.map((row) => {
        const prepared = buildPreparedRow(row);
        const item = {
          ...prepared,
          ...(attendanceByDate[prepared.tanggal] ?? {
            jumlahSiswa: 0,
            siswaHadir: 0,
            siswaIzin: 0,
            siswaSakit: 0,
            siswaAlpha: 0,
          }),
        };

        return {
          ...item,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ownerId: user.uid,
          schoolId: user.schoolId,
          tahunAjaran,
          kelasId,
          namaKelas: selectedKelas?.namaKelas ?? "",
          mapelId,
          namaMapel: selectedMapel?.namaMataPelajaran ?? "",
          status: "Selesai",
        };
      });

      let success = 0;
      const errors: string[] = [];
      const failedRowsToExport: Array<ExcelRow & { error: string }> = [];

      for (const [index, item] of payloads.entries()) {
        const sourceRow = rows[index];

        try {
          await addDoc(collection(db, "jurnal_mengajar"), {
            ...item,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          success += 1;
        } catch (error) {
          console.error(`Gagal menyimpan baris ${index + 2}:`, error);
          const failureMessage = `Baris ${index + 2}: gagal disimpan`;
          errors.push(failureMessage);
          failedRowsToExport.push({
            ...(sourceRow ?? {}),
            error: failureMessage,
          });
        }
        setProgress(Math.round(((index + 1) / payloads.length) * 100));
      }

      setFailedData(failedRowsToExport);
      const reportData: ImportReport = {
        total: payloads.length,
        success,
        failed: errors.length,
        errors,
        failedRows: failedRowsToExport,
      };

      setReport(reportData);
      alert(`Import selesai: ${success} berhasil, ${errors.length} gagal.`);

      if (failedRowsToExport.length > 0) {
        await downloadFailedRowsExcel(failedRowsToExport);
      }
    } catch (error) {
      console.error("Gagal mengimport jurnal:", error);
      const failureReport: ImportReport = {
        total: rows.length,
        success: 0,
        failed: rows.length,
        errors: ["File atau data tidak dapat diproses."],
      };
      setFailedData([]);
      setReport(failureReport);
      alert("Gagal mengimport jurnal. Periksa format Excel dan izin Firestore.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="app-main">
      <div className="app-content-header">
        <div className="container-fluid">
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0">Import Jurnal Mengajar</h4>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">Jurnal Mengajar</li>
                <li className="breadcrumb-item active">Import</li>
              </ol>
            </nav>
          </div>
        </div>
      </div>

      <div className="app-content">
        <div className="container-fluid">
          <div className="card shadow-sm border-0 rounded-4">
            <div className="card-header bg-primary text-white border-0 rounded-top-4">
              <h5 className="mb-0">Import data jurnal dari Excel</h5>
            </div>

            <div className="card-body">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="row g-3 mb-4">
                    <div className="col-md-4">
                      <label className="form-label">Tahun Ajaran Aktif</label>
                      <input
                        type="text"
                        className="form-control"
                        value={tahunAjaran}
                        readOnly
                        placeholder="Tahun ajaran aktif belum tersedia"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Kelas</label>
                      <select
                        className="form-select"
                        value={kelasId}
                        onChange={(event) => setKelasId(event.target.value)}
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
                    <div className="col-md-4">
                      <label className="form-label">Mata Pelajaran</label>
                      <select
                        className="form-select"
                        value={mapelId}
                        onChange={(event) => setMapelId(event.target.value)}
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
                  </div>

                  <div className="alert alert-secondary">
                    Tahun ajaran, kelas, mata pelajaran, dan status akan diterapkan otomatis ke semua baris import. Kehadiran tidak diambil dari Excel.
                  </div>

                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap mb-2">
                      <label className="form-label mb-0">Pilih file Excel</label>
                      <button
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={downloadTemplate}
                      >
                        <i className="fas fa-download me-2" />
                        Download Template Excel
                      </button>
                    </div>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      className="form-control"
                      onChange={handleFileUpload}
                    />
                    {fileName && (
                      <small className="text-muted d-block mt-2">
                        File: {fileName}
                      </small>
                    )}
                  </div>

                  {saving && (
                    <div className="mb-4" role="status" aria-live="polite">
                      <div className="d-flex justify-content-between mb-1">
                        <span className="fw-semibold">Mengupload jurnal...</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="progress" style={{ height: "22px" }}>
                        <div
                          className="progress-bar progress-bar-striped progress-bar-animated"
                          role="progressbar"
                          style={{ width: `${progress}%` }}
                          aria-valuenow={progress}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          {progress}%
                        </div>
                      </div>
                    </div>
                  )}

                  {report && !saving && (
                    <div
                      className={`alert ${report.failed ? "alert-warning" : "alert-success"}`}
                      role="alert"
                    >
                      <strong>Laporan import:</strong> {report.success} dari {report.total} baris berhasil disimpan.
                      {report.failed > 0 && (
                        <>
                          <div>{report.failed} baris gagal disimpan.</div>
                          <ul className="mb-0 mt-2">
                            {report.errors.slice(0, 10).map((error) => (
                              <li key={error}>{error}</li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  )}

                  {columns.length > 0 && (
                    <>
                      <div className="alert alert-info">
                        Pilih kolom Excel yang sesuai dengan setiap field jurnal.
                      </div>
                      <div className="row g-3 mb-4">
                        {FIELD_CONFIG.map((field) => (
                          <div className="col-md-6" key={field.key}>
                            <label className="form-label">{field.label}</label>
                            <select
                              className="form-select"
                              value={fieldMap[field.key] || ""}
                              onChange={(e) =>
                                handleFieldMapChange(field.key, e.target.value)
                              }
                            >
                              <option value="">Pilih kolom</option>
                              {columns.map((column) => (
                                <option key={column} value={column}>
                                  {column}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>

                      <div className="mb-4">
                        <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap mb-2">
                          <h6 className="fw-bold mb-0">Data Excel yang akan diimport</h6>
                          {report?.failed && report.failed > 0 && failedData.length > 0 && (
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => downloadFailedRowsExcel(failedData)}
                            >
                              <i className="fas fa-file-excel me-2" />
                              Download Data Gagal
                            </button>
                          )}
                        </div>
                        <div className="table-responsive">
                          <table className="table table-bordered table-sm align-middle">
                            <thead>
                              <tr>
                                <th>Tanggal</th>
                                <th>Kelas</th>
                                <th>Mapel</th>
                                <th>Jam</th>
                                <th>Metode</th>
                                <th>Media</th>
                                <th>Catatan</th>
                                <th>Jumlah</th>
                                <th>Hadir</th>
                                <th>Izin</th>
                                <th>Sakit</th>
                                <th>Alpha</th>
                              </tr>
                            </thead>
                            <tbody>
                              {tableRows.map((row, index) => (
                                <tr key={`${row.tanggal}-${index}`}>
                                  <td>{row.tanggal}</td>
                                  <td>{kelasList.find((kelas) => kelas.id === kelasId)?.namaKelas || "-"}</td>
                                  <td>{MATA_PELAJARAN.find((mapel) => mapel.idMataPelajaran === mapelId)?.namaMataPelajaran || "-"}</td>
                                  <td>{row.jamKe}</td>
                                  <td>{row.metodePembelajaran.join(", ") || "-"}</td>
                                  <td>{row.mediaPembelajaran.join(", ") || "-"}</td>
                                  <td>{row.catatan || "-"}</td>
                                  <td>{row.jumlahSiswa}</td>
                                  <td>{row.siswaHadir}</td>
                                  <td>{row.siswaIzin}</td>
                                  <td>{row.siswaSakit}</td>
                                  <td>{row.siswaAlpha}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="d-flex justify-content-end">
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={handleImport}
                          disabled={saving}
                        >
                          {saving ? "Menyimpan..." : "Import Jurnal"}
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
