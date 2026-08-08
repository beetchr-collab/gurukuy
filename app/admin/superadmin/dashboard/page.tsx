"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Chart from "chart.js/auto";
import {
  getLoginHistory,
  LoginHistoryData,
} from "@/services/userdata.service";

export default function SuperAdminDashboard() {
  // =========================================================
  // REF
  // =========================================================

  const chartRef = useRef<HTMLCanvasElement | null>(null);

  const chartInstance = useRef<Chart | null>(null);

  // =========================================================
  // STATE
  // =========================================================

  const [history, setHistory] = useState<LoginHistoryData[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // Tahun yang sedang dipilih
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  // =========================================================
  // LOAD LOGIN HISTORY
  // =========================================================

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getLoginHistory(100);

        setHistory(data);
      } catch (err) {
        console.error("Gagal mengambil login history:", err);

        setError("Gagal memuat data login history.");
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  // =========================================================
  // FUNCTION KONVERSI TANGGAL
  // =========================================================

  const getLoginDate = (value: any): Date | null => {
    if (!value) {
      return null;
    }

    // Firebase Timestamp
    if (typeof value?.toDate === "function") {
      return value.toDate();
    }

    // JavaScript Date
    if (value instanceof Date) {
      return value;
    }

    // String / number
    const date = new Date(value);

    if (isNaN(date.getTime())) {
      return null;
    }

    return date;
  };

  // =========================================================
  // DAFTAR TAHUN YANG TERSEDIA
  // =========================================================

  const availableYears = useMemo(() => {
    const years = new Set<number>();

    history.forEach((item) => {
      const date = getLoginDate(item.loginAt);

      if (!date) {
        return;
      }

      years.add(date.getFullYear());
    });

    return Array.from(years).sort((a, b) => b - a);
  }, [history]);

  // =========================================================
  // SET TAHUN TERBARU SEBAGAI DEFAULT
  // =========================================================

  useEffect(() => {
    if (availableYears.length === 0) {
      setSelectedYear(null);
      return;
    }

    // Jika belum ada tahun yang dipilih
    if (selectedYear === null) {
      setSelectedYear(availableYears[0]);
      return;
    }

    // Jika tahun yang dipilih sudah tidak tersedia
    if (!availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  // =========================================================
  // DATA HISTORY SESUAI TAHUN TERPILIH
  // =========================================================

  const filteredHistory = useMemo(() => {
    if (selectedYear === null) {
      return [];
    }

    return history.filter((item) => {
      const date = getLoginDate(item.loginAt);

      if (!date) {
        return false;
      }

      return date.getFullYear() === selectedYear;
    });
  }, [history, selectedYear]);

  // =========================================================
  // DATA GRAFIK
  // =========================================================

  const chartData = useMemo(() => {
    // Array untuk 12 bulan
    const admin = Array(12).fill(0);

    const guru = Array(12).fill(0);

    const siswa = Array(12).fill(0);

    // =======================================================
    // HITUNG LOGIN PER BULAN DAN ROLE
    // =======================================================

    filteredHistory.forEach((item) => {
      const date = getLoginDate(item.loginAt);

      if (!date) {
        return;
      }

      const month = date.getMonth();

      // ADMIN
      if (item.role === "admin") {
        admin[month]++;
      }

      // GURU
      if (item.role === "guru") {
        guru[month]++;
      }

      // SISWA
      if (item.role === "siswa") {
        siswa[month]++;
      }
    });

    // =======================================================
    // RETURN DATA CHART
    // =======================================================

    return {
      labels: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],

      datasets: [
        // ===================================================
        // ADMIN
        // ===================================================

        {
          label: "Admin",

          data: admin,

          borderColor: "#0d6efd",

          backgroundColor: "rgba(13, 110, 253, 0.08)",

          borderWidth: 2,

          tension: 0.35,

          pointRadius: 3,

          pointHoverRadius: 7,

          pointBackgroundColor: "#0d6efd",

          pointBorderColor: "#ffffff",

          pointBorderWidth: 2,

          fill: false,
        },

        // ===================================================
        // GURU
        // ===================================================

        {
          label: "Guru",

          data: guru,

          borderColor: "#198754",

          backgroundColor: "rgba(25, 135, 84, 0.08)",

          borderWidth: 2,

          tension: 0.35,

          pointRadius: 3,

          pointHoverRadius: 7,

          pointBackgroundColor: "#198754",

          pointBorderColor: "#ffffff",

          pointBorderWidth: 2,

          fill: false,
        },

        // ===================================================
        // SISWA
        // ===================================================

        {
          label: "Siswa",

          data: siswa,

          borderColor: "#ffc107",

          backgroundColor: "rgba(255, 193, 7, 0.08)",

          borderWidth: 2,

          tension: 0.35,

          pointRadius: 3,

          pointHoverRadius: 7,

          pointBackgroundColor: "#ffc107",

          pointBorderColor: "#ffffff",

          pointBorderWidth: 2,

          fill: false,
        },
      ],
    };
  }, [filteredHistory]);

  // =========================================================
  // CREATE / UPDATE CHART
  // =========================================================

  useEffect(() => {
    if (!chartRef.current) {
      return;
    }

    const ctx = chartRef.current.getContext("2d");

    if (!ctx) {
      return;
    }

    // Hapus chart sebelumnya
    if (chartInstance.current) {
      chartInstance.current.destroy();

      chartInstance.current = null;
    }

    // Jika belum ada tahun
    if (selectedYear === null) {
      return;
    }

    // =======================================================
    // CREATE CHART
    // =======================================================

    chartInstance.current = new Chart(ctx, {
      type: "line",

      data: chartData,

      options: {
        responsive: true,

        maintainAspectRatio: false,

        interaction: {
          mode: "index",

          intersect: false,
        },

        // ===================================================
        // PLUGINS
        // ===================================================

        plugins: {
          // =================================================
          // LEGEND
          // =================================================

          legend: {
            display: true,

            position: "top",

            align: "start",

            labels: {
              usePointStyle: true,

              pointStyle: "circle",

              padding: 20,

              boxWidth: 8,

              boxHeight: 8,

              font: {
                size: 13,
              },
            },
          },

          // =================================================
          // TOOLTIP
          // =================================================

          tooltip: {
            enabled: true,

            backgroundColor: "#ffffff",

            titleColor: "#212529",

            bodyColor: "#212529",

            borderColor: "#dee2e6",

            borderWidth: 1,

            padding: 12,

            displayColors: true,

            usePointStyle: true,

            titleFont: {
              size: 13,

              weight: "bold",
            },

            bodyFont: {
              size: 13,
            },

            callbacks: {
              label: function (context) {
                return ` ${context.dataset.label}: ${context.parsed.y}`;
              },
            },
          },
        },

        // ===================================================
        // SCALES
        // ===================================================

        scales: {
          // =================================================
          // X
          // =================================================

          x: {
            grid: {
              display: false,
            },

            ticks: {
              color: "#495057",

              font: {
                size: 12,
              },
            },

            border: {
              color: "#dee2e6",
            },
          },

          // =================================================
          // Y
          // =================================================

          y: {
            beginAtZero: true,

            ticks: {
              precision: 0,

              color: "#495057",

              font: {
                size: 12,
              },
            },

            grid: {
              color: "#e9ecef",

              lineWidth: 1,
            },

            border: {
              display: false,
            },
          },
        },
      },
    });

    // =======================================================
    // CLEANUP
    // =======================================================

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();

        chartInstance.current = null;
      }
    };
  }, [chartData, selectedYear]);

  // =========================================================
  // STATISTIK
  // =========================================================

  const totalLogins = filteredHistory.length;

  // =========================================================
  // LOGIN TERAKHIR
  // =========================================================

  const latestLogin = history[0]?.loginAt
    ? getLoginDate(history[0].loginAt)
    : null;

  // =========================================================
  // ROLE TERDAFTAR
  // =========================================================

  const roleCount = new Set(
    filteredHistory.map((item) => item.role)
  ).size;

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="container-fluid">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="mb-3">

        <h3 className="mb-1">
          <i className="fas fa-chart-line me-2 text-primary"></i>

          Dashboard Superadmin
        </h3>

        <p className="text-muted mb-0">
          Laporan aktivitas login dan audit.
        </p>

      </div>

      {/* =====================================================
          INFO BOX
      ====================================================== */}

      <div className="row">

        {/* TOTAL LOGIN */}

        <div className="col-12 col-md-4 mb-3">

          <div className="info-box bg-primary">

            <span className="info-box-icon">

              <i className="fas fa-sign-in-alt"></i>

            </span>

            <div className="info-box-content text-white">

              <span className="info-box-text">
                Total Login Tahun {selectedYear ?? "-"}
              </span>

              <span className="info-box-number display-6">
                {totalLogins}
              </span>

            </div>

          </div>

        </div>

        {/* LOGIN TERAKHIR */}

        <div className="col-12 col-md-4 mb-3">

          <div className="info-box bg-success">

            <span className="info-box-icon">

              <i className="fas fa-clock"></i>

            </span>

            <div className="info-box-content text-white">

              <span className="info-box-text">
                Login Terakhir
              </span>

              <span className="info-box-number">

                {latestLogin
                  ? latestLogin.toLocaleString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "-"}

              </span>

            </div>

          </div>

        </div>

        {/* ROLE */}

        <div className="col-12 col-md-4 mb-3">

          <div className="info-box bg-warning">

            <span className="info-box-icon">

              <i className="fas fa-users"></i>

            </span>

            <div className="info-box-content text-white">

              <span className="info-box-text">
                Role Login Tahun {selectedYear ?? "-"}
              </span>

              <span className="info-box-number">
                {roleCount}
              </span>

            </div>

          </div>

        </div>

      </div>

      {/* =====================================================
          LINE CHART
      ====================================================== */}

      <div className="row">

        <div className="col-12">

          <div className="card">

            {/* =================================================
                CARD HEADER
            ================================================== */}

            <div className="card-header d-flex align-items-center">

              <h3 className="card-title mb-0">

                <i className="fas fa-chart-line me-2"></i>

                Login Activity by Role

              </h3>

              {/* =================================================
                  FILTER TAHUN
              ================================================== */}

              <div className="card-tools ms-auto">

                <div className="d-flex align-items-center">

                  <label
                    htmlFor="filterTahun"
                    className="me-2 mb-0 text-muted"
                  >
                    Tahun:
                  </label>

                  <select
                    id="filterTahun"
                    className="form-select form-select-sm"
                    value={selectedYear ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;

                      setSelectedYear(
                        value ? Number(value) : null
                      );
                    }}
                    disabled={availableYears.length === 0}
                    style={{
                      minWidth: "100px",
                    }}
                  >

                    {availableYears.length === 0 ? (

                      <option value="">
                        -
                      </option>

                    ) : (

                      availableYears.map((year) => (

                        <option
                          key={year}
                          value={year}
                        >
                          {year}
                        </option>

                      ))

                    )}

                  </select>

                  {/* CARD COLLAPSE */}

                  <button
                    type="button"
                    className="btn btn-tool ms-2"
                    data-lte-toggle="card-collapse"
                    title="Minimize"
                  >

                    <i className="fas fa-minus"></i>

                  </button>

                </div>

              </div>

            </div>

            {/* =================================================
                CARD BODY
            ================================================== */}

            <div className="card-body">

              {/* ERROR */}

              {error && (

                <div className="alert alert-danger">

                  <i className="fas fa-exclamation-triangle me-2"></i>

                  {error}

                </div>

              )}

              {/* LOADING */}

              {loading ? (

                <div className="text-center py-5">

                  <div
                    className="spinner-border text-primary"
                    role="status"
                  >

                    <span className="visually-hidden">
                      Loading...
                    </span>

                  </div>

                  <div className="mt-2 text-muted">
                    Memuat data login...
                  </div>

                </div>

              ) : availableYears.length === 0 ? (

                // =================================================
                // BELUM ADA DATA
                // =================================================

                <div className="text-center py-5 text-muted">

                  <i
                    className="fas fa-chart-line fa-3x mb-3"
                  ></i>

                  <div>
                    Belum ada data login.
                  </div>

                </div>

              ) : (

                // =================================================
                // CHART
                // =================================================

                <div
                  style={{
                    position: "relative",
                    height: "350px",
                    width: "100%",
                  }}
                >

                  <canvas ref={chartRef}></canvas>

                </div>

              )}

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}