import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../Utils/api";
import { neonToast } from "../../Components/NeonToast/NeonToast";
import AsyncButton from "../../Components/AsyncButton/AsyncButton";
import styles from "./ResetPassword.module.css";
import {
    FaKey,
    FaEye,
    FaEyeSlash,
    FaLock,
    FaCheckCircle,
    FaExclamationTriangle,
    FaArrowLeft,
    FaRedo
} from "react-icons/fa";
import { useNotifContext } from "../../Context/NotifContext";

export default function ResetPassword() {
    const { signed_inst } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [resending, setResending] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });
    const [isValidLink, setIsValidLink] = useState(false);
    const [verificationMessage, setVerificationMessage] = useState("");
    const { updatePageTitle } = useNotifContext()
    useEffect(() => {
        updatePageTitle("Reset Password")
    }, [])

    const [passwordForm, setPasswordForm] = useState({
        new_password: "",
        confirm_password: ""
    });

    useEffect(() => {
        verifyResetLink();
    }, [signed_inst]);

    const verifyResetLink = async () => {
        setLoading(true);
        try {
            const response = await api.post(`/api/users/password/change/verify/${signed_inst}/`);
            setIsValidLink(true);
            setVerificationMessage(response.data.message || "You can now set your new password.");
        } catch (err) {
            setIsValidLink(false);
            const errorMessage = err.response?.data?.error ||
                err.response?.data?.detail ||
                "This password reset link is invalid or has expired.";
            setVerificationMessage(errorMessage);
            neonToast.error(errorMessage, "error");
        } finally {
            setLoading(false);
        }
    };

    const validatePassword = (password) => {
        const requirements = {
            minLength: password.length >= 8,
            hasUpperCase: /[A-Z]/.test(password),
            hasLowerCase: /[a-z]/.test(password),
            hasNumbers: /\d/.test(password),
            hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };

        return {
            ...requirements,
            isValid: Object.values(requirements).every(req => req)
        };
    };

    const handlePasswordChange = (e) => {
        setPasswordForm(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
        if (message.text) {
            setMessage({ text: "", type: "" });
        }
    };

    const togglePasswordVisibility = (field) => {
        switch (field) {
            case 'new': setShowNewPassword(!showNewPassword); break;
            case 'confirm': setShowConfirmPassword(!showConfirmPassword); break;
        }
    };

    const submitPasswordReset = async (e) => {
        e.preventDefault();
        setMessage({ text: "", type: "" });

        if (passwordForm.new_password !== passwordForm.confirm_password) {
            setMessage({
                text: "Passwords do not match",
                type: "error"
            });
            return;
        }

        const passwordValidation = validatePassword(passwordForm.new_password);
        if (!passwordValidation.isValid) {
            setMessage({
                text: "New password does not meet requirements",
                type: "error"
            });
            return;
        }

        setSubmitting(true);

        try {
            await api.post("/api/users/password/change/confirm/", {
                signed_inst: signed_inst,
                new_password: passwordForm.new_password,
            });

            setMessage({
                text: "Password has been reset successfully!",
                type: "success"
            });


            navigate("/security");

        } catch (err) {
            const errorMessage = err.response?.data?.error ||
                err.response?.data?.message ||
                "Failed to reset password. The link may have expired.";

            setMessage({
                text: errorMessage,
                type: "error"
            });

            neonToast.error(errorMessage, "error");
        } finally {
            setSubmitting(false);
        }
    };

    const resendResetEmail = async () => {
        setResending(true);
        try {
            await api.post("/api/users/password/change/request/");

            setMessage({
                text: "A new password reset email has been sent to your email address.",
                type: "success"
            });

            neonToast.success("Password reset email sent!", "success");
        } catch (err) {
            const errorMessage = err.response?.data?.detail ||
                err.response?.data?.error ||
                "Failed to send reset email";

            setMessage({
                text: errorMessage,
                type: "error"
            });

            neonToast.error(errorMessage, "error");
        } finally {
            setResending(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <p>Verifying your reset link...</p>
            </div>
        );
    }

    if (!isValidLink) {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h1>
                            <FaLock className={styles.titleIcon} />
                            Invalid Reset Link
                        </h1>
                    </div>

                    <div className={styles.messageBanner}>
                        <FaExclamationTriangle />
                        <span>{verificationMessage}</span>
                    </div>

                    <div className={styles.actions}>
                        <button
                            onClick={() => navigate("/security")}
                            className={styles.primaryBtn}
                        >
                            <FaArrowLeft />
                            <span>Go back to security</span>
                        </button>

                        <button
                            onClick={resendResetEmail}
                            disabled={resending}
                            className={styles.secondaryBtn}
                        >
                            {resending ? (
                                <>
                                    <span>Sending...</span>
                                </>
                            ) : (
                                <>
                                    <FaRedo />
                                    <span>Resend Reset Email</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Add the footer note to the invalid link view as well */}
                    <div className={styles.footerNote}>
                        <div className={styles.footerContent}>
                            <p className={styles.footerText}>
                                <strong>Alternative method:</strong> If you have a verification code, you can
                                <button
                                    onClick={() => navigate("/password/reset/code")}
                                    className={styles.inlineLink}
                                >
                                    reset your password with a code instead
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const passwordValidation = validatePassword(passwordForm.new_password);

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <h1>
                        <FaLock className={styles.titleIcon} />
                        Reset Your Password
                    </h1>
                    <p className={styles.subtitle}>
                        {verificationMessage}
                    </p>
                </div>

                {message.text && (
                    <div className={`${styles.messageBanner} ${styles[message.type]}`}>
                        {message.type === "success" ? <FaCheckCircle /> : <FaExclamationTriangle />}
                        <span>{message.text}</span>
                    </div>
                )}

                <form onSubmit={submitPasswordReset} className={styles.form}>
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>
                                New Password
                            </label>
                            <div className={styles.passwordInputWrapper}>
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    name="new_password"
                                    value={passwordForm.new_password}
                                    onChange={handlePasswordChange}
                                    className={styles.formInput}
                                    placeholder="Enter new password"
                                    required
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    className={styles.passwordToggle}
                                    onClick={() => togglePasswordVisibility('new')}
                                >
                                    {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>

                            <div className={styles.passwordRequirements}>
                                <h4>Password must contain:</h4>
                                <ul>
                                    <li className={passwordValidation.minLength ? styles.valid : styles.invalid}>
                                        At least 8 characters
                                    </li>
                                    <li className={passwordValidation.hasUpperCase ? styles.valid : styles.invalid}>
                                        One uppercase letter
                                    </li>
                                    <li className={passwordValidation.hasLowerCase ? styles.valid : styles.invalid}>
                                        One lowercase letter
                                    </li>
                                    <li className={passwordValidation.hasNumbers ? styles.valid : styles.invalid}>
                                        One number
                                    </li>
                                    <li className={passwordValidation.hasSpecialChar ? styles.valid : styles.invalid}>
                                        One special character
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>
                                Confirm New Password
                            </label>
                            <div className={styles.passwordInputWrapper}>
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="confirm_password"
                                    value={passwordForm.confirm_password}
                                    onChange={handlePasswordChange}
                                    className={styles.formInput}
                                    placeholder="Confirm new password"
                                    required
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    className={styles.passwordToggle}
                                    onClick={() => togglePasswordVisibility('confirm')}
                                >
                                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>

                            {passwordForm.new_password && passwordForm.confirm_password && (
                                <div className={`${styles.matchIndicator} ${passwordForm.new_password === passwordForm.confirm_password
                                    ? styles.matches
                                    : styles.noMatch
                                    }`}>
                                    {passwordForm.new_password === passwordForm.confirm_password
                                        ? "✓ Passwords match"
                                        : "✗ Passwords do not match"}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles.formActions}>
                        <AsyncButton
                            type="submit"
                            loading={submitting}
                            disabled={submitting || !passwordForm.new_password || !passwordForm.confirm_password}
                            className={styles.primaryBtn}
                        >
                            <FaKey />
                            <span>Reset Password</span>
                        </AsyncButton>
                    </div>
                </form>

                <div className={styles.additionalActions}>
                    <button
                        onClick={resendResetEmail}
                        disabled={resending}
                        className={styles.linkButton}
                    >
                        {resending ? "Sending..." : "Resend reset email"}
                    </button>

                    <div className={styles.divider}>or</div>

                    <button
                        onClick={() => navigate("/security")}
                        className={styles.secondaryBtn}
                    >
                        <FaArrowLeft />
                        <span>Back to Security</span>
                    </button>
                </div>

                <div className={styles.footerNote}>
                    <div className={styles.footerContent}>
                        <p className={styles.footerText}>
                            <strong>Alternative method:</strong> If you have a verification code, you can
                            <button
                                onClick={() => navigate("/password/reset/code")}
                                className={styles.inlineLink}
                            >
                                reset your password with a code instead
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}