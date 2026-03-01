import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../../Utils/api";
import SideBar from "../../../Components/SideBar/SideBar";
import AnnouncementCard from "../../../Components/AnnouncementCard/AnnouncementCard";
import {
    FaBullhorn,
    FaPlus,
    FaSync,
    FaStar,
    FaCalendarAlt,
    FaUsers
} from "react-icons/fa";
import styles from "./AnnouncementList.module.css";
import { useNotifContext } from "../../../Context/NotifContext";

export default function AnnouncementList() {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [stats, setStats] = useState({
        total: 0,
        important: 0,
        upcoming: 0,
        avgRecipients: 0
    });
    const { updatePageTitle } = useNotifContext()
    useEffect(() => {
        updatePageTitle("Announcements")
    }, [])

    // Fetch all announcements
    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const res = await api.get("/api/announcement/");  // matches your view
            const data = res.data; // array of announcements
            setAnnouncements(data);
            computeStats(data);
        } catch (error) {
            console.error("Error fetching announcements:", error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate stats from fetched announcements
    const computeStats = (items) => {
        const total = items.length;
        const important = items.filter(a => a.is_important).length;
        const now = new Date();
        const upcoming = items.filter(a => {
            const date = new Date(a.announcement_date);
            return date >= now;
        }).length;

        // Average number of recipients (users field)
        let totalRecipients = 0;
        items.forEach(a => {
            totalRecipients += a.users?.length || 0;
        });
        const avgRecipients = total > 0 ? Math.round(totalRecipients / total) : 0;

        setStats({ total, important, upcoming, avgRecipients });
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    // Filter logic
    const filteredAnnouncements = announcements.filter(announcement => {
        // Filter by type
        if (filter === "important" && !announcement.is_important) return false;
        if (filter === "upcoming") {
            const today = new Date();
            const annDate = new Date(announcement.announcement_date);
            if (annDate < today) return false;
        }

        // Search by title
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            return announcement.title?.toLowerCase().includes(term);
        }

        return true;
    });

    // Sorting: most recent announcement_date first, then created_at
    const getSortedAnnouncements = () => {
        return [...filteredAnnouncements].sort((a, b) => {
            // Put upcoming first? Here we just sort by date descending
            const dateA = new Date(a.announcement_date || a.created_at);
            const dateB = new Date(b.announcement_date || b.created_at);
            return dateB - dateA;
        });
    };

    return (
        <div className={styles.container}>
            <SideBar>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerContent}>
                        <div className={styles.titleSection}>
                            <h1>
                                <FaBullhorn /> Announcements
                            </h1>
                            <p>Create and manage system-wide announcements</p>
                        </div>

                        <div className={styles.actions}>
                            <button
                                onClick={fetchAnnouncements}
                                className={styles.refreshBtn}
                                disabled={loading}
                            >
                                <FaSync className={loading ? styles.spin : ""} />
                                Refresh
                            </button>

                            <Link to="/admin/announcement/create/" className={styles.createBtn}>
                                <FaPlus />
                                New Announcement
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className={styles.stats}>
                    <div className={styles.stat}>
                        <div className={styles.statIcon}>
                            <FaBullhorn />
                        </div>
                        <div>
                            <span className={styles.statNumber}>{stats.total}</span>
                            <span className={styles.statLabel}>Total</span>
                        </div>
                    </div>

                    <div className={`${styles.stat} ${styles.statImportant}`}>
                        <div className={styles.statIcon}>
                            <FaStar />
                        </div>
                        <div>
                            <span className={styles.statNumber}>{stats.important}</span>
                            <span className={styles.statLabel}>Important</span>
                        </div>
                    </div>

                    <div className={`${styles.stat} ${styles.statUpcoming}`}>
                        <div className={styles.statIcon}>
                            <FaCalendarAlt />
                        </div>
                        <div>
                            <span className={styles.statNumber}>{stats.upcoming}</span>
                            <span className={styles.statLabel}>Upcoming</span>
                        </div>
                    </div>

                    <div className={styles.stat}>
                        <div className={styles.statIcon}>
                            <FaUsers />
                        </div>
                        <div>
                            <span className={styles.statNumber}>{stats.avgRecipients}</span>
                            <span className={styles.statLabel}>Avg. Recipients</span>
                        </div>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className={styles.filters}>
                    <div className={styles.search}>
                        <input
                            type="text"
                            placeholder="Search by title..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={styles.searchInput}
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm("")} className={styles.clearBtn}>
                                ×
                            </button>
                        )}
                    </div>

                    <div className={styles.filterTabs}>
                        <button
                            className={`${styles.tab} ${filter === "all" ? styles.active : ""}`}
                            onClick={() => setFilter("all")}
                        >
                            All ({stats.total})
                        </button>
                        <button
                            className={`${styles.tab} ${filter === "important" ? styles.active : ""}`}
                            onClick={() => setFilter("important")}
                        >
                            Important ({stats.important})
                        </button>
                        <button
                            className={`${styles.tab} ${filter === "upcoming" ? styles.active : ""}`}
                            onClick={() => setFilter("upcoming")}
                        >
                            Upcoming ({stats.upcoming})
                        </button>
                    </div>
                </div>

                {/* Announcements List */}
                <div className={styles.sessions}>
                    <div className={styles.sessionsHeader}>
                        <h2>Announcements ({filteredAnnouncements.length})</h2>
                        {searchTerm && (
                            <span className={styles.searchInfo}>Search: "{searchTerm}"</span>
                        )}
                    </div>

                    {loading ? (
                        <div className={styles.loading}>
                            <div className={styles.spinner}></div>
                            <p>Loading announcements...</p>
                        </div>
                    ) : filteredAnnouncements.length === 0 ? (
                        <div className={styles.empty}>
                            <FaBullhorn />
                            <h3>No announcements found</h3>
                            <p>
                                {searchTerm || filter !== "all"
                                    ? "Try adjusting your search or filter"
                                    : "Create your first announcement to get started"}
                            </p>
                            {!searchTerm && filter === "all" && (
                                <Link to="/admin/announcement/create/" className={styles.createBtn}>
                                    <FaPlus />
                                    Create Announcement
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className={styles.grid}>
                            {getSortedAnnouncements().map((announcement) => (
                                <AnnouncementCard
                                    key={announcement.id}
                                    announcement={announcement}
                                    onUpdate={fetchAnnouncements}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </SideBar>
        </div>
    );
}