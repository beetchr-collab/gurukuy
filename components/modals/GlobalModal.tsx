"use client";

import { useState, type ReactNode } from "react";
import { ModalOptions } from "./ModalContext";

type LocalModalOptions = ModalOptions & {
  content?: () => ReactNode;
};

interface Props {
  show: boolean;
  options: LocalModalOptions | null;
  onClose: () => void;
}

export default function GlobalModal({
  show,
  options,
  onClose,
}: Props) {
  const [loading, setLoading] = useState(false);

  if (!show || !options) return null;

  const modalType = options.type ?? "info";

  const icons = {
    success: "fas fa-check-circle",
    error: "fas fa-times-circle",
    warning: "fas fa-exclamation-triangle",
    info: "fas fa-info-circle",
  };

  const iconColors = {
    success: "text-success",
    error: "text-danger",
    warning: "text-warning",
    info: "text-primary",
  };

  const headerColors = {
    success: "bg-success",
    error: "bg-danger",
    warning: "bg-warning",
    info: "bg-primary",
  };

  const defaultButton = {
    success: "btn-success",
    error: "btn-danger",
    warning: "btn-danger",
    info: "btn-primary",
  };

  const handleConfirm = async () => {
    if (!options.onConfirm) {
      onClose();
      return;
    }

    try {
      setLoading(true);

      await options.onConfirm();

      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="modal fade show d-block">
        <div
          className={`modal-dialog modal-${options.size ?? "md"} modal-dialog-centered`}
        >
          <div
            className="modal-content border-0 shadow-lg"
            style={{ borderRadius: 16 }}
          >
            {/* Header */}

            <div
              className={`modal-header ${
                headerColors[modalType]
              } text-white border-0`}
            >
              <h5 className="modal-title fw-semibold">
                {options.title}
              </h5>

              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onClose}
                disabled={loading}
              />
            </div>

            {/* Body */}

            <div className="modal-body p-4">

              <div className="text-center">

                <div
                  className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center shadow-sm"
                  style={{
                    width: 90,
                    height: 90,
                  }}
                >
                  <i
                    className={`${icons[modalType]} ${iconColors[modalType]}`}
                    style={{
                      fontSize: 40,
                    }}
                  />
                </div>

              </div>

              {options.message && (
                <p
                  className="text-center text-muted mt-4 mb-0"
                  style={{
                    lineHeight: 1.7,
                  }}
                >
                  {options.message}
                </p>
              )}

              {(options.render || options.content) && (
                <div className="mt-4">
                  {options.render
                    ? options.render(onClose)
                    : options.content?.()}
                </div>
              )}
            </div>

            {/* Footer */}

            <div className="modal-footer">

              {!options.hideCancelButton && (
                <button
                  className="btn btn-secondary"
                  onClick={onClose}
                  disabled={loading}
                >
                  <i className="bi bi-x-circle me-2"></i>

                  {options.cancelText ?? "Batal"}
                </button>
              )}

              <button
                className={`btn ${
                  options.confirmButtonClass ??
                  defaultButton[modalType]
                }`}
                onClick={handleConfirm}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>

                    Memproses...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle me-2"></i>

                    {options.confirmText ?? "OK"}
                  </>
                )}
              </button>

            </div>

          </div>
        </div>
      </div>

      {/* Backdrop */}

      <div
        className="modal-backdrop fade show"
        style={{
          backdropFilter: "blur(2px)",
        }}
      />
    </>
  );
}