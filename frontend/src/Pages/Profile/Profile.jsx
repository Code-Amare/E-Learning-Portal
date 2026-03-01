import { useNavigate } from "react-router-dom";
import { useUser } from "../../Context/UserContext";
import styles from "./Profile.module.css";
import ConfirmAction from "../../Components/ConfirmAction/ConfirmAction";
import {
    FaEdit,
    FaShieldAlt,
    FaCheckCircle,
    FaTimesCircle,
    FaCalendarAlt,
    FaUserShield,
    FaKey,
    FaSignOutAlt,
    FaBell,                // new icon for notifications
} from "react-icons/fa";
import { MdVerified, MdLock, MdPerson, MdEmail } from "react-icons/md";
import SideBar from "../../Components/SideBar/SideBar";
import { useNotifContext } from "../../Context/NotifContext";
import { useEffect } from "react";

export default function Profile() {
    const { user, logout } = useUser();
    const navigate = useNavigate();
    const { updatePageTitle } = useNotifContext()
    useEffect(() => {
        updatePageTitle("Profile")
    }, [])


    const handleLogout = () => {
        logout();
    };

    const formatDate = (dateString) => {
        if (!dateString) return "—";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    return (
        <div className={styles.profileContainer}>
            {/* Header Section */}
            <SideBar>
                <div className={styles.profileHeader}>
                    <div className={styles.headerContent}>
                        <div className={styles.avatarSection}>
                            <div className={styles.avatarContainer}>
                                {user.profilePicURL ? (
                                    <img
                                        src={user.profilePicURL}
                                        alt={`${user.fullName}'s profile`}
                                        className={styles.avatarImage}
                                        onError={(e) => {
                                            e.target.style.display = "none";
                                            e.target.nextElementSibling.style.display = "flex";
                                        }}
                                    />
                                ) : null}
                                <div
                                    className={`${styles.avatarFallback} ${user.profilePicURL ? styles.hidden : ""
                                        }`}
                                >
                                    {user.fullName ? user.fullName[0].toUpperCase() : <MdPerson />}
                                </div>
                            </div>
                            <div className={styles.userInfo}>
                                <h1 className={styles.fullName}>{user.fullName || "User"}</h1>
                                <div className={styles.emailSection}>
                                    <MdEmail className={styles.emailIcon} />
                                    <span className={styles.email}>{user.email}</span>
                                </div>
                                {user.emailVerified && (
                                    <div className={styles.verifiedBadge}>
                                        <MdVerified />
                                        <span>Email Verified</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className={styles.headerActions}>
                            <ConfirmAction
                                onConfirm={handleLogout}
                                message="Are you sure you want to logout?"
                                confirmText="Logout"
                                cancelText="Cancel"
                            >
                                <button className={styles.logoutBtn}>
                                    <FaSignOutAlt />
                                    <span>Logout</span>
                                </button>
                            </ConfirmAction>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <main className={styles.mainContent}>
                    {/* Account Information Card (existing) */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2>
                                <FaUserShield className={styles.cardIcon} />
                                Account Information
                            </h2>
                            <button
                                className={styles.editBtn}
                                onClick={() => navigate("/profile/edit")}
                            >
                                <FaEdit />
                                <span>Edit Profile</span>
                            </button>
                        </div>

                        <div className={styles.cardGrid}>
                            <div className={styles.cardRow}>
                                <div className={styles.rowHeader}>
                                    <MdPerson className={styles.rowIcon} />
                                    <span className={styles.label}>Role</span>
                                </div>
                                <span className={styles.value}>{user.role || "—"}</span>
                            </div>

                            <div className={styles.cardRow}>
                                <div className={styles.rowHeader}>
                                    <MdVerified className={styles.rowIcon} />
                                    <span className={styles.label}>Email Status</span>
                                </div>
                                <div className={styles.statusContainer}>
                                    <span
                                        className={`${styles.statusBadge} ${user.emailVerified
                                            ? styles.statusVerified
                                            : styles.statusUnverified
                                            }`}
                                    >
                                        {user.emailVerified ? (
                                            <>
                                                <FaCheckCircle />
                                                <span>Verified</span>
                                            </>
                                        ) : (
                                            <>
                                                <FaTimesCircle />
                                                <span>Unverified</span>
                                            </>
                                        )}
                                    </span>
                                </div>
                            </div>

                            <div className={styles.cardRow}>
                                <div className={styles.rowHeader}>
                                    <MdLock className={styles.rowIcon} />
                                    <span className={styles.label}>Two-Factor Authentication</span>
                                </div>
                                <div className={styles.statusContainer}>
                                    <span
                                        className={`${styles.statusBadge} ${user.twoFaEnabled
                                            ? styles.statusEnabled
                                            : styles.statusDisabled
                                            }`}
                                    >
                                        {user.twoFaEnabled ? "Enabled" : "Disabled"}
                                    </span>
                                </div>
                            </div>

                            <div className={styles.cardRow}>
                                <div className={styles.rowHeader}>
                                    <FaKey className={styles.rowIcon} />
                                    <span className={styles.label}>Password</span>
                                </div>
                                <span className={styles.value}>
                                    {user.hasPassword ? "Set" : "Not Set"}
                                </span>
                            </div>

                            <div className={styles.cardRow}>
                                <div className={styles.rowHeader}>
                                    <FaCalendarAlt className={styles.rowIcon} />
                                    <span className={styles.label}>Member Since</span>
                                </div>
                                <span className={styles.value}>
                                    {formatDate(user.dateJoined)}
                                </span>
                            </div>

                            <div className={styles.cardRow}>
                                <div className={styles.rowHeader}>
                                    <FaShieldAlt className={styles.rowIcon} />
                                    <span className={styles.label}>Account Status</span>
                                </div>
                                <span className={`${styles.statusBadge} ${styles.statusActive}`}>
                                    Active
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* NEW: Profile Details Card */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2>
                                <MdPerson className={styles.cardIcon} />
                                Profile Details
                            </h2>
                            {/* Optional edit button – could link to same edit page */}
                        </div>
                        <div className={styles.cardGrid}>
                            <div className={styles.cardRow}>
                                <div className={styles.rowHeader}>
                                    <span className={styles.label}>Grade</span>
                                </div>
                                <span className={styles.value}>{user.grade || "—"}</span>
                            </div>
                            <div className={styles.cardRow}>
                                <div className={styles.rowHeader}>
                                    <span className={styles.label}>Field</span>
                                </div>
                                <span className={styles.value}>{user.field || "—"}</span>
                            </div>
                            <div className={styles.cardRow}>
                                <div className={styles.rowHeader}>
                                    <span className={styles.label}>Account</span>
                                </div>
                                <span className={styles.value}>{user.account || "—"}</span>
                            </div>
                            <div className={styles.cardRow}>
                                <div className={styles.rowHeader}>
                                    <span className={styles.label}>Section</span>
                                </div>
                                <span className={styles.value}>{user.section || "—"}</span>
                            </div>
                            <div className={styles.cardRow}>
                                <div className={styles.rowHeader}>
                                    <span className={styles.label}>Phone Number</span>
                                </div>
                                <span className={styles.value}>{user.phoneNumber || "—"}</span>
                            </div>
                        </div>
                    </div>

                    {/* NEW: Notification Preferences Card */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2>
                                <FaBell className={styles.cardIcon} />
                                Notification Preferences
                            </h2>
                        </div>
                        <div className={styles.cardGrid}>
                            <div className={styles.cardRow}>
                                <div className={styles.rowHeader}>
                                    <span className={styles.label}>Push Notifications</span>
                                </div>
                                <div className={styles.statusContainer}>
                                    <span
                                        className={`${styles.statusBadge} ${user.pushNotifEnabled
                                            ? styles.statusEnabled
                                            : styles.statusDisabled
                                            }`}
                                    >
                                        {user.pushNotifEnabled ? "Enabled" : "Disabled"}
                                    </span>
                                </div>
                            </div>
                            <div className={styles.cardRow}>
                                <div className={styles.rowHeader}>
                                    <span className={styles.label}>Email Notifications</span>
                                </div>
                                <div className={styles.statusContainer}>
                                    <span
                                        className={`${styles.statusBadge} ${user.notifEnabled
                                            ? styles.statusEnabled
                                            : styles.statusDisabled
                                            }`}
                                    >
                                        {user.notifEnabled ? "Enabled" : "Disabled"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions (existing) */}
                    <div className={styles.quickActions}>
                        <h2 className={styles.actionsTitle}>Quick Actions</h2>
                        <div className={styles.actionsGrid}>
                            <button
                                className={styles.actionCard}
                                onClick={() => navigate("/profile/edit")}
                            >
                                <div className={styles.actionIcon} style={{ backgroundColor: "rgba(79, 70, 229, 0.1)" }}>
                                    <FaEdit style={{ color: "#4f46e5" }} />
                                </div>
                                <div className={styles.actionContent}>
                                    <h3>Edit Profile</h3>
                                    <p>Update your personal information</p>
                                </div>
                            </button>

                            <button
                                className={styles.actionCard}
                                onClick={() => navigate("/security")}
                            >
                                <div className={styles.actionIcon} style={{ backgroundColor: "rgba(16, 185, 129, 0.1)" }}>
                                    <FaShieldAlt style={{ color: "#10b981" }} />
                                </div>
                                <div className={styles.actionContent}>
                                    <h3>Security Settings</h3>
                                    <p>Manage password and 2FA</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </main>
            </SideBar>
        </div>
    );
}