import { useState, cloneElement, useRef } from "react";
import styles from "./ConfirmAction.module.css";

export default function ConfirmAction({
    children,
    title = "Are you sure?",
    message = "This action cannot be undone.",
    confirmText = "Confirm",
    cancelText = "Cancel",
    onConfirm,
    requireReason = false,
}) {
    const [open, setOpen] = useState(false);
    const [pendingEvent, setPendingEvent] = useState(null);
    const [reason, setReason] = useState("");
    const modalRef = useRef(null);

    const openConfirm = (e) => {
        e && e.preventDefault();
        setPendingEvent(e);
        setOpen(true);
    };

    const handleConfirm = async () => {
        setOpen(false);
        const proceed = await Promise.resolve(
            onConfirm && onConfirm(pendingEvent, reason)
        );
        setReason("");
        setPendingEvent(null);
        return proceed;
    };

    const closeModal = () => {
        setOpen(false);
        setReason("");
        setPendingEvent(null);
    };

    const onBackdropClick = (e) => {
        if (modalRef.current && !modalRef.current.contains(e.target)) {
            closeModal();
        }
    };

    const child =
        children && typeof children === "object"
            ? cloneElement(children, {
                onClick: openConfirm,
                "aria-haspopup": "dialog",
            })
            : null;

    return (
        <>
            {child}
            {open && (
                <div
                    className={styles.backdrop}
                    role="dialog"
                    aria-modal="true"
                    onMouseDown={onBackdropClick}
                >
                    <div className={styles.modal} ref={modalRef}>
                        <h3>{title}</h3>
                        <p>{message}</p>

                        {requireReason && (
                            <input
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Reason (required)"
                                className={styles.input}
                            />
                        )}

                        <div className={styles.row}>
                            <button onClick={closeModal} className={styles.cancelBtn}>
                                {cancelText}
                            </button>
                            <button
                                onClick={handleConfirm}
                                className={styles.confirmBtn}
                                disabled={requireReason && reason.trim() === ""}
                            >
                                {confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
