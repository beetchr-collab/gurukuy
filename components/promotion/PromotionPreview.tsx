"use client";

import { PromotionStudent } from "@/types/promotion";

interface PromotionPreviewProps {
  loading: boolean;

  students: PromotionStudent[];

  onToggle: (id: string) => void;

  onProcess: () => void;
}

export default function PromotionPreview({
  loading,
  students,
  onToggle,
  onProcess,
}: PromotionPreviewProps) {
  const totalSelected = students.filter(
    (student) => student.selected
  ).length;

  const badgeClass = (status: string) => {
    switch (status) {
      case "NAIK":
        return "badge badge-success";

      case "TETAP":
        return "badge badge-warning";

      case "LULUS":
        return "badge badge-primary";

      default:
        return "badge badge-secondary";
    }
  };

  return (
    <div className="card card-outline card-primary">

      <div className="card-header">

        <h3 className="card-title">
          Preview Kenaikan Tingkat
        </h3>

        <div className="card-tools">

          <span className="badge badge-info">
            {totalSelected} Dipilih
          </span>

        </div>

      </div>

      <div className="card-body table-responsive p-0">

        <table className="table table-bordered table-hover">

          <thead>

            <tr>

              <th style={{ width: 50 }}>#</th>

              <th>Nama</th>

              <th style={{ width: 120 }}>NIS</th>
              <th style={{ width: 120 }}>NISN</th>

              <th style={{ width: 120 }}>Kelas Lama</th>

              <th style={{ width: 120 }}>Kelas Baru</th>

              <th style={{ width: 170 }}>Status</th>

            </tr>

          </thead>

          <tbody>

            {loading && (
              <tr>
                <td
                  colSpan={6}
                  className="text-center py-4"
                >
                  <div
                    className="spinner-border spinner-border-sm mr-2"
                    role="status"
                  />

                  Memuat data...
                </td>
              </tr>
            )}

            {!loading && students.length === 0 && (
              <tr>

                <td
                  colSpan={6}
                  className="text-center text-muted py-5"
                >
                  Belum ada data preview.
                </td>

              </tr>
            )}

            {!loading &&
              students.map((student) => (
                <tr key={student.id}>

                  <td className="text-center">

                    <input
                      type="checkbox"
                      checked={student.selected}
                      onChange={() =>
                        onToggle(student.id)
                      }
                    />

                  </td>

                  <td>

                    <strong>{student.nama}</strong>

                  </td>

                  <td>{student.nis}</td>

                  <td>{/* NISN not available on PromotionStudent type */ "-"}</td>

                  <td>

                    <span className="badge badge-secondary">
                      {student.kelasLama}
                    </span>

                  </td>

                  <td>

                    <span className="badge badge-success">
                      {student.kelasBaru}
                    </span>

                  </td>

                  <td>

                    <span
                      className={badgeClass(
                        student.status
                      )}
                    >
                      {student.status}
                    </span>

                  </td>

                </tr>
              ))}

          </tbody>

        </table>

      </div>

      <div className="card-footer d-flex justify-content-between align-items-center">

        <div>

          Total Data :

          <strong className="ml-2">
            {students.length}
          </strong>

        </div>

        <button
          className="btn btn-success"
          disabled={
            loading || totalSelected === 0
          }
          onClick={onProcess}
        >

          <i className="fas fa-level-up-alt mr-2" />

          Proses Kenaikan ({totalSelected})

        </button>

      </div>

    </div>
  );
}