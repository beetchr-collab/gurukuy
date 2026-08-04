'use client';

import { useEffect, useState, type FormEvent } from "react";
import { collection, deleteDoc, doc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import DataTableFooter from "@/components/pagination/TableFooter";
import { usePagination } from "@/hooks/usePagination";
import { useModal } from "@/components/modals/useModal";

type SchoolData = {
  id: string;
  namaSekolah?: string;
  npsn?: string;
  bentuk?: string;
  status?: string;
  kodeSekolah?: string;
  wa?: string;
};

const emptyEditForm = {
  namaSekolah: "",
  npsn: "",
  bentuk: "",
  status: "",
  kodeSekolah: "",
  wa: "",
};

export default function DaftarSekolahPage() {
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedSchool, setSelectedSchool] = useState<SchoolData | null>(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { showModal } = useModal();

  useEffect(() => {
    loadSchools();
  }, []);

  async function loadSchools() {
    setLoading(true);

    try {
      const snapshot = await getDocs(collection(db, "sekolah"));
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Partial<SchoolData>),
      })) as SchoolData[];

      data.sort((a, b) =>
        (a.namaSekolah || "").localeCompare(b.namaSekolah || "", "id")
      );

      setSchools(data);
    } catch (error) {
      console.error(error);
      setSchools([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredSchools = schools.filter((school) => {
    const keyword = search.toLowerCase().trim();

    if (!keyword) return true;

    return [
      school.namaSekolah,
      school.npsn,
      school.kodeSekolah,
      school.wa,
      school.status,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(keyword));
  });

  const {
    currentPage,
    pageSize,
    totalPages,
    startIndex,
    currentData,
    setCurrentPage,
    setPageSize,
  } = usePagination({
    data: filteredSchools,
    pageSize: 10,
    resetDeps: [search],
  });

  const openEditModal = (school: SchoolData) => {
    setSelectedSchool(school);
    setEditForm({
      namaSekolah: school.namaSekolah || "",
      npsn: school.npsn || "",
      bentuk: school.bentuk || "",
      status: school.status || "",
      kodeSekolah: school.kodeSekolah || "",
      wa: school.wa || "",
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedSchool(null);
    setEditForm({ ...emptyEditForm });
  };

  const handleSaveEdit = async (event: FormEvent) => {
    event.preventDefault();

    if (!selectedSchool) return;

    setSaving(true);

    try {
      await updateDoc(doc(db, "sekolah", selectedSchool.id), {
        ...editForm,
      });

      await loadSchools();
      closeEditModal();
    } catch (error) {
      console.error(error);
      alert("Gagal memperbarui data sekolah.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (school: SchoolData) => {
    showModal({
      title: "Hapus Sekolah",
      message: `Apakah Anda yakin ingin menghapus sekolah ${school.namaSekolah || school.id}?`,
      type: "warning",
      confirmText: "Hapus",
      cancelText: "Batal",
      confirmButtonClass: "btn-danger",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "sekolah", school.id));
          await loadSchools();
        } catch (error) {
          console.error(error);
          alert("Gagal menghapus sekolah.");
        }
      },
    });
  };

  const getWhatsappLink = (phone?: string) => {
    if (!phone) return "";

    const cleaned = phone.replace(/\D/g, "");
    if (!cleaned) return "";

    const normalized = cleaned.startsWith("62") ? cleaned : `62${cleaned}`;
    return `https://wa.me/${normalized}`;
  };

  return (
    <div className="container-fluid py-3">
      <div className="row mb-3">
        <div className="col-sm-6">
          <h1 className="mb-0 fs-3">Daftar Sekolah</h1>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-4">
              <h3 className="card-title mb-0">Daftar Sekolah</h3>
            </div>
            <div className="col-12 col-md-8">
              <div className="d-flex flex-wrap justify-content-md-end gap-2">
                <div className="input-group input-group-sm w-auto">
                  <span className="input-group-text">
                    <i className="bi bi-search" aria-hidden="true"></i>
                  </span>
                  <input
                    type="search"
                    className="form-control"
                    placeholder="Cari sekolah..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    aria-label="Cari sekolah"
                    style={{ width: "220px" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle m-0">
              <thead>
                <tr className="text-center">
                  <th>No</th>
                  <th>Nama Sekolah</th>
                  <th>NPSN</th>
                  <th>Jenjang</th>
                  <th>Status</th>
                  <th>Kode Sekolah</th>
                  <th>No WA</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredSchools.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-4">
                      <i className="fas fa-search fa-2x mb-2 d-block"></i>
                      Data sekolah tidak ditemukan.
                    </td>
                  </tr>
                ) : (
                  currentData.map((school, index) => {
                    const whatsappLink = getWhatsappLink(school.wa);

                    return (
                      <tr key={school.id}>
                        <td className="text-center">{startIndex + index + 1}</td>
                        <td>{school.namaSekolah || "-"}</td>
                        <td>{school.npsn || "-"}</td>
                        <td>{school.bentuk || "-"}</td>
                        <td className="text-center">
                          <span
                            className={`badge ${
                              (school.status || "")
                                .toLowerCase()
                                .includes("swasta")
                                ? "bg-info"
                                : "bg-success"
                            }`}
                          >
                            {school.status || "Aktif"}
                          </span>
                        </td>
                        <td>{school.kodeSekolah || "-"}</td>
                        <td>
                          {whatsappLink ? (
                            <a
                              href={whatsappLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-success fw-semibold"
                            >
                              {school.wa}
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="text-center">
                          <div className="btn-group btn-group-sm">
                            <button
                              type="button"
                              className="btn btn-outline-secondary"
                              title="Edit Sekolah"
                              onClick={() => openEditModal(school)}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger"
                              title="Hapus Sekolah"
                              onClick={() => handleDelete(school)}
                            >
                              <i className="bi bi-trash"></i>
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
        </div>

        <div className="card-footer p-3 border-top">
          <DataTableFooter
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalData={filteredSchools.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
            showPageSize={true}
            showInfo={true}
          />
        </div>
      </div>

      {isEditModalOpen && selectedSchool && (
        <div className="modal fade show d-block" tabIndex={-1} role="dialog">
          <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 16 }}>
              <div className="modal-header bg-primary text-white border-0">
                <h5 className="modal-title fw-semibold">Edit Sekolah</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={closeEditModal}
                />
              </div>

              <form onSubmit={handleSaveEdit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Nama Sekolah</label>
                    <input
                      name="namaSekolah"
                      className="form-control"
                      value={editForm.namaSekolah}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, namaSekolah: e.target.value }))
                      }
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">NPSN</label>
                    <input
                      name="npsn"
                      className="form-control"
                      value={editForm.npsn}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, npsn: e.target.value }))
                      }
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Status</label>
                    <input
                      name="status"
                      className="form-control"
                      value={editForm.status}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, status: e.target.value }))
                      }
                      placeholder="Negeri / Swasta"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Kode Sekolah</label>
                    <input
                      name="kodeSekolah"
                      className="form-control"
                      value={editForm.kodeSekolah}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, kodeSekolah: e.target.value }))
                      }
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">No WA</label>
                    <input
                      name="wa"
                      className="form-control"
                      value={editForm.wa}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, wa: e.target.value }))
                      }
                      placeholder="Contoh: 6281234567890"
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeEditModal}
                  >
                    Batal
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? "Menyimpan..." : "Simpan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}