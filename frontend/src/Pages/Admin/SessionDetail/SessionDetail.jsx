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
    FaClock,
    FaExclamationCircle,
    FaFilter,
    FaSearch,
    FaLock,
    FaUnlock,
    FaEdit,
    FaTrash,
    FaChartBar,
    FaFileExport,
    FaDownload
} from "react-icons/fa";
import styles from "./SessionDetail.module.css";
import { useNotifContext } from "../../../Context/NotifContext";

export default function SessionDetail() {
    const { user } = useUser();
    const navigate = useNavigate();
    const { sessionId } = useParams();
    const { updatePageTitle } = useNotifContext()
    useEffect(() => {
        updatePageTitle("Session Detail")
    }, [])

    const [session, setSession] = useState(null);
    const [attendances, setAttendances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [exporting, setExporting] = useState(false);
    const [exportError, setExportError] = useState("");

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
        fetchSessionDetail();
    }, [user, navigate, sessionId]);

    const fetchSessionDetail = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/api/attendance/sessions/${sessionId}/`);
            const sessionData = res.data.session || res.data;
            const attendancesData = res.data.attendances || [];


            setSession(sessionData);
            setAttendances(attendancesData);
        } catch (error) {
            console.error("Error fetching session:", error);
            setError("Failed to load session details.");
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
    const handleExportSession = async () => {
        if (!session || !session.is_ended) return;

        try {
            setExporting(true);
            setExportError("");

            // Make the API call - backend returns HttpResponse with Excel file
            const response = await api.get(`/api/attendance/session/export/${sessionId}/`, {
                responseType: 'blob'  // Important for binary file download
            });

            // Create a blob from the response
            const blob = new Blob([response.data], {
                type: response.headers['content-type']
            });

            // Create a URL for the blob
            const url = window.URL.createObjectURL(blob);

            // Create a temporary anchor element to trigger download
            const link = document.createElement('a');
            link.href = url;

            // Extract filename from Content-Disposition header or create a default one
            const contentDisposition = response.headers['content-disposition'];
            let filename = `attendance_session_${sessionId}_${session.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;

            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1];
                }
            }

            link.download = filename;

            // Append to body, click, and remove
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Clean up the URL object
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error("Error exporting session:", error);

            if (error.response?.status === 400) {
                if (error.response.data?.detail?.includes("not ended")) {
                    setExportError("Session is not ended. Close the session first before exporting.");
                } else {
                    setExportError(error.response.data?.detail || "Bad request");
                }
            } else if (error.response?.status === 404) {
                setExportError("Session not found");
            } else if (error.response?.status === 403) {
                setExportError("You don't have permission to export this session");
            } else {
                setExportError("Failed to export attendance data. Please try again.");
            }
        } finally {
            setExporting(false);
        }
    };
    const handleCloseSession = async () => {
        try {
            await api.post(`/api/attendance/sessions/close/${sessionId}/`);
            setSession({ ...session, is_ended: true });
        } catch (error) {
            console.error("Error closing session:", error);
            setError("Failed to close session.");
        }
    };

    const handleOpenSession = async () => {
        try {
            await api.post(`/api/attendance/sessions/open/${sessionId}/`);
            setSession({ ...session, is_ended: false });
        } catch (error) {
            console.error("Error opening session:", error);
            setError("Failed to open session.");
        }
    };

    const handleDeleteSession = async () => {
        try {
            await api.delete(`/api/attendance/sessions/${sessionId}/`);
            navigate("/admin/attendance");
        } catch (error) {
            console.error("Error deleting session:", error);
            setError("Failed to delete session.");
        }
    };

    // Create attendance map for quick lookup
    const attendanceMap = useMemo(() => {
        const map = {};
        attendances.forEach(attendance => {
            if (attendance.user && attendance.user.id) {
                map[attendance.user.id] = {
                    status: attendance.status,
                    note: attendance.note || "",
                    attended_at: attendance.attended_at,
                    id: attendance.id
                };
            }
        });
        return map;
    }, [attendances]);

    // Get attendance stats
    const attendanceStats = useMemo(() => {
        const stats = {
            total: session?.users?.length || 0,
            marked: attendances.length || 0,
            present: 0,
            absent: 0,
            late: 0,
            special_case: 0,
            not_marked: 0
        };

        if (session?.users) {
            session.users.forEach(user => {
                const attendance = attendanceMap[user.id];
                if (attendance) {
                    stats[attendance.status]++;
                } else {
                    stats.not_marked++;
                }
            });
        }

        return stats;
    }, [session, attendances, attendanceMap]);

    // Extract filter options from users
    const filterOptions = useMemo(() => {
        if (!session?.users) return { fields: [], grades: [], sections: [] };

        const fields = new Set();
        const grades = new Set();
        const sections = new Set();

        session.users.forEach(user => {
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
    }, [session]);

    // Filter users with attendance status
    const filteredUsers = useMemo(() => {
        if (!session?.users) return [];

        return session.users.filter(userData => {
            const profile = userData.profile || {};

            // Apply search filter
            if (searchTerm.trim()) {
                const searchLower = searchTerm.toLowerCase();
                const matchesSearch =
                    userData.full_name?.toLowerCase().includes(searchLower) ||
                    userData.email?.toLowerCase().includes(searchLower) ||
                    profile.account?.toLowerCase().includes(searchLower);
                if (!matchesSearch) return false;
            }

            // Apply field filter
            if (filters.field && profile.field !== filters.field) return false;

            // Apply grade filter
            if (filters.grade && profile.grade != filters.grade) return false;

            // Apply section filter
            if (filters.section && profile.section !== filters.section) return false;

            return true;
        });
    }, [session, searchTerm, filters]);

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

    // Get attendance status icon
    const getStatusIcon = (status) => {
        switch (status) {
            case "present":
                return <FaCheckCircle />;
            case "absent":
                return <FaTimesCircle />;
            case "late":
                return <FaClock />;
            case "special_case":
                return <FaExclamationCircle />;
            default:
                return null;
        }
    };

    // Get attendance status label
    const getStatusLabel = (status) => {
        switch (status) {
            case "present": return "Present";
            case "absent": return "Absent";
            case "late": return "Late";
            case "special_case": return "Special Case";
            default: return "Not Marked";
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <SideBar>
                    <div className={styles.loadingContainer}>
                        <div className={styles.spinner}></div>
                        <p>Loading session...</p>
                    </div>
                </SideBar>
            </div>
        );
    }

    if (!session) {
        return (
            <div className={styles.container}>
                <SideBar>
                    <div className={styles.errorContainer}>
                        <h3>Session not found</h3>
                        <span onClick={() => { navigate("/admin/attendance") }} className={styles.backButton}>
                            <FaArrowLeft />
                            <span>Back to Sessions</span>
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
                            <span onClick={() => { navigate("/admin/attendance") }} className={styles.backButton}>
                                <FaArrowLeft />
                            </span>
                            <div>
                                <h1>{session.title}</h1>
                                <p className={styles.sessionMeta}>
                                    <span>ID: {session.id}</span>
                                    <span>•</span>
                                    <span>Created: {formatDate(session.created_at)}</span>
                                    <span>•</span>
                                    <span className={session.is_ended ? styles.statusClosed : styles.statusOpen}>
                                        {session.is_ended ? "Closed" : "Open"}
                                    </span>
                                </p>
                            </div>
                        </div>

                        <div className={styles.headerActions}>
                            {/* Export button - only shown when session is ended */}
                            {session.is_ended && (
                                <button
                                    className={styles.exportBtn}
                                    onClick={handleExportSession}
                                    disabled={exporting}
                                >
                                    {exporting ? (
                                        <>
                                            <span className={styles.spinnerSmall}></span>
                                            <span>Exporting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <FaFileExport />
                                            <span>Export</span>
                                        </>
                                    )}
                                </button>
                            )}

                            {!session.is_ended ? (
                                <ConfirmAction
                                    title="Close Session"
                                    message="Are you sure you want to close this session? Unmarked users will be marked absent."
                                    confirmText="Close Session"
                                    onConfirm={handleCloseSession}
                                >
                                    <button className={styles.closeBtn}>
                                        <FaLock />
                                        <span>Close</span>
                                    </button>
                                </ConfirmAction>
                            ) : (
                                <ConfirmAction
                                    title="Reopen Session"
                                    message="Are you sure you want to reopen this session?"
                                    confirmText="Reopen Session"
                                    onConfirm={handleOpenSession}
                                >
                                    <button className={styles.openBtn}>
                                        <FaUnlock />
                                        <span>Open</span>
                                    </button>
                                </ConfirmAction>
                            )}
                            <Link to={`/admin/session/edit/${sessionId}`} className={styles.editBtn}>
                                <FaEdit />
                                <span>Edit</span>
                            </Link>

                            <ConfirmAction
                                title="Delete Session"
                                message="Are you sure you want to delete this session? This action cannot be undone."
                                confirmText="Delete Session"
                                onConfirm={handleDeleteSession}
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

                {/* Export Error */}
                {exportError && (
                    <div className={styles.errorAlert}>
                        <span>{exportError}</span>
                        <button onClick={() => setExportError("")}>×</button>
                    </div>
                )}

                {/* Export Info Banner */}
                {session.is_ended && (
                    <div className={styles.exportInfo}>
                        <FaFileExport className={styles.exportInfoIcon} />
                        <div className={styles.exportInfoContent}>
                            <strong>Session is closed</strong>
                            <p>You can now export attendance data for this session.</p>
                        </div>
                        <button
                            className={styles.exportInfoBtn}
                            onClick={handleExportSession}
                            disabled={exporting}
                        >
                            {exporting ? 'Exporting...' : 'Export Now'}
                        </button>
                    </div>
                )}

                {/* Attendance Stats Summary */}
                <div className={styles.statsSummary}>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>Total Participants</span>
                        <span className={styles.statValue}>{attendanceStats.total}</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>Already Marked</span>
                        <span className={styles.statValueMarked}>{attendanceStats.marked}</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>Not Marked</span>
                        <span className={styles.statValue}>{attendanceStats.not_marked}</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>Present</span>
                        <span className={styles.statValuePresent}>{attendanceStats.present}</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>Absent</span>
                        <span className={styles.statValueAbsent}>{attendanceStats.absent}</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>Late</span>
                        <span className={styles.statValueLate}>{attendanceStats.late}</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>Special Case</span>
                        <span className={styles.statValueSpecial}>{attendanceStats.special_case}</span>
                    </div>
                </div>

                {/* Filters */}
                <div className={styles.filterSection}>
                    <div className={styles.filterHeader}>
                        <FaFilter />
                        <h3>Filter Participants</h3>
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

                {/* Participants */}
                <div className={styles.participantsSection}>
                    <div className={styles.sectionHeader}>
                        <h3>Participants ({filteredUsers.length})</h3>
                        {session.is_ended && (
                            <div className={styles.exportNote}>
                                <FaFileExport className={styles.exportNoteIcon} />
                                <span>Session closed. Export available.</span>
                            </div>
                        )}
                    </div>

                    {filteredUsers.length === 0 ? (
                        <div className={styles.emptyState}>
                            <FaUser />
                            <p>No participants found</p>
                        </div>
                    ) : (
                        <div className={styles.participantsGrid}>
                            {filteredUsers.map((participant) => {
                                const profile = participant.profile || {};
                                const attendance = attendanceMap[participant.id];
                                const status = attendance?.status || "not_marked";

                                return (
                                    <div key={participant.id} className={styles.participantCard}>
                                        <div className={styles.participantAvatar}>
                                            {participant.profile_pic_url ? (
                                                <img
                                                    src={participant.profile_pic_url}
                                                    alt={participant.full_name}
                                                    className={styles.avatarImage}
                                                />
                                            ) : (
                                                <div className={styles.avatarPlaceholder}>
                                                    <FaUser />
                                                </div>
                                            )}
                                        </div>

                                        <div className={styles.participantInfo}>
                                            <div className={styles.participantName}>
                                                {participant.full_name}
                                            </div>
                                            <div className={styles.participantEmail}>
                                                <FaEnvelope />
                                                <span>{participant.email}</span>
                                            </div>

                                            <div className={styles.attendanceStatus}>
                                                <span className={`${styles.attendanceBadge} ${status === "present" ? styles.statusPresent :
                                                    status === "absent" ? styles.statusAbsent :
                                                        status === "late" ? styles.statusLate :
                                                            status === "special_case" ? styles.statusSpecial :
                                                                styles.statusNotMarked
                                                    }`}>
                                                    {getStatusIcon(status)}
                                                    <span>{getStatusLabel(status)}</span>
                                                </span>
                                                {attendance?.attended_at && (
                                                    <span className={styles.attendanceNote}>
                                                        Marked at: {formatDate(attendance.attended_at)}
                                                    </span>
                                                )}
                                                {attendance?.note && (
                                                    <span className={styles.attendanceNote}>
                                                        Note: {attendance.note}
                                                    </span>
                                                )}
                                            </div>

                                            <div className={styles.participantMeta}>
                                                <span className={`${styles.metaBadge} ${participant.email_verified ? styles.verified : styles.unverified}`}>
                                                    {participant.email_verified ? (
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
                                                <span className={`${styles.metaBadge} ${participant.gender === "female" ? styles.female : styles.male}`}>
                                                    {participant.gender}
                                                </span>
                                            </div>
                                            <div className={styles.participantProfile}>
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