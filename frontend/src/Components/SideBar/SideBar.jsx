import { useState, useEffect, useRef } from "react";
import styles from "./SideBar.module.css";
import ConfirmAction from "../ConfirmAction/ConfirmAction";
import neonToast from "../../Components/NeonToast/NeonToast"
import {
    MdMenu,
    MdChevronLeft,
    MdNotifications,
    MdSettings,
    MdExitToApp,
    MdEdit,
    MdArrowDropDown,
    MdClose,
    MdSecurity,
    MdPerson,
    MdDashboard,
    MdAnalytics,
    MdPeople,
    MdAssignment,
    MdSchool,
    MdCode,
    MdAccountTree,
    MdChecklist,
    MdAnnouncement,
    MdAdminPanelSettings,
    MdSelectAll,
    MdCampaign,
} from "react-icons/md";

import { FaBullhorn } from "react-icons/fa"
import { useUser } from "../../Context/UserContext";
import { useNotifContext } from "../../Context/NotifContext";
import ThemeToggle from "../ThemeToggle/ThemeToggle";
import { useNavigate } from "react-router-dom";
import { timeAgo } from "../../Utils/time";

export default function SideBar({ children }) {
    const [open, setOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [notificationOpen, setNotificationOpen] = useState(false);

    const initialRender = useRef(true);
    const { user, logout } = useUser();
    const { notificationPreview } = useNotifContext();
    const role = user.role;
    const navigate = useNavigate();



    let adminMenuItems = [
        { icon: <MdDashboard />, text: "Dashboard", to: `/${role}` },
        { icon: <MdPeople />, text: "Students", to: "/admin/students" },
        { icon: <MdSchool />, text: "Learning Tasks", to: "/admin/learning-tasks" },
        { icon: <MdCode />, text: "Languages", to: "/admin/languages" },
        { icon: <MdAccountTree />, text: "Frameworks", to: "/admin/frameworks" },
        { icon: <FaBullhorn size={25} />, text: "Announcements", to: "/admin/announcements" },
        { icon: <MdChecklist />, text: "Attendance", to: "/admin/attendance" },
        { icon: <MdSelectAll />, text: "Bulk Operation", to: "/admin/students/bulk-operation" },
        { icon: <MdAdminPanelSettings />, text: "Admins", to: "/admin/staff" },
    ];


    adminMenuItems = user?.isSuperUser
        ? adminMenuItems
        : adminMenuItems.filter(item => item.text !== "Bulk Operation" && item.text !== "Admins");

    const userMenuItems = [
        { icon: <MdDashboard />, text: "Dashboard", to: `/${role}` },
        { icon: <MdAssignment />, text: "My Learning Task", to: "/user/my-learning-task" },
        { icon: <MdSchool />, text: "Learning Tasks", to: "/user/learning-tasks" },
        { icon: <MdAnnouncement />, text: "Announcements", to: "/user/announcements" },
        { icon: <MdAnalytics />, text: "Attendance", to: "/user/attendance" },
    ];

    const menuItems = user.role === "admin" ? adminMenuItems : userMenuItems;

    const profileMenuItems = [
        { icon: <MdPerson />, text: "Profile", to: "/profile" },
        { icon: <MdEdit />, text: "Edit Profile", to: "/profile/edit" },
        { icon: <MdSettings />, text: "Settings", to: "/settings" },
        { icon: <MdSecurity />, text: "Security", to: "/security" },
        { divider: true },
        {
            icon: <MdExitToApp />,
            text: "Logout",
            action: logout,
            requireConfirmation: true
        },
    ];

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);

            if (!mobile && mobileOpen) {
                setMobileOpen(false);
            }
        };

        if (initialRender.current) {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            if (!mobile) {
                setOpen(false);
            }
            initialRender.current = false;
        }

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [mobileOpen]);

    const toggle = () => setOpen(!open);
    const toggleMobile = () => setMobileOpen(!mobileOpen);
    const closeMobileDrawer = () => setMobileOpen(false);

    const toggleProfileMenu = () => setProfileMenuOpen(!profileMenuOpen);
    const closeProfileMenu = () => setProfileMenuOpen(false);

    const toggleNotification = () => setNotificationOpen(!notificationOpen);
    const closeNotification = () => setNotificationOpen(false);

    // Handle desktop overlay and close dropdowns
    const closeAllDesktopDropdowns = () => {
        setProfileMenuOpen(false);
        setNotificationOpen(false);
    };

    // Handle mobile dropdowns with overlay
    const handleMobileProfileClick = () => {
        setProfileMenuOpen(!profileMenuOpen);
        setNotificationOpen(false);
    };

    const handleMobileNotificationClick = () => {
        setNotificationOpen(!notificationOpen);
        setProfileMenuOpen(false);
    };

    // Close all mobile dropdowns
    const closeAllMobileDropdowns = () => {
        setProfileMenuOpen(false);
        setNotificationOpen(false);
    };

    // Handle profile menu item click
    const handleProfileMenuItemClick = (item) => {
        if (item.to) {
            navigate(item.to);
            closeProfileMenu();
            if (isMobile) {
                closeAllMobileDropdowns();
            }
        }
    };

    // Handle image error
    const handleImageError = (e) => {
        e.target.style.display = "none";
        const parent = e.target.parentElement;
        if (parent) {
            const fallback = parent.querySelector(`.${styles.avatarFallback}`);
            if (fallback) {
                fallback.style.display = "flex";
            }
        }
    };

    // Logout handler
    const handleLogout = () => {
        logout();
        setTimeout(() => {
            navigate("/login");
            neonToast.success("Logged out successfully")
        }, 2000); //
    };


    // Truncate text function
    const truncateText = (text, maxLength = 40) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + "...";
    };

    return (
        <>
            {/* Mobile menu button */}
            {isMobile && (
                <button className={styles.mobileBtn} onClick={toggleMobile}>
                    <MdMenu size={28} />
                </button>
            )}

            {/* Desktop layout */}
            {!isMobile && (
                <div className={styles.desktopContainer}>
                    {/* Desktop Overlay for dropdowns */}
                    {(profileMenuOpen || notificationOpen) && (
                        <div
                            className={styles.desktopOverlay}
                            onClick={closeAllDesktopDropdowns}
                        />
                    )}

                    {/* Sidebar */}
                    <aside className={`${styles.sidebar} ${open ? styles.open : styles.closed}`}>
                        <div className={styles.sidebarHeader}>
                            <button
                                className={styles.toggleBtn}
                                onClick={toggle}
                                aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
                            >
                                {open ? <MdChevronLeft size={24} /> : <MdMenu size={24} />}
                            </button>
                        </div>

                        {/* REMOVED: Profile section from expanded sidebar */}
                        {/* Only show menu items */}

                        <div className={styles.menuItems}>
                            {menuItems.map((item, i) => (
                                <button
                                    key={i}
                                    className={`${styles.item} ${window.location.pathname === item.to ? styles.active : ''}`}
                                    onClick={() => navigate(item.to)}
                                >
                                    {item.icon}
                                    <span className={`${styles.text} ${open ? styles.showText : ""}`}>
                                        {item.text}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Theme toggle at bottom */}
                        <div className={`${styles.themeToggle} ${styles.desktopThemeToggle}`}>
                            <div>
                                <ThemeToggle />
                            </div>
                            <span className={`${styles.text} ${open ? styles.showText : ""}`}>Theme</span>
                        </div>
                    </aside>

                    {/* Main content with header */}
                    <div className={`${styles.mainContent} ${open ? styles.sidebarOpen : styles.sidebarClosed}`}>
                        {/* Top Header */}
                        <header className={styles.header}>
                            <div className={styles.headerLeft}>
                                <h1 className={styles.pageTitle}>{user.role === "admin" ? "Admin" : "User"} Dashboard</h1>
                            </div>

                            <div className={styles.headerRight}>
                                {/* Notification Icon with Dropdown */}
                                <div className={styles.notificationContainer}>
                                    <button
                                        className={styles.notificationBtn}
                                        onClick={toggleNotification}
                                        aria-label="Notifications"
                                    >
                                        <MdNotifications size={24} />
                                        {(notificationPreview.length || 0) > 0 && (
                                            <span className={styles.notificationBadge}>
                                                {(notificationPreview.length || 0) > 99 ? '99+' : (notificationPreview.length || 0)}
                                            </span>
                                        )}
                                    </button>

                                    {notificationOpen && (
                                        <div className={styles.notificationDropdown}>
                                            <div className={styles.notificationHeader}>
                                                <h3>Notifications</h3>
                                                <span
                                                    className={styles.clearAll}
                                                    onClick={() => {
                                                        navigate("/notifications")
                                                    }}
                                                >
                                                    View All
                                                </span>
                                            </div>
                                            <div className={styles.notificationList}>
                                                {notificationPreview && notificationPreview.length > 0 ? (
                                                    notificationPreview.map(notification => (
                                                        <div key={notification.id} className={styles.notificationItem} onClick={() => {
                                                            navigate(`/notification/${notification.id}`)
                                                        }}>
                                                            <div className={styles.notificationContent}>
                                                                <div className={styles.notificationTitle}>
                                                                    {notification.title}
                                                                </div>
                                                                <div className={styles.notificationTime}>
                                                                    {timeAgo(notification.sent_at)}
                                                                </div>
                                                            </div>

                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className={styles.noNotifications}>
                                                        No new notifications
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Profile with Dropdown */}
                                <div className={styles.profileContainer}>
                                    <button
                                        className={styles.profileBtn}
                                        onClick={toggleProfileMenu}
                                        aria-label="Profile menu"
                                    >
                                        <div className={styles.profileImage}>
                                            {user?.profilePicURL ? (
                                                <img
                                                    src={user.profilePicURL}
                                                    className={styles.profilePic}
                                                    alt={`${user.fullName}'s profile`}
                                                    onError={handleImageError}
                                                />
                                            ) : null}
                                            <div className={`${styles.avatarFallback} ${user?.profilePicURL ? styles.hidden : ''}`}>
                                                {user?.fullName?.charAt(0) || <MdPerson />}
                                            </div>
                                        </div>
                                        <div className={styles.profileInfo}>
                                            <span className={styles.profileName}>{user?.fullName || "User"}</span>
                                            <span className={styles.profileRole}>{user?.role || "User"}</span>
                                        </div>
                                        <MdArrowDropDown size={24} className={`${styles.dropdownArrow} ${profileMenuOpen ? styles.rotated : ''}`} />
                                    </button>

                                    {profileMenuOpen && (
                                        <div className={styles.profileDropdown}>
                                            {profileMenuItems.map((item, index) => (
                                                item.divider ? (
                                                    <div key={`divider-${index}`} className={styles.profileMenuDivider} />
                                                ) : item.requireConfirmation ? (
                                                    <ConfirmAction
                                                        key={index}
                                                        onConfirm={handleLogout}
                                                        title="Logout"
                                                        message="Are you sure you want to logout?"
                                                        confirmText="Logout"
                                                        cancelText="Cancel"
                                                    >
                                                        <button className={styles.profileMenuItem}>
                                                            {item.icon}
                                                            <span>{item.text}</span>
                                                        </button>
                                                    </ConfirmAction>
                                                ) : (
                                                    <button
                                                        key={index}
                                                        className={styles.profileMenuItem}
                                                        onClick={() => handleProfileMenuItemClick(item)}
                                                    >
                                                        {item.icon}
                                                        <span>{item.text}</span>
                                                    </button>
                                                )
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </header>

                        {/* Content Area */}
                        <main className={styles.content}>
                            {children}
                        </main>
                    </div>
                </div>
            )}

            {/* Mobile layout */}
            {isMobile && (
                <div className={styles.mobileContainer}>
                    {/* Mobile Header */}
                    <header className={styles.mobileHeader}>
                        <div className={styles.mobileHeaderLeft}>
                            {/* Menu button for mobile */}
                            <button className={styles.mobileMenuBtn} onClick={toggleMobile}>
                                <MdMenu size={24} />
                            </button>
                        </div>

                        <div className={styles.mobileHeaderRight}>
                            {/* Mobile Notification Icon */}
                            <div className={styles.mobileNotificationContainer}>
                                <button
                                    className={styles.notificationBtn}
                                    onClick={handleMobileNotificationClick}
                                    aria-label="Notifications"
                                >
                                    <MdNotifications size={24} />
                                    {(notificationPreview.length || 0) > 0 && (
                                        <span className={styles.notificationBadge}>
                                            {(notificationPreview.length || 0) > 99 ? '99+' : (notificationPreview.length || 0)}
                                        </span>
                                    )}
                                </button>

                                {notificationOpen && (
                                    <>
                                        <div className={styles.mobileNotificationDropdown}>
                                            <div className={styles.mobileDropdownHeader}>
                                                <h3>Notifications</h3>
                                                <span
                                                    className={styles.clearAll}
                                                    onClick={() => {
                                                        navigate("/notifications")
                                                    }}
                                                >
                                                    View All
                                                </span>
                                            </div>
                                            <div className={styles.mobileNotificationList}>
                                                {notificationPreview && notificationPreview.length > 0 ? (
                                                    notificationPreview.map(notification => (
                                                        <div key={notification.id} className={styles.mobileNotificationItem}>
                                                            <div className={styles.mobileNotificationContent}>
                                                                <div className={styles.mobileNotificationTitle} title={notification.title}>
                                                                    {truncateText(notification.title, 35)}
                                                                </div>
                                                                <div className={styles.mobileNotificationTime}>
                                                                    {timeAgo(notification.sent_at)}
                                                                </div>

                                                            </div>

                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className={styles.noNotifications}>
                                                        No new notifications
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className={styles.mobileDropdownOverlay} onClick={closeAllMobileDropdowns} />
                                    </>
                                )}
                            </div>

                            {/* Mobile Profile Icon */}
                            <div className={styles.mobileProfileContainer}>
                                <button
                                    className={styles.mobileProfileBtn}
                                    onClick={handleMobileProfileClick}
                                    aria-label="Profile menu"
                                >
                                    <div className={styles.profileImage}>
                                        {user?.profilePicURL ? (
                                            <img
                                                src={user.profilePicURL}
                                                className={styles.profilePic}
                                                alt={`${user.fullName}'s profile`}
                                                onError={handleImageError}
                                            />
                                        ) : null}
                                        <div className={`${styles.avatarFallback} ${user?.profilePicURL ? styles.hidden : ''}`}>
                                            {user?.fullName?.charAt(0) || <MdPerson />}
                                        </div>
                                    </div>
                                </button>

                                {profileMenuOpen && (
                                    <>
                                        <div className={styles.mobileProfileDropdown}>
                                            <div className={styles.mobileProfileHeader}>
                                                <div className={styles.mobileProfileImage}>
                                                    {user?.profilePicURL ? (
                                                        <img
                                                            src={user.profilePicURL}
                                                            className={styles.profilePic}
                                                            alt={`${user.fullName}'s profile`}
                                                            onError={handleImageError}
                                                        />
                                                    ) : null}
                                                    <div className={`${styles.avatarFallback} ${user?.profilePicURL ? styles.hidden : ''}`}>
                                                        {user?.fullName?.charAt(0) || <MdPerson />}
                                                    </div>
                                                </div>
                                                <div className={styles.mobileProfileInfo}>
                                                    <span className={styles.profileName}>{user?.fullName || "User"}</span>
                                                    <span className={styles.profileEmail}>{user?.email || "user@example.com"}</span>
                                                </div>
                                                <button
                                                    className={styles.mobileCloseBtn}
                                                    onClick={closeAllMobileDropdowns}
                                                >
                                                    <MdClose size={20} />
                                                </button>
                                            </div>
                                            <div className={styles.mobileProfileMenuItems}>
                                                {profileMenuItems.map((item, index) => (
                                                    item.divider ? (
                                                        <div key={`divider-${index}`} className={styles.mobileProfileMenuDivider} />
                                                    ) : item.requireConfirmation ? (
                                                        <ConfirmAction
                                                            key={index}
                                                            onConfirm={handleLogout}
                                                            title="Logout"
                                                            message="Are you sure you want to logout?"
                                                            confirmText="Logout"
                                                            cancelText="Cancel"
                                                        >
                                                            <button className={styles.mobileProfileMenuItem}>
                                                                {item.icon}
                                                                <span>{item.text}</span>
                                                            </button>
                                                        </ConfirmAction>
                                                    ) : (
                                                        <button
                                                            key={index}
                                                            className={styles.mobileProfileMenuItem}
                                                            onClick={() => handleProfileMenuItemClick(item)}
                                                        >
                                                            {item.icon}
                                                            <span>{item.text}</span>
                                                        </button>
                                                    )
                                                ))}
                                            </div>
                                        </div>
                                        <div className={styles.mobileDropdownOverlay} onClick={closeAllMobileDropdowns} />
                                    </>
                                )}
                            </div>
                        </div>
                    </header>

                    {/* Mobile Content */}
                    <main className={styles.mobileContent}>
                        {children}
                    </main>

                    {/* Mobile drawer */}
                    <div className={`${styles.mobileDrawer} ${mobileOpen ? styles.mobileDrawerOpen : ''}`}>
                        <div className={styles.drawerHeader}>
                            <div className={styles.drawerProfile}>
                                <div className={styles.drawerProfileImage}>
                                    {user?.profilePicURL ? (
                                        <img
                                            src={user.profilePicURL}
                                            className={styles.profilePic}
                                            alt={`${user.fullName}'s profile`}
                                            onError={handleImageError}
                                        />
                                    ) : null}
                                    <div className={`${styles.avatarFallback} ${user?.profilePicURL ? styles.hidden : ''}`}>
                                        {user?.fullName?.charAt(0) || <MdPerson />}
                                    </div>
                                </div>
                                <div className={styles.drawerProfileInfo}>
                                    <span className={styles.profileName}>{user?.fullName || "User"}</span>
                                    <span title={user?.email || ""} className={styles.profileEmail}>{user?.email || "user@example.com"}</span>
                                </div>
                            </div>
                            <button className={styles.closeBtn} onClick={closeMobileDrawer}>
                                <MdChevronLeft size={24} />
                            </button>
                        </div>
                        <div className={styles.mobileMenuItems}>
                            {menuItems.map((item, i) => (
                                <button
                                    key={i}
                                    className={`${styles.mobileItem} ${window.location.pathname === item.to ? styles.active : ''}`}
                                    onClick={() => {
                                        navigate(item.to);
                                        closeMobileDrawer();
                                    }}
                                >
                                    {item.icon}
                                    <span className={styles.mobileText}>{item.text}</span>
                                </button>
                            ))}
                            <div className={styles.mobileThemeToggle}>
                                <ThemeToggle />
                                <span className={styles.mobileText}>Theme</span>
                            </div>

                            {/* Logout button in mobile drawer */}
                            <ConfirmAction
                                onConfirm={handleLogout}
                                title="Logout"
                                message="Are you sure you want to logout?"
                                confirmText="Logout"
                                cancelText="Cancel"
                            >
                                <button className={styles.mobileLogoutBtn}>
                                    <MdExitToApp />
                                    <span className={styles.mobileText}>Logout</span>
                                </button>
                            </ConfirmAction>
                        </div>
                    </div>

                    {/* Mobile drawer overlay */}
                    {mobileOpen && (
                        <div
                            className={styles.mobileDrawerOverlay}
                            onClick={closeMobileDrawer}
                        />
                    )}
                </div>
            )}
        </>
    );
}