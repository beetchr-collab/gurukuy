"use client";

type PageSizeSelectProps = {
    pageSize: number;
    onPageSizeChange: (size: number) => void;

    options?: number[];

    label?: string;

    className?: string;
};

export default function PageSizeSelect({
    pageSize,
    onPageSizeChange,
    options = [10, 25, 50, 100],
    label = "Tampilkan",
    className = "",
}: PageSizeSelectProps) {
    return (
        <div
            className={`d-flex align-items-center gap-2 ${className}`}
        >
            <label className="mb-0 text-nowrap">
                {label}
            </label>

            <select
                className="form-select form-select-sm"
                style={{ width: 90 }}
                value={pageSize}
                onChange={(e) =>
                    onPageSizeChange(Number(e.target.value))
                }
            >
                {options.map((size) => (
                    <option
                        key={size}
                        value={size}
                    >
                        {size}
                    </option>
                ))}
            </select>

            <span className="text-nowrap text-muted">
                data
            </span>
        </div>
    );
}