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
    FaList
} from "react-icons/fa";
import {
    MdEmail, MdLocationOn, MdDateRange,
    MdClass, MdGrade, MdAssignment, MdSchool
} from "react-icons/md";
import styles from "./StudentDetail.module.css";
import { useNotifContext } from "../../../Context/NotifContext";

export default function StudentDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useUser();
    const { updatePageTitle } = useNotifContext();
    useEffect(() => {
        updatePageTitle("Student Detail");
    }, []);

    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingDelete, setLoadingDelete] = useState(false);

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
                console.log(response.data);

                if (!mounted) return;

                // The API returns the student object directly (or wrapped in a "student" property)
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

    // Helper to extract all relevant data from the nested structure
    const getStudentData = () => {
        if (!student) return {};

        const profile = student.profile || {};
        const userData = profile.user || {};

        return {
            // From user object
            full_name: userData.full_name,
            email: userData.email,
            gender: userData.gender,
            date_joined: userData.date_joined,
            email_verified: userData.email_verified,
            twofa_enabled: userData.twofa_enabled,
            is_active: userData.is_active,

            // From profile object
            account: profile.account,
            field: profile.field,
            grade: profile.grade,
            phone_number: profile.phone_number,
            section: profile.section,

            // Directly from student root
            profile_pic_url: student.profile_pic_url,
            progress_summary: student.progress_summary || {},

            // ID from user or root
            id: userData.id || student.id,

            // Derive account status from user.is_active
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

    // Calculate performance from progress_summary
    const calculatePerformance = () => {
        if (!student) return {
            progressPercentage: 0,
            finishedCourses: 0,
            startedCourses: 0,
            totalCourses: 0,
            progressPoints: 0,
            progressRating: "N/A"
        };

        const progress = student.progress_summary || {};
        return {
            progressPercentage: progress.progress_percentage || 0,
            finishedCourses: progress.finished_courses || 0,
            startedCourses: progress.started_courses || 0,
            totalCourses: progress.total_courses || 0,
            progressPoints: progress.progress_points || 0,
            progressRating: progress.progress_rating || "N/A"
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
                            {/* NEW: Courses Taken Button (replaces Learning Tasks) */}
                            <button
                                className={styles.learningTasksBtn}  // reuse existing class
                                onClick={() => navigate(`/admin/student/courses/${id}`)}
                                title="View Courses Taken by Student"
                            >
                                <FaBook /> Courses Taken
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

                {/* STATS CARDS using progress data */}
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon}>
                            <FaChartLine />
                        </div>
                        <div className={styles.statContent}>
                            <h3>Progress</h3>
                            <p className={styles.statNumber}>{performance.progressPercentage}%</p>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon}>
                            <FaStar />
                        </div>
                        <div className={styles.statContent}>
                            <h3>Points</h3>
                            <p className={styles.statNumber}>{performance.progressPoints}</p>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon}>
                            <FaTasks />
                        </div>
                        <div className={styles.statContent}>
                            <h3>Finished Courses</h3>
                            <p className={styles.statNumber}>{performance.finishedCourses} / {performance.totalCourses}</p>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon}>
                            <MdGrade />
                        </div>
                        <div className={styles.statContent}>
                            <h3>Rating</h3>
                            <p className={styles.statNumber} style={{ textTransform: 'capitalize' }}>{performance.progressRating}</p>
                        </div>
                    </div>
                </div>

                {/* PROGRESS SUMMARY CARD */}
                {student.progress_summary && (
                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}><FaChartLine /> Progress Summary</h2>
                        <div className={styles.progressGrid}>
                            <div className={styles.progressItem}>
                                <div className={styles.progressIcon}>
                                    <FaCheckCircle style={{ color: '#10b981' }} />
                                </div>
                                <div className={styles.progressContent}>
                                    <h3>Finished Courses</h3>
                                    <p className={styles.progressCount}>{performance.finishedCourses}</p>
                                </div>
                            </div>
                            <div className={styles.progressItem}>
                                <div className={styles.progressIcon}>
                                    <FaTasks style={{ color: '#f59e0b' }} />
                                </div>
                                <div className={styles.progressContent}>
                                    <h3>Started Courses</h3>
                                    <p className={styles.progressCount}>{performance.startedCourses}</p>
                                </div>
                            </div>
                            <div className={styles.progressItem}>
                                <div className={styles.progressIcon}>
                                    <FaBook style={{ color: '#3b82f6' }} />
                                </div>
                                <div className={styles.progressContent}>
                                    <h3>Total Courses</h3>
                                    <p className={styles.progressCount}>{performance.totalCourses}</p>
                                </div>
                            </div>
                            <div className={styles.progressItem}>
                                <div className={styles.progressIcon}>
                                    <FaStar style={{ color: '#8b5cf6' }} />
                                </div>
                                <div className={styles.progressContent}>
                                    <h3>Progress Points</h3>
                                    <p className={styles.progressCount}>{performance.progressPoints}</p>
                                </div>
                            </div>
                        </div>
                        <div className={styles.progressPercentage}>
                            <span>Overall Progress: {performance.progressPercentage}%</span>
                            <div className={styles.progressBarBackground}>
                                <div
                                    className={styles.progressBarFill}
                                    style={{ width: `${performance.progressPercentage}%` }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* CONTENT GRID */}
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
                    </div>

                    <div className={styles.rightColumn}>
                        {/* You can add other cards here if needed, but the Recent Activities card has been removed */}
                    </div>
                </div>
            </SideBar>
        </div>
    );
}