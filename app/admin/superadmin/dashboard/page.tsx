'use client';

export default function SuperAdminDashboard() {
   console.log("Dashboard Superadmin");
  


  return (
    <div className="container-fluid px-0">
      <h1 className="h3 mb-3">Dashboard</h1>
      <div className="row">
        <div className="col-12 col-lg-6 col-xxl-3 d-flex order-2 order-xxl-3">
          <div className="card flex-fill w-100">
            <div className="card-header">
              <h5 className="card-title mb-0">Total Admin</h5>
            </div>
            <div className="card-body d-flex">
              <div className="align-self-center w-100">
                <h1 className="mb-3">0</h1>
                <div className="mb-2">
                  <span className="text-success me-2"><i className="mdi mdi-arrow-bottom-right"></i> 0.00%</span>
                  <span className="text-muted">Since last month</span>  
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}