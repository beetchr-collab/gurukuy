import { useState } from "react";

export function useUploadProgress() {

    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    const start = () => {
        setLoading(true);
        setProgress(0);
    }

    const update = (current: number, total: number) => {
        setProgress(Math.round(current / total * 100));
    }

    const finish = () => {
        setProgress(100);
    };

    const reset = () => {
        setLoading(false);
        setProgress(0);
    };

    return {
        loading,
        progress,
        start,
        update,
        finish,
        reset,
    }

}