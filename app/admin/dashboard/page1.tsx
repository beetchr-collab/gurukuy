'use client';

import Link from 'next/link';

export default function AdminDashboard() {
  return (
    <div className="container-fluid">
      <div className="row min-vh-100">

        {/* SIDEBAR */}
        <aside className="col-md-3 col-lg-2 bg-dark text-white p-0">
          <div className="p-4">
            <h4 className="fw-bold">Admin Panel</h4>
            <hr />
            <ul className="nav flex-column gap-2">
              <li className="nav-item">
                <Link href="/admin/dashboard" className="nav-link text-white">
                  🏠 Dashboard
                </Link>
              </li>
              <li className="nav-item">
                <Link href="/admin/users" className="nav-link text-white">
                  👥 Data User
                </Link>
              </li>
              <li className="nav-item">
                <Link href="/admin/guru" className="nav-link text-white">
                  👨‍🏫 Data Guru
                </Link>
              </li>
              <li className="nav-item">
                <Link href="/admin/siswa" className="nav-link text-white">
                  🎓 Data Siswa
                </Link>
              </li>
              <li className="nav-item">
                <Link href="/logout" className="nav-link text-danger">
                  🚪 Logout
                </Link>
              </li>
            </ul>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="col-md-9 col-lg-10 p-4 bg-light">
          {/* NAVBAR */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="fw-bold">Dashboard Admin</h2>
            <span className="badge bg-primary fs-6">Administrator</span>
          </div>

          {/* STAT CARDS */}
          <div className="row g-4 mb-4">
            <div className="col-md-4">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h6>Total Guru</h6>
                  <h3 className="fw-bold">25</h3>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h6>Total Siswa</h6>
                  <h3 className="fw-bold">320</h3>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h6>Total Kelas</h6>
                  <h3 className="fw-bold">12</h3>
                </div>
              </div>
            </div>
          </div>

          {/* MENU CARD */}
          <div className="row g-4">
            <div className="col-md-3">
              <div className="card shadow-sm h-100">
                <div className="card-body text-center">
                  <h5>Kelola User</h5>
                  <p className="text-muted">Admin, Guru, Siswa</p>
                  <Link href="/admin/users" className="btn btn-primary btn-sm">
                    Buka
                  </Link>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card shadow-sm h-100">
                <div className="card-body text-center">
                  <h5>Data Guru</h5>
                  <p className="text-muted">Manajemen guru</p>
                  <Link href="/admin/guru" className="btn btn-primary btn-sm">
                    Buka
                  </Link>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card shadow-sm h-100">
                <div className="card-body text-center">
                  <h5>Data Siswa</h5>
                  <p className="text-muted">Manajemen siswa</p>
                  <Link href="/admin/siswa" className="btn btn-primary btn-sm">
                    Buka
                  </Link>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card shadow-sm h-100">
                <div className="card-body text-center">
                  <h5>Pengaturan</h5>
                  <p className="text-muted">Konfigurasi sistem</p>
                  <button className="btn btn-secondary btn-sm" disabled>
                    Coming Soon
                  </button>
                </div>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
