import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./EmailLogin.module.css";
import api from "../../Utils/api";
import FullScreenSpinner from "../../Components/FullScreenSpinner/FullScreenSpinner";
import { useContext } from "react";
import { LoadingContext } from "../../Context/LoaderContext";
import Header from "../../Components/Header/Header";
import { neonToast } from "../../Components/NeonToast/NeonToast";
import { FaEnvelope, FaUser, FaArrowRight, FaCheck, FaBolt, FaRedo, FaSpinner } from "react-icons/fa";

const EmailLogin = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const { globalLoading } = useContext(LoadingContext);
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "Login With Email"
    }, [])

    const handleSendVerification = async () => {
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            neonToast.error("Please enter a valid email address");
            return;
        }

        try {
            setLoading(true);
            await api.post("/api/users/send-code/", { email });
            neonToast.success("Verification code sent successfully!");


            // Navigate to verification page
            navigate(`/verify-email?email=${encodeURIComponent(email)}`);
        } catch (err) {
            let errMsg = err.response?.data?.error || "Failed to send verification code";
            neonToast.error(errMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            handleSendVerification();
        }
    };

    return (
        <div className={styles.PageContainer}>
            <Header />
            {globalLoading && <FullScreenSpinner />}

            <main className={styles.MainContainer}>
                <div className={styles.EmailBox}>
                    <div className={styles.IconContainer}>
                        <FaEnvelope className={styles.EmailIcon} />
                    </div>

                    <h2 className={styles.Title}>Verify Your Email</h2>
                    <p className={styles.Subtitle}>
                        Enter your email address to receive a verification code
                    </p>

                    <div className={styles.InputGroup}>
                        <input
                            type="email"
                            className={styles.Input}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Enter your email"
                            disabled={loading}
                        />
                        <FaUser className={styles.InputIcon} />
                    </div>

                    <button
                        className={styles.PrimaryBtn}
                        onClick={handleSendVerification}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <FaSpinner className={styles.Spinner} />
                                Sending...
                            </>
                        ) : (
                            <>
                                Send Verification Code
                                <FaArrowRight className={styles.BtnIcon} />
                            </>
                        )}
                    </button>

                    <p className={styles.HelpText}>
                        Already have a code?{" "}
                        <button
                            className={styles.TextButton}
                            onClick={() => navigate("/verify-email")}
                        >
                            Verify here
                        </button>
                    </p>
                </div>

                <div className={styles.Features}>
                    <div className={styles.Feature}>
                        <div className={styles.FeatureIcon}>
                            <FaCheck />
                        </div>
                        <div>
                            <h3 className={styles.FeatureTitle}>Secure Verification</h3>
                            <p className={styles.FeatureDesc}>Protect your account with our secure verification system</p>
                        </div>
                    </div>

                    <div className={styles.Feature}>
                        <div className={styles.FeatureIcon}>
                            <FaBolt />
                        </div>
                        <div>
                            <h3 className={styles.FeatureTitle}>Instant Delivery</h3>
                            <p className={styles.FeatureDesc}>Receive your code instantly via email</p>
                        </div>
                    </div>

                    <div className={styles.Feature}>
                        <div className={styles.FeatureIcon}>
                            <FaRedo />
                        </div>
                        <div>
                            <h3 className={styles.FeatureTitle}>Easy Resend</h3>
                            <p className={styles.FeatureDesc}>Can't find the code? Resend with one click</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default EmailLogin;