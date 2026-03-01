import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import styles from "./NotFound.module.css";

const NotFound = () => {
    useEffect(() => {
        document.title = "Page not found"
    }, [])
    return (
        <div className={styles.notFoundContainer}>
            <div className={styles.content}>
                <h1 className={styles.code}>404</h1>
                <p className={styles.message}>Sorry, we couldn’t find the page you’re looking for.</p>
                <Link to="/profile" className={styles.button}>Go to Profile</Link>
            </div>
        </div>
    );
};

export default NotFound;
