export default function MasterPage() {
  return (
    <main className="app-main">
      {/* ===== Content Header ===== */}
      <div className="app-content-header">
        <div className="container-fluid">
          <div className="row align-items-center">
            <div className="col-sm-6">
              <h3 className="mb-0">Dashboard</h3>
            </div>
            <div className="col-sm-6">
              <ol className="breadcrumb float-sm-end mb-0">
                <li className="breadcrumb-item">
                  <a href="/admin">Dashboard</a>
                </li>
                 {/* ===== <li className="breadcrumb-item active">Dashboard</li> ===== */}
                
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Main Content ===== */}
      <div className="app-content">
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <div className="card shadow-sm">
                <div className="card-header">
                  <h3 className="card-title">Dashboard</h3>
                </div>
                <div className="card-body">
                  <p className="text-muted mb-0">
                    Halaman ini digunakan untuk mengelola data sekolah seperti
                    siswa, guru, kelas, dan data pendukung lainnya.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
