"use client";

import { useEffect, useState } from "react";

export function usePagination<T>(
  data: T[],
  itemsPerPage: number = 10
) {
  const [currentPage, setCurrentPage] = useState(1);

  // reset halaman jika data berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  const totalPages = Math.ceil(
    data.length / itemsPerPage
  );

  const startIndex =
    (currentPage - 1) * itemsPerPage;

  const endIndex =
    startIndex + itemsPerPage;

  const currentData = data.slice(
    startIndex,
    endIndex
  );

  return {
    currentPage,
    setCurrentPage,
    totalPages,
    startIndex,
    endIndex,
    currentData,
    itemsPerPage,
    totalData: data.length,
  };
}