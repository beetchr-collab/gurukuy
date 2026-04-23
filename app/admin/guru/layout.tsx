import Navbar from "@/app/admin/components/Navbar"
import Sidebar from "@/app/admin/components/Sidebar-master"
import Footer from "@/app/admin/components/Footer"
import RoleGuard from "@/context/RoleGuard";

export default function MasterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
     <RoleGuard role="guru">
          <div className="app-wrapper">
            <Navbar />
            <Sidebar />
    
            <main className="app-main">
              <div className="app-content">
                <div className="container-fluid">
                  {children}
                </div>
              </div>
            </main>
    
            <Footer />
          </div>
        </RoleGuard>
  )
}
