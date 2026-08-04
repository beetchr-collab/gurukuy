"use client";

import { createContext } from "react";

export type ModalType = "success" | "error" | "warning" | "info";

export interface ModalOptions {
  title: string;
  message?: string;
  type?: ModalType;
  render?: (
    close: () => void
) => React.ReactNode;
  onConfirm?: () => Promise<void> | void;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
  hideCancelButton?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

interface ModalContextType {
  showModal: (options: ModalOptions) => void;
  hideModal: () => void;
}

export const ModalContext = createContext<ModalContextType>({
  showModal: () => { },
  hideModal: () => { },
});