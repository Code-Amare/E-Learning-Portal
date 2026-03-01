import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../../Context/UserContext";
import api from "../../../Utils/api";
import { neonToast } from "../../../Components/NeonToast/NeonToast";
import SideBar from "../../../Components/SideBar/SideBar";
import LearningTaskCard from "../../../Components/LearningTaskCard/LearningTaskCard";
import {
    FaTimes,
    FaTasks,
    FaGlobe,
    FaStar,
    FaCode,
} from "react-icons/fa";
import {
    MdRefresh,
    MdFilterList,
    MdSettings
} from "react-icons/md";
import styles from "./LearningTasksList.module.css";
import { useNotifContext } from "../../../Context/NotifContext";

export default function LearningTasksList() {
    const navigate = useNavigate();
    const { updatePageTitle } = useNotifContext()
    useEffect(() => {
        updatePageTitle("Learning Tasks")
    }, [])

    // State
    const [tasks, setTasks] = useState([]);
    const [languages, setLanguages] = useState([]);
    const [frameworks, setFrameworks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingLanguages, setLoadingLanguages] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filters, setFilters] = useState({
        visibility: "",
        language: "",
        framework: "",
        sortBy: "created_at",
        sortOrder: "desc"
    });
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        public: 0,
        reviewed: 0,
        totalLikes: 0
    });

    // Fetch tasks
    useEffect(() => {
        fetchTasks();
        fetchLanguagesAndFrameworks();
    }, []);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const response = await api.get("/api/learning-task/all/");
            const tasksData = response.data.tasks || [];
            setTasks(tasksData);

            // Calculate stats
            const publicTasks = tasksData.filter(t => t.is_public).length;
            const reviewedTasks = tasksData.filter(t => t.is_rated || t.status === "rated").length;
            const totalLikes = tasksData.reduce((acc, task) => acc + (task.likes_count || 0), 0);

            setStats({
                total: tasksData.length,
                public: publicTasks,
                reviewed: reviewedTasks,
                totalLikes: totalLikes
            });
        } catch (error) {
            console.error("Error fetching learning tasks:", error);
            neonToast.error("Failed to load learning tasks", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchLanguagesAndFrameworks = async () => {
        setLoadingLanguages(true);
        try {
            const [langResponse, fwResponse] = await Promise.all([
                api.get("/api/management/languages/"),
                api.get("/api/management/frameworks/")
            ]);
            setLanguages(langResponse.data || []);
            setFrameworks(fwResponse.data || []);
        } catch (error) {
            console.error("Error fetching languages and frameworks:", error);
        } finally {
            setLoadingLanguages(false);
        }
    };

    // Helper functions
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getUserProfilePic = (task) => {
        return task.user?.profile_pic_url || task.profile?.profile_pic_url || null;
    };

    const getUserDisplayName = (task) => {
        if (task.user?.full_name) {
            return task.user.full_name;
        } else if (task.user?.username) {
            return task.user.username;
        } else if (task.user?.email) {
            return task.user.email;
        } else {
            return "Unknown User";
        }
    };

    const getUserEmail = (task) => {
        return task.user?.email || "";
    };

    const getAdminReview = (task) => {
        if (task.reviews && task.reviews.length > 0) {
            const adminReview = task.reviews.find(review => review.is_admin || review.user?.is_staff);
            if (adminReview) {
                return {
                    rating: adminReview.rating,
                    feedback: adminReview.feedback
                };
            }
        }
        return null;
    };

    // Enrich tasks with all needed data for display and search
    const enrichedTasks = useMemo(() => {
        return tasks.map(task => {
            // Resolve language names (handle both ID and full object)
            const languageNames = (task.languages || []).map(lang => {
                if (typeof lang === 'object' && lang.name) return lang.name;
                const found = languages.find(l => l.id === lang);
                return found ? found.name : null;
            }).filter(Boolean);

            // Resolve framework names
            const frameworkNames = (task.frameworks || []).map(fw => {
                if (typeof fw === 'object' && fw.name) return fw.name;
                const found = frameworks.find(f => f.id === fw);
                return found ? found.name : null;
            }).filter(Boolean);

            const userDisplayName = getUserDisplayName(task);
            const userEmail = getUserEmail(task);
            const adminReview = getAdminReview(task);

            // Determine status for card
            let componentStatus = task.status;
            if (!componentStatus) {
                if (task.is_rated || task.status === "rated") {
                    componentStatus = "graded";
                } else if (task.status === "under_review" || task.is_public) {
                    componentStatus = "under_review";
                } else {
                    componentStatus = "draft";
                }
            }

            return {
                ...task,
                _enriched: true,
                languageNames,
                frameworkNames,
                userDisplayName,
                userEmail,
                componentStatus,
                adminReview,
                cardData: {
                    id: task.id,
                    title: task.title,
                    description: task.description,
                    githubLink: task.git_link || "",
                    languages: languageNames,
                    frameworks: frameworkNames,
                    status: componentStatus,
                    grade: adminReview?.rating || 0,
                    adminFeedback: adminReview?.feedback || "",
                    createdAt: formatDate(task.created_at),
                    adminEditable: true,
                    likes_count: task.likes_count || 0,
                    is_public: task.is_public || false,
                    user: {
                        ...task.user,
                        profile_pic_url: getUserProfilePic(task),
                        displayName: userDisplayName
                    },
                    profile: task.profile || {},
                    reviews: task.reviews || []
                }
            };
        });
    }, [tasks, languages, frameworks]);

    // Filter and sort tasks
    const filteredTasks = useMemo(() => {
        let result = [...enrichedTasks];

        // Apply search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            result = result.filter(task => {
                // Build searchable text from all relevant fields
                const searchableFields = [
                    task.title,
                    task.description,
                    task.userDisplayName,
                    task.userEmail,
                    task.git_link,
                    ...task.languageNames,
                    ...task.frameworkNames
                ].map(field => (field || '').toLowerCase());

                // Also include any other text fields you want
                return searchableFields.some(field => field.includes(query));
            });
        }

        // Apply filters
        if (filters.visibility) {
            const isPublic = filters.visibility === "public";
            result = result.filter(task => task.is_public === isPublic);
        }

        if (filters.language) {
            const languageId = parseInt(filters.language);
            result = result.filter(task =>
                task.languages?.some(lang =>
                    (typeof lang === 'object' ? lang.id : lang) === languageId
                )
            );
        }

        if (filters.framework) {
            const frameworkId = parseInt(filters.framework);
            result = result.filter(task =>
                task.frameworks?.some(fw =>
                    (typeof fw === 'object' ? fw.id : fw) === frameworkId
                )
            );
        }

        // Apply sorting
        result.sort((a, b) => {
            let aValue, bValue;

            switch (filters.sortBy) {
                case "created_at":
                case "updated_at":
                    aValue = new Date(a[filters.sortBy]).getTime();
                    bValue = new Date(b[filters.sortBy]).getTime();
                    break;
                case "likes_count":
                    aValue = a.likes_count || 0;
                    bValue = b.likes_count || 0;
                    break;
                case "title":
                    aValue = a.title?.toLowerCase() || "";
                    bValue = b.title?.toLowerCase() || "";
                    break;
                default:
                    aValue = a[filters.sortBy];
                    bValue = b[filters.sortBy];
            }

            if (filters.sortOrder === "asc") {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            }
        });

        return result;
    }, [enrichedTasks, searchQuery, filters]);

    // Handle task actions (unchanged)
    const handleViewTask = (task) => {
        navigate(`/admin/learning-task/${task.id}`);
    };

    const handleEditTask = (task) => {
        navigate(`/admin/learning-task/edit/${task.id}`);
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm("Are you sure you want to delete this task?")) {
            return;
        }

        try {
            await api.delete(`/api/learning-task/delete/${taskId}/`);
            setTasks(prev => prev.filter(t => t.id !== taskId));
            neonToast.success("Task deleted successfully", "success");

            // Update stats after deletion
            const newTasks = tasks.filter(t => t.id !== taskId);
            const publicTasks = newTasks.filter(t => t.is_public).length;
            const reviewedTasks = newTasks.filter(t => t.is_rated || t.status === "rated").length;
            const totalLikes = newTasks.reduce((acc, task) => acc + (task.likes_count || 0), 0);

            setStats({
                total: newTasks.length,
                public: publicTasks,
                reviewed: reviewedTasks,
                totalLikes: totalLikes
            });
        } catch (error) {
            console.error("Error deleting task:", error);
            if (error.response?.data?.error) {
                neonToast.error(error.response.data.error, "error");
            } else {
                neonToast.error("Failed to delete task", "error");
            }
        }
    };

    const handleNavigateToTaskLimitBulk = () => {
        navigate("/admin/task-limit");
    };

    const clearFilters = () => {
        setFilters({
            visibility: "",
            language: "",
            framework: "",
            sortBy: "created_at",
            sortOrder: "desc"
        });
        setSearchQuery("");
        setShowAdvancedFilters(false);
    };

    return (
        <div className={styles.container}>
            <SideBar>
                {/* Header (unchanged) */}
                <div className={styles.header}>
                    <div className={styles.headerContent}>
                        <div className={styles.titleSection}>
                            <FaTasks className={styles.titleIcon} />
                            <div>
                                <h1>Learning Tasks</h1>
                                <p>Browse and evaluate programming tasks submitted by students</p>
                            </div>
                        </div>
                        <div className={styles.headerActions}>
                            <button
                                className={styles.managementBtn}
                                onClick={handleNavigateToTaskLimitBulk}
                                title="Manage Task Limits"
                            >
                                <MdSettings />
                                <span>Manage Task Limits</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Bar (unchanged) */}
                <div className={styles.statsBar}>
                    <div className={styles.statItem}>
                        <FaTasks className={styles.statIcon} />
                        <div>
                            <span className={styles.statNumber}>{stats.total}</span>
                            <span className={styles.statLabel}>Total Tasks</span>
                        </div>
                    </div>
                    <div className={styles.statItem}>
                        <FaGlobe className={styles.statIcon} />
                        <div>
                            <span className={styles.statNumber}>{stats.public}</span>
                            <span className={styles.statLabel}>Public</span>
                        </div>
                    </div>
                    <div className={styles.statItem}>
                        <FaStar className={styles.statIcon} />
                        <div>
                            <span className={styles.statNumber}>{stats.reviewed}</span>
                            <span className={styles.statLabel}>Reviewed</span>
                        </div>
                    </div>
                    <div className={styles.statItem}>
                        <FaCode className={styles.statIcon} />
                        <div>
                            <span className={styles.statNumber}>{stats.totalLikes}</span>
                            <span className={styles.statLabel}>Total Likes</span>
                        </div>
                    </div>
                </div>

                {/* Search and Filters (unchanged) */}
                <div className={styles.filtersCard}>
                    <div className={styles.searchSection}>
                        <div className={styles.searchInputWrapper}>
                            <input
                                type="text"
                                placeholder="Search tasks by title, description, user, or technologies..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={styles.searchInput}
                            />
                            {searchQuery && (
                                <button
                                    className={styles.clearSearch}
                                    onClick={() => setSearchQuery("")}
                                >
                                    <FaTimes />
                                </button>
                            )}
                        </div>
                        <div className={styles.filterControls}>
                            <button
                                className={styles.filterToggle}
                                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                            >
                                <MdFilterList />
                                <span>Filters</span>
                            </button>
                            {(filters.visibility || filters.language || filters.framework || searchQuery) && (
                                <button
                                    className={styles.clearFilters}
                                    onClick={clearFilters}
                                >
                                    <FaTimes />
                                    <span>Clear All</span>
                                </button>
                            )}
                            <button
                                className={styles.refreshBtn}
                                onClick={fetchTasks}
                                disabled={loading}
                            >
                                <MdRefresh />
                                <span>Refresh</span>
                            </button>
                        </div>
                    </div>

                    {/* Advanced Filters (unchanged) */}
                    {showAdvancedFilters && (
                        <div className={styles.advancedFilters}>
                            <div className={styles.filterGrid}>
                                <div className={styles.filterGroup}>
                                    <label>Visibility</label>
                                    <select
                                        value={filters.visibility}
                                        onChange={(e) => setFilters(prev => ({ ...prev, visibility: e.target.value }))}
                                    >
                                        <option value="">All Tasks</option>
                                        <option value="public">Public</option>
                                        <option value="private">Private</option>
                                    </select>
                                </div>

                                <div className={styles.filterGroup}>
                                    <label>Language</label>
                                    <select
                                        value={filters.language}
                                        onChange={(e) => setFilters(prev => ({ ...prev, language: e.target.value }))}
                                        disabled={loadingLanguages || languages.length === 0}
                                    >
                                        <option value="">All Languages</option>
                                        {languages.map(lang => (
                                            <option key={lang.id} value={lang.id}>
                                                {lang.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className={styles.filterGroup}>
                                    <label>Framework</label>
                                    <select
                                        value={filters.framework}
                                        onChange={(e) => setFilters(prev => ({ ...prev, framework: e.target.value }))}
                                        disabled={loadingLanguages || frameworks.length === 0}
                                    >
                                        <option value="">All Frameworks</option>
                                        {frameworks.map(fw => (
                                            <option key={fw.id} value={fw.id}>
                                                {fw.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className={styles.filterGroup}>
                                    <label>Sort By</label>
                                    <select
                                        value={`${filters.sortBy}-${filters.sortOrder}`}
                                        onChange={(e) => {
                                            const [sortBy, sortOrder] = e.target.value.split('-');
                                            setFilters(prev => ({ ...prev, sortBy, sortOrder }));
                                        }}
                                    >
                                        <option value="created_at-desc">Newest First</option>
                                        <option value="created_at-asc">Oldest First</option>
                                        <option value="likes_count-desc">Most Liked</option>
                                        <option value="likes_count-asc">Least Liked</option>
                                        <option value="title-asc">Title A-Z</option>
                                        <option value="title-desc">Title Z-A</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Tasks Grid */}
                <div className={styles.tasksCard}>
                    <div className={styles.tasksHeader}>
                        <h3>Learning Tasks ({filteredTasks.length})</h3>
                        <div className={styles.resultsInfo}>
                            Showing {filteredTasks.length} of {tasks.length} tasks
                        </div>
                    </div>

                    {loading ? (
                        <div className={styles.loadingContainer}>
                            <div className={styles.loadingSpinner}></div>
                            <p>Loading tasks...</p>
                        </div>
                    ) : filteredTasks.length === 0 ? (
                        <div className={styles.emptyState}>
                            <FaTasks size={48} />
                            <h3>No tasks found</h3>
                            <p>
                                {tasks.length === 0
                                    ? "No learning tasks available yet."
                                    : "Try adjusting your search or filters"}
                            </p>
                        </div>
                    ) : (
                        <div className={styles.tasksGrid}>
                            {filteredTasks.map((task) => (
                                <LearningTaskCard
                                    key={task.id}
                                    task={task.cardData}
                                    isOwner={false}
                                    onView={() => handleViewTask(task)}
                                    onEdit={() => handleEditTask(task)}
                                    onDelete={() => handleDeleteTask(task.id)}
                                    loadingDelete={false}
                                    isAdmin={true}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </SideBar>
        </div>
    );
}