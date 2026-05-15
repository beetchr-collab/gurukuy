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
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">

                    {/* HEADER */}
                    <div className="modal-header bg-danger">
                        <h5 className="modal-title text-white">
                            <i className="fas fa-trash-alt me-2"></i>
                            {title}
                        </h5>

                        <button
                            type="button"
                            className="btn-close btn-close-white"
                            data-bs-dismiss="modal"
                        ></button>
                    </div>

                    {/* BODY */}
                    <div className="modal-body text-center py-4">

                        <div
                            className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle bg-danger"
                            style={{
                                width: "80px",
                                height: "80px",
                                fontSize: "32px",
                                color: "#fff",
                            }}
                        >
                            <i className="fas fa-exclamation"></i>
                        </div>

                        <h4 className="fw-bold">
                            Yakin ingin menghapus?
                        </h4>

                        <p className="text-muted mb-0">
                            {message}
                        </p>

                    </div>

                    {/* FOOTER */}
                    <div className="modal-footer justify-content-between">

                        <button
                            type="button"
                            className="btn btn-default"
                            data-bs-dismiss="modal"
                        >
                            Batal
                        </button>

                        <button
                            type="button"
                            className="btn btn-danger"
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
                                    <i className="fas fa-trash me-2"></i>
                                    Ya, Hapus
                                </>
                            )}
                        </button>

                    </div>
                </div>
            </div>
        </div>
    );
}