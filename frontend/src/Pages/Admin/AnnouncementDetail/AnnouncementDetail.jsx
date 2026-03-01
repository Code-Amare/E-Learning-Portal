import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useUser } from "../../../Context/UserContext";
import api from "../../../Utils/api";
import SideBar from "../../../Components/SideBar/SideBar";
import ConfirmAction from "../../../Components/ConfirmAction/ConfirmAction";
import {
    FaArrowLeft,
    FaUser,
    FaEnvelope,
    FaCheckCircle,
    FaTimesCircle,
    FaCalendarAlt,
    FaExclamationCircle,
    FaFilter,
    FaSearch,
    FaEdit,
    FaTrash,
    FaFileAlt      // icon for content
} from "react-icons/fa";
import styles from "./AnnouncementDetail.module.css";
import { useNotifContext } from "../../../Context/NotifContext";

export default function AnnouncementDetail() {
    const { user } = useUser();
    const navigate = useNavigate();
    const { announcementId } = useParams();

    const [announcement, setAnnouncement] = useState(null);
    const [recipients, setRecipients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const { updatePageTitle } = useNotifContext()
    useEffect(() => {
        if (!announcement?.title) return
        updatePageTitle(`Announcement '${announcement?.title}'`)
    }, [announcement])

    // Filter states
    const [filters, setFilters] = useState({
        field: "",
        grade: "",
        section: ""
    });
    const [searchTerm, setSearchTerm] = useState("");

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
            const res = await api.get(`/api/announcement/${announcementId}/`);
            const data = res.data;

            setAnnouncement(data);
            setRecipients(data.users || []);
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

    const handleDeleteAnnouncement = async () => {
        try {
            await api.delete(`/api/announcement/${announcementId}/`);
            navigate("/admin/announcements");
        } catch (error) {
            console.error("Error deleting announcement:", error);
            setError("Failed to delete announcement.");
        }
    };

    // Extract filter options from recipients
    const filterOptions = useMemo(() => {
        if (!recipients.length) return { fields: [], grades: [], sections: [] };

        const fields = new Set();
        const grades = new Set();
        const sections = new Set();

        recipients.forEach(user => {
            const profile = user.profile || {};
            if (profile.field) fields.add(profile.field);
            if (profile.grade) grades.add(profile.grade);
            if (profile.section) sections.add(profile.section);
        });

        return {
            fields: Array.from(fields).sort(),
            grades: Array.from(grades).sort((a, b) => a - b),
            sections: Array.from(sections).sort()
        };
    }, [recipients]);

    // Filter recipients
    const filteredRecipients = useMemo(() => {
        if (!recipients.length) return [];

        return recipients.filter(recipient => {
            const profile = recipient.profile || {};

            if (searchTerm.trim()) {
                const searchLower = searchTerm.toLowerCase();
                const matchesSearch =
                    recipient.full_name?.toLowerCase().includes(searchLower) ||
                    recipient.email?.toLowerCase().includes(searchLower) ||
                    profile.account?.toLowerCase().includes(searchLower);
                if (!matchesSearch) return false;
            }

            if (filters.field && profile.field !== filters.field) return false;
            if (filters.grade && profile.grade != filters.grade) return false;
            if (filters.section && profile.section !== filters.section) return false;

            return true;
        });
    }, [recipients, searchTerm, filters]);

    const handleFilterChange = (filterType, value) => {
        setFilters(prev => ({
            ...prev,
            [filterType]: value
        }));
    };

    const clearFilters = () => {
        setFilters({ field: "", grade: "", section: "" });
        setSearchTerm("");
    };

    const stats = useMemo(() => {
        return {
            total: recipients.length,
            filtered: filteredRecipients.length,
            verified: recipients.filter(r => r.email_verified).length,
            unverified: recipients.filter(r => !r.email_verified).length
        };
    }, [recipients, filteredRecipients]);

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
                        <span onClick={() => navigate("/admin/announcements")} className={styles.backButton}>
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
                            <span onClick={() => navigate("/admin/announcements")} className={styles.backButton}>
                                <FaArrowLeft />
                            </span>
                            <div>
                                <h1>{announcement.title}</h1>
                                <p className={styles.meta}>
                                    <span>ID: {announcement.id}</span>
                                    <span>•</span>
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

                        <div className={styles.headerActions}>
                            <Link to={`/admin/announcement/edit/${announcement.id}`} className={styles.editBtn}>
                                <FaEdit />
                                <span>Edit</span>
                            </Link>

                            <ConfirmAction
                                title="Delete Announcement"
                                message="Are you sure you want to delete this announcement? This action cannot be undone."
                                confirmText="Delete Announcement"
                                onConfirm={handleDeleteAnnouncement}
                            >
                                <button className={styles.deleteBtn}>
                                    <FaTrash />
                                    <span>Delete</span>
                                </button>
                            </ConfirmAction>
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
                            <span className={styles.infoLabel}>Created By</span>
                            <span className={styles.infoValue}>
                                {announcement.created_by?.full_name || announcement.created_by?.username || "Unknown"}
                            </span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Last Updated</span>
                            <span className={styles.infoValue}>{formatDate(announcement.updated_at)}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Total Recipients</span>
                            <span className={styles.infoValue}>{stats.total}</span>
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

                {/* Filters */}
                <div className={styles.filterSection}>
                    <div className={styles.filterHeader}>
                        <FaFilter />
                        <h3>Filter Recipients</h3>
                        {(filters.field || filters.grade || filters.section || searchTerm) && (
                            <button onClick={clearFilters} className={styles.clearFiltersBtn}>
                                Clear All
                            </button>
                        )}
                    </div>

                    <div className={styles.filterControls}>
                        <div className={styles.filterGroup}>
                            <select
                                value={filters.field}
                                onChange={(e) => handleFilterChange('field', e.target.value)}
                                className={styles.filterSelect}
                            >
                                <option value="">All Fields</option>
                                {filterOptions.fields.map(field => (
                                    <option key={field} value={field}>{field}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.filterGroup}>
                            <select
                                value={filters.grade}
                                onChange={(e) => handleFilterChange('grade', e.target.value)}
                                className={styles.filterSelect}
                            >
                                <option value="">All Grades</option>
                                {filterOptions.grades.map(grade => (
                                    <option key={grade} value={grade}>Grade {grade}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.filterGroup}>
                            <select
                                value={filters.section}
                                onChange={(e) => handleFilterChange('section', e.target.value)}
                                className={styles.filterSelect}
                            >
                                <option value="">All Sections</option>
                                {filterOptions.sections.map(section => (
                                    <option key={section} value={section}>Section {section}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.searchGroup}>
                            <FaSearch />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={styles.searchInput}
                            />
                        </div>
                    </div>
                </div>

                {/* Recipients List */}
                <div className={styles.recipientsSection}>
                    <div className={styles.sectionHeader}>
                        <h3>Recipients ({filteredRecipients.length})</h3>
                        <div className={styles.statsBadges}>
                            <span className={styles.statBadge}>
                                <FaCheckCircle className={styles.verifiedIcon} />
                                Verified: {stats.verified}
                            </span>
                            <span className={styles.statBadge}>
                                <FaTimesCircle className={styles.unverifiedIcon} />
                                Unverified: {stats.unverified}
                            </span>
                        </div>
                    </div>

                    {filteredRecipients.length === 0 ? (
                        <div className={styles.emptyState}>
                            <FaUser />
                            <p>No recipients found</p>
                        </div>
                    ) : (
                        <div className={styles.recipientsGrid}>
                            {filteredRecipients.map((recipient) => {
                                const profile = recipient.profile || {};

                                return (
                                    <div key={recipient.id} className={styles.recipientCard}>
                                        <div className={styles.recipientAvatar}>
                                            {recipient.profile_pic_url ? (
                                                <img
                                                    src={recipient.profile_pic_url}
                                                    alt={recipient.full_name}
                                                    className={styles.avatarImage}
                                                />
                                            ) : (
                                                <div className={styles.avatarPlaceholder}>
                                                    <FaUser />
                                                </div>
                                            )}
                                        </div>

                                        <div className={styles.recipientInfo}>
                                            <div className={styles.recipientName}>
                                                {recipient.full_name}
                                            </div>
                                            <div className={styles.recipientEmail}>
                                                <FaEnvelope />
                                                <span>{recipient.email}</span>
                                            </div>

                                            <div className={styles.recipientMeta}>
                                                <span className={`${styles.metaBadge} ${recipient.email_verified ? styles.verified : styles.unverified}`}>
                                                    {recipient.email_verified ? (
                                                        <>
                                                            <FaCheckCircle />
                                                            Verified
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FaTimesCircle />
                                                            Unverified
                                                        </>
                                                    )}
                                                </span>
                                                <span className={`${styles.metaBadge} ${recipient.gender === "female" ? styles.female : styles.male}`}>
                                                    {recipient.gender}
                                                </span>
                                            </div>

                                            <div className={styles.profileBadges}>
                                                {profile.field && (
                                                    <span className={styles.profileBadge}>{profile.field}</span>
                                                )}
                                                {profile.grade && (
                                                    <span className={styles.profileBadge}>Grade {profile.grade}</span>
                                                )}
                                                {profile.section && (
                                                    <span className={styles.profileBadge}>Section {profile.section}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </SideBar>
        </div>
    );
}