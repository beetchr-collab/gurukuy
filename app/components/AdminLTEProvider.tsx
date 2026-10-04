"use client";

import { useEffect, useRef } from "react";

export default function AdminLTEProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initAdminLTE = async () => {
      if (typeof window !== "undefined") {
        await import("bootstrap/dist/js/bootstrap.bundle.min.js");
        await import("admin-lte/dist/js/adminlte.min.js");
      }
    };

    initAdminLTE();
  }, []);

  return <>{children}</>;
}
