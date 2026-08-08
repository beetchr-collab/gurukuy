'use client';

import { useEffect, useState } from "react";
import {
  getAllUsers,
  UserData,
  deleteUser,
} from "@/services/userdata.service";
import { useModal } from "@/components/modals/useModal";
import Pagination from "@/components/pagination/Pagination";
import DataTableFooter from "@/components/pagination/TableFooter";
import { usePagination } from "@/hooks/usePagination";
import { updateUserRole } from "@/services/userdata.service";

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [search, setSearch] = useState(""); // Pencarian by nama
  const [loading, setLoading] = useState(true);
  const { showModal } = useModal(); // Modal Hapus User
  // Update Modal Role
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [selectedRole, setSelectedRole] = useState<
    "superadmin" | "admin" | "guru" | "siswa"
  >("guru");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Menampilkan data users saat halaman dimuat
  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);

    const data = await getAllUsers();

    setUsers(data);
    setLoading(false);
  }

  // Simpan Update User Role
  async function handleUpdateRole() {
    if (!selectedUser) return;

    try {
      await updateUserRole(selectedUser.uid, selectedRole);
      await loadUsers();
    } catch (error) {
      console.error(error);
    } finally {
      setIsEditModalOpen(false);
      setSelectedUser(null);
    }
  }

  // Filter users berdasarkan pencarian nama, email, dan username
  const filteredUsers = users.filter((user) => {
    const keyword = search.toLowerCase().trim();

    return (
      (user.username || "").toLowerCase().includes(keyword) ||
      (user.email || "").toLowerCase().includes(keyword)
    );
  });

  const parseTimestamp = (value: any): Date | null => {
    if (!value) return null;
    if (value?.toDate) return value.toDate();
    if (value instanceof Date) return value;
    return new Date(value);
  };

  // Pagination
  const {
    currentPage,
    pageSize,
    totalPages,
    startIndex,
    currentData,
    setCurrentPage,
    setPageSize,
  } = usePagination({
    data: filteredUsers,
    pageSize: 10,
    resetDeps: [search],
  });

  return (
    <div className="container-fluid py-3">

      {/* Header */}
      <div className="row mb-3">
        <div className="col-sm-6">
          <h1 className="mb-0 fs-3">
            Users
          </h1>
        </div>

        <div className="col-sm-6">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb float-sm-end">
              <li className="breadcrumb-item">
                <a href="#">Home</a>
              </li>
              <li className="breadcrumb-item active">
                Users
              </li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Table User Directory */}
      <div className="card mb-4">
        <div className="card-header">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-4">
              <h3 className="card-title">User Directory</h3>
            </div>
            <div className="col-12 col-md-8">
              <div className="d-flex flex-wrap justify-content-md-end gap-2">
                <div className="input-group input-group-sm w-auto">
                  <span className="input-group-text">
                    <i className="bi bi-search" aria-hidden="true"></i>
                  </span>
                  <input
                    type="search"
                    id="user-search"
                    className="form-control"
                    placeholder="Cari nama user..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    aria-label="Search users"
                    style={{ width: "180px" }}
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  data-bs-toggle="modal"
                  data-bs-target=""
                >
                  <i className="bi bi-person-plus-fill me-1" aria-hidden="true"> </i>
                  Tambah User
                </button>
              </div>
            </div>
          </div>
        </div>


        <div className="card-body p-0">
          <div className="table-responsive">
            <table
              className="table table-hover align-middle m-0"
            >
              <thead>
                <tr className="text-center">
                  <th>No</th>
                  <th>Foto</th>
                  <th>Nama</th>
                  <th>Email</th>
                  <th>username</th>
                  <th>role</th>
                  <th>Terakhir Login</th>
                  <th>Status</th>
                  <th>Dibuat</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} className="text-center py-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center text-muted py-4">
                      <i className="fas fa-search fa-2x mb-2 d-block"></i>
                      User tidak ditemukan.
                    </td>
                  </tr>
                ) : (
                  currentData.map((user, index) => (
                    <tr key={user.uid}>
                      <td>{startIndex + index + 1}</td>

                      <td>
                        <img src={user?.photo ? user.photo.replace(/"/g, '') + '?sz=100' : '/default-avatar.png'} alt=""
                          className="img-size-32 rounded-circle me-2" />
                      </td>

                      <td>{user.username || "-"}</td>

                      <td>{user.email || "-"}</td>

                      <td>{user.username || "-"}</td>

                      <td>
                        <span className={`badge ${user.role === "superadmin" ? "bg-danger" : user.role === "admin" ? "bg-primary" :
                          user.role === "guru" ? "bg-success" : "bg-secondary"}`}>
                          {user.role}
                        </span>
                      </td>

                      <td>
                        {user.lastLogin ? (
                          (() => {
                            const date = parseTimestamp(user.lastLogin);
                            return date ? (
                              <div className="d-flex flex-column">
                                <span className="fw-semibold">
                                  {date.toLocaleDateString("id-ID", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </span>
                                <small className="text-muted">
                                  <i className="far fa-clock me-1"></i>
                                  {date.toLocaleTimeString("id-ID", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </small>
                              </div>
                            ) : (
                              <span className="text-muted">-</span>
                            );
                          })()
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>

                      <td>
                        <span className={`badge ${user.status === "aktif" ? "bg-success" : "bg-secondary"}`}>
                          {user.status || "Aktif"}
                        </span>
                      </td>
                      <td>
                        {user.createdAt ? (
                          <div className="d-flex flex-column">
                            <span className="fw-semibold">
                              {new Date(user.createdAt.seconds * 1000).toLocaleDateString("id-ID", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>

                            <small className="text-muted">
                              <i className="far fa-clock me-1"></i>
                              {new Date(user.createdAt.seconds * 1000).toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </small>
                          </div>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td className="text-center">
                        <div className="btn-group btn-group-sm">
                          {/* Tombol Edit user */}
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            title="Edit User"
                            onClick={() => {
                              setSelectedUser(user);
                              setSelectedRole(user.role);
                              setIsEditModalOpen(true);
                            }}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>

                          {/* Tombol Hapus user */}
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() =>
                              showModal({
                                title: "Hapus User",
                                message: `Apakah Anda yakin ingin menghapus user?`,
                                type: "warning",
                                render: () => (
                                  <>
                                    <div className="text-center mb-4">
                                      <h5 className="mt-3 mb-1">
                                        {user.username}
                                      </h5>

                                      <div className="text-muted">
                                        {user.email}
                                      </div>

                                      <span
                                        className={`badge mt-2 ${user.role === "superadmin"
                                          ? "bg-danger"
                                          : user.role === "admin"
                                            ? "bg-primary"
                                            : user.role === "guru"
                                              ? "bg-success"
                                              : "bg-secondary"
                                          }`}
                                      >
                                        {user.role}
                                      </span>

                                    </div>

                                    <div className="alert alert-danger">
                                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                      <strong>Tindakan ini tidak dapat dibatalkan.</strong>
                                    </div>
                                  </>
                                ),
                                onConfirm: async () => {
                                  await deleteUser(user.uid);
                                  await loadUsers();
                                },
                              })
                            }
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
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
            totalData={filteredUsers.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
            showPageSize={true}
            showInfo={true}
          />
        </div>
      </div>

      {/* Modal Edit User Role */}
      {isEditModalOpen && selectedUser && (
        <div className="modal fade show d-block">
          <div className="modal-dialog modal-md modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 16 }}>
              <div className="modal-header bg-info text-white border-0">
                <h5 className="modal-title fw-semibold">Edit User</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setIsEditModalOpen(false)}
                />
              </div>

              <div className="modal-body p-4">
                <div className="text-center mb-4">
                  <img
                    src={
                      selectedUser.photo
                        ? selectedUser.photo.replace(/"/g, "") + "?sz=150"
                        : "/default-avatar.png"
                    }
                    alt={selectedUser.username}
                    className="rounded-circle shadow border mx-auto d-block"
                    width={90}
                    height={90}
                  />

                  <h5 className="mt-3 mb-1 fw-semibold">
                    {selectedUser.username}
                  </h5>

                  <div className="text-muted">{selectedUser.email}</div>

                  <span
                    className={`badge mt-2 ${selectedUser.role === "superadmin"
                      ? "bg-danger"
                      : selectedUser.role === "admin"
                        ? "bg-primary"
                        : selectedUser.role === "guru"
                          ? "bg-success"
                          : "bg-secondary"
                      }`}
                  >
                    {selectedUser.role}
                  </span>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Role</label>
                  <select
                    className="form-select"
                    value={selectedRole}
                    onChange={(e) =>
                      setSelectedRole(
                        e.target.value as
                        | "superadmin"
                        | "admin"
                        | "guru"
                        | "siswa"
                      )
                    }
                  >
                    <option value="superadmin">Super Admin</option>
                    <option value="admin">Admin</option>
                    <option value="guru">Guru</option>
                    <option value="siswa">Siswa</option>
                  </select>
                </div>

                <div className="alert alert-info mb-0">
                  <i className="bi bi-info-circle-fill me-2"></i>
                  Perubahan hanya akan mengubah <strong>Role</strong> pengguna.
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleUpdateRole}
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}