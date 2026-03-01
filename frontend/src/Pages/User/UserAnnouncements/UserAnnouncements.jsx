import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../../Context/UserContext";
import api from "../../../Utils/api";
import SideBar from "../../../Components/SideBar/SideBar";
import AnnouncementCard from "../../../Components/AnnouncementCard/AnnouncementCard"; // <-- reuse the card
import {
    FaBullhorn,
    FaExclamationTriangle
} from "react-icons/fa";
import styles from "./UserAnnouncements.module.css";

export default function UserAnnouncements() {
    const { user } = useUser();
    const navigate = useNavigate();

    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (user.isAuthenticated === null) return;
        if (!user.isAuthenticated) {
            navigate("/login");
            return;
        }
        fetchAnnouncements();
    }, [user, navigate]);

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const res = await api.get("/api/announcement/user/");
            const data = res.data.announcements || [];
            setAnnouncements(data);
        } catch (err) {
            console.error("Error fetching announcements:", err);
            if (err.response?.status === 404) {
                setAnnouncements([]);
            } else {
                setError("Failed to load announcements. Please try again later.");
            }
        } finally {
            setLoading(false);
        }
    };

    // Sort by date (newest first)
    const sortedAnnouncements = [...announcements].sort((a, b) => {
        const dateA = new Date(a.announcement_date || a.created_at);
        const dateB = new Date(b.announcement_date || b.created_at);
        return dateB - dateA;
    });

    return (
        <div className={styles.container}>
            <SideBar>
                {/* Header */}
                <div className={styles.header}>
                    <h1>
                        <FaBullhorn /> Announcements
                    </h1>
                    <p>Stay updated with the latest news</p>
                </div>

                {/* Error message */}
                {error && (
                    <div className={styles.error}>
                        <FaExclamationTriangle />
                        <span>{error}</span>
                    </div>
                )}

                {/* Loading state */}
                {loading ? (
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                        <p>Loading announcements...</p>
                    </div>
                ) : sortedAnnouncements.length === 0 ? (
                    <div className={styles.empty}>
                        <FaBullhorn />
                        <h3>No announcements yet</h3>
                        <p>You don’t have any announcements at the moment.</p>
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {sortedAnnouncements.map((announcement) => (
                            <AnnouncementCard
                                key={announcement.id}
                                announcement={announcement}
                                onUpdate={fetchAnnouncements} // optional – never called for users, but safe to pass
                            />
                        ))}
                    </div>
                )}
            </SideBar>
        </div>
    );
}