"use client";

import React from "react";

interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    width?: number | string;
    disabled?: boolean;
}

export default function SearchInput({
    value,
    onChange,
    placeholder = "Cari data...",
    className = "",
    width = 320,
    disabled = false,
}: SearchInputProps) {
    return (
        <div
            className={`input-group ${className}`}
            style={{ width }}
        >
            <span className="input-group-text">
                <i className="fas fa-search"></i>
            </span>

            <input
                type="text"
                className="form-control"
                placeholder={placeholder}
                value={value}
                disabled={disabled}
                onChange={(e) => onChange(e.target.value)}
            />

            {value && (
                <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => onChange("")}
                    title="Bersihkan pencarian"
                >
                    <i className="fas fa-times"></i>
                </button>
            )}
        </div>
    );
}