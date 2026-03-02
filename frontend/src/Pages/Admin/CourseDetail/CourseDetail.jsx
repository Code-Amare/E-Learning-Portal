import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useUser } from "../../../Context/UserContext";
import api from "../../../Utils/api";
import { neonToast } from "../../../Components/NeonToast/NeonToast";
import SideBar from "../../../Components/SideBar/SideBar";
import ConfirmAction from "../../../Components/ConfirmAction/ConfirmAction";
import AsyncButton from "../../../Components/AsyncButton/AsyncButton";
import {
    FaArrowLeft,
    FaBook,
    FaEdit,
    FaTrash,
    FaLink,
    FaTag,
    FaAlignLeft,
    FaStickyNote,
    FaCalendarAlt,
    FaSpinner,
    FaExclamationTriangle,
    FaYoutube,
} from "react-icons/fa";
import { MdClass } from "react-icons/md";
import styles from "./CourseDetail.module.css";
import { useNotifContext } from "../../../Context/NotifContext";

export default function CourseDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useUser();
    const { updatePageTitle } = useNotifContext();

    useEffect(() => {
        updatePageTitle("Course Details");
    }, []);

    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [thumbnailError, setThumbnailError] = useState(false);

    useEffect(() => {
        if (user?.isAuthenticated === false) {
            navigate("/login");
            return;
        }
        fetchCourse();
    }, [id, user]);

    const fetchCourse = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/api/courses/${id}/`);
            setCourse(response.data.course);
        } catch (error) {
            console.error("Error fetching course:", error);
            if (error.response?.status === 404) {
                neonToast.error("Course not found", "error");
                navigate("/admin/courses");
            } else {
                neonToast.error("Failed to load course details", "error");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (event, typedName) => {
        if (!course) return false;

        if (typedName !== course.title) {
            neonToast.error(
                `The title you typed does not match. Please type "${course.title}" exactly to delete.`,
                "error"
            );
            return false;
        }

        setDeleting(true);
        try {
            await api.delete(`/api/courses/${id}/delete/`);
            neonToast.success("Course deleted successfully", "success");
            navigate("/admin/courses");
            return true;
        } catch (error) {
            console.error("Delete error:", error);
            if (error.response?.status === 403) {
                neonToast.error("You don't have permission to delete this course", "error");
            } else if (error.response?.data?.detail) {
                neonToast.error(error.response.data.detail, "error");
            } else {
                neonToast.error("Failed to delete course", "error");
            }
            return false;
        } finally {
            setDeleting(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    // Extract YouTube video ID from various URL formats
    const getYouTubeThumbnail = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        const videoId = match && match[2].length === 11 ? match[2] : null;
        return videoId ? `https://img.youtube.com/vi/${videoId}/0.jpg` : null;
    };

    const thumbnailUrl = course?.youtube_link ? getYouTubeThumbnail(course.youtube_link) : null;

    if (loading) {
        return (
            <div className={styles.container}>
                <SideBar>
                    <div className={styles.loadingContainer}>
                        <FaSpinner className={styles.loadingSpinner} />
                        <p>Loading course details...</p>
                    </div>
                </SideBar>
            </div>
        );
    }

    if (!course) {
        return (
            <div className={styles.container}>
                <SideBar>
                    <div className={styles.notFound}>
                        <FaExclamationTriangle size={48} />
                        <h2>Course not found</h2>
                        <p>The course you're looking for doesn't exist.</p>
                        <Link to="/admin/courses" className={styles.backBtn}>
                            <FaArrowLeft /> Back to Courses
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
                    <div className={styles.headerTop}>
                        <Link to="/admin/courses" className={styles.backLink}>
                            <FaArrowLeft /> Back to Courses
                        </Link>

                        <div className={styles.headerActions}>
                            <button
                                className={styles.editBtn}
                                onClick={() => navigate(`/admin/courses/edit/${id}`)}
                            >
                                <FaEdit /> Edit Course
                            </button>

                            <ConfirmAction
                                title="Delete Course"
                                message={`Are you sure you want to delete "${course.title}"? This action cannot be undone. To confirm, please type the course title exactly as shown below:`}
                                confirmText="Delete Course"
                                cancelText="Cancel"
                                requireReason={true}
                                placeholder={`Type: "${course.title}"`}
                                onConfirm={handleDelete}
                            >
                                <AsyncButton
                                    className={styles.deleteBtn}
                                    loading={deleting}
                                    disabled={deleting}
                                >
                                    <FaTrash /> Delete Course
                                </AsyncButton>
                            </ConfirmAction>
                        </div>
                    </div>

                    <div className={styles.courseHeader}>
                        <div className={styles.courseIcon}>
                            <FaBook size={40} />
                        </div>
                        <div className={styles.courseInfo}>
                            <h1>{course.title}</h1>
                            <div className={styles.courseMeta}>
                                <span className={styles.courseId}>ID: {course.id}</span>
                                <span className={styles.fieldBadge}>
                                    <MdClass />{" "}
                                    {course.field
                                        ? course.field.charAt(0).toUpperCase() + course.field.slice(1)
                                        : "N/A"}
                                </span>
                                <span className={styles.dateBadge}>
                                    <FaCalendarAlt /> {formatDate(course.created_at)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                <div className={styles.contentGrid}>
                    <div className={styles.mainCard}>
                        <h2 className={styles.sectionTitle}>
                            <FaAlignLeft /> Description
                        </h2>
                        <p className={styles.description}>{course.description || "No description provided."}</p>

                        <div className={styles.divider} />

                        <h2 className={styles.sectionTitle}>
                            <FaStickyNote /> Short Note
                        </h2>
                        <p className={styles.shortNote}>{course.short_note || "No short note."}</p>

                        <div className={styles.divider} />

                        <h2 className={styles.sectionTitle}>
                            <FaYoutube /> YouTube Video
                        </h2>

                        {course.youtube_link ? (
                            <>
                                {/* YouTube Thumbnail */}
                                {thumbnailUrl && !thumbnailError && (
                                    <div className={styles.thumbnailContainer}>
                                        <a
                                            href={course.youtube_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.thumbnailLink}
                                        >
                                            <img
                                                src={thumbnailUrl}
                                                alt="YouTube video thumbnail"
                                                className={styles.youtubeThumbnail}
                                                onError={() => setThumbnailError(true)}
                                            />
                                            <div className={styles.playIconOverlay}>
                                                <FaYoutube size={48} />
                                            </div>
                                        </a>
                                    </div>
                                )}

                                {/* Fallback if thumbnail fails */}
                                {(thumbnailError || !thumbnailUrl) && (
                                    <div className={styles.fallbackLink}>
                                        <a
                                            href={course.youtube_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.youtubeLink}
                                        >
                                            <FaLink /> {course.youtube_link}
                                        </a>
                                    </div>
                                )}
                            </>
                        ) : (
                            <p className={styles.noData}>No YouTube link provided.</p>
                        )}
                    </div>

                    <div className={styles.sideCard}>
                        <h2 className={styles.sectionTitle}>
                            <FaTag /> Course Details
                        </h2>
                        <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Title:</span>
                            <span className={styles.detailValue}>{course.title}</span>
                        </div>
                        <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Field:</span>
                            <span className={styles.detailValue}>
                                {course.field
                                    ? course.field.charAt(0).toUpperCase() + course.field.slice(1)
                                    : "N/A"}
                            </span>
                        </div>
                        <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Created At:</span>
                            <span className={styles.detailValue}>{formatDate(course.created_at)}</span>
                        </div>
                        <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Course ID:</span>
                            <span className={styles.detailValue}>{course.id}</span>
                        </div>
                    </div>
                </div>
            </SideBar>
        </div>
    );
}