"use client";

import Link from "next/link";

type EujianMenuProps = {
  active: "overview" | "bank-soal" | "peserta" | "analisis";
};

const menuItems = [
  {
    id: "overview",
    label: "Status Ujian",
    href: "/admin/guru/eujian",
    icon: "fa-layer-group",
  },
  {
    id: "bank-soal",
    label: "Bank Soal",
    href: "/admin/guru/eujian/bank_soal",
    icon: "fa-book-open",
  },
  {
    id: "peserta",
    label: "Peserta",
    href: "/admin/guru/eujian/peserta-exam",
    icon: "fa-users",
  },
    {
    id: "analisis",
    label: "Analisis & Nilai",
    href: "/admin/guru/eujian/analisis",
    icon: "fa-chart-bar",
  },
] as const;

export default function EujianMenu({ active }: EujianMenuProps) {
  return (
    <nav className="d-flex flex-wrap gap-2" aria-label="Menu E-Ujian">
      {menuItems.map((item) => (
        <span
          className={`badge px-3 py-2 ${
            active === item.id ? "bg-warning" : "bg-light"
          }`}
          key={item.id}
        >
          <Link
            aria-current={active === item.id ? "page" : undefined}
            className={`text-decoration-none fw-semibold ${
              active === item.id ? "text-white" : "text-primary"
            }`}
            href={item.href}
          >
            <i className={`fas ${item.icon} me-1`} aria-hidden="true" />
            {item.label}
          </Link>
        </span>
      ))}
    </nav>
  );
}
