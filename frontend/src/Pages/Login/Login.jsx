import { useState, useContext, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa"; // Import eye icons
import styles from "./Login.module.css";
import api from "../../Utils/api";
import { LoadingContext } from "../../Context/LoaderContext";
import FullScreenSpinner from "../../Components/FullScreenSpinner/FullScreenSpinner";
import { neonToast } from "../../Components/NeonToast/NeonToast";
import { useUser } from "../../Context/UserContext";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false); // New state

    const user = useUser();
    useEffect(() => {
        document.title = "Login"
    }, [])
    const { globalLoading } = useContext(LoadingContext);

    const navigate = useNavigate();
    const location = useLocation();

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const res = await api.post("api/users/login/", { email, password }, { publicApi: true });
            const verifyEmail = res.data.verify_email;
            user.getUser();

            if (verifyEmail) {
                neonToast.success("Verification code sent successfully");
                return navigate(`/verify-email/?email=${email}`);
            }

            neonToast.success("Login successful!");

            const params = new URLSearchParams(location.search);
            const next = params.get("next") || "/admin";
            navigate(next);
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

            <main className={styles.LoginContainer}>
                <form className={styles.LoginForm} onSubmit={handleSubmit}>
                    <h2 className={styles.Title}>Welcome Back</h2>
                    <p className={styles.Subtitle}>Log in to your account</p>

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
                            placeholder="Enter your password"
                            required
                        />
                        <button
                            type="button"
                            className={styles.eyeButton}
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                    </div>

                    <button type="submit" className={styles.LoginBtn}>Login</button>

                    <p className={styles.RegisterPrompt}>
                        Log in with email: <Link to="/login/email" className={styles.RegisterLink}>Click here</Link><br /><br />
                        Don't have an account yet?: <Link to="/register" className={styles.RegisterLink}>Register here</Link>
                    </p>
                </form>
            </main>
        </div>
    );
};

export default Login;