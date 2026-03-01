import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../../../Context/UserContext";
import api from "../../../Utils/api";
import SideBar from "../../../Components/SideBar/SideBar";
import {
    FaArrowLeft,
    FaSave,
    FaTimes,
    FaFilter,
    FaCheck,
    FaUser,
    FaSearch,
    FaExclamationCircle,
    FaCheckCircle,
    FaCalendarAlt,
    FaFileAlt
} from "react-icons/fa";
import styles from "./CreateAnnouncement.module.css";
import { neonToast } from "../../../Components/NeonToast/NeonToast";
import { useNotifContext } from "../../../Context/NotifContext";

export default function CreateAnnouncement() {
    const navigate = useNavigate();
    const { updatePageTitle } = useNotifContext();

    useEffect(() => {
        updatePageTitle("Create Announcement");
    }, []);

    // Form state – now includes 'content'
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        announcement_date: "",
        is_important: false,
        targets: []      // array of user IDs
    });

    // Available users state
    const [allUsers, setAllUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Filter states
    const [filters, setFilters] = useState({
        field: "",
        grade: "",
        section: ""
    });

    // Fetch all users on mount
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                const res = await api.get("/api/management/users/");
                const users = res.data.users || [];
                setAllUsers(users);
                setFilteredUsers(users);
            } catch (error) {
                console.error("Error fetching users:", error);
                setError("Failed to load users. Please try again.");
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    // Extract unique filter options
    const filterOptions = useMemo(() => {
        const fields = new Set();
        const grades = new Set();
        const sections = new Set();

        allUsers.forEach(user => {
            if (user.field) fields.add(user.field);
            if (user.grade) grades.add(user.grade);
            if (user.section) sections.add(user.section);
        });

        return {
            fields: Array.from(fields).sort(),
            grades: Array.from(grades).sort((a, b) => a - b),
            sections: Array.from(sections).sort()
        };
    }, [allUsers]);

    // Apply filters and search
    useEffect(() => {
        if (allUsers.length === 0) {
            setFilteredUsers([]);
            return;
        }

        let filtered = allUsers;

        if (searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(user => {
                const userData = user.user || {};
                return (
                    userData.full_name?.toLowerCase().includes(searchLower) ||
                    userData.email?.toLowerCase().includes(searchLower) ||
                    user.account?.toLowerCase().includes(searchLower)
                );
            });
        }

        if (filters.field) {
            filtered = filtered.filter(user => user.field === filters.field);
        }

        if (filters.grade) {
            filtered = filtered.filter(user => user.grade == filters.grade);
        }

        if (filters.section) {
            filtered = filtered.filter(user => user.section === filters.section);
        }

        setFilteredUsers(filtered);
    }, [allUsers, searchTerm, filters]);

    // Handlers
    const handleTitleChange = (e) => {
        setFormData({ ...formData, title: e.target.value });
        setError("");
    };

    const handleContentChange = (e) => {
        setFormData({ ...formData, content: e.target.value });
        setError("");
    };

    const handleDateChange = (e) => {
        setFormData({ ...formData, announcement_date: e.target.value });
    };

    const handleImportanceChange = (e) => {
        setFormData({ ...formData, is_important: e.target.checked });
    };

    const toggleUserSelection = (userId) => {
        setFormData(prev => {
            const isSelected = prev.targets.includes(userId);
            return {
                ...prev,
                targets: isSelected
                    ? prev.targets.filter(id => id !== userId)
                    : [...prev.targets, userId]
            };
        });
    };

    const selectAllUsers = () => {
        if (formData.targets.length === filteredUsers.length && filteredUsers.length > 0) {
            setFormData({ ...formData, targets: [] });
        } else {
            const allFilteredUserIds = filteredUsers.map(user => user.user.id);
            setFormData({ ...formData, targets: allFilteredUserIds });
        }
    };

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        // Validation – only title and content are required now
        if (!formData.title.trim()) {
            setError("Please enter an announcement title");
            return;
        }

        if (!formData.content.trim()) {
            setError("Please enter announcement content");
            return;
        }

        if (formData.targets.length === 0) {
            setError("Please select at least one recipient");
            return;
        }

        setSubmitting(true);

        try {
            // Build payload – only include announcement_date if it has a value
            const payload = {
                title: formData.title,
                content: formData.content,
                targets: formData.targets,
                is_important: formData.is_important
            };

            if (formData.announcement_date) {
                payload.announcement_date = formData.announcement_date;
            }

            const response = await api.post("/api/announcement/", payload);

            setSuccess("Announcement created successfully! Redirecting...");
            neonToast.success("Announcement published");

            setTimeout(() => navigate("/admin/announcements"), 1500);
        } catch (error) {
            console.error("Error creating announcement:", error);
            setError(
                error.response?.data?.error ||
                error.response?.data?.message ||
                "Failed to create announcement. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate("/admin/announcements");
    };

    const getDisplayName = (userData) => {
        const u = userData.user || {};
        return u.full_name || u.email || `User ${u.id}`;
    };

    const getUserEmail = (userData) => {
        return userData.user?.email || "";
    };

    return (
        <div className={styles.container}>
            <SideBar>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerContent}>
                        <div className={styles.titleSection}>
                            <Link to="/admin/announcements" className={styles.backButton}>
                                <FaArrowLeft />
                            </Link>
                            <div>
                                <h1>Create Announcement</h1>
                                <p>Compose a new announcement and select recipients</p>
                            </div>
                        </div>

                        <div className={styles.headerActions}>
                            <button
                                type="button"
                                onClick={handleCancel}
                                className={styles.secondaryBtn}
                                disabled={submitting}
                            >
                                <FaTimes />
                                <span>Cancel</span>
                            </button>

                            <button
                                type="submit"
                                form="createAnnouncementForm"
                                className={styles.primaryBtn}
                                disabled={submitting || formData.targets.length === 0}
                            >
                                <FaSave />
                                <span>{submitting ? "Publishing..." : "Publish"}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Messages */}
                {error && (
                    <div className={styles.errorAlert}>
                        <FaExclamationCircle />
                        <span>{error}</span>
                        <button onClick={() => setError("")} className={styles.closeAlert}>
                            <FaTimes />
                        </button>
                    </div>
                )}

                {success && (
                    <div className={styles.successAlert}>
                        <FaCheckCircle />
                        <span>{success}</span>
                    </div>
                )}

                <form id="createAnnouncementForm" onSubmit={handleSubmit}>
                    <div className={styles.formContainer}>
                        {/* Announcement Title */}
                        <div className={styles.formSection}>
                            <label className={styles.inputLabel}>
                                Announcement Title *
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={handleTitleChange}
                                placeholder="e.g. Holiday Schedule, Exam Reminder..."
                                className={styles.textInput}
                                required
                                disabled={submitting}
                            />
                        </div>

                        {/* Announcement Content */}
                        <div className={styles.formSection}>
                            <label className={styles.inputLabel}>
                                <FaFileAlt style={{ marginRight: "6px" }} />
                                Announcement Content *
                            </label>
                            <textarea
                                value={formData.content}
                                onChange={handleContentChange}
                                placeholder="Write the full announcement here..."
                                className={styles.textArea}
                                rows="6"
                                required
                                disabled={submitting}
                            />
                            <div className={styles.charCounter}>
                                {formData.content.length} characters
                            </div>
                        </div>

                        {/* Date & Importance – date no longer required */}
                        <div className={styles.formSection}>
                            <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                                <div style={{ flex: "1 1 200px" }}>
                                    <label className={styles.inputLabel}>
                                        <FaCalendarAlt style={{ marginRight: "6px" }} />
                                        Announcement Date (optional)
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.announcement_date}
                                        onChange={handleDateChange}
                                        className={styles.textInput}
                                        disabled={submitting}
                                    />
                                </div>

                                <div style={{ display: "flex", alignItems: "center", marginTop: "24px" }}>
                                    <label className={styles.importanceLabel}>
                                        <input
                                            type="checkbox"
                                            checked={formData.is_important}
                                            onChange={handleImportanceChange}
                                            disabled={submitting}
                                            className={styles.checkbox}
                                        />
                                        <FaExclamationCircle
                                            className={styles.importanceIcon}
                                            style={{
                                                color: formData.is_important ? "#ffc107" : "#adb5bd",
                                                marginLeft: "8px"
                                            }}
                                        />
                                        <span style={{ marginLeft: "8px" }}>Mark as important</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Filters & User Selection */}
                        <div className={styles.formSection}>
                            <div className={styles.filterHeader}>
                                <FaFilter />
                                <h3>Filter Recipients</h3>
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className={styles.clearFiltersBtn}
                                >
                                    Clear All
                                </button>
                            </div>

                            <div className={styles.filtersGrid}>
                                <div className={styles.filterGroup}>
                                    <label>Field</label>
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
                                    <label>Grade</label>
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
                                    <label>Section</label>
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

                                <div className={styles.filterGroup}>
                                    <label>Search</label>
                                    <div className={styles.searchWrapper}>
                                        <FaSearch />
                                        <input
                                            type="text"
                                            placeholder="Search by name or email"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className={styles.searchInput}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* User Selection */}
                        <div className={styles.formSection}>
                            <div className={styles.selectionHeader}>
                                <div>
                                    <h3>Select Recipients</h3>
                                    <p>{filteredUsers.length} users found</p>
                                </div>
                                <div className={styles.selectionActions}>
                                    <div className={styles.selectedCount}>
                                        <FaCheck />
                                        <span>{formData.targets.length} selected</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={selectAllUsers}
                                        className={styles.selectAllBtn}
                                        disabled={filteredUsers.length === 0}
                                    >
                                        {formData.targets.length === filteredUsers.length && filteredUsers.length > 0
                                            ? "Deselect All"
                                            : "Select All"}
                                    </button>
                                </div>
                            </div>

                            <div className={styles.usersListContainer}>
                                {loading ? (
                                    <div className={styles.loadingState}>
                                        <div className={styles.spinner}></div>
                                        <p>Loading users...</p>
                                    </div>
                                ) : filteredUsers.length === 0 ? (
                                    <div className={styles.emptyState}>
                                        <FaUser />
                                        <p>No users found with current filters</p>
                                    </div>
                                ) : (
                                    <div className={styles.usersGrid}>
                                        {filteredUsers.map((userData) => {
                                            const u = userData.user || {};
                                            const isSelected = formData.targets.includes(u.id);
                                            return (
                                                <div
                                                    key={u.id}
                                                    className={`${styles.userCard} ${isSelected ? styles.selected : ''}`}
                                                    onClick={() => !submitting && toggleUserSelection(u.id)}
                                                >
                                                    <div className={styles.userCheckbox}>
                                                        <div className={styles.checkbox}>
                                                            {isSelected && <div className={styles.checkmark} />}
                                                        </div>
                                                    </div>
                                                    <div className={styles.userInfo}>
                                                        <div className={styles.userName}>
                                                            {getDisplayName(userData)}
                                                        </div>
                                                        <div className={styles.userEmail}>
                                                            {getUserEmail(userData)}
                                                        </div>
                                                        <div className={styles.userMeta}>
                                                            {userData.field && (
                                                                <span className={styles.metaBadge}>{userData.field}</span>
                                                            )}
                                                            {userData.grade && (
                                                                <span className={styles.metaBadge}>Grade {userData.grade}</span>
                                                            )}
                                                            {userData.section && (
                                                                <span className={styles.metaBadge}>Sec {userData.section}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </form>
            </SideBar>
        </div>
    );
}