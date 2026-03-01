import { useState } from "react";
import styles from "./AsyncButton.module.css";

export default function AsyncButton({
    onClick,
    children,
    className = "",
    disabled = false,
    type = "button",
    ...props
}) {
    const [loading, setLoading] = useState(false);

    const handleClick = async (e) => {
        if (loading) return;

        setLoading(true);
        try {
            await onClick?.(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            type={type}
            className={`${styles.customBtn} ${className}`}
            onClick={onClick ? handleClick : undefined}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? <span className={styles.loader} aria-hidden /> : children}
        </button>
    );
}
