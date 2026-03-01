import { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import styles from "./Register.module.css";
import api from "../../Utils/api";
import { LoadingContext } from "../../Context/LoaderContext";
import FullScreenSpinner from "../../Components/FullScreenSpinner/FullScreenSpinner";
import { neonToast } from "../../Components/NeonToast/NeonToast";
import { useUser } from "../../Context/UserContext";

const Register = () => {
    const [email, setEmail] = useState("");
    const [fullName, setFullName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const { globalLoading } = useContext(LoadingContext);
    const user = useUser();
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "Register";
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            return neonToast.error("Passwords do not match");
        }

        try {
            await api.post(
                "api/users/register/",
                { email, full_name: fullName, password },
                { publicApi: true }
            );

            neonToast.success("Registration successful! Verification email sent.");
            user.getUser();
            navigate(`/verify-email/?email=${email}`);

        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data?.error || "Something went wrong";
            neonToast.error(errMsg);
        }
    };

    return (
        <div className={styles.PageContainer}>
            {globalLoading && <FullScreenSpinner />}

            <header className={styles.TopBar}>
                <Link to="/" className={styles.HomeLink}>← Back to Home</Link>
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
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                    </div>

                    <label className={styles.Label}>Confirm Password</label>
                    <input
                        type="password"
                        className={styles.Input}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        required
                    />

                    <button type="submit" className={styles.RegisterBtn}>
                        Register
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