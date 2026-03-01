import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../../../Context/UserContext";
import api from "../../../Utils/api";
import SideBar from "../../../Components/SideBar/SideBar";
import {
    FaUsers,
    FaUserPlus,
    FaUpload,
    FaSpinner,
    FaExclamationTriangle,
    FaChevronLeft,
    FaChevronRight,
    FaSearch,
    FaFilter,
    FaSort,
    FaGraduationCap,
    FaStar,
    FaHeart,
    FaCheckCircle,
    FaTimesCircle,
    FaCalendarAlt,
    FaUserCheck,
    FaUserSlash,
    FaDownload,
    FaCode, // for field icon
} from "react-icons/fa";
import { neonToast } from "../../../Components/NeonToast/NeonToast";
import styles from "./Students.module.css";
import { useNotifContext } from "../../../Context/NotifContext";

export default function Students() {
    const { user } = useUser();
    const navigate = useNavigate();
    const { updatePageTitle } = useNotifContext()
    useEffect(() => {
        updatePageTitle("Students")
    }, [])

    const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, attendance_avg: 0 });
    const [students, setStudents] = useState([]);
    const [pagination, setPagination] = useState({
        current_page: 1,
        page_size: 10,
        total_count: 0,
        total_pages: 1,
    });
    const [filters, setFilters] = useState({
        search: "",
        grade: "",
        section: "",
        field: "", // NEW: field filter
        accountStatus: "",
    });
    const [filterOptions, setFilterOptions] = useState({
        grades: [],
        sections: [],
        fields: [], // NEW: field options
    });
    const [sortConfig, setSortConfig] = useState({
        sort_by: "-user__date_joined",
        sort_order: "desc"
    });
    const [showFilters, setShowFilters] = useState(false);
    const [loading, setLoading] = useState(true);
    const [studentsLoading, setStudentsLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [exportingGrades, setExportingGrades] = useState(false);

    useEffect(() => {
        if (user.isAuthenticated === null) return;
        if (!user.isAuthenticated) {
            navigate("/login");
            return;
        }
        fetchStudents();
    }, [user, navigate]);

    const fetchStudents = async (page = 1) => {
        setStudentsLoading(true);
        try {
            const params = {
                page,
                page_size: pagination.page_size,
                ...sortConfig,
                ...filters
            };

            Object.keys(params).forEach(key => {
                if (params[key] === "" || params[key] === null || params[key] === undefined) {
                    delete params[key];
                }
            });

            const response = await api.get("/api/management/students/", { params });
            const data = response.data;

            setStats(data.stats || { total: 0, active: 0, inactive: 0, attendance_avg: 0 });
            setStudents(data.students || []);
            setPagination(data.pagination || {
                current_page: 1,
                page_size: 10,
                total_count: 0,
                total_pages: 1,
            });
            setFilterOptions(data.filter_options || { grades: [], sections: [], fields: [] });

        } catch (error) {
            console.error("Error fetching students:", error);
            neonToast.error("Failed to load students", "error");
        } finally {
            setStudentsLoading(false);
            setLoading(false);
        }
    };

    const handlePageChange = (page) => {
        if (page >= 1 && page <= pagination.total_pages) {
            fetchStudents(page);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleSort = (field) => {
        const isCurrentlyDesc = sortConfig.sort_by === `-${field}`;
        const isCurrentlyAsc = sortConfig.sort_by === field;

        let newSortConfig = { ...sortConfig };

        if (isCurrentlyDesc) {
            newSortConfig.sort_by = field;
            newSortConfig.sort_order = "asc";
        } else if (isCurrentlyAsc) {
            newSortConfig.sort_by = "-user__date_joined";
            newSortConfig.sort_order = "desc";
        } else {
            newSortConfig.sort_by = `-${field}`;
            newSortConfig.sort_order = "desc";
        }

        setSortConfig(newSortConfig);
        fetchStudents(1);
    };

    const handleSearch = () => {
        fetchStudents(1);
    };

    const handleClearFilters = () => {
        setFilters({
            search: "",
            grade: "",
            section: "",
            field: "", // NEW: clear field
            accountStatus: "",
        });
        setSortConfig({
            sort_by: "-user__date_joined",
            sort_order: "desc"
        });
        fetchStudents(1);
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const params = new URLSearchParams();
            if (filters.search) params.append("search", filters.search);
            if (filters.grade) params.append("grade", filters.grade);
            if (filters.section) params.append("section", filters.section);
            if (filters.field) params.append("field", filters.field); // NEW
            if (filters.accountStatus) params.append("account_status", filters.accountStatus);

            const response = await api.get("/api/management/students/export/", {
                params,
                responseType: "blob",
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `students_export_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.xlsx`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            neonToast.success("Export completed successfully", "success");
        } catch (error) {
            console.error("Export error:", error);
            neonToast.error("Failed to export students", "error");
        } finally {
            setExporting(false);
        }
    };

    const handleExportGrades = async () => {
        setExportingGrades(true);
        try {
            const params = new URLSearchParams();
            if (filters.search) params.append("search", filters.search);
            if (filters.grade) params.append("grade", filters.grade);
            if (filters.section) params.append("section", filters.section);
            if (filters.field) params.append("field", filters.field); // NEW
            if (filters.accountStatus) params.append("account_status", filters.accountStatus);

            const response = await api.get("/api/management/students/grade/export/", {
                params,
                responseType: "blob",
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `grades_export_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.pdf`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            neonToast.success("Grades export completed successfully", "success");
        } catch (error) {
            console.error("Export grades error:", error);
            neonToast.error("Failed to export grades", "error");
        } finally {
            setExportingGrades(false);
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

    const getAttendanceRatingColor = (rating) => {
        switch (rating) {
            case "excellent": return "#10b981";
            case "good": return "#3b82f6";
            case "average": return "#f59e0b";
            case "poor": return "#ef4444";
            default: return "#6b7280";
        }
    };

    const handleRowClick = (studentId) => {
        navigate(`/admin/student/${studentId}`);
    };

    const handleImageError = (e) => {
        e.target.style.display = "none";
        const nextSibling = e.target.nextElementSibling;
        if (nextSibling) {
            nextSibling.style.display = "flex";
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <SideBar>
                    <div className={styles.loadingContainer}>
                        <FaSpinner className={styles.loadingSpinner} />
                        <p>Loading students...</p>
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
                            <FaUsers className={styles.titleIcon} />
                            <div>
                                <h1>Students</h1>
                                <p>Manage student accounts</p>
                            </div>
                        </div>

                        <div className={styles.headerActions}>
                            <Link to="/admin/students/bulk" className={styles.secondaryBtn}>
                                <FaUpload />
                                <span>Bulk Upload</span>
                            </Link>
                            <Link to="/admin/student/add" className={styles.primaryBtn}>
                                <FaUserPlus />
                                <span>Add Student</span>
                            </Link>
                        </div>
                    </div>
                </div>

                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={styles.statIconContainer}>
                            <FaUsers className={styles.statIcon} />
                        </div>
                        <div className={styles.statContent}>
                            <h3>Total Students</h3>
                            <p className={styles.statValue}>{stats.total || 0}</p>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statIconContainer}>
                            <FaUserCheck className={styles.statIcon} />
                        </div>
                        <div className={styles.statContent}>
                            <h3>Active</h3>
                            <p className={styles.statValue}>{stats.active || 0}</p>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statIconContainer}>
                            <FaUserSlash className={styles.statIcon} />
                        </div>
                        <div className={styles.statContent}>
                            <h3>Inactive</h3>
                            <p className={styles.statValue}>{stats.inactive || 0}</p>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statIconContainer}>
                            <FaCalendarAlt className={styles.statIcon} />
                        </div>
                        <div className={styles.statContent}>
                            <h3>Attendance Avg</h3>
                            <p className={styles.statValue}>{(stats?.attendance_avg || 0).toFixed(2)}%</p>
                        </div>
                    </div>
                </div>

                <div className={styles.tableCard}>
                    <div className={styles.tableHeader}>
                        <h2>
                            <FaUsers className={styles.tableIcon} /> Student Management
                        </h2>
                        <div className={styles.tableActions}>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={styles.filterButton}
                            >
                                <FaFilter /> Filters
                            </button>
                            <button
                                onClick={handleExport}
                                className={styles.exportButton}
                                disabled={studentsLoading || exporting}
                            >
                                {exporting ? <FaSpinner className={styles.spinner} /> : <FaDownload />}
                                Export Excel
                            </button>
                            <button
                                onClick={handleExportGrades}
                                className={styles.exportButton}
                                disabled={studentsLoading || exportingGrades}
                            >
                                {exportingGrades ? <FaSpinner className={styles.spinner} /> : <FaGraduationCap />}
                                Export Grades
                            </button>
                            <button
                                onClick={handleClearFilters}
                                className={styles.clearButton}
                                disabled={studentsLoading}
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
                                            placeholder="Search by name, email, grade, etc."
                                            value={filters.search}
                                            onChange={(e) => handleFilterChange("search", e.target.value)}
                                            onKeyPress={handleKeyPress}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className={styles.filterRow}>
                                <div className={styles.filterGroup}>
                                    <label>Grade</label>
                                    <select
                                        value={filters.grade}
                                        onChange={(e) => handleFilterChange("grade", e.target.value)}
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
                                        onChange={(e) => handleFilterChange("section", e.target.value)}
                                    >
                                        <option value="">All Sections</option>
                                        {filterOptions.sections.map(section => (
                                            <option key={section} value={section}>{section}</option>
                                        ))}
                                    </select>
                                </div>
                                {/* NEW Field filter */}
                                <div className={styles.filterGroup}>
                                    <label>Field</label>
                                    <select
                                        value={filters.field}
                                        onChange={(e) => handleFilterChange("field", e.target.value)}
                                    >
                                        <option value="">All Fields</option>
                                        {filterOptions.fields.map(field => (
                                            <option key={field} value={field}>{field}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.filterGroup}>
                                    <label>Account Status</label>
                                    <select
                                        value={filters.accountStatus}
                                        onChange={(e) => handleFilterChange("accountStatus", e.target.value)}
                                    >
                                        <option value="">All Status</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                                <button
                                    onClick={handleSearch}
                                    className={styles.applyButton}
                                    disabled={studentsLoading}
                                >
                                    {studentsLoading ? <FaSpinner className={styles.spinner} /> : "Apply Filters"}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className={styles.tableWrapper}>
                        <div className={styles.tableContainer}>
                            {studentsLoading ? (
                                <div className={styles.loadingOverlay}>
                                    <FaSpinner className={styles.loadingSpinner} />
                                    <p>Loading students...</p>
                                </div>
                            ) : students.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <FaExclamationTriangle size={24} />
                                    <p>No students found</p>
                                    {Object.values(filters).some(val => val !== "") && (
                                        <button
                                            onClick={handleClearFilters}
                                            className={styles.clearButton}
                                        >
                                            Clear filters
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <table className={styles.dataTable}>
                                    <thead>
                                        <tr>
                                            <th onClick={() => handleSort("full_name")} className={styles.sortable}>
                                                Name {getSortIcon("full_name")}
                                            </th>
                                            <th onClick={() => handleSort("email")} className={`${styles.sortable} ${styles.hideOnMobile}`}>
                                                Email {getSortIcon("email")}
                                            </th>
                                            <th onClick={() => handleSort("grade")} className={styles.sortable}>
                                                Grade {getSortIcon("grade")}
                                            </th>
                                            <th onClick={() => handleSort("section")} className={`${styles.sortable} ${styles.hideOnMobile}`}>
                                                Section {getSortIcon("section")}
                                            </th>
                                            {/* NEW Field column */}
                                            <th onClick={() => handleSort("field")} className={`${styles.sortable} ${styles.hideOnMobile}`}>
                                                Field {getSortIcon("field")}
                                            </th>
                                            <th>Attendance</th>
                                            <th onClick={() => handleSort("account_status")} className={styles.sortable}>
                                                Status {getSortIcon("account_status")}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map((student) => (
                                            <tr
                                                key={student.id}
                                                className={styles.clickableRow}
                                                onClick={() => handleRowClick(student.id)}
                                            >
                                                <td>
                                                    <div className={styles.studentCell}>
                                                        {student.profile_pic_url ? (
                                                            <img
                                                                src={student.profile_pic_url}
                                                                alt={student.full_name}
                                                                className={styles.profileImage}
                                                                onError={handleImageError}
                                                            />
                                                        ) : null}
                                                        <div className={styles.avatarPlaceholder} style={{ display: student.profile_pic_url ? 'none' : 'flex' }}>
                                                            {student.full_name?.charAt(0) || '?'}
                                                        </div>
                                                        <div className={styles.studentInfo}>
                                                            <span className={styles.studentName}>{student.full_name}</span>
                                                            <span className={styles.mobileEmail}>{student.email}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className={styles.hideOnMobile}>{student.email}</td>
                                                <td>
                                                    <span className={styles.gradeBadge}>
                                                        <FaGraduationCap className={styles.gradeIcon} /> {student.grade || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className={styles.hideOnMobile}>{student.section || 'N/A'}</td>
                                                {/* NEW Field cell */}
                                                <td className={styles.hideOnMobile}>
                                                    <span className={styles.fieldBadge}>
                                                        <FaCode className={styles.fieldIcon} /> {student.field || 'N/A'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className={styles.attendanceCell}>
                                                        <div className={styles.attendanceProgress}>
                                                            <div className={styles.progressBar} title={`${student.attendance?.attendance_percentage || 0}%`}>
                                                                <div
                                                                    className={styles.progressFill}
                                                                    style={{
                                                                        width: `${Math.min(student.attendance?.attendance_percentage || 0, 100)}%`,
                                                                        backgroundColor: getAttendanceRatingColor(student.attendance?.attendance_rating)
                                                                    }}
                                                                />
                                                            </div>
                                                            <span className={styles.attendancePercentage}>
                                                                {student.attendance?.attendance_percentage || 0}%
                                                            </span>
                                                        </div>
                                                        <div className={styles.attendanceRating}>
                                                            <span
                                                                className={styles.ratingBadge}
                                                                style={{
                                                                    backgroundColor: `${getAttendanceRatingColor(student.attendance?.attendance_rating)}20`,
                                                                    color: getAttendanceRatingColor(student.attendance?.attendance_rating)
                                                                }}
                                                            >
                                                                {student.attendance?.attendance_rating || 'No data'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`${styles.statusBadge} ${student.account_status === 'active' ? styles.activeBadge : styles.inactiveBadge}`}>
                                                        {student.account_status === 'active' ? (
                                                            <><FaCheckCircle /> Active</>
                                                        ) : (
                                                            <><FaTimesCircle /> Inactive</>
                                                        )}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {students.length > 0 && pagination.total_count > pagination.page_size && (
                            <div className={styles.pagination}>
                                <div className={styles.paginationInfo}>
                                    Showing {((pagination.current_page - 1) * pagination.page_size) + 1} to {Math.min(pagination.current_page * pagination.page_size, pagination.total_count)} of {pagination.total_count} students
                                </div>
                                <div className={styles.paginationControls}>
                                    <button
                                        onClick={() => handlePageChange(pagination.current_page - 1)}
                                        disabled={pagination.current_page === 1 || studentsLoading}
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
                                                    className={`${styles.pageButton} ${pagination.current_page === pageNum ? styles.activePage : ''}`}
                                                    disabled={studentsLoading}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <button
                                        onClick={() => handlePageChange(pagination.current_page + 1)}
                                        disabled={pagination.current_page === pagination.total_pages || studentsLoading}
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
                                            setPagination(prev => ({ ...prev, page_size: parseInt(e.target.value) }));
                                            setTimeout(() => fetchStudents(1), 0);
                                        }}
                                        disabled={studentsLoading}
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