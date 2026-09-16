"use client";

type PaginationProps = {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;

    showInfo?: boolean;
    maxVisiblePages?: number;

    className?: string;
};

export default function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    showInfo = true,
    maxVisiblePages = 5,
    className = "",
}: PaginationProps) {
    if (totalPages <= 1) return null;

    const getPages = () => {
        const pages: Array<number | string> = [];

        const half = Math.floor(maxVisiblePages / 2);

        let start = Math.max(2, currentPage - half);
        let end = Math.min(totalPages - 1, currentPage + half);

        if (currentPage <= half + 2) {
            end = Math.min(maxVisiblePages, totalPages - 1);
        }

        if (currentPage >= totalPages - half - 1) {
            start = Math.max(2, totalPages - maxVisiblePages + 1);
        }

        const uniquePages = new Set<number>();

        pages.push(1);
        uniquePages.add(1);

        if (start > 2) {
            pages.push("...");
        }

        for (let i = start; i <= end; i++) {
            if (!uniquePages.has(i)) {
                pages.push(i);
                uniquePages.add(i);
            }
        }

        if (end < totalPages - 1) {
            pages.push("...");
        }

        if (totalPages > 1 && !uniquePages.has(totalPages)) {
            pages.push(totalPages);
        }

        return pages;
    };

    return (
        <div
            className={`d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 ${className}`}
        >
            <nav>
                <ul className="pagination pagination-sm mb-0">

                    {/* FIRST */}
                    <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                        <button
                            className="page-link"
                            onClick={() => onPageChange(1)}
                        >
                            ««
                        </button>
                    </li>

                    {/* PREV */}
                    <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                        <button
                            className="page-link"
                            onClick={() => onPageChange(currentPage - 1)}
                        >
                            ‹
                        </button>
                    </li>

                    {getPages().map((page, index) => {
                        if (page === "...") {
                            return (
                                <li
                                    key={`ellipsis-${index}`}
                                    className="page-item disabled"
                                >
                                    <span className="page-link">…</span>
                                </li>
                            );
                        }

                        return (
                            <li
                                key={`page-${page}`}
                                className={`page-item ${
                                    currentPage === page ? "active" : ""
                                }`}
                            >
                                <button
                                    className="page-link"
                                    onClick={() => onPageChange(Number(page))}
                                >
                                    {page}
                                </button>
                            </li>
                        );
                    })}

                    {/* NEXT */}
                    <li
                        className={`page-item ${
                            currentPage === totalPages ? "disabled" : ""
                        }`}
                    >
                        <button
                            className="page-link"
                            onClick={() => onPageChange(currentPage + 1)}
                        >
                            ›
                        </button>
                    </li>

                    {/* LAST */}
                    <li
                        className={`page-item ${
                            currentPage === totalPages ? "disabled" : ""
                        }`}
                    >
                        <button
                            className="page-link"
                            onClick={() => onPageChange(totalPages)}
                        >
                            »»
                        </button>
                    </li>
                </ul>
            </nav>
        </div>
    );
}