import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../../../Context/UserContext";
import api from "../../../Utils/api";
import SideBar from "../../../Components/SideBar/SideBar";
import {
    FaBook,
    FaPlus,
    FaSpinner,
    FaExclamationTriangle,
    FaChevronLeft,
    FaChevronRight,
    FaSearch,
    FaFilter,
    FaSort,
    FaEdit,
    FaTrash,
    FaEye,
    FaTag,
    FaCalendarAlt,
} from "react-icons/fa";
import { MdClass } from "react-icons/md";
import { neonToast } from "../../../Components/NeonToast/NeonToast";
import ConfirmAction from "../../../Components/ConfirmAction/ConfirmAction";
import styles from "./Courses.module.css";
import { useNotifContext } from "../../../Context/NotifContext";

export default function Courses() {
    const { user } = useUser();
    const navigate = useNavigate();
    const { updatePageTitle } = useNotifContext();
    useEffect(() => {
        updatePageTitle("Courses");
    }, []);

    // State
    const [courses, setCourses] = useState([]);
    const [stats, setStats] = useState({ total: 0 }); // could be extended later
    const [pagination, setPagination] = useState({
        current_page: 1,
        page_size: 10,
        total_count: 0,
        total_pages: 1,
    });
    const [filters, setFilters] = useState({
        search: "",
        field: "",
    });
    const [filterOptions, setFilterOptions] = useState({
        fields: [], // will be populated from API or manually
    });
    const [sortConfig, setSortConfig] = useState({
        sort_by: "-created_at",
        sort_order: "desc",
    });
    const [showFilters, setShowFilters] = useState(false);
    const [loading, setLoading] = useState(true);
    const [coursesLoading, setCoursesLoading] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    // Field options (can also be fetched from backend)
    const fieldOptions = [
        { value: "frontend", label: "Frontend" },
        { value: "backend", label: "Backend" },
        { value: "ai", label: "AI" },
        { value: "embedded", label: "Embedded" },
        { value: "cyber", label: "Cyber" },
        { value: "other", label: "Other" },
    ];

    useEffect(() => {
        if (user.isAuthenticated === null) return;
        if (!user.isAuthenticated) {
            navigate("/login");
            return;
        }
        fetchCourses();
    }, [user, navigate]);

    const fetchCourses = async (page = 1) => {
        setCoursesLoading(true);
        try {
            const params = {
                page,
                page_size: pagination.page_size,
                ...sortConfig,
                ...filters,
            };

            // Remove empty values
            Object.keys(params).forEach((key) => {
                if (params[key] === "" || params[key] === null || params[key] === undefined) {
                    delete params[key];
                }
            });

            const response = await api.get("/api/courses/", { params });
            const data = response.data;


            // Assume response has structure: { courses, pagination, stats, filter_options }
            setCourses(data.courses || []);
            setPagination(data.pagination || {
                current_page: 1,
                page_size: 10,
                total_count: 0,
                total_pages: 1,
            });
            setStats(data.stats || { total: data.pagination?.total_count || 0 });
            setFilterOptions(data.filter_options || { fields: [] });

        } catch (error) {
            if (error?.response?.data?.info) {
                neonToast.warning("No courses yet")
                setCourses([]);
                setPagination({
                    current_page: 1,
                    page_size: 10,
                    total_count: 0,
                    total_pages: 1,
                });
                setStats({ total: data.pagination?.total_count || 0 });
                setFilterOptions({ fields: [] });
            }
            console.error("Error fetching courses:", error);
            neonToast.error("Failed to load courses", "error");
        } finally {
            setCoursesLoading(false);
            setLoading(false);
        }
    };

    const handlePageChange = (page) => {
        if (page >= 1 && page <= pagination.total_pages) {
            fetchCourses(page);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const handleSort = (field) => {
        const isCurrentlyDesc = sortConfig.sort_by === `-${field}`;
        const isCurrentlyAsc = sortConfig.sort_by === field;

        let newSortConfig = { ...sortConfig };

        if (isCurrentlyDesc) {
            newSortConfig.sort_by = field;
            newSortConfig.sort_order = "asc";
        } else if (isCurrentlyAsc) {
            newSortConfig.sort_by = "-created_at"; // default
            newSortConfig.sort_order = "desc";
        } else {
            newSortConfig.sort_by = `-${field}`;
            newSortConfig.sort_order = "desc";
        }

        setSortConfig(newSortConfig);
        fetchCourses(1);
    };

    const handleSearch = () => {
        fetchCourses(1);
    };

    const handleClearFilters = () => {
        setFilters({ search: "", field: "" });
        setSortConfig({ sort_by: "-created_at", sort_order: "desc" });
        fetchCourses(1);
    };

    const handleDelete = async (courseId, courseTitle) => {
        setDeletingId(courseId);
        try {
            const res = await api.delete(`/api/courses/${courseId}/delete/`);
            neonToast.success("Course deleted successfully", "success");


            // Refresh list
            fetchCourses(pagination.current_page);

        } catch (error) {
            console.error("Delete error:", error);
            if (error.response?.status === 403) {
                neonToast.error("You don't have permission to delete this course", "error");
            } else if (error.response?.data?.detail) {
                neonToast.error(error.response.data.detail, "error");
            } else {
                neonToast.error("Failed to delete course", "error");
            }
        } finally {
            setDeletingId(null);
        }
    };

    const getSortIcon = (field) => {
        if (sortConfig.sort_by === `-${field}`) {
            return <FaSort className={styles.sortIcon} />;
        } else if (sortConfig.sort_by === field) {
            return <FaSort className={`${styles.sortIcon} ${styles.sortAsc}`} />;
        }
        return null;
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const handleRowClick = (courseId) => {
        navigate(`/admin/courses/${courseId}`); // detail page (optional)
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <SideBar>
                    <div className={styles.loadingContainer}>
                        <FaSpinner className={styles.loadingSpinner} />
                        <p>Loading courses...</p>
                    </div>
                </SideBar>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <SideBar>
                <div className={styles.header}>
                    <div className={styles.headerContent}>
                        <div className={styles.titleSection}>
                            <FaBook className={styles.titleIcon} />
                            <div>
                                <h1>Courses</h1>
                                <p>Manage all courses</p>
                            </div>
                        </div>

                        <div className={styles.headerActions}>
                            <Link to="/admin/courses/create" className={styles.primaryBtn}>
                                <FaPlus />
                                <span>Create Course</span>
                            </Link>
                        </div>
                    </div>
                </div>

                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={styles.statIconContainer}>
                            <FaBook className={styles.statIcon} />
                        </div>
                        <div className={styles.statContent}>
                            <h3>Total Courses</h3>
                            <p className={styles.statValue}>{stats.total || 0}</p>
                        </div>
                    </div>
                    {/* Additional stats can be added here if available from backend */}
                </div>

                <div className={styles.tableCard}>
                    <div className={styles.tableHeader}>
                        <h2>
                            <FaBook className={styles.tableIcon} /> Course Management
                        </h2>
                        <div className={styles.tableActions}>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={styles.filterButton}
                            >
                                <FaFilter /> Filters
                            </button>
                            <button
                                onClick={handleClearFilters}
                                className={styles.clearButton}
                                disabled={coursesLoading}
                            >
                                Clear All
                            </button>
                        </div>
                    </div>

                    {showFilters && (
                        <div className={styles.filtersSection}>
                            <div className={styles.filterRow}>
                                <div className={styles.filterGroup}>
                                    <label>Search</label>
                                    <div className={styles.searchInput}>
                                        <FaSearch className={styles.searchIcon} />
                                        <input
                                            type="text"
                                            placeholder="Search by title or description..."
                                            value={filters.search}
                                            onChange={(e) => handleFilterChange("search", e.target.value)}
                                            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                                        />
                                    </div>
                                </div>
                                <div className={styles.filterGroup}>
                                    <label>Field</label>
                                    <select
                                        value={filters.field}
                                        onChange={(e) => handleFilterChange("field", e.target.value)}
                                    >
                                        <option value="">All Fields</option>
                                        {fieldOptions.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    onClick={handleSearch}
                                    className={styles.applyButton}
                                    disabled={coursesLoading}
                                >
                                    {coursesLoading ? <FaSpinner className={styles.spinner} /> : "Apply Filters"}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className={styles.tableWrapper}>
                        <div className={styles.tableContainer}>
                            {coursesLoading ? (
                                <div className={styles.loadingOverlay}>
                                    <FaSpinner className={styles.loadingSpinner} />
                                    <p>Loading courses...</p>
                                </div>
                            ) : courses.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <FaExclamationTriangle size={24} />
                                    <p>No courses found</p>
                                    {Object.values(filters).some((val) => val !== "") && (
                                        <button onClick={handleClearFilters} className={styles.clearButton}>
                                            Clear filters
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <table className={styles.dataTable}>
                                    <thead>
                                        <tr>
                                            <th onClick={() => handleSort("title")} className={styles.sortable}>
                                                Title {getSortIcon("title")}
                                            </th>
                                            <th onClick={() => handleSort("field")} className={styles.sortable}>
                                                Field {getSortIcon("field")}
                                            </th>
                                            <th>Short Note</th>
                                            <th onClick={() => handleSort("created_at")} className={styles.sortable}>
                                                Created At {getSortIcon("created_at")}
                                            </th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {courses.map((course) => (
                                            <tr
                                                key={course.id}
                                                className={styles.clickableRow}
                                                onClick={() => handleRowClick(course.id)}
                                            >
                                                <td>
                                                    <div className={styles.courseTitleCell}>
                                                        <FaBook className={styles.titleIcon} />
                                                        <span>{course.title}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={styles.fieldBadge}>
                                                        <MdClass />{" "}
                                                        {course.field
                                                            ? course.field.charAt(0).toUpperCase() + course.field.slice(1)
                                                            : "N/A"}
                                                    </span>
                                                </td>
                                                <td className={styles.shortNote}>{course.short_note || "—"}</td>
                                                <td>
                                                    <div className={styles.dateCell}>
                                                        <FaCalendarAlt className={styles.dateIcon} />
                                                        {formatDate(course.created_at)}
                                                    </div>
                                                </td>
                                                <td onClick={(e) => e.stopPropagation()}>
                                                    <div className={styles.actionButtons}>
                                                        <Link
                                                            to={`/admin/courses/${course.id}`}
                                                            className={styles.actionBtn}
                                                            title="View"
                                                        >
                                                            <FaEye />
                                                        </Link>
                                                        <Link
                                                            to={`/admin/courses/edit/${course.id}`}
                                                            className={styles.actionBtn}
                                                            title="Edit"
                                                        >
                                                            <FaEdit />
                                                        </Link>
                                                        <ConfirmAction
                                                            title="Delete Course"
                                                            message={`Are you sure you want to delete "${course.title}"? This action cannot be undone.`}
                                                            confirmText="Delete"
                                                            cancelText="Cancel"
                                                            onConfirm={() => handleDelete(course.id, course.title)}
                                                        >
                                                            <button
                                                                className={styles.actionBtn}
                                                                disabled={deletingId === course.id}
                                                                title="Delete"
                                                            >
                                                                {deletingId === course.id ? (
                                                                    <FaSpinner className={styles.spinner} />
                                                                ) : (
                                                                    <FaTrash />
                                                                )}
                                                            </button>
                                                        </ConfirmAction>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {courses.length > 0 && pagination.total_count > pagination.page_size && (
                            <div className={styles.pagination}>
                                <div className={styles.paginationInfo}>
                                    Showing{" "}
                                    {(pagination.current_page - 1) * pagination.page_size + 1} to{" "}
                                    {Math.min(pagination.current_page * pagination.page_size, pagination.total_count)} of{" "}
                                    {pagination.total_count} courses
                                </div>
                                <div className={styles.paginationControls}>
                                    <button
                                        onClick={() => handlePageChange(pagination.current_page - 1)}
                                        disabled={pagination.current_page === 1 || coursesLoading}
                                        className={styles.paginationButton}
                                    >
                                        <FaChevronLeft /> Previous
                                    </button>
                                    <div className={styles.pageNumbers}>
                                        {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                                            let pageNum;
                                            if (pagination.total_pages <= 5) {
                                                pageNum = i + 1;
                                            } else if (pagination.current_page <= 3) {
                                                pageNum = i + 1;
                                            } else if (pagination.current_page >= pagination.total_pages - 2) {
                                                pageNum = pagination.total_pages - 4 + i;
                                            } else {
                                                pageNum = pagination.current_page - 2 + i;
                                            }
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className={`${styles.pageButton} ${pagination.current_page === pageNum ? styles.activePage : ""
                                                        }`}
                                                    disabled={coursesLoading}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <button
                                        onClick={() => handlePageChange(pagination.current_page + 1)}
                                        disabled={pagination.current_page === pagination.total_pages || coursesLoading}
                                        className={styles.paginationButton}
                                    >
                                        Next <FaChevronRight />
                                    </button>
                                </div>
                                <div className={styles.pageSizeSelector}>
                                    <label>Show: </label>
                                    <select
                                        value={pagination.page_size}
                                        onChange={(e) => {
                                            const newSize = parseInt(e.target.value);
                                            setPagination((prev) => ({ ...prev, page_size: newSize }));
                                            // Directly call fetchCourses without setTimeout
                                            fetchCourses(1);
                                        }}
                                        disabled={coursesLoading}
                                        className={styles.pageSizeSelect}
                                    >
                                        <option value="5">5</option>
                                        <option value="10">10</option>
                                        <option value="25">25</option>
                                        <option value="50">50</option>
                                        <option value="100">100</option>
                                    </select>
                                    <span>per page</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </SideBar>
        </div>
    );
}