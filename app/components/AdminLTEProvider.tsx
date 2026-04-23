"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function AdminLTEProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  useEffect(() => {
    const initAdminLTE = async () => {
      if (typeof window !== "undefined") {
        await import("bootstrap/dist/js/bootstrap.bundle.min.js");
        await import("admin-lte/dist/js/adminlte.min.js");

        // 🔥 penting: trigger ulang AdminLTE
        window.dispatchEvent(new Event("load"));
      }
    };

    initAdminLTE();
  }, [pathname]);

  return <>{children}</>;
}
