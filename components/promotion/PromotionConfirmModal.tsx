"use client";

interface PromotionConfirmModalProps {
  open: boolean;
  loading: boolean;

  total: number;

  currentAcademicYear: string;
  nextAcademicYear: string;

  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function PromotionConfirmModal({
  open,
  loading,
  total,
  currentAcademicYear,
  nextAcademicYear,
  onClose,
  onConfirm,
}: PromotionConfirmModalProps) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="modal-backdrop fade show"
        style={{ zIndex: 1040 }}
      />

      {/* Modal */}
      <div
        className="modal fade show d-block"
        tabIndex={-1}
        style={{ zIndex: 1050 }}
      >
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">

            <div className="modal-header bg-warning">

              <h5 className="modal-title">
                <i className="fas fa-exclamation-triangle mr-2" />
                Konfirmasi Kenaikan Tingkat
              </h5>

              {!loading && (
                <button
                  type="button"
                  className="close"
                  onClick={onClose}
                >
                  <span>&times;</span>
                </button>
              )}

            </div>

            <div className="modal-body">

              <div className="alert alert-warning">

                <h5>
                  <i className="icon fas fa-info-circle mr-2" />
                  Perhatian
                </h5>

                <p className="mb-2">
                  Anda akan melakukan proses kenaikan tingkat
                  siswa.
                </p>

                <p className="mb-0">
                  Proses ini akan memperbarui data siswa secara
                  permanen.
                </p>

              </div>

              <table className="table table-bordered">

                <tbody>

                  <tr>
                    <th style={{ width: '40%' }}>
                      Tahun Ajaran Saat Ini
                    </th>

                    <td>{currentAcademicYear}</td>
                  </tr>

                  <tr>

                    <th>
                      Tahun Ajaran Baru
                    </th>

                    <td>{nextAcademicYear}</td>

                  </tr>

                  <tr>

                    <th>
                      Jumlah Siswa Diproses
                    </th>

                    <td>
                      <strong>{total}</strong> siswa
                    </td>

                  </tr>

                </tbody>

              </table>

              <div className="alert alert-danger mb-0">

                <strong>⚠ Penting</strong>

                <ul className="mb-0 mt-2">

                  <li>
                    Pastikan seluruh data sudah benar.
                  </li>

                  <li>
                    Pastikan tidak ada siswa yang terlewat.
                  </li>

                  <li>
                    Setelah diproses data akan berubah ke
                    tahun ajaran berikutnya.
                  </li>

                  <li>
                    Kelas 6 akan otomatis berstatus
                    <strong> Lulus</strong>.
                  </li>

                </ul>

              </div>

            </div>

            <div className="modal-footer">

              <button
                className="btn btn-secondary"
                disabled={loading}
                onClick={onClose}
              >
                Batal
              </button>

              <button
                className="btn btn-success"
                disabled={loading}
                onClick={onConfirm}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm mr-2" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check mr-2" />
                    Ya, Proses Sekarang
                  </>
                )}
              </button>

            </div>

          </div>
        </div>
      </div>
    </>
  );
}