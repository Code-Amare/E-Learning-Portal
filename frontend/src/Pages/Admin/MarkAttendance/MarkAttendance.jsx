import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useUser } from "../../../Context/UserContext";
import api from "../../../Utils/api";
import SideBar from "../../../Components/SideBar/SideBar";
import {
    FaArrowLeft,
    FaUser,
    FaEnvelope,
    FaCheckCircle,
    FaTimesCircle,
    FaExclamationCircle,
    FaClock,
    FaFilter,
    FaSearch,
    FaSave,
    FaTimes,
    FaCalendarAlt,
    FaStickyNote
} from "react-icons/fa";
import styles from "./MarkAttendance.module.css";
import { neonToast } from "../../../Components/NeonToast/NeonToast";
import { useNotifContext } from "../../../Context/NotifContext";

export default function MarkAttendance() {
    const navigate = useNavigate();
    const { sessionId } = useParams();
    const { updatePageTitle } = useNotifContext()
    useEffect(() => {
        updatePageTitle("Mark Attendance")
    }, [])

    const [session, setSession] = useState(null);
    const [existingAttendances, setExistingAttendances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Filter states
    const [filters, setFilters] = useState({
        field: "",
        grade: "",
        section: ""
    });
    const [searchTerm, setSearchTerm] = useState("");

    // Attendance status states for each user
    const [attendanceStatus, setAttendanceStatus] = useState({});
    const [attendanceNotes, setAttendanceNotes] = useState({});

    // Bulk actions
    const [bulkStatus, setBulkStatus] = useState("present");
    const [bulkNote, setBulkNote] = useState("");
    const [selectedUsers, setSelectedUsers] = useState(new Set());

    useEffect(() => {
        const fetchSessionDetail = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/api/attendance/sessions/${sessionId}/`);
                const sessionData = res.data.session;
                const attendancesData = res.data.attendances || [];


                // Check if session is ended
                if (sessionData.is_ended) {
                    setError("This session has been closed. You cannot mark attendance.");
                }

                setSession(sessionData);
                setExistingAttendances(attendancesData);

                // Initialize attendance status from existing attendances
                const initialStatus = {};
                const initialNotes = {};

                if (sessionData.users) {
                    // First, set all users to "absent" as default
                    sessionData.users.forEach(user => {
                        initialStatus[user.id] = "absent";
                        initialNotes[user.id] = "";
                    });

                    // Then, override with existing attendance data if available
                    attendancesData.forEach(attendance => {
                        if (attendance.user && attendance.user.id) {
                            initialStatus[attendance.user.id] = attendance.status;
                            initialNotes[attendance.user.id] = attendance.note || "";
                        }
                    });
                }

                setAttendanceStatus(initialStatus);
                setAttendanceNotes(initialNotes);

            } catch (error) {
                console.error("Error fetching session:", error);
                setError("Failed to load session details.");
            } finally {
                setLoading(false);
            }
        };

        fetchSessionDetail();
    }, [sessionId]);

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

    // Create a map of existing attendances for quick lookup
    const existingAttendanceMap = useMemo(() => {
        const map = {};
        existingAttendances.forEach(attendance => {
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
    }, [existingAttendances]);

    // Filter users
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

    const handleAttendanceChange = (userId, status) => {
        setAttendanceStatus(prev => ({
            ...prev,
            [userId]: status
        }));

        // Clear note if not special_case
        if (status !== "special_case") {
            setAttendanceNotes(prev => ({
                ...prev,
                [userId]: ""
            }));
        }
    };

    const handleNoteChange = (userId, note) => {
        setAttendanceNotes(prev => ({
            ...prev,
            [userId]: note
        }));
    };

    const toggleUserSelection = (userId) => {
        const newSelected = new Set(selectedUsers);
        if (newSelected.has(userId)) {
            newSelected.delete(userId);
        } else {
            newSelected.add(userId);
        }
        setSelectedUsers(newSelected);
    };

    const selectAllFiltered = () => {
        if (selectedUsers.size === filteredUsers.length && filteredUsers.length > 0) {
            setSelectedUsers(new Set());
        } else {
            const allIds = new Set(filteredUsers.map(user => user.id));
            setSelectedUsers(allIds);
        }
    };

    const applyBulkStatus = () => {
        const newStatus = { ...attendanceStatus };
        const newNotes = { ...attendanceNotes };

        selectedUsers.forEach(userId => {
            newStatus[userId] = bulkStatus;
            if (bulkStatus === "special_case") {
                newNotes[userId] = bulkNote;
            } else {
                newNotes[userId] = "";
            }
        });

        setAttendanceStatus(newStatus);
        setAttendanceNotes(newNotes);
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "present":
                return <FaCheckCircle className={styles.statusPresent} />;
            case "absent":
                return <FaTimesCircle className={styles.statusAbsent} />;
            case "late":
                return <FaClock className={styles.statusLate} />;
            case "special_case":
                return <FaExclamationCircle className={styles.statusSpecial} />;
            default:
                return null;
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case "present": return "Present";
            case "absent": return "Absent";
            case "late": return "Late";
            case "special_case": return "Special Case";
            default: return "Absent";
        }
    };

    const validateAttendances = () => {
        const errors = [];

        // Check for special_case without note
        Object.keys(attendanceStatus).forEach(userId => {
            if (attendanceStatus[userId] === "special_case") {
                const note = attendanceNotes[userId] || "";
                if (!note.trim()) {
                    errors.push(`User ${userId} has special_case status but no note provided`);
                }
            }
        });

        return errors;
    };

    const handleSubmit = async () => {
        if (!session || session.is_ended) {
            setError("Session is closed. Cannot mark attendance.");
            return;
        }

        // Validate special_case notes
        const validationErrors = validateAttendances();
        if (validationErrors.length > 0) {
            setError(validationErrors.join(", "));
            return;
        }

        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const attendances = [];

            // Create attendance array for all users in session
            session.users.forEach(user => {
                const status = attendanceStatus[user.id] || "absent";
                const attendanceData = {
                    user: user.id,
                    status: status
                };

                // Add note only if provided (for special_case)
                const note = attendanceNotes[user.id];
                if (note && note.trim()) {
                    attendanceData.note = note.trim();
                }

                attendances.push(attendanceData);
            });

            const response = await api.post(`/api/attendance/${sessionId}/`, {
                attendances: attendances
            });

            setSuccess(`Attendance marked successfully! Created: ${response.data.created?.length || 0}, Updated: ${response.data.updated?.length || 0}`);
            neonToast.success("Attendance marked successfully!")
            navigate(`/admin/session/${sessionId}`)

        } catch (error) {
            if (error.response?.data?.error) {
                setError(`Error: ${error.response.data.error}`);
            } else if (error.response?.data?.errors) {
                // Handle field-level validation errors
                const errorMessages = Object.entries(error.response.data.errors)
                    .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
                    .join('; ');
                setError(`Validation error: ${errorMessages}`);
            } else {
                setError("Failed to mark attendance. Please try again.");
            }
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        navigate(-1);
    };

    // Get stats for current selections
    const getStats = () => {
        const stats = {
            present: 0,
            absent: 0,
            late: 0,
            special_case: 0,
            total: session?.users?.length || 0,
            already_marked: existingAttendances.length || 0
        };

        Object.values(attendanceStatus).forEach(status => {
            if (stats[status] !== undefined) {
                stats[status]++;
            }
        });

        return stats;
    };

    const stats = getStats();

    // Check if user has existing attendance
    const hasExistingAttendance = (userId) => {
        return existingAttendanceMap[userId] !== undefined;
    };

    // Check if attendance has been modified from existing
    const isAttendanceModified = (userId) => {
        const existing = existingAttendanceMap[userId];
        if (!existing) return false;

        return attendanceStatus[userId] !== existing.status ||
            attendanceNotes[userId] !== existing.note;
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
                        <Link to={`/admin/session/${sessionId}`} className={styles.backButton}>
                            <FaArrowLeft />
                            <span>Back to Sessions</span>
                        </Link>
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
                            <Link to={`/admin/session/${sessionId}`} className={styles.backButton}>
                                <FaArrowLeft />
                            </Link>
                            <div>
                                <h1>Mark Attendance</h1>
                                <p className={styles.sessionMeta}>
                                    <span>{session.title}</span>
                                    <span>•</span>
                                    <span>ID: {session.id}</span>
                                    {session.is_ended && (
                                        <>
                                            <span>•</span>
                                            <span className={styles.closedBadge}>CLOSED</span>
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className={styles.headerActions}>
                            <button
                                onClick={handleCancel}
                                className={styles.secondaryBtn}
                                disabled={saving}
                            >
                                <FaTimes />
                                <span>Cancel</span>
                            </button>

                            <button
                                onClick={handleSubmit}
                                className={styles.primaryBtn}
                                disabled={saving || session.is_ended}
                            >
                                <FaSave />
                                <span>{saving ? "Saving..." : "Save Attendance"}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Error & Success Messages */}
                {error && (
                    <div className={styles.errorAlert}>
                        <FaTimesCircle />
                        <span>{error}</span>
                        <button onClick={() => setError("")}>×</button>
                    </div>
                )}

                {success && (
                    <div className={styles.successAlert}>
                        <FaCheckCircle />
                        <span>{success}</span>
                    </div>
                )}

                {/* Session Warning */}
                {session.is_ended && (
                    <div className={styles.warningAlert}>
                        <FaTimesCircle />
                        <span>This session is closed. You cannot mark attendance.</span>
                    </div>
                )}

                {/* Stats Summary */}
                <div className={styles.statsSummary}>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>Total</span>
                        <span className={styles.statValue}>{stats.total}</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>Already Marked</span>
                        <span className={styles.statValueMarked}>{stats.already_marked}</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>Present</span>
                        <span className={styles.statValuePresent}>{stats.present}</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>Absent</span>
                        <span className={styles.statValueAbsent}>{stats.absent}</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>Late</span>
                        <span className={styles.statValueLate}>{stats.late}</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>Special</span>
                        <span className={styles.statValueSpecial}>{stats.special_case}</span>
                    </div>
                </div>

                {/* Bulk Actions */}
                <div className={styles.bulkActions}>
                    <div className={styles.bulkHeader}>
                        <h3>Bulk Actions</h3>
                        <div className={styles.bulkHeaderActions}>
                            <span className={styles.selectedCount}>
                                Selected: {selectedUsers.size}
                            </span>
                            <button
                                onClick={selectAllFiltered}
                                className={styles.selectAllBtn}
                                disabled={filteredUsers.length === 0}
                            >
                                {selectedUsers.size === filteredUsers.length && filteredUsers.length > 0
                                    ? "Deselect All"
                                    : "Select All Filtered"}
                            </button>
                        </div>
                    </div>

                    <div className={styles.bulkControls}>
                        <div className={styles.bulkStatus}>
                            <span>Set status for selected:</span>
                            <select
                                value={bulkStatus}
                                onChange={(e) => setBulkStatus(e.target.value)}
                                className={styles.statusSelect}
                            >
                                <option value="present">Present</option>
                                <option value="absent">Absent</option>
                                <option value="late">Late</option>
                                <option value="special_case">Special Case</option>
                            </select>

                            {bulkStatus === "special_case" && (
                                <div className={styles.bulkNote}>
                                    <FaStickyNote />
                                    <input
                                        type="text"
                                        placeholder="Note for special case..."
                                        value={bulkNote}
                                        onChange={(e) => setBulkNote(e.target.value)}
                                        className={styles.noteInput}
                                    />
                                </div>
                            )}

                            <button
                                onClick={applyBulkStatus}
                                className={styles.applyBtn}
                                disabled={selectedUsers.size === 0 || session.is_ended}
                            >
                                Apply to Selected
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className={styles.filterSection}>
                    <div className={styles.filterHeader}>
                        <FaFilter />
                        <h3>Filter Users</h3>
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
                                disabled={session.is_ended}
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
                                disabled={session.is_ended}
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
                                disabled={session.is_ended}
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
                                disabled={session.is_ended}
                            />
                        </div>
                    </div>
                </div>

                {/* Users List */}
                <div className={styles.usersSection}>
                    <div className={styles.sectionHeader}>
                        <h3>Users ({filteredUsers.length})</h3>
                        <div className={styles.sectionSubtitle}>
                            <span className={styles.markedIndicator}></span> Already marked • Click card to select • Click status to change
                        </div>
                    </div>

                    {filteredUsers.length === 0 ? (
                        <div className={styles.emptyState}>
                            <FaUser />
                            <p>No users found with current filters</p>
                        </div>
                    ) : (
                        <div className={styles.usersList}>
                            {filteredUsers.map((userData) => {
                                const profile = userData.profile || {};
                                const userStatus = attendanceStatus[userData.id] || "absent";
                                const userNote = attendanceNotes[userData.id] || "";
                                const isSelected = selectedUsers.has(userData.id);
                                const hasExisting = hasExistingAttendance(userData.id);
                                const isModified = isAttendanceModified(userData.id);
                                const existingData = existingAttendanceMap[userData.id];

                                return (
                                    <div
                                        key={userData.id}
                                        className={`${styles.userRow} ${isSelected ? styles.selected : ''} 
                                            ${userStatus === "present" ? styles.rowPresent :
                                                userStatus === "absent" ? styles.rowAbsent :
                                                    userStatus === "late" ? styles.rowLate :
                                                        styles.rowSpecial}
                                            ${hasExisting && !isModified ? styles.rowMarked : ''}
                                            ${isModified ? styles.rowModified : ''}`}
                                        onClick={(e) => {
                                            // Don't trigger if clicking on interactive elements
                                            if (e.target.tagName === 'SELECT' ||
                                                e.target.tagName === 'TEXTAREA' ||
                                                e.target.tagName === 'INPUT' ||
                                                e.target.closest(`.${styles.statusSelector}`) ||
                                                e.target.closest(`.${styles.noteInput}`)) {
                                                return;
                                            }
                                            !session.is_ended && toggleUserSelection(userData.id);
                                        }}
                                    >
                                        <div className={styles.userInfo}>
                                            <div className={styles.userSelect}>
                                                <div className={`${styles.selectionIndicator} ${isSelected ? styles.selected : ''}`}>
                                                    {isSelected && <FaCheckCircle />}
                                                </div>
                                            </div>

                                            <div className={styles.userAvatar}>
                                                {userData.profile_pic_url ? (
                                                    <img
                                                        src={userData.profile_pic_url}
                                                        alt={userData.full_name}
                                                    />
                                                ) : (
                                                    <FaUser />
                                                )}
                                                {hasExisting && (
                                                    <div className={styles.existingBadge} title="Already marked">
                                                        ✓
                                                    </div>
                                                )}
                                            </div>

                                            <div className={styles.userDetails}>
                                                <div className={styles.userName}>
                                                    {userData.full_name}
                                                    {hasExisting && (
                                                        <span className={styles.existingLabel}>
                                                            (Already marked)
                                                        </span>
                                                    )}
                                                </div>
                                                <div className={styles.userEmail}>
                                                    <FaEnvelope />
                                                    <span>{userData.email}</span>
                                                </div>
                                                <div className={styles.userProfile}>
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
                                                {hasExisting && existingData?.attended_at && (
                                                    <div className={styles.attendedAt}>
                                                        Last marked: {new Date(existingData.attended_at).toLocaleString()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className={styles.attendanceControls}>
                                            <div
                                                className={styles.statusSelector}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <select
                                                    value={userStatus}
                                                    onChange={(e) => handleAttendanceChange(userData.id, e.target.value)}
                                                    className={styles.statusSelect}
                                                    disabled={session.is_ended}
                                                >
                                                    <option value="present">Present</option>
                                                    <option value="absent">Absent</option>
                                                    <option value="late">Late</option>
                                                    <option value="special_case">Special Case</option>
                                                </select>
                                                <div className={styles.statusIcon}>
                                                    {getStatusIcon(userStatus)}
                                                </div>
                                            </div>

                                            {userStatus === "special_case" && (
                                                <div
                                                    className={styles.noteInput}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <div className={styles.noteHeader}>
                                                        <FaStickyNote />
                                                        <span>Note (Required):</span>
                                                    </div>
                                                    <textarea
                                                        placeholder="Enter note explaining the special case..."
                                                        value={userNote}
                                                        onChange={(e) => handleNoteChange(userData.id, e.target.value)}
                                                        className={styles.noteTextarea}
                                                        disabled={session.is_ended}
                                                        rows="2"
                                                        required
                                                    />
                                                    {!userNote.trim() && (
                                                        <div className={styles.noteError}>
                                                            Note is required for Special Case
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className={styles.currentStatus}>
                                            <div className={`${styles.statusBadge} 
                                                ${userStatus === "present" ? styles.badgePresent :
                                                    userStatus === "absent" ? styles.badgeAbsent :
                                                        userStatus === "late" ? styles.badgeLate :
                                                            styles.badgeSpecial}
                                                ${hasExisting ? styles.badgeExisting : ''}`}>
                                                {getStatusIcon(userStatus)}
                                                <span>{getStatusLabel(userStatus)}</span>
                                                {hasExisting && (
                                                    <span className={styles.existingDot}></span>
                                                )}
                                            </div>
                                            {isModified && (
                                                <div className={styles.modifiedIndicator}>
                                                    Modified
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Bottom Actions */}
                <div className={styles.bottomActions}>
                    <div className={styles.actionStats}>
                        <div className={styles.statBadge}>
                            <div className={styles.statIconMarked}></div>
                            <span>Marked: {stats.already_marked}</span>
                        </div>
                        <div className={styles.statBadge}>
                            <FaCheckCircle className={styles.statIconPresent} />
                            <span>Present: {stats.present}</span>
                        </div>
                        <div className={styles.statBadge}>
                            <FaTimesCircle className={styles.statIconAbsent} />
                            <span>Absent: {stats.absent}</span>
                        </div>
                        <div className={styles.statBadge}>
                            <FaClock className={styles.statIconLate} />
                            <span>Late: {stats.late}</span>
                        </div>
                        <div className={styles.statBadge}>
                            <FaExclamationCircle className={styles.statIconSpecial} />
                            <span>Special: {stats.special_case}</span>
                        </div>
                    </div>

                    <div className={styles.actionButtons}>
                        <button
                            onClick={handleCancel}
                            className={styles.secondaryBtn}
                            disabled={saving}
                        >
                            <FaTimes />
                            <span>Cancel</span>
                        </button>

                        <button
                            onClick={handleSubmit}
                            className={styles.primaryBtn}
                            disabled={saving || session.is_ended}
                        >
                            <FaSave />
                            <span>{saving ? "Saving..." : `Save Attendance (${stats.total} users)`}</span>
                        </button>
                    </div>
                </div>
            </SideBar>
        </div>
    );
}