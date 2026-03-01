import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../Utils/api";
import { timeAgo } from "../../Utils/time";
import SideBar from "../../Components/SideBar/SideBar";
import {
    FaBell,
    FaCog,
    FaUser,
    FaCheck,
    FaCircle,
    FaCalendarAlt
} from "react-icons/fa";
import styles from "./NotificationsList.module.css";
import { useNotifContext } from "../../Context/NotifContext";

export default function NotificationsList() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const { notification, notificationPreview, makeAllAsRead, updatePageTitle } = useNotifContext();
    const [notifUnreadCount, setNotifUnreadCount] = useState(notificationPreview.length || 0)
    useEffect(() => {
        updatePageTitle("Notifications")
    }, [])

    useEffect(() => {
        setNotifUnreadCount(notificationPreview.length || 0)
    }, [notificationPreview])

    useEffect(() => {
        if (notification) {
            setNotifications(notification);
            setLoading(false);
        }
    }, [notification]);

    useEffect(() => {
    }, [])

    const handleMarkAllAsRead = async () => {
        try {
            await api.post("/api/realtime/mark-read/", { scope: "all" });

            makeAllAsRead()
        } catch (error) {
            console.error("Failed to mark all as read:", error);
        }
    };

    const handleNotificationClick = (notifId) => {
        navigate(`/notification/${notifId}`);
    };

    const renderActorIcon = (notification) => {
        if (!notification.actor) {
            return (
                <div className={`${styles.actorIcon} ${styles.systemIcon}`}>
                    <FaCog />
                </div>
            );
        }

        if (notification?.actor?.profile_pic_url) {
            return (
                <div className={styles.avatarContainer}>
                    <img
                        src={notification.actor.profile_pic_url}
                        alt={notification.actor.full_name}
                        className={styles.actorAvatar}
                    />
                    {!notification.is_read && <div className={styles.unreadDot}></div>}
                </div>
            );
        }

        return (
            <div className={`${styles.actorIcon} ${styles.userIcon}`}>
                <FaUser />
                {!notification.is_read && <div className={styles.unreadDot}></div>}
            </div>
        );
    };

    const renderActorName = (notification) => {
        if (!notification.actor) {
            return (
                <>
                    <span className={styles.systemBadge}>System</span>
                    <span className={styles.systemText}>Notification</span>
                </>
            );
        }
        return (
            <>
                <span className={styles.actorName}>{notification.actor.full_name || "User"}</span>
                <span className={styles.actorAction}>sent a notification</span>
            </>
        );
    };

    return (
        <div className={styles.container}>
            <SideBar>
                {/* Header - Sticky */}
                <div className={styles.stickyHeader}>
                    <div className={styles.headerContent}>
                        <div className={styles.titleSection}>
                            <div className={styles.bellIconContainer}>
                                <FaBell className={styles.bellIcon} />
                                {notifUnreadCount > 0 && (
                                    <span className={styles.unreadBadge}>{notifUnreadCount}</span>
                                )}
                            </div>
                            <div>
                                <h1>Notifications</h1>
                                <p>Stay updated with your latest activity</p>
                            </div>
                        </div>

                        {notifUnreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className={styles.markAllButton}
                            >
                                <FaCheck />
                                <span>Mark all as read</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Notifications List */}
                <div className={styles.notificationsContainer}>
                    {loading ? (
                        <div className={styles.loadingContainer}>
                            <div className={styles.loadingSpinner}></div>
                            <p className={styles.loadingText}>Loading your notifications...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>
                                <FaBell />
                            </div>
                            <h3>No notifications yet</h3>
                            <p>When you get notifications, they'll appear here</p>
                        </div>
                    ) : (
                        <div className={styles.notificationsList}>
                            {notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    className={`${styles.notificationItem} ${notif.is_read ? styles.read : styles.unread
                                        }`}
                                    onClick={() => handleNotificationClick(notif.id)}
                                >
                                    <div className={styles.notificationContent}>
                                        {/* Left: Avatar/Icon */}
                                        <div className={styles.avatarColumn}>
                                            {renderActorIcon(notif)}
                                        </div>

                                        {/* Middle: Content */}
                                        <div className={styles.contentColumn}>
                                            <div className={styles.notificationHeader}>
                                                <div className={styles.actorInfo}>
                                                    {renderActorName(notif)}
                                                </div>
                                                <div className={styles.timeInfo}>
                                                    <FaCalendarAlt className={styles.timeIcon} />
                                                    <span className={styles.timeText}>
                                                        {timeAgo(notif.sent_at)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className={styles.notificationBody}>
                                                <h4 className={styles.notificationTitle}>
                                                    {notif.title}
                                                </h4>
                                            </div>

                                            {!notif.is_read && (
                                                <div className={styles.unreadIndicator}>
                                                    <FaCircle className={styles.unreadCircle} />
                                                    <span className={styles.unreadText}>New</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </SideBar>
        </div>
    );
}