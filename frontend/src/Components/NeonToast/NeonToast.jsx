import { Toaster, toast } from "sonner";
import { CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";
import styles from "./NeonToast.module.css";

const neonToast = {
    success: (msg) =>
        toast.custom(() => (
            <div className={`${styles.toaster} ${styles["toaster-success"]}`}>
                <CheckCircle className={styles.icon} size={20} />
                <span className={styles.text}>{msg}</span>
            </div>
        )),
    error: (msg) =>
        toast.custom(() => (
            <div className={`${styles.toaster} ${styles["toaster-error"]}`}>
                <XCircle className={styles.icon} size={20} />
                <span className={styles.text}>{msg}</span>
            </div>
        )),
    warning: (msg) =>
        toast.custom(() => (
            <div className={`${styles.toaster} ${styles["toaster-warning"]}`}>
                <AlertTriangle className={styles.icon} size={20} />
                <span className={styles.text}>{msg}</span>
            </div>
        )),
    info: (msg) =>
        toast.custom(() => (
            <div className={`${styles.toaster} ${styles["toaster-info"]}`}>
                <Info className={styles.icon} size={20} />
                <span className={styles.text}>{msg}</span>
            </div>
        )),
};

export default function NeonToast() {
    return <Toaster richColors />;
}

export { neonToast };
