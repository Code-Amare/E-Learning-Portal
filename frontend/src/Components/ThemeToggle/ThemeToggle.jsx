import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import styles from "./ThemeToggle.module.css";

const ThemeToggle = () => {
    const [theme, setTheme] = useState(() =>
        localStorage.getItem("drtTheme") || "light"
    );

    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        localStorage.setItem("drtTheme", newTheme);
        document.documentElement.setAttribute("data-theme", newTheme);
    };

    return (
        <button className={styles.themeToggleBtn} onClick={toggleTheme}>
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
        </button>
    );
};

export default ThemeToggle;
