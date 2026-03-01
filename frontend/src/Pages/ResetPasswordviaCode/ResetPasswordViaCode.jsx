import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../Utils/api";
import { neonToast } from "../../Components/NeonToast/NeonToast";
import AsyncButton from "../../Components/AsyncButton/AsyncButton";
import styles from "./ResetPasswordViaCode.module.css";
import {
    FaKey,
    FaEye,
    FaEyeSlash,
    FaLock,
    FaCheckCircle,
    FaExclamationTriangle,
    FaArrowLeft,
    FaRedo,
    FaClock,
    FaShieldAlt
} from "react-icons/fa";
import { MdEmail } from "react-icons/md";

export default function ResetPasswordViaCode() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });
    const { updatePageTitle } = useNotifContext()
    useEffect(() => {
        updatePageTitle("Reset Password Via Code")
    }, [])

    const [passwordForm, setPasswordForm] = useState({
        code: "",
        new_password: "",
        confirm_password: ""
    });

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

        // Validate code
        if (!passwordForm.code || passwordForm.code.length < 6) {
            setMessage({
                text: "Please enter a valid 6-digit code",
                type: "error"
            });
            return;
        }

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

        setLoading(true);

        try {
            await api.post("/api/users/password/change/code/", {
                code: passwordForm.code,
                new_password: passwordForm.new_password,
            });

            setMessage({
                text: "Password has been reset successfully!",
                type: "success"
            });


        } catch (err) {
            const errorMessage = err.response?.data?.error ||
                err.response?.data?.detail ||
                "Failed to reset password. The code may be invalid or expired.";

            setMessage({
                text: errorMessage,
                type: "error"
            });

            neonToast.error(errorMessage, "error");
        } finally {
            setLoading(false);
        }
    };

    const resendCode = async () => {

        setResending(true);
        setMessage({ text: "", type: "" });

        try {

            await api.post("/api/users/password/change/request/");

            setMessage({
                text: "A new verification code has been sent to your email.",
                type: "success"
            });

            neonToast.success("Verification code sent!", "success");
        } catch (err) {
            const errorMessage = err.response?.data?.error ||
                err.response?.data?.error ||
                "Failed to send verification code";

            setMessage({
                text: errorMessage,
                type: "error"
            });

            neonToast.error(errorMessage, "error");
        } finally {
            setResending(false);
        }
    };

    const passwordValidation = validatePassword(passwordForm.new_password);

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <h1>
                        <FaLock className={styles.titleIcon} />
                        Reset Password with Code
                    </h1>
                    <p className={styles.subtitle}>
                        Enter the 6-digit verification code from your email
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
                                Verification Code
                            </label>
                            <input
                                // type="number"
                                name="code"
                                value={passwordForm.code}
                                onChange={handlePasswordChange}
                                className={styles.codeInput}
                                placeholder="Enter 6-digit code"
                                required
                                maxLength="6"
                                pattern="\d{6}"
                                inputMode="numeric"
                            />
                            <div className={styles.codeHelp}>
                                <FaClock />
                                <span>Code expires in 5 minutes</span>
                            </div>
                        </div>

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
                            loading={loading}
                            disabled={loading || !passwordForm.code || !passwordForm.new_password || !passwordForm.confirm_password}
                            className={styles.primaryBtn}
                        >
                            <FaKey />
                            <span>Reset Password</span>
                        </AsyncButton>
                    </div>
                </form>

                <div className={styles.additionalActions}>
                    <div className={styles.resendSection}>
                        <AsyncButton
                            onClick={resendCode}
                            loading={resending}
                            disabled={resending}
                            className={styles.secondaryBtn}
                        >
                            <FaRedo />
                            <span>Resend Code</span>
                        </AsyncButton>
                    </div>

                    <div className={styles.divider}>or</div>

                    <button
                        onClick={() => navigate("/security")}
                        className={styles.secondaryBtn}
                    >
                        <FaArrowLeft />
                        <span>Back to security</span>
                    </button>
                </div>

                <div className={styles.securityTips}>
                    <div className={styles.tipHeader}>
                        <FaShieldAlt />
                        <h4>Security Tips</h4>
                    </div>
                    <ul>
                        <li>The verification code is only valid for 5 minutes</li>
                        <li>Never share your verification code with anyone</li>
                        <li>Check your spam folder if you don't see the email</li>
                        <li>Use a strong, unique password that you don't use elsewhere</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}