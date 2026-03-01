import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUser } from "../../../Context/UserContext";
import api from "../../../Utils/api";
import SideBar from "../../../Components/SideBar/SideBar";
import {
    FaArrowLeft,
    FaCalendarAlt,
    FaExclamationCircle,
    FaFileAlt,
    FaUser
} from "react-icons/fa";
import styles from "./AnnouncementDetail.module.css";
import { useNotifContext } from "../../../Context/NotifContext";

export default function AnnouncementDetail() {
    const { user } = useUser();
    const navigate = useNavigate();
    const { announcementId } = useParams();

    const [announcement, setAnnouncement] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const { updatePageTitle } = useNotifContext()

    useEffect(() => {
        if (!announcement?.title === "") return
        updatePageTitle(`Announcement '${announcement?.title}'`)
    }, [announcement])

    useEffect(() => {
        if (user.isAuthenticated === null) return;
        if (!user.isAuthenticated) {
            navigate("/login");
            return;
        }
        fetchAnnouncementDetail();
    }, [user, navigate, announcementId]);

    const fetchAnnouncementDetail = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/api/announcement/user/${announcementId}/`);
            const data = res.data;
            setAnnouncement(data);
        } catch (error) {
            console.error("Error fetching announcement:", error);
            setError("Failed to load announcement details.");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getCreatorName = (creator) => {
        return creator?.full_name || creator?.username || creator?.email || "Unknown";
    };

    const getProfilePic = (creator) => {
        return creator?.profile_pic_url || null;
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <SideBar>
                    <div className={styles.loadingContainer}>
                        <div className={styles.spinner}></div>
                        <p>Loading announcement...</p>
                    </div>
                </SideBar>
            </div>
        );
    }

    if (!announcement) {
        return (
            <div className={styles.container}>
                <SideBar>
                    <div className={styles.errorContainer}>
                        <h3>Announcement not found</h3>
                        <span onClick={() => navigate("/user/announcements")} className={styles.backButton}>
                            <FaArrowLeft />
                            <span>Back to Announcements</span>
                        </span>
                    </div>
                </SideBar>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <SideBar>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerContent}>
                        <div className={styles.titleSection}>
                            <span onClick={() => navigate("/user/announcements")} className={styles.backButton}>
                                <FaArrowLeft />
                            </span>
                            <div>
                                <h1>{announcement.title}</h1>
                                <p className={styles.meta}>
                                    <span>Created: {formatDate(announcement.created_at)}</span>
                                    <span>•</span>
                                    <span className={announcement.is_important ? styles.importantBadge : styles.normalBadge}>
                                        {announcement.is_important ? (
                                            <>
                                                <FaExclamationCircle /> Important
                                            </>
                                        ) : (
                                            "Normal"
                                        )}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className={styles.errorAlert}>
                        <span>{error}</span>
                        <button onClick={() => setError("")}>×</button>
                    </div>
                )}

                {/* Announcement Info Card */}
                <div className={styles.infoCard}>
                    <div className={styles.infoHeader}>
                        <h3>Announcement Details</h3>
                    </div>
                    <div className={styles.infoContent}>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Announcement Date</span>
                            <span className={styles.infoValue}>
                                <FaCalendarAlt />
                                {formatDate(announcement.announcement_date)}
                            </span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Posted By</span>
                            <span className={styles.infoValue}>
                                <div className={styles.creatorAvatar}>
                                    {getProfilePic(announcement.created_by) ? (
                                        <img
                                            src={getProfilePic(announcement.created_by)}
                                            alt={getCreatorName(announcement.created_by)}
                                            className={styles.avatarImageSmall}
                                        />
                                    ) : (
                                        <div className={styles.avatarPlaceholderSmall}>
                                            <FaUser />
                                        </div>
                                    )}
                                </div>
                                {getCreatorName(announcement.created_by)}
                            </span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Last Updated</span>
                            <span className={styles.infoValue}>{formatDate(announcement.updated_at)}</span>
                        </div>
                    </div>
                </div>

                {/* Announcement Content Card */}
                <div className={styles.contentCard}>
                    <div className={styles.contentHeader}>
                        <FaFileAlt />
                        <h3>Content</h3>
                    </div>
                    <div className={styles.contentBody}>
                        {announcement.content ? (
                            <div className={styles.contentText}>
                                {announcement.content}
                            </div>
                        ) : (
                            <div className={styles.contentEmpty}>
                                No content provided.
                            </div>
                        )}
                    </div>
                </div>
            </SideBar>
        </div>
    );
}