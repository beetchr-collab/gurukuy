"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  ModalContext,
  ModalOptions,
} from "./ModalContext";

import GlobalModal from "./GlobalModal";

export default function ModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {

  const [show, setShow] = useState(false);

  const [options, setOptions] =
    useState<ModalOptions | null>(null);

  const showModal = (option: ModalOptions) => {
    setOptions(option);
    setShow(true);
  };

  const hideModal = () => {
    setShow(false);
  };

  const value = useMemo(
    () => ({
      showModal,
      hideModal,
    }),
    []
  );

  return (
    <ModalContext.Provider value={value}>

      {children}

      <GlobalModal
        show={show}
        options={options}
        onClose={hideModal}
      />

    </ModalContext.Provider>
  );
}