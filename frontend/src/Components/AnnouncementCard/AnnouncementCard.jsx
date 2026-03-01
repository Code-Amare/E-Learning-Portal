import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../../Context/UserContext";
import api from "../../Utils/api";
import {
    FaEdit,
    FaTrash,
    FaUser,
    FaCalendarAlt,
    FaUsers,
    FaFileAlt,
    FaExclamationCircle
} from "react-icons/fa";
import styles from "./AnnouncementCard.module.css";
import ConfirmAction from "../ConfirmAction/ConfirmAction"; // adjust path as needed
import { neonToast } from "../NeonToast/NeonToast";

export default function AnnouncementCard({ announcement, onUpdate }) {
    const { user } = useUser();
    const navigate = useNavigate();
    const [deleting, setDeleting] = useState(false);

    // Determine if current user is admin/staff
    const isAdmin =
        user?.role === "admin" ||
        user?.role === "staff" ||
        user?.is_staff === true;

    const formattedDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    // Strip HTML tags and truncate to ~120 characters
    const getContentPreview = (content) => {
        if (!content) return "No content";
        const plainText = content.replace(/<[^>]*>?/gm, "");
        return plainText.length > 120
            ? plainText.substring(0, 120) + "…"
            : plainText;
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await api.delete(`/api/announcement/${announcement.id}/`);
            onUpdate();
            neonToast.success("Announcement deleted successfully.")
        } catch (error) {
            console.error("Delete failed:", error);
        } finally {
            setDeleting(false);
        }
    };

    const handleCardClick = () => {
        if (isAdmin) {
            navigate(`/admin/announcement/${announcement.id}/`);
        } else {
            navigate(`/user/announcement/${announcement.id}/`);
        }
    };

    const handleActionClick = (e) => {
        e.stopPropagation(); // Prevent card click when interacting with buttons
    };

    return (
        <div
            className={`${styles.card} ${announcement.is_important ? styles.important : ""}`}
            onClick={handleCardClick}
        >
            <div className={styles.header}>
                <div className={styles.titleWrapper}>
                    <h3 className={styles.title}>{announcement.title}</h3>
                    {announcement.is_important && (
                        <span className={styles.importantBadge} title="Important announcement">
                            <FaExclamationCircle />
                        </span>
                    )}
                </div>

                {/* Admin actions – only shown for admin/staff */}
                {isAdmin && (
                    <div className={styles.actions} onClick={handleActionClick}>
                        <Link
                            to={`/admin/announcement/edit/${announcement.id}/`}
                            className={styles.editBtn}
                            onClick={handleActionClick}
                        >
                            <FaEdit />
                        </Link>

                        {/* Delete button with reusable ConfirmAction */}
                        <span onClick={handleActionClick}>
                            <ConfirmAction
                                title="Delete announcement?"
                                message="This action cannot be undone."
                                confirmText="Delete"
                                cancelText="Cancel"
                                onConfirm={handleDelete}
                            >
                                <button
                                    className={styles.deleteBtn}
                                    disabled={deleting}
                                >
                                    <FaTrash />
                                </button>
                            </ConfirmAction>
                        </span>
                    </div>
                )}
            </div>

            <div className={styles.details}>
                {/* Content preview – always visible */}
                <div className={styles.contentPreview}>
                    <FaFileAlt className={styles.contentIcon} />
                    <p className={styles.contentText}>
                        {getContentPreview(announcement.content)}
                    </p>
                </div>

                {/* Meta information in a responsive grid */}
                <div className={styles.metaGrid}>
                    <div className={styles.detailItem}>
                        <FaCalendarAlt />
                        <span>{formattedDate(announcement.announcement_date)}</span>
                    </div>
                    <div className={styles.detailItem}>
                        <FaUser />
                        <span>
                            {announcement.created_by?.full_name ||
                                announcement.created_by?.username ||
                                "Unknown"}
                        </span>
                    </div>
                    <div className={styles.detailItem}>
                        <FaUsers />
                        <span>{announcement.users?.length || 0} recipients</span>
                    </div>
                </div>
            </div>
        </div>
    );
}