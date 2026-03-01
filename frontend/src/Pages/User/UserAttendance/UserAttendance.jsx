import styles from "./UserAttendance.module.css";
import SideBar from "../../../Components/SideBar/SideBar";
import { useState, useEffect } from "react";
import { useNotifContext } from "../../../Context/NotifContext";
import api from "../../../Utils/api";
import {
    FaCalendarCheck,
    FaClock,
    FaRegCalendarCheck,
    FaRegClock,
    FaRegTimesCircle,
    FaUserMd,
    FaCheckCircle,
    FaTimesCircle,
    FaExclamationTriangle,
    FaCalendarAlt,
    FaHistory,
} from "react-icons/fa";

const UserAttendance = () => {
    const { updatePageTitle } = useNotifContext();
    const [attendances, setAttendances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        present: 0,
        absent: 0,
        late: 0,
        special_case: 0,
        total: 0
    });

    useEffect(() => {
        updatePageTitle("My Attendance");
        fetchAttendance();
    }, []);

    const fetchAttendance = async () => {
        try {
            setLoading(true);
            const response = await api.get("api/users/attendance/");
            const data = response.data.attendances;
            setAttendances(data);
            calculateStats(data);
        } catch (error) {
            console.error("Error fetching attendance:", error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (attendanceData) => {
        const stats = {
            present: 0,
            absent: 0,
            late: 0,
            special_case: 0,
            total: attendanceData.length
        };

        attendanceData.forEach(attendance => {
            if (attendance.status === "present") stats.present++;
            else if (attendance.status === "absent") stats.absent++;
            else if (attendance.status === "late") stats.late++;
            else if (attendance.status === "special_case") stats.special_case++;
        });

        setStats(stats);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDateTime = (dateString) => {
        return `${formatDate(dateString)} ${formatTime(dateString)}`;
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "present":
                return <FaCheckCircle className={styles.statusIcon} />;
            case "absent":
                return <FaTimesCircle className={styles.statusIcon} />;
            case "late":
                return <FaClock className={styles.statusIcon} />;
            case "special_case":
                return <FaUserMd className={styles.statusIcon} />;
            default:
                return <FaExclamationTriangle className={styles.statusIcon} />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "present":
                return "#10b981";
            case "absent":
                return "#ef4444";
            case "late":
                return "#f59e0b";
            case "special_case":
                return "#8b5cf6";
            default:
                return "#6b7280";
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case "present":
                return "Present";
            case "absent":
                return "Absent";
            case "late":
                return "Late";
            case "special_case":
                return "Special Case";
            default:
                return "Unknown";
        }
    };

    if (loading) {
        return (
            <div className={styles.UserAttendanceContainer}>
                <SideBar>
                    <div className={styles.loadingContainer}>
                        <div className={styles.spinner}></div>
                        <p>Loading attendance records...</p>
                    </div>
                </SideBar>
            </div>
        );
    }

    return (
        <div className={styles.UserAttendanceContainer}>
            <SideBar>
                <div className={styles.UserAttendance}>
                    {/* Header */}
                    <header className={styles.header}>
                        <div className={styles.headerContent}>
                            <div className={styles.headerText}>
                                <h1>My Attendance</h1>
                                <p className={styles.subtitle}>
                                    View your attendance history and session status
                                </p>
                            </div>
                        </div>
                    </header>

                    {/* Stats Grid */}
                    <div className={styles.statsGrid}>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon} style={{ backgroundColor: "rgba(16, 185, 129, 0.1)" }}>
                                <FaCalendarCheck className={styles.statIconSvg} />
                            </div>
                            <div className={styles.statContent}>
                                <h3>Present</h3>
                                <p className={styles.statValue}>{stats.present}</p>
                                <span className={styles.statTrend}>
                                    {stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}% of total
                                </span>
                            </div>
                        </div>

                        <div className={styles.statCard}>
                            <div className={styles.statIcon} style={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}>
                                <FaTimesCircle className={styles.statIconSvg} />
                            </div>
                            <div className={styles.statContent}>
                                <h3>Absent</h3>
                                <p className={styles.statValue}>{stats.absent}</p>
                                <span className={styles.statTrend}>
                                    {stats.total > 0 ? Math.round((stats.absent / stats.total) * 100) : 0}% of total
                                </span>
                            </div>
                        </div>

                        <div className={styles.statCard}>
                            <div className={styles.statIcon} style={{ backgroundColor: "rgba(245, 158, 11, 0.1)" }}>
                                <FaClock className={styles.statIconSvg} />
                            </div>
                            <div className={styles.statContent}>
                                <h3>Late</h3>
                                <p className={styles.statValue}>{stats.late}</p>
                                <span className={styles.statTrend}>
                                    {stats.total > 0 ? Math.round((stats.late / stats.total) * 100) : 0}% of total
                                </span>
                            </div>
                        </div>

                        <div className={styles.statCard}>
                            <div className={styles.statIcon} style={{ backgroundColor: "rgba(139, 92, 246, 0.1)" }}>
                                <FaUserMd className={styles.statIconSvg} />
                            </div>
                            <div className={styles.statContent}>
                                <h3>Total Sessions</h3>
                                <p className={styles.statValue}>{stats.total}</p>
                                <span className={styles.statTrend}>
                                    All attendance records
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Attendance List */}
                    <div className={styles.attendanceSection}>
                        <div className={styles.sectionHeader}>
                            <div className={styles.sectionTitle}>
                                <FaHistory className={styles.sectionIcon} />
                                <h2>Attendance History</h2>
                            </div>
                            <div className={styles.sectionInfo}>
                                <span className={styles.infoBadge}>
                                    {attendances.length} records
                                </span>
                            </div>
                        </div>

                        {attendances.length === 0 ? (
                            <div className={styles.emptyState}>
                                <FaCalendarAlt className={styles.emptyIcon} />
                                <h3>No Attendance Records</h3>
                                <p>Your attendance records will appear here once you attend sessions.</p>
                            </div>
                        ) : (
                            <div className={styles.attendanceList}>
                                {attendances.map((attendance) => (
                                    <div key={attendance.id} className={styles.attendanceCard}>
                                        <div
                                            className={styles.cardHeader}
                                            style={{ borderLeftColor: getStatusColor(attendance.status) }}
                                        >
                                            <div className={styles.sessionInfo}>
                                                <h3 className={styles.sessionTitle}>
                                                    {attendance.session.title}
                                                </h3>
                                                <div className={styles.sessionMeta}>
                                                    <span className={styles.sessionDate}>
                                                        <FaCalendarAlt className={styles.metaIcon} />
                                                        {formatDate(attendance.session.created_at)}
                                                    </span>
                                                    <span className={styles.sessionStatus}>
                                                        {attendance.session.is_ended ? (
                                                            <span className={styles.endedBadge}>
                                                                Session Ended
                                                            </span>
                                                        ) : (
                                                            <span className={styles.activeBadge}>
                                                                Active Session
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className={styles.attendanceStatus}>
                                                <div
                                                    className={styles.statusBadge}
                                                    style={{
                                                        backgroundColor: `${getStatusColor(attendance.status)}20`,
                                                        color: getStatusColor(attendance.status),
                                                        borderColor: `${getStatusColor(attendance.status)}40`
                                                    }}
                                                >
                                                    {getStatusIcon(attendance.status)}
                                                    <span>{getStatusLabel(attendance.status)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className={styles.cardContent}>
                                            <div className={styles.infoGrid}>
                                                <div className={styles.infoItem}>
                                                    <div className={styles.infoLabel}>
                                                        <FaCalendarCheck className={styles.infoIcon} />
                                                        <span>Session Date</span>
                                                    </div>
                                                    <div className={styles.infoValue}>
                                                        {formatDate(attendance.session.created_at)}
                                                    </div>
                                                </div>
                                                <div className={styles.infoItem}>
                                                    <div className={styles.infoLabel}>
                                                        <FaClock className={styles.infoIcon} />
                                                        <span>Attended At</span>
                                                    </div>
                                                    <div className={styles.infoValue}>
                                                        {formatDateTime(attendance.attended_at)}
                                                    </div>
                                                </div>
                                                <div className={styles.infoItem}>
                                                    <div className={styles.infoLabel}>
                                                        <FaRegClock className={styles.infoIcon} />
                                                        <span>Session Status</span>
                                                    </div>
                                                    <div className={styles.infoValue}>
                                                        {attendance.session.is_ended ? (
                                                            <span className={styles.endedText}>Ended</span>
                                                        ) : (
                                                            <span className={styles.activeText}>Active</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className={styles.infoItem}>
                                                    <div className={styles.infoLabel}>
                                                        <FaRegCalendarCheck className={styles.infoIcon} />
                                                        <span>Record ID</span>
                                                    </div>
                                                    <div className={styles.infoValue}>
                                                        #{attendance.id}
                                                    </div>
                                                </div>
                                            </div>

                                            {attendance.note && (
                                                <div className={styles.noteSection}>
                                                    <div className={styles.noteLabel}>
                                                        <FaExclamationTriangle className={styles.noteIcon} />
                                                        <span>Note</span>
                                                    </div>
                                                    <div className={styles.noteText}>
                                                        {attendance.note}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </SideBar>
        </div>
    );
};

export default UserAttendance;