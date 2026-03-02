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
    FaYoutube,
    FaTag,
    FaAlignLeft,
    FaStickyNote,
} from "react-icons/fa";
import { MdClass } from "react-icons/md";
import styles from "./UserCourseDetail.module.css";
import { useNotifContext } from "../../../Context/NotifContext";

export default function UserCourseDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useUser();
    const { updatePageTitle } = useNotifContext();

    useEffect(() => {
        updatePageTitle("Course Details");
    }, []);

    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.isAuthenticated === false) {
            navigate("/login");
            return;
        }
        fetchCourse();
    }, [id, user, navigate]);

    const fetchCourse = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/api/courses/${id}/`);
            setCourse(response.data.course);
        } catch (error) {
            console.error("Error fetching course:", error);
            if (error.response?.status === 404) {
                neonToast.error("Course not found", "error");
            } else {
                neonToast.error("Failed to load course details", "error");
            }
            navigate("/courses");
        } finally {
            setLoading(false);
        }
    };

    // Extract YouTube video ID for embedding
    const getYouTubeEmbedUrl = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        const videoId = match && match[2].length === 11 ? match[2] : null;
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    };

    const embedUrl = course?.youtube_link ? getYouTubeEmbedUrl(course.youtube_link) : null;

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
                        <Link to="/courses" className={styles.backBtn}>
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
                <div className={styles.header}>
                    <button className={styles.backBtn} onClick={() => navigate("/courses")}>
                        <FaArrowLeft /> Back to Courses
                    </button>
                </div>

                <div className={styles.content}>
                    <h1 className={styles.title}>{course.title}</h1>
                    <div className={styles.meta}>
                        <span className={styles.fieldBadge}>
                            <MdClass />{" "}
                            {course.field_label || course.field.charAt(0).toUpperCase() + course.field.slice(1)}
                        </span>
                    </div>

                    {/* YouTube Embed */}
                    {embedUrl ? (
                        <div className={styles.videoContainer}>
                            <iframe
                                src={embedUrl}
                                title={course.title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className={styles.videoIframe}
                            ></iframe>
                        </div>
                    ) : (
                        <div className={styles.noVideo}>
                            <FaYoutube size={48} />
                            <p>No video available for this course.</p>
                        </div>
                    )}

                    {/* Description */}
                    <div className={styles.section}>
                        <h2>
                            <FaAlignLeft /> Description
                        </h2>
                        <p className={styles.description}>{course.description || "No description provided."}</p>
                    </div>

                    {/* Short Note */}
                    <div className={styles.section}>
                        <h2>
                            <FaStickyNote /> Short Note
                        </h2>
                        <p className={styles.shortNote}>{course.short_note || "No short note."}</p>
                    </div>
                </div>
            </SideBar>
        </div>
    );
}