import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useUser } from "../../../Context/UserContext";
import api from "../../../Utils/api";
import { neonToast } from "../../../Components/NeonToast/NeonToast";
import SideBar from "../../../Components/SideBar/SideBar";
import ConfirmAction from "../../../Components/ConfirmAction/ConfirmAction"; // <-- imported
import {
    FaArrowLeft,
    FaBook,
    FaSpinner,
    FaExclamationTriangle,
    FaYoutube,
    FaCheckCircle,
    FaPlayCircle,
} from "react-icons/fa";
import { MdClass } from "react-icons/md";
import styles from "./UserCourseDetail.module.css";
import { useNotifContext } from "../../../Context/NotifContext";

// Simple confirmation modal component (kept for start confirmation)
const ConfirmModal = ({ isOpen, onConfirm, onCancel, message }) => {
    if (!isOpen) return null;
    return (
        <div className={styles.modalOverlay} onClick={onCancel}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalContent}>
                    <p>{message}</p>
                    <div className={styles.modalActions}>
                        <button className={styles.modalCancelBtn} onClick={onCancel}>
                            No
                        </button>
                        <button className={styles.modalConfirmBtn} onClick={onConfirm}>
                            Yes, Start
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function UserCourseDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useUser();
    const { updatePageTitle } = useNotifContext();

    useEffect(() => {
        updatePageTitle("Course Details");
    }, []);

    const [course, setCourse] = useState(null);
    const [progress, setProgress] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [showStartModal, setShowStartModal] = useState(false);
    // Removed showFinishConfirm – now using ConfirmAction

    useEffect(() => {
        if (user?.isAuthenticated === false) {
            navigate("/login");
            return;
        }
        fetchCourseAndProgress();
    }, [id, user, navigate]);

    const fetchCourseAndProgress = async () => {
        setLoading(true);
        try {
            const courseRes = await api.get(`/api/courses/${id}/`);
            setCourse(courseRes.data.course);

            const progressRes = await api.get(`/api/courses/${id}/progress/`);
            setProgress(progressRes.data);
        } catch (error) {
            console.log(error.response?.data);
            console.error("Error fetching data:", error);
            if (error.response?.status === 404) {
                neonToast.error("Course not found", "error");
                navigate("/courses");
            } else {
                neonToast.error("Failed to load course details", "error");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!loading && course && progress) {
            const timer = setTimeout(() => {
                if (!progress || (progress.status !== 'started' && progress.status !== 'finished')) {
                    setShowStartModal(true);
                }
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [loading, course, progress]);

    const handleStartCourse = async () => {
        setShowStartModal(false);
        setUpdating(true);
        try {
            const response = await api.post(`/api/courses/${id}/progress/`, {
                status: "started",
            });
            setProgress(response.data);
            neonToast.success("Course started! Good luck!", "success");
        } catch (error) {
            console.error("Error starting course:", error);
            neonToast.error("Failed to start course", "error");
        } finally {
            setUpdating(false);
        }
    };

    // handleFinishCourse now accepts optional parameters from ConfirmAction
    const handleFinishCourse = async (event, reason) => {
        setUpdating(true);
        try {
            const response = await api.post(`/api/courses/${id}/progress/`, {
                status: "finished",
            });
            setProgress(response.data);
            neonToast.success("Congratulations! Course completed!", "success");
            return true; // indicate success to ConfirmAction (optional)
        } catch (error) {
            console.error("Error finishing course:", error);
            neonToast.error("Failed to finish course", "error");
            return false;
        } finally {
            setUpdating(false);
        }
    };

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
                        <Link to="/user/courses" className={styles.backBtn}>
                            <FaArrowLeft /> Back to Courses
                        </Link>
                    </div>
                </SideBar>
            </div>
        );
    }

    const isStarted = progress?.status === 'started';
    const isFinished = progress?.status === 'finished';

    return (
        <div className={styles.container}>
            <SideBar>
                <div className={styles.header}>
                    <button className={styles.backBtn} onClick={() => navigate("/user/courses")}>
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
                        {isFinished && (
                            <span className={`${styles.statusBadge} ${styles.finished}`}>
                                <FaCheckCircle /> Completed
                            </span>
                        )}
                        {isStarted && !isFinished && (
                            <span className={`${styles.statusBadge} ${styles.started}`}>
                                <FaPlayCircle /> In Progress
                            </span>
                        )}
                    </div>

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

                    <div className={styles.section}>
                        <h2><FaBook /> Description</h2>
                        <p className={styles.description}>{course.description || "No description provided."}</p>
                    </div>

                    <div className={styles.section}>
                        <h2><FaBook /> Short Note</h2>
                        <p className={styles.shortNote}>{course.short_note || "No short note."}</p>
                    </div>

                    {isStarted && !isFinished && (
                        <div className={styles.finishSection}>
                            {/* Wrap finish button with ConfirmAction */}
                            <ConfirmAction
                                title="Finish Course"
                                message="Are you sure you want to mark this course as finished? This action cannot be undone."
                                confirmText="Yes, Finish"
                                cancelText="Cancel"
                                onConfirm={handleFinishCourse}
                                requireReason={false} // no reason needed
                            >
                                <button
                                    className={styles.finishBtn}
                                    disabled={updating}
                                >
                                    {updating ? <FaSpinner className={styles.spinner} /> : "Finish Course"}
                                </button>
                            </ConfirmAction>
                        </div>
                    )}

                    {isFinished && (
                        <div className={styles.completedMessage}>
                            <FaCheckCircle size={24} />
                            <p>You have completed this course. Great job!</p>
                        </div>
                    )}
                </div>

                <ConfirmModal
                    isOpen={showStartModal}
                    onConfirm={handleStartCourse}
                    onCancel={() => setShowStartModal(false)}
                    message="Do you want to start this course?"
                />
            </SideBar>
        </div>
    );
}