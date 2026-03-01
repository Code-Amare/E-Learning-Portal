import { useState, useContext, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./VerifyEmail.module.css";
import api from "../../Utils/api";
import FullScreenSpinner from "../../Components/FullScreenSpinner/FullScreenSpinner";
import { LoadingContext } from "../../Context/LoaderContext";
import Header from "../../Components/Header/Header";
import { neonToast } from "../../Components/NeonToast/NeonToast";
import { useUser } from "../../Context/UserContext";
import { FaEnvelope, FaSpinner, FaUser } from "react-icons/fa";

const VerifyEmail = () => {
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [resending, setResending] = useState(false);
    const [step, setStep] = useState("email"); // "email" | "code"

    const user = useUser();
    const { globalLoading } = useContext(LoadingContext);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        document.title = "Verify Email"
    }, [])

    // Detect email from URL
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const urlEmail = params.get("email");

        if (urlEmail) {
            setEmail(decodeURIComponent(urlEmail));
            setStep("code");
        } else {
            setStep("email");
        }
    }, [location]);

    // Just set email in URL (DO NOT send code)
    const handleSetEmail = () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email || !emailRegex.test(email)) {
            neonToast.error("Please enter a valid email address");
            return;
        }

        navigate(`/verify-email?email=${encodeURIComponent(email)}`);
    };

    // Verify code
    const handleVerify = async () => {
        if (code.length !== 6) {
            neonToast.error("Enter a valid 6-digit code");
            return;
        }

        setVerifying(true);
        try {
            await api.post("/api/users/verify-code/", { code, email });
            neonToast.success("Login successful");
            await user.getUser();
            navigate("/profile");
        } catch (err) {
            let errMsg = err.response?.data?.error || "Verification failed";
            neonToast.error(errMsg);
        } finally {
            setVerifying(false);
        }
    };

    // Explicit resend (user intention)
    const handleResend = async () => {
        if (!email) return;

        setResending(true);
        try {
            await api.post("/api/users/send-code/", { email });
            neonToast.success("Verification code sent successfully.");
        } catch (err) {
            let errMsg = err.response?.data?.error || "Failed to resend code";
            neonToast.error(errMsg);
        } finally {
            setResending(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            if (step === "email") {
                handleSetEmail();
            } else {
                handleVerify();
            }
        }
    };

    return (
        <div className={styles.PageContainer}>
            <Header />
            {globalLoading && <FullScreenSpinner />}

            <main className={styles.MainContainer}>
                <div className={styles.VerificationBox}>
                    <div className={styles.IconContainer}>
                        <FaEnvelope className={styles.EmailIcon} />
                    </div>

                    <h2 className={styles.Title}>
                        {step === "email" ? "Enter Your Email" : "Verify Your Email"}
                    </h2>

                    <p className={styles.Subtitle}>
                        {step === "email"
                            ? "Enter the email you received the verification code on"
                            : `Enter the 6-digit verification code sent to ${email}`}
                    </p>

                    {step === "email" ? (
                        <>
                            <div className={styles.InputGroup}>
                                <input
                                    type="email"
                                    className={styles.Input}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                    placeholder="Enter your email"
                                />
                                <FaUser className={styles.InputIcon} />
                            </div>

                            <button
                                className={styles.PrimaryBtn}
                                onClick={handleSetEmail}
                            >
                                Continue
                            </button>
                        </>
                    ) : (
                        <>
                            <div className={styles.InputWrapper}>
                                <input
                                    type="text"
                                    className={styles.Input}
                                    value={code}
                                    onChange={(e) =>
                                        setCode(
                                            e.target.value.replace(/\D/g, "").slice(0, 6)
                                        )
                                    }
                                    onKeyDown={handleKeyPress}
                                    placeholder="Enter 6-digit code"
                                    maxLength="6"
                                    disabled={verifying || resending}
                                />
                            </div>

                            <div className={styles.ButtonGroup}>
                                <button
                                    className={styles.PrimaryBtn}
                                    onClick={handleVerify}
                                    disabled={
                                        verifying || resending || code.length !== 6
                                    }
                                >
                                    {verifying ? (
                                        <>
                                            <FaSpinner className={styles.Spinner} />
                                            Verifying...
                                        </>
                                    ) : (
                                        "Verify Email"
                                    )}
                                </button>

                                <button
                                    className={styles.SecondaryBtn}
                                    onClick={handleResend}
                                    disabled={verifying || resending}
                                >
                                    {resending ? (
                                        <>
                                            <FaSpinner className={styles.Spinner} />
                                            Sending...
                                        </>
                                    ) : (
                                        "Resend Code"
                                    )}
                                </button>
                            </div>

                            <div className={styles.HelpText}>
                                <p>Didn't receive the code? Check spam or resend.</p>
                                <p>Code expires in 5 minutes.</p>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

export default VerifyEmail;
