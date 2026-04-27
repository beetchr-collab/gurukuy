"use client";

export default function DashboardPage() {

  return (
    <>
      <main className="app-main">
        {/* HEADER */}
        <div className="app-content-header">
          <div className="container-fluid">
            <div className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0">Dashboard</h4>

              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item active">Dashboard</li>
                </ol>
              </nav>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="app-content">
          <div className="container-fluid">

            {/* WELCOME CARD */}
            <div className="callout callout-info mb-3">
              <div className="card-body">
                <h5 className="fw-bold mb-2">Selamat Datang 👋</h5>
                <p className="text-muted mb-0">
                  Portal ini merupakan media informasi dan komunikasi sekolah
                  yang memberikan layanan cepat, transparan, dan mudah diakses.
                </p>
              </div>

            </div>

            {/* FITUR LIST */}
            <div className="card shadow-sm border-0">
              <div className="card-body bg-warning">
                <h6 className="fw-bold mb-3">Fitur Utama</h6>

                <ul className="mb-0">
                  <li>📊 Melihat ringkasan aktivitas mengajar</li>
                  <li>👤 Mengelola profil dan data pribadi</li>
                  <li>📢 Mengakses informasi sekolah terbaru</li>
                  <li>📝 Memantau tugas dan laporan pembelajaran</li>
                </ul>
              </div>
            </div>

          </div>
        </div>
      </main>

    </>
  );
}