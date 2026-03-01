import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../../../Context/UserContext";
import api from "../../../Utils/api";
import SideBar from "../../../Components/SideBar/SideBar";
import {
    FaUsers,
    FaUserPlus,
    FaSpinner,
    FaExclamationTriangle,
    FaChevronLeft,
    FaChevronRight,
    FaSearch,
    FaFilter,
    FaSort,
    FaGraduationCap,
    FaUserCheck,
    FaUserSlash,
    FaDownload,
    FaCode,
    FaPhone,
    FaUserTie,
} from "react-icons/fa";
import { neonToast } from "../../../Components/NeonToast/NeonToast";
import styles from "./AdminList.module.css";
import { useNotifContext } from "../../../Context/NotifContext";

export default function AdminList() {
    const { user } = useUser();
    const navigate = useNavigate();
    const { updatePageTitle } = useNotifContext();

    useEffect(() => {
        if (!user?.isSuperUser) {
            navigate(-1)
        }
        updatePageTitle("Administrators");
    }, []);


    // Data states
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [adminsLoading, setAdminsLoading] = useState(false);

    // Stats
    const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });

    // Filtering & sorting (client‑side)
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
    const [sortConfig, setSortConfig] = useState({
        key: "full_name",
        direction: "asc",
    });
    const [showFilters, setShowFilters] = useState(false);

    // Pagination
    const [pagination, setPagination] = useState({
        current_page: 1,
        page_size: 10,
    });

    // Export loading
    const [exporting, setExporting] = useState(false);

    // Redirect if not authenticated
    useEffect(() => {
        if (user.isAuthenticated === null) return;
        if (!user.isAuthenticated) {
            navigate("/login");
            return;
        }
        fetchAdmins();
    }, [user, navigate]);

    // Fetch all admins from the API
    const fetchAdmins = async () => {
        setAdminsLoading(true);
        setLoading(true);
        try {
            const response = await api.get("/api/management/admins/");
            const data = response.data.admins || [];

            setAdmins(data);

            // Derive filter options
            const grades = [...new Set(data.map(a => a.profile?.grade).filter(Boolean))].sort();
            const sections = [...new Set(data.map(a => a.profile?.section).filter(Boolean))].sort();
            const fields = [...new Set(data.map(a => a.profile?.field).filter(Boolean))].sort();

            setFilterOptions({ grades, sections, fields });

            // Stats
            const activeCount = data.filter(a => a.is_active).length;
            setStats({
                total: data.length,
                active: activeCount,
                inactive: data.length - activeCount,
            });
        } catch (error) {
            console.error("Error fetching admins:", error);
            neonToast.error("Failed to load administrators", "error");
        } finally {
            setAdminsLoading(false);
            setLoading(false);
        }
    };

    // Filter and sort
    const filteredAndSortedAdmins = useMemo(() => {
        let result = [...admins];

        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            result = result.filter(
                admin =>
                    admin.full_name?.toLowerCase().includes(searchLower) ||
                    admin.email?.toLowerCase().includes(searchLower)
            );
        }
        if (filters.grade) {
            result = result.filter(admin => admin.profile?.grade == filters.grade);
        }
        if (filters.section) {
            result = result.filter(admin => admin.profile?.section === filters.section);
        }
        if (filters.field) {
            result = result.filter(admin => admin.profile?.field === filters.field);
        }
        if (filters.accountStatus) {
            const isActive = filters.accountStatus === "active";
            result = result.filter(admin => admin.is_active === isActive);
        }

        // Sorting
        if (sortConfig.key) {
            result.sort((a, b) => {
                let aVal, bVal;
                if (sortConfig.key === "full_name") {
                    aVal = a.full_name || "";
                    bVal = b.full_name || "";
                } else if (sortConfig.key === "email") {
                    aVal = a.email || "";
                    bVal = b.email || "";
                } else if (sortConfig.key === "role") {
                    aVal = a.is_superuser ? "Admin" : "Staff";
                    bVal = b.is_superuser ? "Admin" : "Staff";
                } else if (sortConfig.key === "grade") {
                    aVal = a.profile?.grade || 0;
                    bVal = b.profile?.grade || 0;
                } else if (sortConfig.key === "section") {
                    aVal = a.profile?.section || "";
                    bVal = b.profile?.section || "";
                } else if (sortConfig.key === "field") {
                    aVal = a.profile?.field || "";
                    bVal = b.profile?.field || "";
                } else if (sortConfig.key === "account_status") {
                    aVal = a.is_active ? "active" : "inactive";
                    bVal = b.is_active ? "active" : "inactive";
                } else {
                    return 0;
                }

                if (typeof aVal === "string") aVal = aVal.toLowerCase();
                if (typeof bVal === "string") bVal = bVal.toLowerCase();

                if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [admins, filters, sortConfig]);

    // Paginate
    const paginatedAdmins = useMemo(() => {
        const start = (pagination.current_page - 1) * pagination.page_size;
        return filteredAndSortedAdmins.slice(start, start + pagination.page_size);
    }, [filteredAndSortedAdmins, pagination]);

    const totalPages = Math.ceil(filteredAndSortedAdmins.length / pagination.page_size);

    // Handlers
    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setPagination(prev => ({ ...prev, current_page: page }));
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, current_page: 1 }));
    };

    const handleSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
        setPagination(prev => ({ ...prev, current_page: 1 }));
    };

    const handleSearch = () => {
        setPagination(prev => ({ ...prev, current_page: 1 }));
    };

    const handleClearFilters = () => {
        setFilters({
            search: "",
            grade: "",
            section: "",
            field: "",
            accountStatus: "",
        });
        setSortConfig({ key: "full_name", direction: "asc" });
        setPagination(prev => ({ ...prev, current_page: 1 }));
    };

    const handleExport = () => {
        setExporting(true);
        try {
            const headers = ["Name", "Email", "Role", "Grade", "Section", "Field", "Phone", "Status"];
            const rows = filteredAndSortedAdmins.map(admin => [
                admin.full_name,
                admin.email,
                admin.is_superuser ? "Admin" : "Staff",
                admin.profile?.grade || "",
                admin.profile?.section || "",
                admin.profile?.field || "",
                admin.profile?.phone_number || "",
                admin.is_active ? "Active" : "Inactive",
            ]);

            const csvContent = [
                headers.join(","),
                ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
            ].join("\n");

            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `admins_export_${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            neonToast.success("Export completed successfully", "success");
        } catch (error) {
            console.error("Export error:", error);
            neonToast.error("Failed to export administrators", "error");
        } finally {
            setExporting(false);
        }
    };

    const getSortIcon = (field) => {
        if (sortConfig.key !== field) return null;
        return <FaSort className={`${styles.sortIcon} ${sortConfig.direction === "asc" ? styles.sortAsc : ""}`} />;
    };

    const handleRowClick = (adminId) => {
        navigate(`/admin/staff/${adminId}`);
    };

    const handleImageError = (e) => {
        e.target.style.display = "none";
        const nextSibling = e.target.nextElementSibling;
        if (nextSibling) {
            nextSibling.style.display = "flex";
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            handleSearch();
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <SideBar>
                    <div className={styles.loadingContainer}>
                        <FaSpinner className={styles.loadingSpinner} />
                        <p>Loading administrators...</p>
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
                                <h1>Administrators</h1>
                                <p>Manage admin & staff accounts</p>
                            </div>
                        </div>

                        <div className={styles.headerActions}>
                            {/* Bulk upload removed – admins are few */}
                            <Link to="/admin/staff/add" className={styles.primaryBtn}>
                                <FaUserPlus />
                                <span>Add Admin</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Stats Cards (unchanged) */}
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={styles.statIconContainer}>
                            <FaUsers className={styles.statIcon} />
                        </div>
                        <div className={styles.statContent}>
                            <h3>Total Admins</h3>
                            <p className={styles.statValue}>{stats.total}</p>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statIconContainer}>
                            <FaUserCheck className={styles.statIcon} />
                        </div>
                        <div className={styles.statContent}>
                            <h3>Active</h3>
                            <p className={styles.statValue}>{stats.active}</p>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statIconContainer}>
                            <FaUserSlash className={styles.statIcon} />
                        </div>
                        <div className={styles.statContent}>
                            <h3>Inactive</h3>
                            <p className={styles.statValue}>{stats.inactive}</p>
                        </div>
                    </div>
                </div>

                {/* Table Card (unchanged except maybe column headers) */}
                <div className={styles.tableCard}>
                    <div className={styles.tableHeader}>
                        <h2>
                            <FaUsers className={styles.tableIcon} /> Administrator Management
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
                                disabled={adminsLoading || exporting}
                            >
                                {exporting ? <FaSpinner className={styles.spinner} /> : <FaDownload />}
                                Export CSV
                            </button>
                            <button
                                onClick={handleClearFilters}
                                className={styles.clearButton}
                                disabled={adminsLoading}
                            >
                                Clear All
                            </button>
                        </div>
                    </div>

                    {/* Filters (unchanged) */}
                    {showFilters && (
                        <div className={styles.filtersSection}>
                            <div className={styles.filterRow}>
                                <div className={styles.filterGroup}>
                                    <label>Search</label>
                                    <div className={styles.searchInput}>
                                        <FaSearch className={styles.searchIcon} />
                                        <input
                                            type="text"
                                            placeholder="Search by name or email..."
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
                                    disabled={adminsLoading}
                                >
                                    {adminsLoading ? <FaSpinner className={styles.spinner} /> : "Apply Filters"}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Table (unchanged) */}
                    <div className={styles.tableWrapper}>
                        <div className={styles.tableContainer}>
                            {adminsLoading ? (
                                <div className={styles.loadingOverlay}>
                                    <FaSpinner className={styles.loadingSpinner} />
                                    <p>Loading administrators...</p>
                                </div>
                            ) : paginatedAdmins.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <FaExclamationTriangle size={24} />
                                    <p>No administrators found</p>
                                    {Object.values(filters).some(val => val !== "") && (
                                        <button onClick={handleClearFilters} className={styles.clearButton}>
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
                                            <th onClick={() => handleSort("role")} className={styles.sortable}>
                                                Role {getSortIcon("role")}
                                            </th>
                                            <th onClick={() => handleSort("grade")} className={styles.sortable}>
                                                Grade {getSortIcon("grade")}
                                            </th>
                                            <th onClick={() => handleSort("section")} className={`${styles.sortable} ${styles.hideOnMobile}`}>
                                                Section {getSortIcon("section")}
                                            </th>
                                            <th onClick={() => handleSort("field")} className={`${styles.sortable} ${styles.hideOnMobile}`}>
                                                Field {getSortIcon("field")}
                                            </th>
                                            <th className={styles.hideOnMobile}>Phone</th>
                                            <th onClick={() => handleSort("account_status")} className={styles.sortable}>
                                                Status {getSortIcon("account_status")}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedAdmins.map((admin) => (
                                            <tr
                                                key={admin.id}
                                                className={styles.clickableRow}
                                                onClick={() => handleRowClick(admin.id)}
                                            >
                                                <td>
                                                    <div className={styles.studentCell}>
                                                        {admin.profile_pic_url ? (
                                                            <img
                                                                src={admin.profile_pic_url}
                                                                alt={admin.full_name}
                                                                className={styles.profileImage}
                                                                onError={handleImageError}
                                                            />
                                                        ) : null}
                                                        <div className={styles.avatarPlaceholder} style={{ display: admin.profile_pic_url ? 'none' : 'flex' }}>
                                                            {admin.full_name?.charAt(0) || '?'}
                                                        </div>
                                                        <div className={styles.studentInfo}>
                                                            <span className={styles.studentName}>{admin.full_name}</span>
                                                            <span className={styles.mobileEmail}>{admin.email}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className={styles.hideOnMobile}>{admin.email}</td>
                                                <td>
                                                    <span className={styles.roleBadge}>
                                                        <FaUserTie className={styles.roleIcon} />
                                                        {admin.is_superuser ? "Admin" : "Staff"}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={styles.gradeBadge}>
                                                        <FaGraduationCap className={styles.gradeIcon} />
                                                        {admin.profile?.grade || "N/A"}
                                                    </span>
                                                </td>
                                                <td className={styles.hideOnMobile}>{admin.profile?.section || "N/A"}</td>
                                                <td className={styles.hideOnMobile}>
                                                    <span className={styles.fieldBadge}>
                                                        <FaCode className={styles.fieldIcon} />
                                                        {admin.profile?.field || "N/A"}
                                                    </span>
                                                </td>
                                                <td className={styles.hideOnMobile}>
                                                    <span className={styles.phoneBadge}>
                                                        <FaPhone className={styles.phoneIcon} />
                                                        {admin.profile?.phone_number || "—"}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`${styles.statusBadge} ${admin.is_active ? styles.activeBadge : styles.inactiveBadge}`}>
                                                        {admin.is_active ? "Active" : "Inactive"}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {filteredAndSortedAdmins.length > 0 && (
                            <div className={styles.pagination}>
                                <div className={styles.paginationInfo}>
                                    Showing {((pagination.current_page - 1) * pagination.page_size) + 1} to{" "}
                                    {Math.min(pagination.current_page * pagination.page_size, filteredAndSortedAdmins.length)} of{" "}
                                    {filteredAndSortedAdmins.length} administrators
                                </div>
                                <div className={styles.paginationControls}>
                                    <button
                                        onClick={() => handlePageChange(pagination.current_page - 1)}
                                        disabled={pagination.current_page === 1 || adminsLoading}
                                        className={styles.paginationButton}
                                    >
                                        <FaChevronLeft /> Previous
                                    </button>
                                    <div className={styles.pageNumbers}>
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let pageNum;
                                            if (totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (pagination.current_page <= 3) {
                                                pageNum = i + 1;
                                            } else if (pagination.current_page >= totalPages - 2) {
                                                pageNum = totalPages - 4 + i;
                                            } else {
                                                pageNum = pagination.current_page - 2 + i;
                                            }
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className={`${styles.pageButton} ${pagination.current_page === pageNum ? styles.activePage : ""}`}
                                                    disabled={adminsLoading}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <button
                                        onClick={() => handlePageChange(pagination.current_page + 1)}
                                        disabled={pagination.current_page === totalPages || adminsLoading}
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
                                            setPagination(prev => ({
                                                ...prev,
                                                page_size: parseInt(e.target.value),
                                                current_page: 1,
                                            }));
                                        }}
                                        disabled={adminsLoading}
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