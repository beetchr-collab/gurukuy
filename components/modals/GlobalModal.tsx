"use client";

import { ModalOptions } from "./ModalContext";

interface Props {
  show: boolean;
  options: ModalOptions | null;
  onClose: () => void;
}

export default function GlobalModal({
  show,
  options,
  onClose,
}: Props) {

  if (!show || !options) return null;

  const icon = {
    success: "fas fa-check-circle text-success",
    error: "fas fa-times-circle text-danger",
    warning: "fas fa-exclamation-triangle text-warning",
    info: "fas fa-info-circle text-info",
  };

  return (
    <div
      className="modal fade show"
      style={{
        display: "block",
        background: "rgba(0,0,0,.5)",
      }}
    >
      <div className="modal-dialog modal-dialog-centered">

        <div className="modal-content">

          <div className="modal-header">

            <h5 className="modal-title">
              {options.title}
            </h5>

          </div>

          <div className="modal-body text-center">

            <i
              className={`${icon[options.type ?? "info"]} fa-4x mb-3`}
            />

            <p>{options.message}</p>

          </div>

          <div className="modal-footer">

            <button
              className="btn btn-primary"
              onClick={() => {
                onClose();
                options.onConfirm?.();
              }}
            >
              OK
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}