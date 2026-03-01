// src/pages/Admin/Students/BulkOperations.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../../Context/UserContext";
import api from "../../../Utils/api";
import SideBar from "../../../Components/SideBar/SideBar";
import ConfirmAction from "../../../Components/ConfirmAction/ConfirmAction"; // <-- new import
import {
    FaUsers,
    FaSpinner,
    FaExclamationTriangle,
    FaChevronLeft,
    FaChevronRight,
    FaSearch,
    FaFilter,
    FaTrash,
    FaEdit,
    FaSave,
    FaTimes,
    FaPhone,
    FaIdCard,
    FaCheckCircle,
    FaTimesCircle,
    FaGraduationCap,
    FaCode,
} from "react-icons/fa";
import { neonToast } from "../../../Components/NeonToast/NeonToast";
import styles from "../Students/Students.module.css";
import bulkStyles from "./BulkOperations.module.css";
import { useNotifContext } from "../../../Context/NotifContext";

export default function BulkOperations() {
    const { user } = useUser();
    const navigate = useNavigate();
    const { updatePageTitle } = useNotifContext();

    useEffect(() => {
        updatePageTitle("Student Bulk Operation");
    }, [updatePageTitle]);

    // ---------- Filters ----------
    const [filters, setFilters] = useState({
        search: "",
        grade: "",
        section: "",
        field: "",
        accountStatus: "",
    });

    const [filterOptions, setFilterOptions] = useState({
        grades: [],
        sections: [],
        fields: [],
    });

    const [showFilters, setShowFilters] = useState(true);

    // ---------- Preview data ----------
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewStats, setPreviewStats] = useState({ total: 0 });
    const [previewStudents, setPreviewStudents] = useState([]);
    const [previewPagination, setPreviewPagination] = useState({
        current_page: 1,
        page_size: 5,
        total_count: 0,
        total_pages: 1,
    });

    // ---------- Update form state ----------
    const [showUpdateForm, setShowUpdateForm] = useState(false);
    const [updateData, setUpdateData] = useState({
        grade: "",
        section: "",
        field: "",
        account: "",
        phone_number: "",
        is_active: "",
    });

    // ---------- Loading states for actions ----------
    const [deleting, setDeleting] = useState(false);
    const [updating, setUpdating] = useState(false);

    const FIELD_LIST = ["ai", "other", "backend", "frontend", "embedded", "cyber"];

    // ---------- Initial data load ----------
    useEffect(() => {
        if (user.isAuthenticated === null) return;
        if (!user.isAuthenticated) {
            navigate("/login");
            return;
        }
        if (!user.isSuperUser) {
            navigate(-1);
            neonToast.warning("You are not allowed to this page.");
        }
        fetchFilterOptions();
    }, [user, navigate]);

    const fetchFilterOptions = async () => {
        try {
            const response = await api.get("/api/management/students/", {
                params: { page_size: 1 },
            });
            setFilterOptions(response.data.filter_options || {
                grades: [],
                sections: [],
                fields: [],
            });
        } catch (error) {
            console.error("Error fetching filter options:", error);
            neonToast.error("Failed to load filter options");
        }
    };

    // ---------- Preview fetching ----------
    const fetchPreview = async (page = 1) => {
        setPreviewLoading(true);
        try {
            const params = {
                page,
                page_size: previewPagination.page_size,
                ...filters,
            };
            Object.keys(params).forEach(key => {
                if (!params[key]) delete params[key];
            });

            const response = await api.get("/api/management/students/", { params });
            const data = response.data;

            setPreviewStudents(data.students || []);
            setPreviewPagination(data.pagination || {
                current_page: 1,
                page_size: 5,
                total_count: 0,
                total_pages: 1,
            });
            setPreviewStats({ total: data.pagination?.total_count || 0 });
        } catch (error) {
            console.error("Preview error:", error);
            neonToast.error("Failed to load preview");
        } finally {
            setPreviewLoading(false);
        }
    };

    // ---------- Filter handlers ----------
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleSearch = () => {
        fetchPreview(1);
    };

    const handleClearFilters = () => {
        setFilters({
            search: "",
            grade: "",
            section: "",
            field: "",
            accountStatus: "",
        });
        setPreviewStudents([]);
        setPreviewStats({ total: 0 });
        setShowUpdateForm(false);
        setUpdateData({
            grade: "",
            section: "",
            field: "",
            account: "",
            phone_number: "",
            is_active: "",
        });
    };

    // ---------- Bulk Delete action (called by ConfirmAction) ----------
    const confirmDelete = async (event, reason) => {
        if (previewStats.total === 0) {
            neonToast.warning("No students match the current filters");
            return;
        }

        setDeleting(true);
        try {
            const payload = {
                action: "delete",
                search: filters.search || undefined,
                grade: filters.grade || undefined,
                section: filters.section || undefined,
                field: filters.field || undefined,
                account_status: filters.accountStatus || undefined,
            };

            const response = await api.post("/api/management/students/bulk/", payload);
            neonToast.success(`Successfully deleted ${response.data.deleted_count} students`);
            fetchPreview(1);
            setShowUpdateForm(false);
        } catch (error) {
            console.error("Delete error:", error);
            neonToast.error(error.response?.data?.error || "Failed to delete students");
        } finally {
            setDeleting(false);
        }
    };

    // ---------- Bulk Update action (called by ConfirmAction) ----------
    const confirmUpdate = async (event, reason) => {
        if (previewStats.total === 0) {
            neonToast.warning("No students match the current filters");
            return;
        }

        // Build edit_data from filled fields only
        const edit_data = {};
        if (updateData.grade) edit_data.grade = updateData.grade;
        if (updateData.section) edit_data.section = updateData.section;
        if (updateData.field) {
            if (!FIELD_LIST.includes(updateData.field.toLowerCase())) {
                neonToast.error(`Field must be one of: ${FIELD_LIST.join(", ")}`);
                return;
            }
            edit_data.field = updateData.field.toLowerCase();
        }
        if (updateData.account) edit_data.account = updateData.account;
        if (updateData.phone_number) edit_data.phone_number = updateData.phone_number;
        if (updateData.is_active) {
            edit_data.is_active = updateData.is_active === "active";
        }

        if (Object.keys(edit_data).length === 0) {
            neonToast.warning("No update fields specified");
            return;
        }

        setUpdating(true);
        try {
            const payload = {
                action: "edit",
                search: filters.search || undefined,
                grade: filters.grade || undefined,
                section: filters.section || undefined,
                field: filters.field || undefined,
                account_status: filters.accountStatus || undefined,
                edit_data,
            };

            const response = await api.post("/api/management/students/bulk/", payload);
            neonToast.success(response.data.message || `Successfully updated ${previewStats.total} students`);
            fetchPreview(1);
            setShowUpdateForm(false);
            setUpdateData({
                grade: "",
                section: "",
                field: "",
                account: "",
                phone_number: "",
                is_active: "",
            });
        } catch (error) {
            console.error("Update error:", error);
            neonToast.error(error.response?.data?.error || "Failed to update students");
        } finally {
            setUpdating(false);
        }
    };

    // ---------- Helper: attendance rating color ----------
    const getAttendanceRatingColor = (rating) => {
        switch (rating) {
            case "excellent": return "#10b981";
            case "good": return "#3b82f6";
            case "average": return "#f59e0b";
            case "poor": return "#ef4444";
            default: return "#6b7280";
        }
    };

    // ---------- Render ----------
    return (
        <div className={styles.container}>
            <SideBar>
                <div className={styles.header}>
                    <div className={styles.headerContent}>
                        <div className={styles.titleSection}>
                            <FaUsers className={styles.titleIcon} />
                            <div>
                                <h1>Bulk Operations</h1>
                                <p>Delete or update multiple students at once</p>
                            </div>
                        </div>
                        <div className={styles.headerActions}>
                            <button
                                onClick={() => navigate("/admin/students")}
                                className={styles.secondaryBtn}
                            >
                                ← Back to Students
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filter section */}
                <div className={styles.tableCard}>
                    <div className={styles.tableHeader}>
                        <h2>
                            <FaFilter className={styles.tableIcon} /> Select Students to Modify
                        </h2>
                        <div className={styles.tableActions}>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={styles.filterButton}
                            >
                                <FaFilter /> {showFilters ? "Hide" : "Show"} Filters
                            </button>
                            <button
                                onClick={handleClearFilters}
                                className={styles.clearButton}
                                disabled={previewLoading}
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
                                            placeholder="Name, email, grade, section, field..."
                                            value={filters.search}
                                            onChange={(e) => handleFilterChange("search", e.target.value)}
                                            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
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
                                    disabled={previewLoading}
                                >
                                    {previewLoading ? <FaSpinner className={styles.spinner} /> : "Preview"}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Preview table */}
                    <div className={bulkStyles.previewSection}>
                        <div className={bulkStyles.previewHeader}>
                            <h3>
                                Preview ({previewStats.total} student{previewStats.total !== 1 ? "s" : ""} match)
                            </h3>
                            {previewStats.total > 0 && (
                                <span className={bulkStyles.previewNote}>
                                    Showing first {Math.min(previewPagination.total_count, previewPagination.page_size)} records
                                </span>
                            )}
                        </div>

                        {previewLoading ? (
                            <div className={styles.loadingOverlay}>
                                <FaSpinner className={styles.loadingSpinner} />
                                <p>Loading preview...</p>
                            </div>
                        ) : previewStudents.length === 0 ? (
                            <div className={styles.emptyState}>
                                <FaExclamationTriangle size={24} />
                                <p>No students match the selected filters</p>
                            </div>
                        ) : (
                            <div className={styles.tableWrapper}>
                                <table className={styles.dataTable}>
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th className={styles.hideOnMobile}>Email</th>
                                            <th>Grade</th>
                                            <th className={styles.hideOnMobile}>Section</th>
                                            <th className={styles.hideOnMobile}>Field</th>
                                            <th>Attendance</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewStudents.map((student) => (
                                            <tr key={student.id}>
                                                <td>
                                                    <div className={styles.studentCell}>
                                                        {student.profile_pic_url ? (
                                                            <img
                                                                src={student.profile_pic_url}
                                                                alt={student.full_name}
                                                                className={styles.profileImage}
                                                                onError={(e) => {
                                                                    e.target.style.display = "none";
                                                                    e.target.nextElementSibling.style.display = "flex";
                                                                }}
                                                            />
                                                        ) : null}
                                                        <div
                                                            className={styles.avatarPlaceholder}
                                                            style={{ display: student.profile_pic_url ? "none" : "flex" }}
                                                        >
                                                            {student.full_name?.charAt(0) || "?"}
                                                        </div>
                                                        <span>{student.full_name}</span>
                                                    </div>
                                                </td>
                                                <td className={styles.hideOnMobile}>{student.email}</td>
                                                <td>{student.grade || "N/A"}</td>
                                                <td className={styles.hideOnMobile}>{student.section || "N/A"}</td>
                                                <td className={styles.hideOnMobile}>{student.field || "N/A"}</td>
                                                <td>
                                                    <div className={styles.attendanceProgress}>
                                                        <div className={styles.progressBar} style={{ width: "60px" }}>
                                                            <div
                                                                className={styles.progressFill}
                                                                style={{
                                                                    width: `${Math.min(student.attendance?.attendance_percentage || 0, 100)}%`,
                                                                    backgroundColor: getAttendanceRatingColor(student.attendance?.attendance_rating)
                                                                }}
                                                            />
                                                        </div>
                                                        <span>{student.attendance?.attendance_percentage || 0}%</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`${styles.statusBadge} ${student.account_status === "active" ? styles.activeBadge : styles.inactiveBadge}`}>
                                                        {student.account_status === "active" ? <FaCheckCircle /> : <FaTimesCircle />}
                                                        {student.account_status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Simple pagination */}
                        {previewPagination.total_pages > 1 && (
                            <div className={styles.pagination} style={{ marginTop: "1rem" }}>
                                <div className={styles.paginationInfo}>
                                    Page {previewPagination.current_page} of {previewPagination.total_pages}
                                </div>
                                <div className={styles.paginationControls}>
                                    <button
                                        onClick={() => fetchPreview(previewPagination.current_page - 1)}
                                        disabled={previewPagination.current_page === 1 || previewLoading}
                                        className={styles.paginationButton}
                                    >
                                        <FaChevronLeft />
                                    </button>
                                    <button
                                        onClick={() => fetchPreview(previewPagination.current_page + 1)}
                                        disabled={previewPagination.current_page === previewPagination.total_pages || previewLoading}
                                        className={styles.paginationButton}
                                    >
                                        <FaChevronRight />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action buttons with ConfirmAction */}
                    {previewStats.total > 0 && (
                        <div className={bulkStyles.actionBar}>
                            <ConfirmAction
                                title="Delete Students"
                                message={`Are you sure you want to delete ${previewStats.total} student(s)? This action cannot be undone.`}
                                confirmText="Delete"
                                onConfirm={confirmDelete}
                            >
                                <button
                                    disabled={deleting || updating}
                                    className={bulkStyles.deleteButton}
                                >
                                    {deleting ? <FaSpinner className={styles.spinner} /> : <FaTrash />}
                                    Delete {previewStats.total} Student(s)
                                </button>
                            </ConfirmAction>

                            <button
                                onClick={() => setShowUpdateForm(!showUpdateForm)}
                                disabled={deleting || updating}
                                className={bulkStyles.updateButton}
                            >
                                <FaEdit />
                                {showUpdateForm ? "Hide Update Form" : "Update Students"}
                            </button>
                        </div>
                    )}

                    {/* Update form */}
                    {showUpdateForm && previewStats.total > 0 && (
                        <div className={bulkStyles.updateForm}>
                            <h3>Bulk Update Fields</h3>
                            <p className={bulkStyles.formNote}>
                                Leave fields empty to keep current values.
                            </p>
                            <div className={bulkStyles.formGrid}>
                                <div className={bulkStyles.formGroup}>
                                    <label><FaGraduationCap /> Grade</label>
                                    <input
                                        type="number"
                                        value={updateData.grade}
                                        onChange={(e) => setUpdateData({ ...updateData, grade: e.target.value })}
                                        placeholder="e.g. 10"
                                    />
                                </div>
                                <div className={bulkStyles.formGroup}>
                                    <label>Section</label>
                                    <input
                                        type="text"
                                        value={updateData.section}
                                        onChange={(e) => setUpdateData({ ...updateData, section: e.target.value.toUpperCase() })}
                                        placeholder="e.g. A"
                                        maxLength="1"
                                    />
                                </div>
                                <div className={bulkStyles.formGroup}>
                                    <label><FaCode /> Field</label>
                                    <select
                                        value={updateData.field}
                                        onChange={(e) => setUpdateData({ ...updateData, field: e.target.value })}
                                    >
                                        <option value="">-- No change --</option>
                                        {FIELD_LIST.map(f => (
                                            <option key={f} value={f}>{f}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className={bulkStyles.formGroup}>
                                    <label><FaIdCard /> Account</label>
                                    <input
                                        type="text"
                                        value={updateData.account}
                                        onChange={(e) => setUpdateData({ ...updateData, account: e.target.value })}
                                        placeholder="Account number (optional)"
                                    />
                                </div>
                                <div className={bulkStyles.formGroup}>
                                    <label><FaPhone /> Phone Number</label>
                                    <input
                                        type="text"
                                        value={updateData.phone_number}
                                        onChange={(e) => setUpdateData({ ...updateData, phone_number: e.target.value })}
                                        placeholder="Phone number"
                                    />
                                </div>
                                <div className={bulkStyles.formGroup}>
                                    <label>Account Status</label>
                                    <select
                                        value={updateData.is_active}
                                        onChange={(e) => setUpdateData({ ...updateData, is_active: e.target.value })}
                                    >
                                        <option value="">-- No change --</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>
                            <div className={bulkStyles.formActions}>
                                <ConfirmAction
                                    title="Update Students"
                                    message={`Are you sure you want to update ${previewStats.total} student(s) with the provided data?`}
                                    confirmText="Update"
                                    onConfirm={confirmUpdate}
                                >
                                    <button
                                        disabled={updating || deleting}
                                        className={bulkStyles.saveButton}
                                    >
                                        {updating ? <FaSpinner className={styles.spinner} /> : <FaSave />}
                                        Apply Updates
                                    </button>
                                </ConfirmAction>
                                <button
                                    onClick={() => setShowUpdateForm(false)}
                                    className={bulkStyles.cancelButton}
                                    disabled={updating}
                                >
                                    <FaTimes /> Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </SideBar>
        </div>
    );
}