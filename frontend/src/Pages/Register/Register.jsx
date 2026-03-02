import { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import styles from "./Register.module.css";
import api from "../../Utils/api";
import { LoadingContext } from "../../Context/LoaderContext";
import FullScreenSpinner from "../../Components/FullScreenSpinner/FullScreenSpinner";
import { neonToast } from "../../Components/NeonToast/NeonToast";

const Register = () => {
    const [email, setEmail] = useState("");
    const [fullName, setFullName] = useState("");
    const [grade, setGrade] = useState("");
    const [section, setSection] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const { globalLoading } = useContext(LoadingContext);
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "Register";
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitting) return;

        if (password !== confirmPassword) {
            neonToast.error("Passwords do not match");
            return;
        }

        if (!grade || !section) {
            neonToast.error("Grade and Section are required");
            return;
        }

        setSubmitting(true);

        try {
            await api.post(
                "api/users/register/",
                {
                    email: email.trim(),
                    full_name: fullName.trim(),
                    grade: grade.trim(),
                    section: section.trim(),
                    phone_number: phoneNumber.trim(),
                    password: password.trim(),
                },
                { publicApi: true }
            );

            neonToast.success("Registration successful! Verification email sent.");
            navigate(`/verify-email/?email=${encodeURIComponent(email.trim())}`);

        } catch (err) {
            console.error(err);

            let errMsg = "Something went wrong";

            if (Array.isArray(err.response?.data?.error)) {
                errMsg = err.response.data.error[0];
            } else if (typeof err.response?.data?.error === "string") {
                errMsg = err.response.data.error;
            }

            neonToast.error(errMsg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.PageContainer}>
            {globalLoading && <FullScreenSpinner />}

            <header className={styles.TopBar}>
                <Link to="/" className={styles.HomeLink}>
                    ← Back to Home
                </Link>
            </header>

            <main className={styles.RegisterContainer}>
                <form className={styles.RegisterForm} onSubmit={handleSubmit}>
                    <h2 className={styles.Title}>Create Account</h2>
                    <p className={styles.Subtitle}>Sign up to get started</p>

                    <label className={styles.Label}>Full Name</label>
                    <input
                        type="text"
                        className={styles.Input}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your full name"
                        required
                    />

                    <label className={styles.Label}>Email</label>
                    <input
                        type="email"
                        className={styles.Input}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                    />

                    <label className={styles.Label}>Grade</label>
                    <input
                        type="text"
                        className={styles.Input}
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        placeholder="e.g. 10"
                        required
                    />

                    <label className={styles.Label}>Section</label>
                    <input
                        type="text"
                        className={styles.Input}
                        value={section}
                        onChange={(e) => setSection(e.target.value)}
                        placeholder="e.g. A"
                        required
                    />

                    <label className={styles.Label}>Phone Number</label>
                    <input
                        type="tel"
                        className={styles.Input}
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="e.g. 0912345678"
                    />

                    <label className={styles.Label}>Password</label>
                    <div className={styles.passwordWrapper}>
                        <input
                            type={showPassword ? "text" : "password"}
                            className={styles.passwordInput}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Create a password"
                            required
                        />
                        <button
                            type="button"
                            className={styles.eyeButton}
                            onClick={() => setShowPassword((prev) => !prev)}
                        >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                    </div>

                    <label className={styles.Label}>Confirm Password</label>
                    <div className={styles.passwordWrapper}>
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            className={styles.passwordInput}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm your password"
                            required
                        />
                        <button
                            type="button"
                            className={styles.eyeButton}
                            onClick={() =>
                                setShowConfirmPassword((prev) => !prev)
                            }
                        >
                            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                    </div>

                    <button
                        type="submit"
                        className={styles.RegisterBtn}
                        disabled={submitting}
                        style={{ opacity: submitting ? 0.7 : 1 }}
                    >
                        {submitting ? "Registering..." : "Register"}
                    </button>

                    <p className={styles.LoginPrompt}>
                        Already have an account?{" "}
                        <Link to="/login" className={styles.LoginLink}>
                            Login
                        </Link>
                    </p>
                </form>
            </main>
        </div>
    );
};

export default Register;