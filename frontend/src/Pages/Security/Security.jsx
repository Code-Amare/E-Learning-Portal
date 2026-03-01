import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../Context/UserContext";
import api from "../../Utils/api";
import { neonToast } from "../../Components/NeonToast/NeonToast";
import AsyncButton from "../../Components/AsyncButton/AsyncButton";
import SideBar from "../../Components/SideBar/SideBar";
import styles from "./Security.module.css";
import {
    FaShieldAlt,
    FaKey,
    FaSignOutAlt,
    FaCheckCircle,
    FaEye,
    FaEyeSlash,
    FaMobileAlt,
    FaClock,
    FaLock,
    FaUnlock,
    FaEnvelope,
    FaRedo,
    FaSpinner
} from "react-icons/fa";
import { MdSecurity, MdWarning, MdEmail } from "react-icons/md";
import { IoShieldCheckmark } from "react-icons/io5";
import { useNotifContext } from "../../Context/NotifContext";

export default function Security() {
    const { user, refreshUser } = useUser();
    const navigate = useNavigate();
    const { updatePageTitle } = useNotifContext()
    useEffect(() => {
        updatePageTitle("Security")
    }, [])

    // Local state for 2FA button
    const [localTwoFaEnabled, setLocalTwoFaEnabled] = useState(false);
    const [twoFaLoading, setTwoFaLoading] = useState(false);
    const [pwLoading, setPwLoading] = useState(false);
    const [emailPwLoading, setEmailPwLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [passwordForm, setPasswordForm] = useState({
        current_password: "",
        new_password: "",
        confirm_password: ""
    });

    // Initialize local state from user context
    useEffect(() => {
        if (user.twoFaEnabled !== undefined) {
            setLocalTwoFaEnabled(user.twoFaEnabled);
        }
    }, [user.twoFaEnabled]);

    useEffect(() => {
        if (user.isAuthenticated === null) return;
        if (!user.isAuthenticated) {
            navigate("/login");
            return;
        }
    }, [user, navigate]);

    const toggle2FA = async () => {
        setTwoFaLoading(true);

        try {
            const endpoint = localTwoFaEnabled
                ? "/api/users/twofa/disable/"
                : "/api/users/twofa/enable/";

            const response = await api.post(endpoint);

            // SUCCESS - Update local state immediately with API response data
            if (response.data.twofa_enabled !== undefined) {
                setLocalTwoFaEnabled(response.data.twofa_enabled);
            } else {
                // Fallback: toggle the state
                setLocalTwoFaEnabled(!localTwoFaEnabled);
            }

            // Also refresh user context in background
            if (typeof refreshUser === "function") {
                await refreshUser();
            }

            // Show success message from API
            neonToast.success(response.data.message, "success");

        } catch (err) {
            // Handle 400 errors (warnings or errors from your API)
            if (err.response?.status === 400) {
                if (err.response.data.warning) {
                    neonToast.warning(err.response.data.warning, "warning");
                } else if (err.response.data.error) {
                    neonToast.error(err.response.data.error, "error");
                }
            } else {
                // Handle other errors
                const errorMessage = err.response?.data?.error ||
                    err.response?.data?.warning ||
                    err.response?.data?.message ||
                    "Failed to update 2FA settings";
                neonToast.error(errorMessage, "error");
            }
        } finally {
            setTwoFaLoading(false);
        }
    };

    const handlePasswordChange = (e) => {
        setPasswordForm(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const togglePasswordVisibility = (field) => {
        switch (field) {
            case 'current': setShowCurrentPassword(!showCurrentPassword); break;
            case 'new': setShowNewPassword(!showNewPassword); break;
            case 'confirm': setShowConfirmPassword(!showConfirmPassword); break;
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

    const submitPasswordChange = async (e) => {
        e.preventDefault();

        // Validation
        if (passwordForm.new_password !== passwordForm.confirm_password) {
            neonToast.error("New passwords do not match", "error");
            return;
        }

        const passwordValidation = validatePassword(passwordForm.new_password);
        if (!passwordValidation.isValid) {
            neonToast.error("New password does not meet requirements", "error");
            return;
        }

        setPwLoading(true);

        try {
            await api.post("/api/users/password/change/", {
                current_password: passwordForm.current_password,
                new_password: passwordForm.new_password,
            });

            setPasswordForm({
                current_password: "",
                new_password: "",
                confirm_password: ""
            });


            if (typeof refreshUser === "function") {
                await refreshUser();
            }

        } catch (err) {
            const errorMessage = err.response?.data?.error ||
                err.response?.data?.message?.[0] ||
                "Failed to change password";
            neonToast.error(errorMessage, "error");
        } finally {
            setPwLoading(false);
        }
    };

    const requestPasswordChangeViaEmail = async () => {
        setEmailPwLoading(true);

        try {
            await api.post("/api/users/password/change/request/");

            neonToast.success("Password reset email sent! Check your inbox for verification instructions.", "success");

        } catch (err) {
            const errorMessage = err.response?.data?.detail ||
                err.response?.data?.error ||
                "Failed to send password reset email";

            neonToast.error(errorMessage, "error");
        } finally {
            setEmailPwLoading(false);
        }
    };

    if (user.isAuthenticated === null) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <p>Loading security settings...</p>
            </div>
        );
    }

    if (!user.isAuthenticated) return null;

    const passwordValidation = validatePassword(passwordForm.new_password);

    return (
        <div className={styles.securityContainer}>
            <SideBar>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerContent}>
                        <div className={styles.titleSection}>
                            <FaShieldAlt className={styles.titleIcon} />
                            <div>
                                <h1>Security Settings</h1>
                                <p>Manage your account security and privacy</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <main className={styles.mainContent}>
                    {/* Two-Factor Authentication Card */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2>
                                <IoShieldCheckmark className={styles.cardIcon} />
                                Two-Factor Authentication
                            </h2>
                            <div className={`${styles.statusBadge} ${localTwoFaEnabled ? styles.enabled : styles.disabled}`}>
                                {localTwoFaEnabled ? "Enabled" : "Disabled"}
                            </div>
                        </div>

                        <div className={styles.cardContent}>
                            <div className={styles.settingRow}>
                                <div className={styles.settingInfo}>
                                    <div className={styles.settingIcon}>
                                        <FaMobileAlt />
                                    </div>
                                    <div>
                                        <h3>Two-Factor Authentication (2FA)</h3>
                                        <p>
                                            Add an extra layer of security to your account.
                                            When enabled, you'll need to enter a verification code
                                            from your authenticator app when signing in.
                                        </p>
                                        {localTwoFaEnabled && (
                                            <div className={styles.helperText}>
                                                <FaCheckCircle />
                                                <span>2FA is currently protecting your account</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <AsyncButton
                                    onClick={toggle2FA}
                                    loading={twoFaLoading}
                                    disabled={twoFaLoading}
                                    className={localTwoFaEnabled ? styles.dangerBtn : styles.primaryBtn}
                                >
                                    {localTwoFaEnabled ? (
                                        <>
                                            <FaUnlock />
                                            <span>Disable 2FA</span>
                                        </>
                                    ) : (
                                        <>
                                            <FaLock />
                                            <span>Enable 2FA</span>
                                        </>
                                    )}
                                </AsyncButton>
                            </div>
                        </div>
                    </div>

                    {/* Change Password Card */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2>
                                <FaKey className={styles.cardIcon} />
                                Change Password
                            </h2>
                        </div>

                        <form onSubmit={submitPasswordChange} className={styles.form}>
                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>
                                        Current Password
                                    </label>
                                    <div className={styles.passwordInputWrapper}>
                                        <input
                                            type={showCurrentPassword ? "text" : "password"}
                                            name="current_password"
                                            value={passwordForm.current_password}
                                            onChange={handlePasswordChange}
                                            className={styles.formInput}
                                            placeholder="Enter current password"
                                            required
                                        />
                                        <button
                                            type="button"
                                            className={styles.passwordToggle}
                                            onClick={() => togglePasswordVisibility('current')}
                                        >
                                            {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                                        </button>
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
                                        />
                                        <button
                                            type="button"
                                            className={styles.passwordToggle}
                                            onClick={() => togglePasswordVisibility('new')}
                                        >
                                            {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                                        </button>
                                    </div>

                                    {/* Password Requirements */}
                                    <div className={styles.passwordRequirements}>
                                        <h4>Password Requirements</h4>
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
                                        />
                                        <button
                                            type="button"
                                            className={styles.passwordToggle}
                                            onClick={() => togglePasswordVisibility('confirm')}
                                        >
                                            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                        </button>
                                    </div>

                                    {/* Password Match Indicator */}
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
                                    loading={pwLoading}
                                    disabled={pwLoading || !passwordForm.current_password}
                                    className={styles.primaryBtn}
                                >
                                    <FaKey />
                                    <span>Change Password</span>
                                </AsyncButton>
                            </div>
                        </form>
                    </div>

                    {/* Reset Password via Email Card */}
                    <div className={`${styles.card} ${styles.emailResetCard}`}>
                        <div className={styles.cardHeader}>
                            <h2>
                                <MdEmail className={styles.cardIcon} />
                                Reset Password via Email
                            </h2>
                        </div>

                        <div className={styles.cardContent}>
                            <div className={styles.settingRow}>
                                <div className={styles.settingInfo}>
                                    <div className={styles.settingIcon}>
                                        <FaEnvelope />
                                    </div>
                                    <div className={styles.emailResetInfo}>
                                        <h3>Forgot your password?</h3>
                                        <p>
                                            Request a password reset email if you don't remember your current password.
                                            You'll receive a verification link at <strong>{user.email}</strong>
                                        </p>

                                        <div className={styles.emailResetTips}>
                                            <h4>How it works:</h4>
                                            <ul>
                                                <li>
                                                    <FaClock /> You'll receive an email with a verification link
                                                </li>
                                                <li>
                                                    <FaKey /> The link will take you to a secure page to set a new password
                                                </li>
                                                <li>
                                                    <FaShieldAlt /> The link expires in 5 minutes for security
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.emailResetActions}>
                                    <AsyncButton
                                        onClick={requestPasswordChangeViaEmail}
                                        loading={emailPwLoading}
                                        disabled={emailPwLoading}
                                        className={styles.secondaryBtn}
                                    >
                                        {emailPwLoading ? (
                                            <>
                                                <FaSpinner className={styles.spinner} />
                                                <span>Sending...</span>
                                            </>
                                        ) : (
                                            <>
                                                <FaRedo />
                                                <span>Send Reset Email</span>
                                            </>
                                        )}
                                    </AsyncButton>

                                    <div className={styles.emailResetNote}>
                                        <MdWarning />
                                        <span>
                                            Make sure you have access to your email before requesting a reset.
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Security Tips Card */}
                    <div className={`${styles.card} ${styles.tipsCard}`}>
                        <div className={styles.cardHeader}>
                            <h2>
                                <MdSecurity className={styles.cardIcon} />
                                Security Tips
                            </h2>
                        </div>

                        <div className={styles.tipsList}>
                            <div className={styles.tipItem}>
                                <div className={styles.tipIcon}>
                                    <FaShieldAlt />
                                </div>
                                <div className={styles.tipContent}>
                                    <h3>Enable Two-Factor Authentication</h3>
                                    <p>Add an extra layer of security to prevent unauthorized access.</p>
                                </div>
                            </div>

                            <div className={styles.tipItem}>
                                <div className={styles.tipIcon}>
                                    <FaKey />
                                </div>
                                <div className={styles.tipContent}>
                                    <h3>Use Strong Passwords</h3>
                                    <p>Create unique passwords with a mix of letters, numbers, and symbols.</p>
                                </div>
                            </div>

                            <div className={styles.tipItem}>
                                <div className={styles.tipIcon}>
                                    <FaSignOutAlt />
                                </div>
                                <div className={styles.tipContent}>
                                    <h3>Logout from Shared Devices</h3>
                                    <p>Always logout when using public or shared computers.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </SideBar>
        </div>
    );
}