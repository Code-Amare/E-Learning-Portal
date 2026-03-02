import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useUser } from "../../../Context/UserContext";
import api from "../../../Utils/api";
import { neonToast } from "../../../Components/NeonToast/NeonToast";
import SideBar from "../../../Components/SideBar/SideBar";
import {
    FaArrowLeft,
    FaBook,
    FaSpinner,
    FaExclamationTriangle,
    FaCheckCircle,
    FaClock,
    FaPlayCircle,
} from "react-icons/fa";
import { MdClass } from "react-icons/md";
import styles from "./StudentCourses.module.css";
import { useNotifContext } from "../../../Context/NotifContext";

export default function StudentCourses() {
    const { userId } = useParams(); // assuming route: /admin/student/:userId/courses
    const navigate = useNavigate();
    const { user } = useUser();
    const { updatePageTitle } = useNotifContext();

    useEffect(() => {
        updatePageTitle("Student Courses");
    }, []);

    const [coursesData, setCoursesData] = useState({
        courses_taken_serializer: [],
        started_courses_serializer: [],
        finished_courses_serializer: [],
    });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("all"); // 'all', 'started', 'finished'

    useEffect(() => {
        if (user?.isAuthenticated === false) {
            navigate("/login");
            return;
        }
        fetchStudentCourses();
    }, [userId, user]);

    const fetchStudentCourses = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/api/courses/user/${userId}/`);
            setCoursesData(response.data);
        } catch (error) {
            console.error("Error fetching student courses:", error);
            if (error.response?.status === 404) {
                neonToast.error("Student not found", "error");
            } else {
                neonToast.error("Failed to load courses", "error");
            }
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const getStatusBadge = (status) => {
        if (status === "finished") {
            return (
                <span className={`${styles.statusBadge} ${styles.finished}`}>
                    <FaCheckCircle /> Finished
                </span>
            );
        } else if (status === "started") {
            return (
                <span className={`${styles.statusBadge} ${styles.started}`}>
                    <FaPlayCircle /> Started
                </span>
            );
        } else {
            return (
                <span className={`${styles.statusBadge} ${styles.unknown}`}>
                    <FaClock /> Unknown
                </span>
            );
        }
    };

    const renderCourseList = (courses) => {
        if (courses.length === 0) {
            return (
                <div className={styles.emptyState}>
                    <FaBook size={48} />
                    <p>No courses found</p>
                </div>
            );
        }

        return (
            <table className={styles.dataTable}>
                <thead>
                    <tr>
                        <th>Course</th>
                        <th>Status</th>
                        <th>Started At</th>
                        <th>Finished At</th>
                    </tr>
                </thead>
                <tbody>
                    {courses.map((progress) => {
                        // progress.course might be just an ID or an object depending on serializer
                        // For now, we'll assume it's an object with id and title (adjust as needed)
                        const course = progress.course;
                        const courseTitle = course?.title || `Course ID: ${course}`;
                        return (
                            <tr key={progress.id}>
                                <td>
                                    <div className={styles.courseCell}>
                                        <FaBook className={styles.courseIcon} />
                                        <span>{courseTitle}</span>
                                    </div>
                                </td>
                                <td>{getStatusBadge(progress.status)}</td>
                                <td>{formatDate(progress.started_at)}</td>
                                <td>{formatDate(progress.finished_at)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        );
    };

    const getActiveCourses = () => {
        switch (activeTab) {
            case "started":
                return coursesData.started_courses_serializer;
            case "finished":
                return coursesData.finished_courses_serializer;
            default:
                return coursesData.courses_taken_serializer;
        }
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
                    <div className={styles.headerTop}>
                        <Link to={`/admin/student/${userId}`} className={styles.backLink}>
                            <FaArrowLeft /> Back to Student
                        </Link>
                        <h1 className={styles.pageTitle}>Student Courses</h1>
                    </div>
                </div>

                <div className={styles.content}>
                    {/* Tabs */}
                    <div className={styles.tabs}>
                        <button
                            className={`${styles.tab} ${activeTab === "all" ? styles.activeTab : ""}`}
                            onClick={() => setActiveTab("all")}
                        >
                            All ({coursesData.courses_taken_serializer.length})
                        </button>
                        <button
                            className={`${styles.tab} ${activeTab === "started" ? styles.activeTab : ""}`}
                            onClick={() => setActiveTab("started")}
                        >
                            Started ({coursesData.started_courses_serializer.length})
                        </button>
                        <button
                            className={`${styles.tab} ${activeTab === "finished" ? styles.activeTab : ""}`}
                            onClick={() => setActiveTab("finished")}
                        >
                            Finished ({coursesData.finished_courses_serializer.length})
                        </button>
                    </div>

                    {/* Course List */}
                    <div className={styles.tableCard}>
                        <div className={styles.tableWrapper}>
                            {renderCourseList(getActiveCourses())}
                        </div>
                    </div>
                </div>
            </SideBar>
        </div>
    );
}