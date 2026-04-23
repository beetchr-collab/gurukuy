'use client';

export default function Dashboard() {
  return (
    <div className="wrapper">

      {/* NAVBAR */}
      <nav className="main-header navbar navbar-expand-md navbar-dark bg-danger">
        <div className="container">
          <a href="#" className="navbar-brand">
            <span className="brand-text font-weight-light">
              SD NEGERI TUNJUNG 02
            </span>
          </a>

          <button
            className="navbar-toggler order-1"
            type="button"
            data-toggle="collapse"
            data-target="#navbarCollapse"
            aria-controls="navbarCollapse"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon" />
          </button>
        </div>
      </nav>

      {/* CONTENT */}
      <div className="content-wrapper">

        {/* HEADER */}
        <div className="content-header">
          <div className="container">
            <div className="row mb-2">
              <div className="col-sm-6">
                <h1 className="m-0">
                  Portal <small>SD Negeri Tunjung 02</small>
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* ALERT */}
        <div className="container mb-3">
          <div className="alert alert-warning">
            <h5>
              <i className="icon fas fa-exclamation-triangle" />{' '}
              <b>Selamat datang!</b>
            </h5>
            Portal ini merupakan media informasi dan komunikasi sekolah yang
            bertujuan untuk memberikan layanan informasi secara cepat,
            transparan, dan mudah diakses oleh seluruh warga sekolah serta
            masyarakat.
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="content">
          <div className="container">
            <div className="row">

              {/* BOX 1 */}
              <div className="col-lg-2 col-6">
                <div className="small-box bg-warning">
                  <div className="inner text-center">
                    <h3><i className="fas fa-database"></i></h3>
                  </div>
                  <a
                    href="/admin/master"
                    className="small-box-footer text-decoration-none"
                  >
                    Manageman <i className="fas fa-arrow-circle-right" />
                  </a>

                </div>
              </div>

              {/* BOX 2 */}
              <div className="col-lg-3 col-6">
                <div className="small-box bg-success">
                  <div className="inner">
                    <h3>
                      53<sup style={{ fontSize: '20px' }}>%</sup>
                    </h3>
                    <p>Bounce Rate</p>
                  </div>
                  <a href="#" className="small-box-footer">
                    More info <i className="fas fa-arrow-circle-right" />
                  </a>
                </div>
              </div>

              {/* BOX 3 */}
              <div className="col-lg-3 col-6">
                <div className="small-box bg-warning">
                  <div className="inner">
                    <h3>44</h3>
                    <p>User Registrations</p>
                  </div>
                  <a href="#" className="small-box-footer">
                    More info <i className="fas fa-arrow-circle-right" />
                  </a>
                </div>
              </div>

              {/* BOX 4 */}
              <div className="col-lg-3 col-6">
                <div className="small-box bg-danger">
                  <div className="inner">
                    <h3>65</h3>
                    <p>Unique Visitors</p>
                  </div>
                  <a href="#" className="small-box-footer">
                    More info <i className="fas fa-arrow-circle-right" />
                  </a>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>



    </div>
  );
}
