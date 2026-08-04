"use client";

import React from "react";

interface DeleteModalProps {
  id?: string | null;
  title?: string;
  message?: string;
  loading?: boolean;
  onConfirm: () => void;
}

export default function DeleteModal({
  title = "Hapus Data",
  message = "Data yang dihapus tidak dapat dikembalikan.",
  loading = false,
  onConfirm,
}: DeleteModalProps) {
  return (
    <div
      className="modal fade"
      id="globalDeleteModal"
      tabIndex={-1}
      aria-hidden="true"
    >
      <div className="modal-dialog modal-dialog-centered modal-sm modal-md">
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">

          {/* Header */}
          <div className="modal-header border-0 bg-danger text-white py-3">
            <h5 className="modal-title fw-semibold">
              <i className="fas fa-trash-alt me-2"></i>
              {title}
            </h5>

            <button
              type="button"
              className="btn-close btn-close-white"
              data-bs-dismiss="modal"
            ></button>
          </div>

          {/* Body */}
          <div className="modal-body text-center px-4 py-4">

            <div
              className="mx-auto mb-4 rounded-circle d-flex align-items-center justify-content-center shadow-sm"
              style={{
                width: 90,
                height: 90,
                background:
                  "linear-gradient(135deg,#dc3545 0%,#ff6b6b 100%)",
              }}
            >
              <i
                className="fas fa-trash-alt text-white"
                style={{ fontSize: 34 }}
              ></i>
            </div>

            <h4 className="fw-bold mb-2">
              Yakin ingin menghapus?
            </h4>

            <p
              className="text-muted mb-0"
              style={{
                lineHeight: 1.7,
              }}
            >
              {message}
            </p>

            <div className="alert alert-warning mt-4 mb-0 text-start">
              <i className="fas fa-exclamation-triangle me-2"></i>
              <strong>Perhatian!</strong>
              <br />
              Data yang telah dihapus tidak dapat dikembalikan lagi.
            </div>

          </div>

          {/* Footer */}
          <div className="modal-footer border-0 pt-0 pb-4 px-4">

            <div className="d-grid gap-2 d-md-flex w-100">

              <button
                type="button"
                className="btn btn-light border flex-fill"
                data-bs-dismiss="modal"
              >
                <i className="fas fa-times me-2"></i>
                Batal
              </button>

              <button
                type="button"
                className="btn btn-danger flex-fill"
                onClick={onConfirm}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Menghapus...
                  </>
                ) : (
                  <>
                    <i className="fas fa-trash-alt me-2"></i>
                    Ya, Hapus
                  </>
                )}
              </button>

            </div>

          </div>

        </div>
      </div>
    </div>
  );
}