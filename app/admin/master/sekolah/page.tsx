export default function UsersPage() {
  return (
    <main className="app-main">
      {/* Header */}
      <div className="app-content-header">
        <div className="container-fluid">
          <div className="row">
            <div className="col-sm-6">
              <h3 className="mb-0">Sekolah</h3>
            </div>
            <div className="col-sm-6">
              <ol className="breadcrumb float-sm-end">
                <li className="breadcrumb-item">
                  <a href="/admin">Dashboard</a>
                </li>
                <li className="breadcrumb-item active">Sekolah</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="app-content">
        <div className="container-fluid">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Data Sekolah</h3>
            </div>

            <div className="card-body">
              <p>Halaman ini digunakan untuk mengelola data sekolah.</p>
              {/* contoh tombol */}
              <button className="btn btn-primary">
                <i className="fas fa-plus me-1"></i>
                Edit Sekolah
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
