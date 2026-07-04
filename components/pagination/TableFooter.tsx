"use client";

import Pagination from "./Pagination";
import PageSizeSelect from "./PageSizeSelect";

type TableFooterProps = {
    currentPage: number;
    totalPages: number;

    pageSize: number;
    totalData: number;

    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;

    pageSizeOptions?: number[];

    showPageSize?: boolean;
    showInfo?: boolean;

    className?: string;
};

export default function DataTableFooter({
    currentPage,
    totalPages,
    pageSize,
    totalData,
    onPageChange,
    onPageSizeChange,

    pageSizeOptions = [10, 25, 50, 100],

    showPageSize = true,
    showInfo = true,

    className = "",
}: TableFooterProps) {
    const start =
        totalData === 0
            ? 0
            : (currentPage - 1) * pageSize + 1;

    const end = Math.min(
        currentPage * pageSize,
        totalData
    );

    return (
        <div
            className={`d-flex flex-column flex-lg-row justify-content-between align-items-center gap-3 mt-3 ${className}`}
        >
            {/* Kiri */}
            <div className="d-flex flex-column flex-md-row align-items-center gap-3">

                {showPageSize && (
                    <PageSizeSelect
                        pageSize={pageSize}
                        options={pageSizeOptions}
                        onPageSizeChange={onPageSizeChange}
                    />
                )}

                {showInfo && (
                    <small className="text-muted text-center">
                        Menampilkan <strong>{start}</strong>–
                        <strong>{end}</strong> dari{" "}
                        <strong>{totalData}</strong> data
                    </small>
                )}
            </div>

            {/* Kanan */}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange}
            />
        </div>
    );
}