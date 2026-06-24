type Props = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: Props) {
  if (totalPages <= 1) return null;

  return (
    <nav>
      <ul className="pagination mb-0">

        {/* PREV */}
        <li
          className={`page-item ${
            currentPage === 1
              ? "disabled"
              : ""
          }`}
        >
          <button
            className="page-link"
            onClick={() =>
              onPageChange(currentPage - 1)
            }
          >
            «
          </button>
        </li>

        {/* NOMOR HALAMAN */}
        {Array.from(
          { length: totalPages },
          (_, i) => (
            <li
              key={i}
              className={`page-item ${
                currentPage === i + 1
                  ? "active"
                  : ""
              }`}
            >
              <button
                className="page-link"
                onClick={() =>
                  onPageChange(i + 1)
                }
              >
                {i + 1}
              </button>
            </li>
          )
        )}

        {/* NEXT */}
        <li
          className={`page-item ${
            currentPage === totalPages
              ? "disabled"
              : ""
          }`}
        >
          <button
            className="page-link"
            onClick={() =>
              onPageChange(currentPage + 1)
            }
          >
            »
          </button>
        </li>
      </ul>
    </nav>
  );
}