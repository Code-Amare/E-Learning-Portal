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
    FaCheckCircle
} from "react-icons/fa";
import styles from "./CreateAttendanceSession.module.css";
import { neonToast } from "../../../Components/NeonToast/NeonToast";
import { useNotifContext } from "../../../Context/NotifContext";

export default function CreateAttendanceSession() {
    const navigate = useNavigate();

    // Form state
    const [formData, setFormData] = useState({
        title: "",
        users: []
    });

    // Available users state
    const [allUsers, setAllUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const { updatePageTitle } = useNotifContext()
    useEffect(() => {
        updatePageTitle("Create Attendance Session")
    }, [])

    // Filter states
    const [filters, setFilters] = useState({
        field: "",
        grade: "",
        section: ""
    });

    // Fetch all users on component mount
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

        // Apply text search
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

        // Apply field filter
        if (filters.field) {
            filtered = filtered.filter(user => user.field === filters.field);
        }

        // Apply grade filter
        if (filters.grade) {
            filtered = filtered.filter(user => user.grade == filters.grade);
        }

        // Apply section filter
        if (filters.section) {
            filtered = filtered.filter(user => user.section === filters.section);
        }

        setFilteredUsers(filtered);
    }, [allUsers, searchTerm, filters]);

    const handleTitleChange = (e) => {
        setFormData({ ...formData, title: e.target.value });
        setError("");
    };

    const toggleUserSelection = (userId) => {
        setFormData(prev => {
            const isSelected = prev.users.includes(userId);
            return {
                ...prev,
                users: isSelected
                    ? prev.users.filter(id => id !== userId)
                    : [...prev.users, userId]
            };
        });
    };

    const selectAllUsers = () => {
        if (formData.users.length === filteredUsers.length && filteredUsers.length > 0) {
            setFormData({ ...formData, users: [] });
        } else {
            const allFilteredUserIds = filteredUsers.map(user => user.user.id);
            setFormData({ ...formData, users: allFilteredUserIds });
        }
    };

    const handleFilterChange = (filterType, value) => {
        setFilters(prev => ({
            ...prev,
            [filterType]: value
        }));
    };

    const clearFilters = () => {
        setFilters({
            field: "",
            grade: "",
            section: ""
        });
        setSearchTerm("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        // Validation
        if (!formData.title.trim()) {
            setError("Please enter a title for the session");
            return;
        }

        if (formData.users.length === 0) {
            setError("Please select at least one user");
            return;
        }

        setSubmitting(true);

        try {
            const payload = {
                title: formData.title,
                users: formData.users
            };

            const response = await api.post("/api/attendance/sessions/", payload);
            const sessionId = response.data?.session_id
            setSuccess(`Session created successfully! Redirecting...`);
            if (sessionId) {
                navigate(`/admin/session/${sessionId}`)
                neonToast.success(response.data?.message)
            }



        } catch (error) {
            console.error("Error creating session:", error);
            setError(error.response?.data?.error || "Failed to create session. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate("/admin/attendance");
    };

    const getDisplayName = (user) => {
        const userData = user.user || {};
        return userData.full_name || userData.email || `User ${userData.id}`;
    };

    const getUserEmail = (user) => {
        return user.user?.email || "";
    };

    return (
        <div className={styles.container}>
            <SideBar>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerContent}>
                        <div className={styles.titleSection}>
                            <Link to="/admin/attendance" className={styles.backButton}>
                                <FaArrowLeft />
                            </Link>
                            <div>
                                <h1>Create Attendance Session</h1>
                                <p>Select users by filtering and create attendance session</p>
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
                                form="createSessionForm"
                                className={styles.primaryBtn}
                                disabled={submitting || formData.users.length === 0}
                            >
                                <FaSave />
                                <span>{submitting ? "Creating..." : "Create"}</span>
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

                <form id="createSessionForm" onSubmit={handleSubmit}>
                    <div className={styles.formContainer}>
                        {/* Session Title */}
                        <div className={styles.formSection}>
                            <label className={styles.inputLabel}>
                                Session Title *
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={handleTitleChange}
                                placeholder="Enter session title"
                                className={styles.textInput}
                                required
                                disabled={submitting}
                            />
                        </div>

                        {/* Filters */}
                        <div className={styles.formSection}>
                            <div className={styles.filterHeader}>
                                <FaFilter />
                                <h3>Filter Users</h3>
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
                                    <h3>Select Users</h3>
                                    <p>{filteredUsers.length} users found</p>
                                </div>
                                <div className={styles.selectionActions}>
                                    <div className={styles.selectedCount}>
                                        <FaCheck />
                                        <span>{formData.users.length} selected</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={selectAllUsers}
                                        className={styles.selectAllBtn}
                                        disabled={filteredUsers.length === 0}
                                    >
                                        {formData.users.length === filteredUsers.length && filteredUsers.length > 0
                                            ? "Deselect All"
                                            : "Select All"}
                                    </button>
                                </div>
                            </div>

                            {/* Users List */}
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
                                        {filteredUsers.map((userData, index) => {
                                            const user = userData.user || {};
                                            const isSelected = formData.users.includes(user.id);
                                            return (
                                                <div
                                                    key={user.id}
                                                    className={`${styles.userCard} ${isSelected ? styles.selected : ''}`}
                                                    onClick={() => !submitting && toggleUserSelection(user.id)}
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