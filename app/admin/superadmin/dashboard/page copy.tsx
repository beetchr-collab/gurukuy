'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import Chart from "chart.js/auto";
import { getLoginHistory, LoginHistoryData } from "@/services/userdata.service";

export default function SuperAdminDashboard() {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const [history, setHistory] = useState<LoginHistoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chartInstance, setChartInstance] = useState<InstanceType<typeof Chart> | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      try {
        const data = await getLoginHistory(100);
        setHistory(data);
      } catch (err) {
        console.error(err);
        setError("Gagal memuat data login history.");
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  const chartData = useMemo(() => {
    const counts = {
      superadmin: 0,
      admin: 0,
      guru: 0,
      siswa: 0,
    };

    history.forEach((item) => {
      if (item.role in counts) {
        counts[item.role] += 1;
      }
    });

    return {
      labels: ["Superadmin", "Admin", "Guru", "Siswa"],
      datasets: [
        {
          label: "Jumlah Login",
          data: [counts.superadmin, counts.admin, counts.guru, counts.siswa],
          backgroundColor: ["#dc3545", "#0d6efd", "#198754", "#6c757d"],
        },
      ],
    };
  }, [history]);

  useEffect(() => {
    if (!chartRef.current) return;

    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;

    if (chartInstance) {
      chartInstance.destroy();
    }

    const newChart = new Chart(ctx, {
      type: "bar",
      data: chartData,
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "top",
          },
          tooltip: {
            enabled: true,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
            },
          },
        },
      },
    });

    setChartInstance(newChart);

    return () => {
      newChart.destroy();
    };
  }, [chartData]);

  const totalLogins = history.length;
  const latestLogin = history[0]?.loginAt
    ? "toDate" in history[0].loginAt
      ? history[0].loginAt.toDate()
      : new Date(history[0].loginAt)
    : null;

  return (
    <div className="container-fluid px-0">
      <div className="row mb-3">
        <div className="col-12">
          <h1 className="h3 mb-2">Dashboard Superadmin</h1>
          <p className="text-muted">Laporan aktivitas login dan audit.</p>
        </div>
      </div>

      <div className="row">
        <div className="col-12 col-md-4 mb-3">
          <div className="info-box bg-primary">
            <span className="info-box-icon">
              <i className="fas fa-sign-in-alt" />
            </span>
            <div className="info-box-content text-white">
              <span className="info-box-text">Total Login Terbaru</span>
              <span className="info-box-number display-6">{totalLogins}</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4 mb-3">
          <div className="info-box bg-success">
            <span className="info-box-icon">
              <i className="fas fa-users" />
            </span>
            <div className="info-box-content text-white">
              <span className="info-box-text">Login Terakhir</span>
              <span className="info-box-number">
                {latestLogin ? latestLogin.toLocaleString("id-ID", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }) : "-"}
              </span>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4 mb-3">
          <div className="info-box bg-warning">
            <span className="info-box-icon">
              <i className="fas fa-chart-bar" />
            </span>
            <div className="info-box-content text-white">
              <span className="info-box-text">Role Terdaftar</span>
              <span className="info-box-number">{new Set(history.map((item) => item.role)).size}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Login Activity by Role</h5>
            </div>
            <div className="card-body">
              {error && <div className="alert alert-danger">{error}</div>}
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <canvas ref={chartRef} height={120} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
