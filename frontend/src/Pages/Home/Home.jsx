import React from 'react';
import styles from "./Home.module.css";
import Header from "../../Components/Header/Header";

const App = () => {
    return (
        <div className={styles.homeContainer}>
            <Header />
            <main className={styles.mainContainer}>
                <h1>CSSS IT Club</h1>
                <p className={styles.tagline}>Code together. Learn together.</p>
                <div className={styles.info}>
                    <p>Dedicated to CSSS IT Club students.</p>
                </div>
            </main>
        </div>
    );
};

export default App;