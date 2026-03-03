import React, { useState, useEffect } from 'react';
import styles from "./Home.module.css";
import Header from "../../Components/Header/Header";
import { useNavigate } from 'react-router';
// Import icons
import { FaEnvelope, FaPhoneAlt, FaMapMarkerAlt } from 'react-icons/fa';
import { FaFacebook, FaTwitter, FaLinkedin, FaGithub } from 'react-icons/fa';
// Import toast
import { neonToast } from '../../Components/NeonToast/NeonToast'; // adjust path as needed

const App = () => {
    const [imageUrl, setImageUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchImage = async () => {
            try {
                setLoading(true);
                const response = await fetch(
                    `https://picsum.photos/400/300?random=${Math.random()}`
                );
                if (!response.ok) throw new Error('Failed to load image');
                setImageUrl(response.url);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchImage();
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        // Here you would typically send the form data to a backend
        // For now, just show a success toast
        neonToast.success("Successfully sent message");
        // Optionally reset form
        e.target.reset();
    };

    return (
        <div className={styles.homeContainer}>
            <Header />
            <main>
                {/* Hero Section */}
                <section className={styles.hero}>
                    <h1 className={styles.heroTitle}>CSSS IT Club E‑Learning</h1>
                    <p className={styles.heroSubtitle}>
                        Master coding with fellow students. Anytime, anywhere.
                    </p>
                    <button className={styles.ctaButton} onClick={() => navigate('/login')}>
                        Start Learning
                    </button>
                </section>

                {/* About Section */}
                <section className={styles.about}>
                    <div className={styles.aboutContent}>
                        <h2>About Us</h2>
                        <p>
                            We are a community of IT students dedicated to collaborative learning.
                            Our platform offers interactive courses, real‑world projects, and
                            mentorship from senior students and industry professionals.
                        </p>
                        <p>
                            Whether you're a beginner or looking to deepen your skills, you'll find
                            the resources and support you need to succeed.
                        </p>
                    </div>
                    <div className={styles.aboutImage}>
                        {loading && <div className={styles.spinner}></div>}
                        {error && <p className={styles.error}>Failed to load image</p>}
                        {!loading && !error && imageUrl && (
                            <img src={imageUrl} alt="Random learning illustration" />
                        )}
                    </div>
                </section>

                {/* Contact Section */}
                <section className={styles.contact}>
                    <h2>Get in Touch</h2>
                    <div className={styles.contactContainer}>
                        <div className={styles.contactInfo}>
                            <p>
                                <FaEnvelope className={styles.icon} />
                                <a href="mailto:elearn@csss-it-club.org">elearn@csss-it-club.org</a>
                            </p>
                            <p>
                                <FaPhoneAlt className={styles.icon} />
                                +1 (555) 123-4567
                            </p>
                            <p>
                                <FaMapMarkerAlt className={styles.icon} />
                                University Campus, Building 42
                            </p>
                            <div className={styles.socialLinks}>
                                <a href="#" aria-label="Facebook"><FaFacebook /></a>
                                <a href="#" aria-label="Twitter"><FaTwitter /></a>
                                <a href="#" aria-label="LinkedIn"><FaLinkedin /></a>
                                <a href="#" aria-label="GitHub"><FaGithub /></a>
                            </div>
                        </div>
                        <form className={styles.contactForm} onSubmit={handleSubmit}>
                            <input type="text" placeholder="Your Name" required />
                            <input type="email" placeholder="Your Email" required />
                            <textarea rows="4" placeholder="Your Message"></textarea>
                            <button type="submit">Send Message</button>
                        </form>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default App;