"use client";

import { FailedImportItem } from "@/hooks/useUploadProgress";
import * as XLSX from "xlsx";

interface UploadProgressProps {
  loading: boolean;
  finished: boolean;
  progress: number;

  total: number;
  success: number;

  failed: FailedImportItem[];

  title?: string;
  subtitle?: string;

  onFinish?: () => void;
}

export default function UploadProgress({
  loading,
  finished,
  progress,

  total,
  success,
  failed,

  title = "Mengupload Data",
  subtitle = "Mohon tunggu hingga proses selesai...",

  onFinish,
}: UploadProgressProps) {
  if (!loading) return null;

  // Menampilkan kolom data gagal jika ada data gagal
  const columns =
    failed.length > 0
      ? Object.keys(failed[0].data)
      : [];

  // Download data gagal
  const downloadFailedData = () => {
    if (failed.length === 0) return;

    const rows = failed.map((item) => ({
      ...item.data,
      "Keterangan Gagal Upload": item.reason,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Data Gagal"
    );

    XLSX.writeFile(
      workbook,
      `Data_Gagal_Import_${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`
    );
  };

  return (
    <div className="card shadow-sm border-0 mt-4 upload-card">

      <div className="card-body">

        {/* ================= Header ================= */}

        <div className="d-flex justify-content-between align-items-center mb-3">

          <div>

            <h5 className="mb-1">
              <i className="fas fa-cloud-upload-alt text-primary me-2"></i>
              {title}
            </h5>

            <small className="text-muted">
              {subtitle}
            </small>

          </div>

          <div className="text-end">

            <h3 className="text-primary mb-0">
              {progress}%
            </h3>

          </div>

        </div>

        {/* ================= Progress ================= */}

        <div
          className="progress rounded-pill"
          style={{ height: 12 }}
        >
          <div
            className="progress-bar progress-bar-striped progress-bar-animated"
            style={{
              width: `${progress}%`,
              transition: "width .4s ease",
            }}
          />
        </div>

        {/* ================= Upload ================= */}

        {!finished && (

          <div className="mt-4 text-muted">

            <i className="fas fa-spinner fa-spin me-2"></i>

            Sedang memproses data...

          </div>

        )}

        {/* ================= Result ================= */}

        {finished && (

          <>

            <div className="text-center mt-4">

              <i
                className="fas fa-check-circle text-success mb-3"
                style={{ fontSize: 60 }}
              />

              <h4 className="text-success">
                Import Data Selesai
              </h4>

            </div>

            {/* Ringkasan */}

            <div className="row text-center mt-4">

              <div className="col">

                <div className="border rounded p-3">

                  <h3>{total}</h3>

                  <small className="text-muted">
                    Total
                  </small>

                </div>

              </div>

              <div className="col">

                <div className="border rounded p-3">

                  <h3 className="text-success">
                    {success}
                  </h3>

                  <small className="text-muted">
                    Berhasil
                  </small>

                </div>

              </div>

              <div className="col">

                <div className="border rounded p-3">

                  <h3 className="text-danger">
                    {failed.length}
                  </h3>

                  <small className="text-muted">
                    Gagal
                  </small>

                </div>

              </div>

            </div>

            {/* Data gagal */}

            {failed.length > 0 && (

              <div className="mt-4">

                <h6 className="text-danger mb-3">

                  <i className="fas fa-exclamation-circle me-2"></i>

                  Data Gagal Diimport

                </h6>

                <div className="table-responsive">

                  <table className="table table-bordered table-hover">

                    <thead className="table-light">
                      <tr>

                        <th>Baris</th>

                        {columns.map((column) => (
                          <th key={column}>
                            {column}
                          </th>
                        ))}

                        <th>Keterangan Gagal Upload</th>

                      </tr>
                    </thead>
                    <tbody>

                      {failed.map((item, index) => (

                        <tr key={index}>

                          <td>{item.row}</td>

                          {columns.map((column) => (
                            <td key={column}>
                              {String(item.data[column] ?? "-")}
                            </td>
                          ))}

                          <td className="text-danger">
                            {item.reason}
                          </td>

                        </tr>

                      ))}

                    </tbody>
                  </table>

                </div>

              </div>

            )}

            {/* Tombol */}

            <div className="d-flex justify-content-center gap-2 flex-wrap mt-4">

              {failed.length > 0 && (
                <button
                  className="btn btn-outline-danger"
                  onClick={downloadFailedData}
                >
                  <i className="fas fa-file-excel me-2"></i>
                  Download Data Gagal (.xlsx)
                </button>
              )}

              <button
                className="btn btn-success"
                onClick={onFinish}
              >
                <i className="fas fa-check me-2"></i>
                Selesai
              </button>

            </div>

          </>

        )}

      </div>

    </div>
  );
}