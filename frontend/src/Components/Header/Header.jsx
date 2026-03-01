import { useState, useEffect, useRef } from "react";
import { Menu, X, LogIn, ChevronRight } from "lucide-react";
import styles from "./Header.module.css";
import ThemeToggle from "../ThemeToggle/ThemeToggle";
import { Link } from "react-router-dom";

const Header = () => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const menuRef = useRef(null);
    const backdropRef = useRef(null);

    const toggleMobileMenu = () => {
        setMobileOpen(prev => !prev);
        if (!mobileOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    };

    const closeMobileMenu = () => {
        setMobileOpen(false);
        document.body.style.overflow = 'unset';
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target) &&
                !event.target.closest(`.${styles.MobileMenuBtn}`)) {
                closeMobileMenu();
            }
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                closeMobileMenu();
            }
        };

        if (mobileOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [mobileOpen]);

    return (
        <>
            {/* Backdrop - placed before header, will be below sidebar */}
            {mobileOpen && (
                <div
                    ref={backdropRef}
                    className={styles.Backdrop}
                    onClick={closeMobileMenu}
                />
            )}

            <header className={styles.HeaderContainer}>
                <div className={styles.HeaderContent}>
                    <Link to="/" className={styles.Logo} onClick={closeMobileMenu}>
                        CSSS IT Club
                    </Link>

                    {/* Desktop Right Controls (Login + Theme Toggle) */}
                    <div className={styles.RightControls}>
                        <ThemeToggle />
                        <Link to="/login" className={styles.LoginBtn}>
                            <LogIn size={16} />
                            <span>Login</span>
                        </Link>

                        <button
                            className={`${styles.MobileMenuBtn} ${mobileOpen ? styles.MenuBtnOpen : ''}`}
                            onClick={toggleMobileMenu}
                            aria-label={mobileOpen ? "Close menu" : "Open menu"}
                        >
                            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Side Navigation Drawer - outside header for proper stacking */}
            <aside
                ref={menuRef}
                className={`${styles.SideDrawer} ${mobileOpen ? styles.SideDrawerOpen : ''}`}
            >
                <div className={styles.DrawerHeader}>
                    <h3 className={styles.DrawerTitle}>Menu</h3>
                    <button
                        className={styles.CloseDrawerBtn}
                        onClick={closeMobileMenu}
                        aria-label="Close menu"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.DrawerContent}>
                    <div className={styles.DrawerSection}>
                        <div className={styles.DrawerSectionTitle}>Navigation</div>
                        <Link
                            to="/"
                            className={styles.DrawerLink}
                            onClick={closeMobileMenu}
                        >
                            Home
                        </Link>
                    </div>

                    <div className={styles.DrawerSection}>
                        <div className={styles.DrawerSectionTitle}>Theme</div>
                        <div className={styles.ThemeSection}>
                            <span>Appearance</span>
                            <ThemeToggle />
                        </div>
                    </div>

                    <div className={styles.DrawerSection}>
                        <div className={styles.DrawerSectionTitle}>Account</div>
                        <Link
                            to="/login"
                            className={styles.DrawerLoginBtn}
                            onClick={closeMobileMenu}
                        >
                            <div className={styles.LoginIconWrapper}>
                                <LogIn size={18} />
                            </div>
                            <div className={styles.LoginText}>
                                <strong>Login to Account</strong>
                                <small>Access your dashboard</small>
                            </div>
                        </Link>
                    </div>
                </div>

                <div className={styles.DrawerFooter}>
                    <div className={styles.FooterLogo}>CSSS IT Club</div>
                    <div className={styles.FooterCopyright}>© 2024 All rights reserved</div>
                </div>
            </aside>
        </>
    );
};

export default Header;