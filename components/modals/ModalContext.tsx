"use client";

import { createContext } from "react";

export type ModalType = "success" | "error" | "warning" | "info";

export interface ModalOptions {
  title: string;
  message: string;
  type?: ModalType;
  onConfirm?: () => void;
}

interface ModalContextType {
  showModal: (options: ModalOptions) => void;
  hideModal: () => void;
}

export const ModalContext = createContext<ModalContextType>({
  showModal: () => {},
  hideModal: () => {},
});