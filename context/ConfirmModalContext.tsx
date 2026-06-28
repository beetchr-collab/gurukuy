"use client";

import {
    createContext,
    useContext,
    useState,
    ReactNode,
} from "react";

type ConfirmOptions = {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "primary" | "warning" | "success";
};

type ConfirmContextType = {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function ConfirmProvider({
    children,
}: {
    children: ReactNode;
}) {
    const [show, setShow] = useState(false);
    const [options, setOptions] = useState<ConfirmOptions>({
        message: "",
    });

    const [resolver, setResolver] = useState<
        ((value: boolean) => void) | null
    >(null);

    const confirm = (options: ConfirmOptions) => {
        setOptions(options);
        setShow(true);

        return new Promise<boolean>((resolve) => {
            setResolver(() => resolve);
        });
    };

    const handleClose = (result: boolean) => {
        setShow(false);

        if (resolver) {
            resolver(result);
            setResolver(null);
        }
    };

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}

            {show && (
                <div
                    className="modal fade show d-block"
                    style={{ background: "rgba(0,0,0,.4)" }}
                >
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">

                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {options.title ?? "Konfirmasi"}
                                </h5>
                            </div>

                            <div className="modal-body">
                                {options.message}
                            </div>

                            <div className="modal-footer">

                                <button
                                    className="btn btn-secondary"
                                    onClick={() => handleClose(false)}
                                >
                                    {options.cancelText ?? "Batal"}
                                </button>

                                <button
                                    className={`btn btn-${
                                        options.variant ?? "danger"
                                    }`}
                                    onClick={() => handleClose(true)}
                                >
                                    {options.confirmText ?? "Ya"}
                                </button>

                            </div>

                        </div>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    );
}

export function useConfirm() {
    const context = useContext(ConfirmContext);

    if (!context) {
        throw new Error("useConfirm harus berada di dalam ConfirmProvider");
    }

    return context;
}