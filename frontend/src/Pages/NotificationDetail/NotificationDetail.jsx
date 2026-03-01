import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../Utils/api";
import { timeAgo } from "../../Utils/time";
import SideBar from "../../Components/SideBar/SideBar";
import {
    FaArrowLeft,
    FaUser,
    FaCog,
    FaCalendarAlt,
    FaClock,
    FaExternalLinkAlt,
    FaBell,
    FaInfoCircle,
} from "react-icons/fa";
import styles from "./NotificationDetail.module.css";
import { useNotifContext } from "../../Context/NotifContext";

export default function NotificationDetail() {
    const { notif_id } = useParams();
    const navigate = useNavigate();

    const [notification, setNotification] = useState(null);
    const [loading, setLoading] = useState(true);
    const { getNotif, updatePageTitle } = useNotifContext()
    useEffect(() => {
        if (!notification?.title) return
        updatePageTitle(`Notification '${notification?.title}'`)
    }, [notification])

    useEffect(() => {
        if (!notif_id) return; // do nothing if notif_id is missing
        getNotif()
    }, [notif_id]); // only run when notif_id changes



    useEffect(() => {
        if (!notif_id) return;
        fetchNotification();
    }, [notif_id]);

    const fetchNotification = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/api/realtime/get-notif/${notif_id}/`);
            setNotification(res.data.notif);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatFullDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const renderActorIcon = (notif) => {
        if (!notif.actor) {
            return (
                <div className={styles.avatarContainer}>
                    <div className={`${styles.actorIcon} ${styles.systemIcon}`}>
                        <FaCog />
                    </div>
                </div>
            );
        }

        if (notif.actor.profile_pic_url) {
            return (
                <div className={styles.avatarContainer}>
                    <img
                        src={notif.actor.profile_pic_url}
                        alt={notif.actor.full_name}
                        className={styles.actorAvatar}
                    />
                </div>
            );
        }

        return (
            <div className={styles.avatarContainer}>
                <div className={`${styles.actorIcon} ${styles.userIcon}`}>
                    <FaUser />
                </div>
            </div>
        );
    };

    const renderActorName = (notif) => {
        if (!notif.actor) {
            return (
                <div className={styles.systemTitle}>
                    <FaCog />
                    <span>System Notification</span>
                </div>
            );
        }

        return (
            <div className={styles.actorTitle}>
                <span className={styles.actorName}>
                    {notif.actor.full_name || "User"}
                </span>
                <span className={styles.actorEmail}>
                    {notif.actor.email || ""}
                </span>
            </div>
        );
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <SideBar>
                    <div className={styles.loadingContainer}>
                        <div className={styles.loadingSpinner} />
                        <p>Loading notification...</p>
                    </div>
                </SideBar>
            </div>
        );
    }

    if (!notification) {
        return (
            <div className={styles.container}>
                <SideBar>
                    <div className={styles.emptyState}>
                        <FaBell />
                        <h3>Notification not found</h3>
                        <button onClick={() => navigate("/notification")}>
                            <FaArrowLeft /> Back
                        </button>
                    </div>
                </SideBar>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <SideBar>
                <div className={styles.stickyHeader}>
                    <button
                        onClick={() => {
                            navigate("/notifications")
                        }}

                        className={styles.backButton}
                    >
                        <FaArrowLeft />
                    </button>
                    <h1>Notification</h1>
                </div>

                <div className={styles.contentWrapper}>
                    <div className={styles.notificationCard}>
                        <div className={styles.cardHeader}>
                            {renderActorIcon(notification)}
                            <div className={styles.actorInfo}>
                                {renderActorName(notification)}
                                <div className={styles.notificationMeta}>
                                    <span>
                                        <FaCalendarAlt />
                                        {formatFullDate(notification.sent_at)}
                                    </span>
                                    <span>
                                        <FaClock />
                                        {formatTime(notification.sent_at)} (
                                        {timeAgo(notification.sent_at)})
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.cardContent}>
                            <h2>{notification.title}</h2>

                            <div className={styles.description}>
                                <FaInfoCircle />
                                <p>{notification.description}</p>
                            </div>

                            <div className={styles.metaInfo}>
                                <span>Code: {notification.code}</span>
                                <span>ID: {notification.id}</span>
                            </div>
                        </div>

                        {notification.url && (
                            <div className={styles.cardActions}>
                                <span
                                    onClick={() => { navigate(notification.url) }}
                                >
                                    <FaExternalLinkAlt />
                                    View related content
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </SideBar>
        </div>
    );
}
