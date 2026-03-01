import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useUser } from "../../../Context/UserContext";
import api from "../../../Utils/api";
import { neonToast } from "../../../Components/NeonToast/NeonToast";
import SideBar from "../../../Components/SideBar/SideBar";
import ConfirmAction from "../../../Components/ConfirmAction/ConfirmAction";
import AsyncButton from "../../../Components/AsyncButton/AsyncButton";
import {
    FaArrowLeft, FaUser, FaPhone, FaCalendarAlt, FaEdit, FaTrash,
    FaGraduationCap, FaUsers, FaBook, FaChalkboardTeacher,
    FaChartLine, FaHistory, FaFileAlt, FaStar, FaCheckCircle,
    FaTimesCircle, FaExclamationTriangle, FaTasks, FaCamera,
    FaList // Added for learning tasks button
} from "react-icons/fa";
import {
    MdEmail, MdLocationOn, MdDateRange,
    MdClass, MdGrade, MdAssignment, MdSchool
} from "react-icons/md";
import styles from "./StudentDetail.module.css";
import { useNotifContext } from "../../../Context/NotifContext";

/* ---------------- MOCK DATA (OUTSIDE COMPONENT) ---------------- */
const MOCK_ACTIVITIES = [
    { type: "grade", description: "Math test graded: 88%", timestamp: "2025-01-12T09:30:00" },
    { type: "attendance", description: "Present in morning class", timestamp: "2025-01-11T08:10:00" },
    { type: "task", description: "Submitted Physics assignment", timestamp: "2025-01-10T16:45:00" },
    { type: "system", description: "Profile updated by admin", timestamp: "2025-01-09T14:20:00" }
];

/* ---------------- COMPONENT ---------------- */
export default function StudentDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useUser();
    const { updatePageTitle } = useNotifContext()
    useEffect(() => {
        updatePageTitle("Student Detail")
    }, [])

    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingDelete, setLoadingDelete] = useState(false);

    const [activities] = useState(MOCK_ACTIVITIES);

    useEffect(() => {
        if (user == null) return;
        if (!user?.isAuthenticated) {
            navigate("/login");
            return;
        }

        let mounted = true;
        const fetchStudentDetails = async () => {
            setLoading(true);
            try {
                const response = await api.get(`/api/management/student/${id}/`);

                if (!mounted) return;

                // Handle the nested response structure
                const studentData = response.data.student || response.data;
                setStudent(studentData || null);
            } catch (error) {
                neonToast.error("Failed to load student details", "error");
                navigate("/admin/students");
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchStudentDetails();
        return () => { mounted = false; };
    }, [id, user, navigate]);

    // Helper function to get student data from nested structure
    const getStudentData = () => {
        if (!student) return {};

        // Extract data from the nested structure
        const userData = student.profile?.user || {};
        const profileData = student.profile || {};

        return {
            ...userData,
            ...profileData,
            profile_pic_url: student.profile_pic_url,
            attendance_summary: student.attendance_summary,
            learning_tasks: student.learning_tasks,
            task_limit: student.task_limit,
            // For status, use is_active from user
            account_status: userData.is_active ? "active" : "inactive"
        };
    };

    const handleDelete = async (event, typedName) => {
        if (!student) return false;

        const studentData = getStudentData();

        if (typedName !== studentData.full_name) {
            neonToast.error(
                `The name you typed does not match the student's full name. Please type "${studentData.full_name}" exactly to delete.`,
                "error"
            );
            return false;
        }

        setLoadingDelete(true);
        try {
            await api.delete(`/api/management/student/delete/${id}/`);
            neonToast.success("Student deleted successfully", "success");
            navigate("/admin/students");
            return true;
        } catch (error) {

            if (error.response?.status === 404) {
                neonToast.error("Student not found", "error");
            } else if (error.response?.data?.detail) {
                neonToast.error(error.response.data.detail, "error");
            } else {
                neonToast.error("Failed to delete student", "error");
            }
            return false;
        } finally {
            setLoadingDelete(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return "Not specified";
        try {
            return new Date(date).toLocaleDateString("en-US", {
                year: "numeric", month: "long", day: "numeric"
            });
        } catch {
            return date;
        }
    };

    // Get task limit from student data
    const getTaskLimit = () => {
        if (!student) return 0;

        if (student.task_limit && typeof student.task_limit === 'object') {
            return student.task_limit.limit || 0;
        }

        return student.task_limit || 0;
    };

    // Calculate performance from real data
    const calculatePerformance = () => {
        if (!student) return {
            averageGrade: "N/A",
            completedTasks: 0,
            attendanceRate: 0,
            rank: "N/A"
        };

        const attendanceRate = student.attendance_summary?.status_percentages?.present || 0;
        const completedTasks = student.learning_tasks?.total_created || 0;

        return {
            averageGrade: "N/A", // Not in API
            completedTasks,
            attendanceRate,
            rank: "N/A" // Not in API
        };
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <SideBar>
                    <div className={styles.loadingContainer}>
                        <div className={styles.loadingSpinner} />
                        <p>Loading student details...</p>
                    </div>
                </SideBar>
            </div>
        );
    }

    if (!student) {
        return (
            <div className={styles.container}>
                <SideBar>
                    <div className={styles.notFound}>
                        <h2>Student not found</h2>
                        <p>The student you're looking for doesn't exist.</p>
                        <Link to="/admin/students" className={styles.backBtn}>
                            <FaArrowLeft /> Back to Students
                        </Link>
                    </div>
                </SideBar>
            </div>
        );
    }

    const studentData = getStudentData();
    const performance = calculatePerformance();
    const taskLimit = getTaskLimit();
    const attendanceSummary = student.attendance_summary || {};

    return (
        <div className={styles.container}>
            <SideBar>

                {/* HEADER */}
                <div className={styles.header}>
                    <div className={styles.headerTop}>
                        <Link to="/admin/students" className={styles.backLink}>
                            <FaArrowLeft /> Back to Students
                        </Link>

                        <div className={styles.headerActions}>
                            {/* NEW: Learning Tasks Button */}
                            <button
                                className={styles.learningTasksBtn}
                                onClick={() => navigate(`/admin/student/task/${id}`)}
                                title="View Student Learning Tasks"
                            >
                                <FaList /> Learning Tasks
                            </button>

                            <button
                                className={styles.editBtn}
                                onClick={() => navigate(`/admin/student/edit/${id}/`)}
                            >
                                <FaEdit /> Edit Student
                            </button>

                            <ConfirmAction
                                title="Delete Student"
                                message={`Are you sure you want to delete this student? This action cannot be undone. To confirm, please type the student's full name exactly as shown below:`}
                                confirmText="Delete Student"
                                cancelText="Cancel"
                                requireReason={true}
                                placeholder={`Type: "${studentData.full_name}"`}
                                onConfirm={handleDelete}
                            >
                                <AsyncButton
                                    className={styles.deleteBtn}
                                    loading={loadingDelete}
                                    disabled={loadingDelete}
                                >
                                    <FaTrash /> Delete Student
                                </AsyncButton>
                            </ConfirmAction>
                        </div>
                    </div>

                    <div className={styles.studentHeader}>
                        <div className={styles.avatar}>
                            {studentData.profile_pic_url ? (
                                <img
                                    src={studentData.profile_pic_url}
                                    alt={studentData.full_name}
                                    className={styles.avatarImage}
                                />
                            ) : (
                                <FaUser size={32} />
                            )}
                        </div>
                        <div className={styles.studentInfo}>
                            <h1>{studentData.full_name || "Unnamed Student"}</h1>
                            <div className={styles.studentMeta}>
                                <span className={styles.studentId}>ID: {studentData.id}</span>
                                <span className={`${styles.status} ${styles[studentData.account_status || "pending"]}`}>
                                    {studentData.account_status === "active" ? <><FaCheckCircle /> Active</> :
                                        studentData.account_status === "inactive" ? <><FaTimesCircle /> Inactive</> :
                                            <><FaExclamationTriangle /> Pending</>}
                                </span>
                                {studentData.grade && (
                                    <span className={styles.gradeBadge}>
                                        <FaGraduationCap /> Grade {studentData.grade}
                                    </span>
                                )}
                                {studentData.section && (
                                    <span className={styles.sectionBadge}>
                                        <MdClass /> Section {studentData.section}
                                    </span>
                                )}
                                {studentData.field && (
                                    <span className={styles.fieldBadge}>
                                        <FaBook /> {studentData.field.charAt(0).toUpperCase() + studentData.field.slice(1)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* STATS */}
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon}>
                            <MdGrade />
                        </div>
                        <div className={styles.statContent}>
                            <h3>Total Score</h3>
                            <p className={styles.statNumber}>{student.learning_tasks.total_admin_rating_plus_bonus}</p>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon}>
                            <MdAssignment />
                        </div>
                        <div className={styles.statContent}>
                            <h3>Completed Tasks</h3>
                            <p className={styles.statNumber}>{performance.completedTasks}</p>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon}>
                            <FaChartLine />
                        </div>
                        <div className={styles.statContent}>
                            <h3>Attendance Rate</h3>
                            <p className={styles.statNumber}>{performance.attendanceRate.toFixed(1)}%</p>
                        </div>
                    </div>

                </div>

                {/* ATTENDANCE SUMMARY */}
                {attendanceSummary.status_counts && (
                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}><FaCalendarAlt /> Attendance Summary</h2>
                        <div className={styles.attendanceGrid}>
                            <div className={styles.attendanceItem}>
                                <div className={`${styles.attendanceIcon} ${styles.present}`}>
                                    <FaCheckCircle />
                                </div>
                                <div className={styles.attendanceContent}>
                                    <h3>Present</h3>
                                    <p className={styles.attendanceCount}>
                                        {attendanceSummary.status_counts.total_present || 0}
                                        <span className={styles.attendancePercentage}>
                                            ({attendanceSummary.status_percentages?.present?.toFixed(1) || 0}%)
                                        </span>
                                    </p>
                                </div>
                            </div>
                            <div className={styles.attendanceItem}>
                                <div className={`${styles.attendanceIcon} ${styles.late}`}>
                                    <FaExclamationTriangle />
                                </div>
                                <div className={styles.attendanceContent}>
                                    <h3>Late</h3>
                                    <p className={styles.attendanceCount}>
                                        {attendanceSummary.status_counts.total_late || 0}
                                        <span className={styles.attendancePercentage}>
                                            ({attendanceSummary.status_percentages?.late?.toFixed(1) || 0}%)
                                        </span>
                                    </p>
                                </div>
                            </div>
                            <div className={styles.attendanceItem}>
                                <div className={`${styles.attendanceIcon} ${styles.absent}`}>
                                    <FaTimesCircle />
                                </div>
                                <div className={styles.attendanceContent}>
                                    <h3>Absent</h3>
                                    <p className={styles.attendanceCount}>
                                        {attendanceSummary.status_counts.total_absent || 0}
                                        <span className={styles.attendancePercentage}>
                                            ({attendanceSummary.status_percentages?.absent?.toFixed(1) || 0}%)
                                        </span>
                                    </p>
                                </div>
                            </div>
                            <div className={styles.attendanceItem}>
                                <div className={`${styles.attendanceIcon} ${styles.special}`}>
                                    <FaExclamationTriangle />
                                </div>
                                <div className={styles.attendanceContent}>
                                    <h3>Special Cases</h3>
                                    <p className={styles.attendanceCount}>
                                        {attendanceSummary.status_counts.total_special_case || 0}
                                        <span className={styles.attendancePercentage}>
                                            ({attendanceSummary.status_percentages?.special_case?.toFixed(1) || 0}%)
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className={styles.attendanceTotal}>
                            <span>Total Attendance Records: {attendanceSummary.total || 0}</span>
                        </div>
                    </div>
                )}

                {/* CONTENT */}
                <div className={styles.contentGrid}>
                    <div className={styles.leftColumn}>
                        {/* Personal Information Card */}
                        <div className={styles.card}>
                            <h2 className={styles.cardTitle}><FaUser /> Personal Information</h2>
                            <div className={styles.infoGrid}>
                                <div className={styles.infoItem}>
                                    <div className={styles.infoIcon}><MdEmail /></div>
                                    <div>
                                        <label>Email Address</label>
                                        <p>{studentData.email || "Not specified"}</p>
                                    </div>
                                </div>
                                {studentData.phone_number && studentData.phone_number !== "N/A" && (
                                    <div className={styles.infoItem}>
                                        <div className={styles.infoIcon}><FaPhone /></div>
                                        <div>
                                            <label>Phone Number</label>
                                            <p>{studentData.phone_number}</p>
                                        </div>
                                    </div>
                                )}
                                <div className={styles.infoItem}>
                                    <div className={styles.infoIcon}><FaUser /></div>
                                    <div>
                                        <label>Gender</label>
                                        <p>{studentData.gender ? studentData.gender.charAt(0).toUpperCase() + studentData.gender.slice(1) : "Not specified"}</p>
                                    </div>
                                </div>
                                <div className={styles.infoItem}>
                                    <div className={styles.infoIcon}><FaUser /></div>
                                    <div>
                                        <label>Account Identifier</label>
                                        <p>{studentData.account || "N/A"}</p>
                                    </div>
                                </div>
                                <div className={styles.infoItem}>
                                    <div className={styles.infoIcon}><MdDateRange /></div>
                                    <div>
                                        <label>Joined Date</label>
                                        <p>{formatDate(studentData.date_joined)}</p>
                                    </div>
                                </div>
                                <div className={styles.infoItem}>
                                    <div className={styles.infoIcon}><FaUser /></div>
                                    <div>
                                        <label>Email Verified</label>
                                        <p className={studentData.email_verified ? styles.verified : styles.notVerified}>
                                            {studentData.email_verified ? "✓ Verified" : "✗ Not Verified"}
                                        </p>
                                    </div>
                                </div>
                                <div className={styles.infoItem}>
                                    <div className={styles.infoIcon}><FaUser /></div>
                                    <div>
                                        <label>2FA Enabled</label>
                                        <p className={studentData.twofa_enabled ? styles.enabled : styles.disabled}>
                                            {studentData.twofa_enabled ? "✓ Enabled" : "✗ Disabled"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Academic Information Card */}
                        <div className={styles.card}>
                            <h2 className={styles.cardTitle}><MdSchool /> Academic Information</h2>
                            <div className={styles.infoGrid}>
                                <div className={styles.infoItem}>
                                    <div className={styles.infoIcon}><FaGraduationCap /></div>
                                    <div>
                                        <label>Grade Level</label>
                                        <p>{studentData.grade ?? "N/A"}</p>
                                    </div>
                                </div>
                                <div className={styles.infoItem}>
                                    <div className={styles.infoIcon}><MdClass /></div>
                                    <div>
                                        <label>Section</label>
                                        <p>{studentData.section ?? "N/A"}</p>
                                    </div>
                                </div>
                                <div className={styles.infoItem}>
                                    <div className={styles.infoIcon}><FaBook /></div>
                                    <div>
                                        <label>Field of Study</label>
                                        <p>{studentData.field ? studentData.field.charAt(0).toUpperCase() + studentData.field.slice(1) : "Not specified"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Task Limit Card */}
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <h2 className={styles.cardTitle}><FaTasks /> Task Limit</h2>
                                <button
                                    className={styles.editLimitBtn}
                                    onClick={() => navigate(`/admin/student/edit/${id}/`)}
                                >
                                    <FaEdit /> Edit
                                </button>
                            </div>
                            <div className={styles.taskLimitDisplay}>
                                <div className={styles.taskLimitValue}>{taskLimit}</div>
                                <p className={styles.taskLimitDescription}>
                                    Maximum number of tasks this student can be assigned.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className={styles.rightColumn}>
                        {/* Learning Tasks Summary */}
                        {student.learning_tasks && (
                            <div className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <h2 className={styles.cardTitle}><FaTasks /> Learning Tasks Summary</h2>
                                    <button
                                        className={styles.viewAllBtn}
                                        onClick={() => navigate(`/admin/student/task/${id}`)}
                                    >
                                        View All Tasks
                                    </button>
                                </div>
                                <div className={styles.learningTasksGrid}>
                                    <div className={styles.learningTaskItem}>
                                        <div className={styles.learningTaskIcon}>
                                            <MdAssignment />
                                        </div>
                                        <div className={styles.learningTaskContent}>
                                            <h3>Total Tasks Created</h3>
                                            <p className={styles.learningTaskNumber}>
                                                {student.learning_tasks.total_created || 0}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={styles.learningTaskItem}>
                                        <div className={styles.learningTaskIcon}>
                                            <FaStar />
                                        </div>
                                        <div className={styles.learningTaskContent}>
                                            <h3>Admin Rating + Bonus</h3>
                                            <p className={styles.learningTaskNumber}>
                                                {student.learning_tasks.total_admin_rating_plus_bonus || 0}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

    
                    </div>
                </div>
            </SideBar>
        </div>
    );
}