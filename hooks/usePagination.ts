import { useMemo, useState, useEffect } from "react";

type UsePaginationProps<T> = {
    data: T[];
    pageSize?: number;
    resetDeps?: any[];
};

export function usePagination<T>({
    data,
    pageSize: initialPageSize = 10,
    resetDeps = [],
}: UsePaginationProps<T>) {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(initialPageSize);

    useEffect(() => {
        setCurrentPage(1);
    }, resetDeps);

    const totalPages = Math.max(
        1,
        Math.ceil(data.length / pageSize)
    );

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const startIndex = (currentPage - 1) * pageSize;

    const currentData = useMemo(() => {
        return data.slice(
            startIndex,
            startIndex + pageSize
        );
    }, [data, startIndex, pageSize]);

    return {
        currentPage,
        pageSize,
        totalPages,
        startIndex,
        currentData,

        setCurrentPage,
        setPageSize,
    };
}