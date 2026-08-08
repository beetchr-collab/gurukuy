'use client';

import { useEffect, useState } from "react";
import { getLoginHistory, LoginHistoryData } from "@/services/userdata.service";

export default function LoginHistoryPage() {
  const [history, setHistory] = useState<LoginHistoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      try {
        const data = await getLoginHistory(100);
        setHistory(data);
      } catch (err) {
        console.error(err);
        setError("Gagal memuat login history.");
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  const formatTimestamp = (value: any) => {
    if (!value) return "-";
    const date = value?.toDate ? value.toDate() : new Date(value);
    return date.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="container-fluid py-3">
      <div className="row mb-3">
        <div className="col-sm-6">
          <h1 className="mb-0 fs-3">Login History</h1>
          <p className="text-muted">Riwayat login pengguna untuk audit dan laporan.</p>
        </div>
        <div className="col-sm-6">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb float-sm-end">
              <li className="breadcrumb-item"><a href="#">Home</a></li>
              <li className="breadcrumb-item active">Login History</li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h5 className="card-title mb-0">Daftar Login Terakhir</h5>
        </div>
        <div className="card-body p-0">
          {error && <div className="alert alert-danger m-3">{error}</div>}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover m-0">
                <thead>
                  <tr className="text-center">
                    <th>No</th>
                    <th>UID</th>
                    <th>Username</th>
                    <th>School</th>
                    <th>Role</th>
                    <th>Login At</th>
                    <th>IP Address</th>
                    <th>Browser</th>
                    <th>Device</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-4 text-muted">
                        Tidak ada data login history.
                      </td>
                    </tr>
                  ) : (
                    history.map((item, index) => (
                      <tr key={item.id} className="text-center align-middle">
                        <td>{index + 1}</td>
                        <td>{item.uid}</td>
                        <td>{item.username}</td>
                        <td>{item.schoolId || '-'}</td>
                        <td>{item.role}</td>
                        <td>{formatTimestamp(item.loginAt)}</td>
                        <td>{item.ipAddress || '-'}</td>
                        <td>{item.browser || '-'}</td>
                        <td>{item.device || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
