import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUser } from "../../../Context/UserContext";
import api from "../../../Utils/api";
import { neonToast } from "../../../Components/NeonToast/NeonToast";
import AsyncButton from "../../../Components/AsyncButton/AsyncButton";
import SideBar from "../../../Components/SideBar/SideBar";
import ConfirmAction from "../../../Components/ConfirmAction/ConfirmAction";
import {
    FaArrowLeft,
    FaCode,
    FaGlobe,
    FaLock,
    FaLink,
    FaStar,
    FaEdit,
    FaTrash,
    FaUser,
    FaCalendar,
    FaThumbsUp,
    FaComment,
    FaCheck,
    FaTimes,
    FaExclamationTriangle,
    FaEllipsisV,
    FaShieldAlt,
    FaCrown,
    FaEye,
    FaRedo,
    FaCheckCircle,
    FaChartBar,
    FaLightbulb,
    FaGift,
    FaLock as FaLockIcon,
    FaExclamationCircle
} from "react-icons/fa";
import {
    MdLanguage,
    MdCode,
    MdDescription
} from "react-icons/md";
import styles from "./LearningTaskDetail.module.css";
import { useNotifContext } from "../../../Context/NotifContext";

export default function LearningTaskDetail() {
    const navigate = useNavigate();
    const { taskId } = useParams();
    const { user } = useUser();

    const [loading, setLoading] = useState(true);
    const [task, setTask] = useState(null);
    const [showReviewMenu, setShowReviewMenu] = useState(null);
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [settingToRedo, setSettingToRedo] = useState(false);

    // Review form state
    const [reviewForm, setReviewForm] = useState({
        rating: 5,
        feedback: ""
    });
    const [reviewErrors, setReviewErrors] = useState({});
    const [submittingReview, setSubmittingReview] = useState(false);
    const [submittingDelete, setSubmittingDelete] = useState(false);
    const [userReview, setUserReview] = useState(null);
    const [editingReview, setEditingReview] = useState(false);

    // Bonus form state
    const [bonusData, setBonusData] = useState(null);
    const [loadingBonus, setLoadingBonus] = useState(false);
    const [bonusForm, setBonusForm] = useState({
        score: 0
    });
    const [bonusErrors, setBonusErrors] = useState({});
    const [submittingBonus, setSubmittingBonus] = useState(false);
    const [deletingBonus, setDeletingBonus] = useState(false);
    const [editingBonus, setEditingBonus] = useState(false);

    const { updatePageTitle } = useNotifContext()
    useEffect(() => {
        updatePageTitle("Learning Task Detail")
    }, [])

    // Fetch task data
    useEffect(() => {
        if (taskId) {
            fetchTaskData();
            fetchBonusData();
        }
    }, [taskId]);

    const fetchTaskData = async () => {
        setLoading(true);
        try {
            const taskResponse = await api.get(`/api/learning-task/${taskId}/`);
            const responseData = taskResponse.data;

            const taskData = responseData.task || responseData;
            setTask(taskData);

            setLiked(responseData.user_liked || false);
            setLikeCount(taskData.likes_count || 0);

            if (taskData.reviews) {
                const existingReview = taskData.reviews.find(
                    review => review.user?.id === user.id && review.is_admin
                );
                if (existingReview) {
                    setUserReview(existingReview);
                    setReviewForm({
                        rating: existingReview.rating,
                        feedback: existingReview.feedback || ""
                    });
                } else {
                    setReviewForm({
                        rating: 5,
                        feedback: ""
                    });
                }
            }

        } catch (error) {
            console.error("Error fetching task data:", error);
            if (error.response?.status === 404) {
                neonToast.error("Learning Task not found", "error");
            } else {
                neonToast.error("Failed to load learning task", "error");
            }
            navigate("/admin");
        } finally {
            setLoading(false);
        }
    };

    // Fetch bonus data
    const fetchBonusData = async () => {
        setLoadingBonus(true);
        try {
            const response = await api.get(`/api/learning-task/bonus/${taskId}/`);
            if (response.data.task_bonus) {
                setBonusData(response.data.task_bonus);
                setBonusForm({
                    score: response.data.task_bonus.score
                });
            } else {
                setBonusData(null);
                setBonusForm({ score: 0 });
            }
        } catch (error) {
            if (error.response?.status !== 404) {
                console.error("Error fetching bonus data:", error);
            }
            setBonusData(null);
            setBonusForm({ score: 0 });
        } finally {
            setLoadingBonus(false);
        }
    };

    // Handle set to redo
    const handleSetToRedo = async () => {
        if (!task || task.status !== "rated") {
            neonToast.error("Only rated tasks can be set to redo", "error");
            return;
        }

        setSettingToRedo(true);
        try {
            await api.post(`/api/learning-task/redo/${taskId}/`);
            neonToast.success("Task set to redo successfully", "success");
            await fetchTaskData();
        } catch (error) {
            console.error("Error setting task to redo:", error);
            neonToast.error(error.response?.data?.error || "Failed to set task to redo", "error");
        } finally {
            setSettingToRedo(false);
        }
    };

    // Handle like/unlike
    const handleLike = async () => {
        if (!user.isAuthenticated) {
            neonToast.error("Please login to like learning tasks", "error");
            return;
        }

        try {
            const response = await api.post(`/api/learning-task/like/${taskId}/`);
            setLiked(response.data.action === "liked");
            setLikeCount(response.data.total_likes || response.data.likes_count);

            neonToast.success(
                response.data.action === "liked"
                    ? "Learning task liked!"
                    : "Learning task unliked!",
                "success"
            );
        } catch (error) {
            console.error("Error liking learning task:", error);
            neonToast.error("Failed to like/unlike learning task", "error");
        }
    };

    // Handle review form changes
    const handleReviewChange = (e) => {
        const { name, value } = e.target;
        setReviewForm(prev => ({ ...prev, [name]: value }));
        if (reviewErrors[name]) {
            setReviewErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    // Submit review - ADMIN ONLY
    const handleSubmitReview = async (e) => {
        e.preventDefault();

        if (!reviewForm.rating || reviewForm.rating < 1 || reviewForm.rating > 5) {
            neonToast.error("Please select a rating between 1 and 5", "error");
            return;
        }

        if (!reviewForm.feedback.trim()) {
            neonToast.error("Please provide feedback", "error");
            return;
        }

        setSubmittingReview(true);
        try {
            const endpoint = userReview
                ? `/api/learning-task/review/edit/${taskId}/`
                : `/api/learning-task/review/create/${taskId}/`;

            const method = userReview ? "patch" : "post";

            const response = await api[method](endpoint, {
                rating: parseInt(reviewForm.rating),
                feedback: reviewForm.feedback.trim()
            });

            neonToast.success(
                userReview ? "Review updated successfully!" : "Review submitted and task marked as rated!",
                "success"
            );

            await fetchTaskData();
            setEditingReview(false);

        } catch (error) {
            console.error("Error submitting review:", error);
            if (error.response?.data?.errors) {
                setReviewErrors(error.response.data.errors);
                neonToast.error("Please fix the errors in the review form", "error");
            } else {
                neonToast.error(
                    error.response?.data?.detail || "Failed to submit review",
                    "error"
                );
            }
        } finally {
            setSubmittingReview(false);
        }
    };

    // Handle delete review
    const handleDeleteReview = async () => {
        setSubmittingDelete(true);
        try {
            await api.delete(`/api/management/review/delete/${taskId}/`);
            neonToast.success("Review deleted successfully!", "success");
            setUserReview(null);
            setEditingReview(false);
            setReviewForm({
                rating: 5,
                feedback: ""
            });

            await fetchTaskData();
        } catch (error) {
            console.error("Error deleting review:", error);
            neonToast.error(
                error.response?.data?.error || "Failed to delete review",
                "error"
            );
        } finally {
            setSubmittingDelete(false);
        }
    };

    // Start editing review
    const handleEditReview = (review) => {
        setUserReview(review);
        setReviewForm({
            rating: review.rating,
            feedback: review.feedback || ""
        });
        setEditingReview(true);

        setTimeout(() => {
            document.querySelector(`.${styles.reviewForm}`)?.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            document.querySelector(`.${styles.feedbackInput}`)?.focus();
        }, 100);

        setShowReviewMenu(null);
    };

    // Cancel editing
    const handleCancelEdit = () => {
        setEditingReview(false);
        if (userReview) {
            setReviewForm({
                rating: userReview.rating,
                feedback: userReview.feedback || ""
            });
        } else {
            setReviewForm({
                rating: 5,
                feedback: ""
            });
        }
    };

    // Handle bonus form changes
    const handleBonusChange = (e) => {
        const { name, value } = e.target;
        const numValue = parseInt(value) || 0;
        setBonusForm(prev => ({ ...prev, [name]: numValue }));
        if (bonusErrors[name]) {
            setBonusErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    // Handle bonus score change via increment/decrement
    const handleBonusScoreChange = (increment) => {
        const newScore = Math.max(0, Math.min(30, bonusForm.score + increment));
        setBonusForm(prev => ({ ...prev, score: newScore }));
    };

    // Submit bonus
    const handleSubmitBonus = async (e) => {
        e.preventDefault();

        if (bonusForm.score < 0 || bonusForm.score > 30) {
            neonToast.error("Bonus score must be between 0 and 30", "error");
            return;
        }

        setSubmittingBonus(true);
        try {
            if (bonusData) {
                // Update existing bonus
                await api.patch(`/api/learning-task/bonus/${taskId}/`, {
                    score: bonusForm.score
                });
                neonToast.success("Bonus score updated successfully!", "success");
            } else {
                // Create new bonus
                await api.post(`/api/learning-task/bonus/${taskId}/`, {
                    score: bonusForm.score
                });
                neonToast.success("Bonus score added successfully!", "success");
            }
            await fetchBonusData();
            setEditingBonus(false);
        } catch (error) {
            console.error("Error submitting bonus:", error);
            if (error.response?.data?.error) {
                neonToast.error(error.response.data.error, "error");
            } else {
                neonToast.error("Failed to submit bonus", "error");
            }
        } finally {
            setSubmittingBonus(false);
        }
    };

    // Delete bonus
    const handleDeleteBonus = async () => {
        setDeletingBonus(true);
        try {
            await api.delete(`/api/learning-task/bonus/${taskId}/`);
            neonToast.success("Bonus score removed successfully!", "success");
            await fetchBonusData();
        } catch (error) {
            console.error("Error deleting bonus:", error);
            neonToast.error(error.response?.data?.error || "Failed to delete bonus", "error");
        } finally {
            setDeletingBonus(false);
        }
    };

    // Handle delete learning task
    const handleDeleteTask = async () => {
        try {
            await api.delete(`/api/management/task/delete/${taskId}/`);
            neonToast.success("Learning task deleted successfully!", "success");
            navigate("/admin");
        } catch (error) {
            console.error("Error deleting learning task:", error);
            neonToast.error(
                error.response?.data?.error || "Failed to delete learning task",
                "error"
            );
            throw error;
        }
    };

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Calculate average rating
    const calculateAverageRating = () => {
        if (!task.reviews || task.reviews.length === 0) return 0;
        const total = task.reviews.reduce((sum, review) => sum + review.rating, 0);
        return (total / task.reviews.length).toFixed(1);
    };

    // Profile picture component
    const ProfilePicture = ({ src, alt, size = "medium" }) => {
        const sizeClass = size === "small" ? styles.profilePicSmall : styles.profilePicMedium;

        if (src) {
            return (
                <img
                    src={src}
                    alt={alt}
                    className={`${styles.profilePic} ${sizeClass}`}
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                        const nextSibling = e.target.nextSibling;
                        if (nextSibling && nextSibling.style) {
                            nextSibling.style.display = 'flex';
                        }
                    }}
                />
            );
        }

        return (
            <div className={`${styles.profilePicPlaceholder} ${sizeClass}`}>
                <FaUser />
            </div>
        );
    };

    // Get user display name
    const getUserDisplayName = (userObj) => {
        if (!userObj) return "Unknown User";
        if (typeof userObj === 'string') return userObj;
        if (typeof userObj === 'object') {
            return userObj.full_name || userObj.username || "Unknown User";
        }
        return String(userObj);
    };

    // Get user profile picture URL from task
    const getUserProfilePic = (taskUser) => {
        return taskUser?.profile_pic_url || null;
    };

    // Get status badge class
    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'draft': return styles.statusDraft;
            case 'submitted': return styles.statusSubmitted;
            case 'rated': return styles.statusRated;
            case 'redo': return styles.statusRedo;
            default: return styles.statusDefault;
        }
    };

    // Get status display text
    const getStatusDisplay = (status) => {
        switch (status) {
            case 'draft': return 'Draft';
            case 'submitted': return 'Submitted';
            case 'rated': return 'Rated';
            case 'redo': return 'Needs Redo';
            default: return status;
        }
    };

    // Check if current user is the admin who created the bonus
    const isBonusCreator = () => {
        return bonusData && bonusData.admin && bonusData.admin.id === user.id;
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <SideBar>
                    <div className={styles.loadingContainer}>
                        <div className={styles.loadingSpinner}></div>
                        <p>Loading learning task details...</p>
                    </div>
                </SideBar>
            </div>
        );
    }

    if (!task) {
        return (
            <div className={styles.container}>
                <SideBar>
                    <div className={styles.errorContainer}>
                        <FaExclamationTriangle />
                        <h2>Learning Task Not Found</h2>
                        <p>The requested learning task could not be found.</p>
                        <button
                            className={styles.primaryBtn}
                            onClick={() => navigate("/admin")}
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </SideBar>
            </div>
        );
    }

    const averageRating = calculateAverageRating();
    const isRated = task.status === "rated";
    const isRedo = task.status === "redo";
    const isCurrentlyEditing = editingReview && userReview;
    const userIsBonusCreator = isBonusCreator();

    return (
        <div className={styles.container}>
            <SideBar>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerContent}>
                        <button
                            className={styles.backBtn}
                            onClick={() => navigate(-1)}
                        >
                            <FaArrowLeft /> Go Back
                        </button>
                        <div className={styles.headerMain}>
                            <div className={styles.titleSection}>
                                <h1>{task.title}</h1>
                                <div className={styles.subtitle}>
                                    <span className={styles.userInfo}>
                                        <ProfilePicture
                                            src={getUserProfilePic(task.user)}
                                            alt={getUserDisplayName(task.user)}
                                            size="small"
                                        />
                                        <span>{getUserDisplayName(task.user)}</span>
                                    </span>
                                    <span className={styles.dateInfo}>
                                        <FaCalendar /> {formatDate(task.created_at)}
                                    </span>
                                    <span className={`${styles.visibilityBadge} ${task.is_public ? styles.public : styles.private}`}>
                                        {task.is_public ? (
                                            <>
                                                <FaGlobe /> Public
                                            </>
                                        ) : (
                                            <>
                                                <FaLock /> Private
                                            </>
                                        )}
                                    </span>
                                    <span className={`${styles.statusBadge} ${getStatusBadgeClass(task.status)}`}>
                                        {getStatusDisplay(task.status)}
                                    </span>
                                    <span className={styles.adminBadge}>
                                        <FaCrown /> Admin View
                                    </span>
                                </div>
                            </div>

                            {/* Admin Action Buttons */}
                            <div className={styles.headerActions}>
                                {/* Like Button */}
                                <button
                                    className={`${styles.likeBtn} ${liked ? styles.liked : ""}`}
                                    onClick={handleLike}
                                    title={liked ? "Unlike this learning task" : "Like this learning task"}
                                    disabled={!user.isAuthenticated}
                                >
                                    <FaThumbsUp />
                                    <span>{likeCount}</span>
                                </button>

                                {/* Set to Redo Button (only for rated tasks) */}
                                {isRated && (
                                    <ConfirmAction
                                        title="Set Task to Redo"
                                        message="Are you sure you want to set this task to redo? The student will be able to modify and resubmit it."
                                        confirmText="Set to Redo"
                                        cancelText="Cancel"
                                        onConfirm={handleSetToRedo}
                                    >
                                        <AsyncButton
                                            className={styles.redoBtn}
                                            loading={settingToRedo}
                                            disabled={settingToRedo}
                                            title="Set task to redo mode"
                                        >
                                            <FaRedo /> Set to Redo
                                        </AsyncButton>
                                    </ConfirmAction>
                                )}

                                {/* Delete Learning Task Button */}
                                <ConfirmAction
                                    title="Delete Learning Task"
                                    message="Are you sure you want to delete this learning task? This action cannot be undone."
                                    confirmText="Delete"
                                    cancelText="Cancel"
                                    onConfirm={handleDeleteTask}
                                >
                                    <button
                                        className={styles.deleteTaskBtn}
                                        title="Delete learning task"
                                    >
                                        <FaTrash /> Delete Task
                                    </button>
                                </ConfirmAction>

                                {/* Admin Review Actions */}
                                {!userReview && !isRated && (
                                    <button
                                        className={styles.adminRateBtn}
                                        onClick={() => {
                                            document.querySelector(`.${styles.reviewForm}`)?.scrollIntoView({
                                                behavior: 'smooth',
                                                block: 'start'
                                            });
                                            document.querySelector(`.${styles.feedbackInput}`)?.focus();
                                        }}
                                        title="Review & Rate this learning task"
                                    >
                                        <FaStar /> Rate Learning Task
                                    </button>
                                )}

                                {userReview && !isCurrentlyEditing && (
                                    <button
                                        className={styles.editReviewBtn}
                                        onClick={() => handleEditReview(userReview)}
                                    >
                                        <FaEdit /> Edit Your Review
                                    </button>
                                )}

                                {isCurrentlyEditing && (
                                    <button
                                        className={styles.cancelEditBtn}
                                        onClick={handleCancelEdit}
                                    >
                                        <FaTimes /> Cancel Edit
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className={styles.contentGrid}>
                    {/* Left Column - Learning Task Details */}
                    <div className={styles.leftColumn}>
                        {/* Description */}
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <MdDescription />
                                <h3>Description</h3>
                            </div>
                            <div className={styles.description}>
                                {task.description || "No description provided."}
                            </div>
                        </div>

                        {/* GitHub Link */}
                        {task.git_link && (
                            <div className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <FaLink />
                                    <h3>GitHub Repository</h3>
                                </div>
                                <a
                                    href={task.git_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.githubLink}
                                >
                                    <FaCode />
                                    <span>{task.git_link}</span>
                                </a>
                            </div>
                        )}

                        {/* Technologies */}
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <MdLanguage />
                                <h3>Technologies Used</h3>
                            </div>

                            {/* Languages */}
                            <div className={styles.techGroup}>
                                <h4>Programming Languages</h4>
                                <div className={styles.techList}>
                                    {task.languages && task.languages.length > 0 ? (
                                        task.languages.map(lang => (
                                            <div key={lang.id} className={styles.techItem}>
                                                <div
                                                    className={styles.techColor}
                                                    style={{ backgroundColor: lang.color || "#3b82f6" }}
                                                />
                                                <span className={styles.techName}>
                                                    {lang.name}
                                                </span>
                                                {lang.code && (
                                                    <span className={styles.techCode}>
                                                        {lang.code}
                                                    </span>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className={styles.emptyTech}>No languages specified</div>
                                    )}
                                </div>
                            </div>

                            {/* Frameworks */}
                            {task.frameworks && task.frameworks.length > 0 && (
                                <div className={styles.techGroup}>
                                    <h4>Frameworks & Libraries</h4>
                                    <div className={styles.techList}>
                                        {task.frameworks.map(fw => (
                                            <div key={fw.id} className={styles.techItem}>
                                                <MdCode className={styles.frameworkIcon} />
                                                <span className={styles.techName}>
                                                    {fw.name}
                                                </span>
                                                {fw.language && (
                                                    <span className={styles.techLanguage}>
                                                        {fw.language.name}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Quick Stats - COMPACT VERSION */}
                        <div className={styles.statsCard}>
                            <div className={styles.cardHeader}>
                                <FaChartBar />
                                <h3>Quick Stats</h3>
                            </div>
                            <div className={styles.statsGrid}>
                                <div className={styles.statItem}>
                                    <div className={styles.statIcon}>
                                        <FaThumbsUp />
                                    </div>
                                    <div className={styles.statNumber}>{likeCount}</div>
                                    <div className={styles.statLabel}>Likes</div>
                                </div>
                                <div className={styles.statItem}>
                                    <div className={styles.statIcon}>
                                        <FaComment />
                                    </div>
                                    <div className={styles.statNumber}>{task.reviews?.length || 0}</div>
                                    <div className={styles.statLabel}>Reviews</div>
                                </div>
                                <div className={styles.statItem}>
                                    <div className={styles.statIcon}>
                                        <FaCrown />
                                    </div>
                                    <div className={styles.statNumber}>
                                        {task.reviews?.filter(r => r.is_admin)?.length || 0}
                                    </div>
                                    <div className={styles.statLabel}>Admin</div>
                                </div>
                                <div className={styles.statItem}>
                                    <div className={styles.statIcon}>
                                        <FaStar />
                                    </div>
                                    <div className={styles.statNumber}>{averageRating}</div>
                                    <div className={styles.statLabel}>Avg</div>
                                </div>
                                {/* Bonus Score Stat */}
                                <div className={styles.statItem}>
                                    <div className={styles.statIcon}>
                                        <FaGift />
                                    </div>
                                    <div className={styles.statNumber}>
                                        {bonusData ? `+${bonusData.score}` : "0"}
                                    </div>
                                    <div className={styles.statLabel}>Bonus</div>
                                </div>
                                <div className={styles.statItem}>
                                    <div className={styles.statIcon}>
                                        <FaCheckCircle />
                                    </div>
                                    <div className={styles.statNumber}>
                                        {bonusData ? "Yes" : "No"}
                                    </div>
                                    <div className={styles.statLabel}>Has Bonus</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Reviews & Admin Functions */}
                    <div className={styles.rightColumn}>
                        {/* Bonus Score Section */}
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <FaGift />
                                <h3>Bonus Score</h3>
                                {bonusData && (
                                    <span className={`${styles.bonusBadge} ${userIsBonusCreator ? styles.bonusCreator : styles.bonusLocked}`}>
                                        {userIsBonusCreator ? (
                                            <>
                                                <FaCrown /> You set this bonus
                                            </>
                                        ) : (
                                            <>
                                                <FaLockIcon /> Set by {getUserDisplayName(bonusData.admin)}
                                            </>
                                        )}
                                    </span>
                                )}
                            </div>

                            {loadingBonus ? (
                                <div className={styles.loadingBonus}>
                                    <div className={styles.loadingSpinner}></div>
                                    <p>Loading bonus data...</p>
                                </div>
                            ) : bonusData ? (
                                <div className={styles.bonusDisplay}>
                                    <div className={styles.bonusInfo}>
                                        <div className={styles.bonusScore}>
                                            <span className={styles.bonusValue}>+{bonusData.score}</span>
                                            <span className={styles.bonusLabel}>Bonus Points</span>
                                        </div>
                                        <div className={styles.bonusDetails}>
                                            <div className={styles.bonusDetailItem}>
                                                <FaUser className={styles.bonusDetailIcon} />
                                                <div>
                                                    <div className={styles.bonusDetailLabel}>Set by</div>
                                                    <div className={styles.bonusDetailValue}>
                                                        {getUserDisplayName(bonusData.admin)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={styles.bonusDetailItem}>
                                                <FaCalendar className={styles.bonusDetailIcon} />
                                                <div>
                                                    <div className={styles.bonusDetailLabel}>Date</div>
                                                    <div className={styles.bonusDetailValue}>
                                                        {formatDate(bonusData.created_at)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {userIsBonusCreator ? (
                                        <div className={styles.bonusActions}>
                                            {!editingBonus ? (
                                                <>
                                                    <button
                                                        className={styles.editBonusBtn}
                                                        onClick={() => setEditingBonus(true)}
                                                    >
                                                        <FaEdit /> Edit Bonus
                                                    </button>
                                                    <ConfirmAction
                                                        title="Remove Bonus"
                                                        message="Are you sure you want to remove this bonus score? This action cannot be undone."
                                                        confirmText="Remove Bonus"
                                                        cancelText="Cancel"
                                                        onConfirm={handleDeleteBonus}
                                                    >
                                                        <AsyncButton
                                                            className={styles.deleteBonusBtn}
                                                            loading={deletingBonus}
                                                            disabled={deletingBonus}
                                                        >
                                                            <FaTrash /> Remove Bonus
                                                        </AsyncButton>
                                                    </ConfirmAction>
                                                </>
                                            ) : (
                                                <form onSubmit={handleSubmitBonus} className={styles.bonusForm}>
                                                    <div className={styles.bonusFormGroup}>
                                                        <label className={styles.bonusFormLabel}>
                                                            <FaGift /> Bonus Score (0-30)
                                                        </label>
                                                        <div className={styles.bonusScoreInput}>
                                                            <button
                                                                type="button"
                                                                className={styles.scoreControlBtn}
                                                                onClick={() => handleBonusScoreChange(-1)}
                                                                disabled={bonusForm.score <= 0}
                                                            >
                                                                -
                                                            </button>
                                                            <input
                                                                type="number"
                                                                name="score"
                                                                value={bonusForm.score}
                                                                onChange={handleBonusChange}
                                                                min="0"
                                                                max="30"
                                                                className={styles.scoreInput}
                                                            />
                                                            <button
                                                                type="button"
                                                                className={styles.scoreControlBtn}
                                                                onClick={() => handleBonusScoreChange(1)}
                                                                disabled={bonusForm.score >= 30}
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                        <div className={styles.scoreHelp}>
                                                            <span className={styles.scoreValue}>Current: {bonusForm.score} points</span>
                                                            <span className={styles.scoreMax}>Max: 30 points</span>
                                                        </div>
                                                    </div>
                                                    <div className={styles.bonusFormActions}>
                                                        <AsyncButton
                                                            type="submit"
                                                            className={styles.saveBonusBtn}
                                                            loading={submittingBonus}
                                                            disabled={submittingBonus}
                                                        >
                                                            <FaCheck /> Save Changes
                                                        </AsyncButton>
                                                        <button
                                                            type="button"
                                                            className={styles.cancelBonusBtn}
                                                            onClick={() => {
                                                                setEditingBonus(false);
                                                                setBonusForm({ score: bonusData.score });
                                                            }}
                                                            disabled={submittingBonus}
                                                        >
                                                            <FaTimes /> Cancel
                                                        </button>
                                                    </div>
                                                </form>
                                            )}
                                        </div>
                                    ) : (
                                        <div className={styles.bonusLockedMessage}>
                                            <FaExclamationCircle />
                                            <p>
                                                This bonus was set by another administrator. Only the creator can modify or remove it.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className={styles.noBonus}>
                                    <div className={styles.noBonusContent}>
                                        <FaGift className={styles.noBonusIcon} />
                                        <div className={styles.noBonusText}>
                                            <h4>No Bonus Score Yet</h4>
                                            <p>You can add a bonus score to reward exceptional work on this task.</p>
                                        </div>
                                    </div>
                                    <form onSubmit={handleSubmitBonus} className={styles.bonusForm}>
                                        <div className={styles.bonusFormGroup}>
                                            <label className={styles.bonusFormLabel}>
                                                <FaGift /> Bonus Score (0-30)
                                            </label>
                                            <div className={styles.bonusScoreInput}>
                                                <button
                                                    type="button"
                                                    className={styles.scoreControlBtn}
                                                    onClick={() => handleBonusScoreChange(-1)}
                                                    disabled={bonusForm.score <= 0}
                                                >
                                                    -
                                                </button>
                                                <input
                                                    type="number"
                                                    name="score"
                                                    value={bonusForm.score}
                                                    onChange={handleBonusChange}
                                                    min="0"
                                                    max="30"
                                                    className={styles.scoreInput}
                                                />
                                                <button
                                                    type="button"
                                                    className={styles.scoreControlBtn}
                                                    onClick={() => handleBonusScoreChange(1)}
                                                    disabled={bonusForm.score >= 30}
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <div className={styles.scoreHelp}>
                                                <span className={styles.scoreValue}>Selected: {bonusForm.score} points</span>
                                                <span className={styles.scoreMax}>Max: 30 points</span>
                                            </div>
                                        </div>
                                        <div className={styles.bonusFormActions}>
                                            <AsyncButton
                                                type="submit"
                                                className={styles.addBonusBtn}
                                                loading={submittingBonus}
                                                disabled={submittingBonus}
                                            >
                                                <FaCheck /> Add Bonus Score
                                            </AsyncButton>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>

                        {/* Admin Review & Rating Section */}
                        <div className={styles.adminSection}>
                            <div className={styles.adminHeader}>
                                <div className={styles.adminTitle}>
                                    <FaStar />
                                    <h3>
                                        {isCurrentlyEditing ? "Edit Your Review" :
                                            userReview ? "Your Admin Review" : "Admin Review & Rating"}
                                    </h3>
                                </div>
                                <span className={styles.adminBadge}>
                                    <FaCrown /> Admin
                                </span>
                            </div>

                            {(!isRated || userReview) && (
                                <form onSubmit={handleSubmitReview} className={styles.reviewForm}>
                                    {/* Rating Section */}
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>
                                            <FaStar /> Rating (1-5)
                                        </label>
                                        <div className={styles.ratingInput}>
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    className={`${styles.starBtn} ${star <= reviewForm.rating ? styles.active : ""}`}
                                                    onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                                                    disabled={submittingReview}
                                                    title={`${star} star${star > 1 ? 's' : ''}`}
                                                >
                                                    <FaStar />
                                                </button>
                                            ))}
                                        </div>
                                        <div className={styles.ratingHelp}>
                                            <span className={styles.ratingValue}>
                                                Selected: {reviewForm.rating} / 5 stars
                                            </span>
                                        </div>
                                    </div>

                                    {/* Feedback Section */}
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>
                                            <FaComment /> Feedback
                                        </label>
                                        <textarea
                                            name="feedback"
                                            value={reviewForm.feedback}
                                            onChange={handleReviewChange}
                                            placeholder="Provide constructive feedback about the learning task. Include what was done well and areas for improvement..."
                                            className={styles.feedbackInput}
                                            rows={5}
                                            disabled={submittingReview}
                                            maxLength={500}
                                        />
                                        <div className={styles.feedbackHelp}>
                                            {reviewForm.feedback.length}/500 characters
                                        </div>
                                    </div>

                                    {/* Form Actions */}
                                    <div className={styles.formActions}>
                                        <div className={styles.formButtons}>
                                            <AsyncButton
                                                type="submit"
                                                className={styles.submitReviewBtn}
                                                loading={submittingReview}
                                                disabled={submittingReview}
                                            >
                                                {userReview ? (
                                                    <>
                                                        <FaEdit /> Update Review
                                                    </>
                                                ) : (
                                                    <>
                                                        <FaCheck /> Submit & Mark as Rated
                                                    </>
                                                )}
                                            </AsyncButton>

                                            {userReview && (
                                                <ConfirmAction
                                                    title="Delete Review"
                                                    message="Are you sure you want to delete your review? This will unmark the task as rated."
                                                    confirmText="Delete"
                                                    cancelText="Cancel"
                                                    onConfirm={handleDeleteReview}
                                                >
                                                    <button
                                                        type="button"
                                                        className={styles.deleteReviewBtn}
                                                        disabled={submittingReview || submittingDelete}
                                                    >
                                                        {submittingDelete ? "Deleting..." : (
                                                            <>
                                                                <FaTrash /> Delete Review
                                                            </>
                                                        )}
                                                    </button>
                                                </ConfirmAction>
                                            )}

                                            {isCurrentlyEditing && (
                                                <button
                                                    type="button"
                                                    className={styles.cancelFormBtn}
                                                    onClick={handleCancelEdit}
                                                    disabled={submittingReview}
                                                >
                                                    <FaTimes /> Cancel
                                                </button>
                                            )}
                                        </div>

                                        {userReview && !isCurrentlyEditing && (
                                            <div className={styles.reviewStatus}>
                                                <FaCalendar /> You reviewed on {formatDate(userReview.created_at)}
                                                {userReview.updated_at && userReview.updated_at !== userReview.created_at && (
                                                    <span className={styles.updatedNote}>
                                                        (Updated: {formatDate(userReview.updated_at)})
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </form>
                            )}

                            {isRated && !userReview && (
                                <div className={styles.alreadyRatedNote}>
                                    <FaExclamationTriangle />
                                    <p>
                                        This task has already been rated by another administrator.
                                        You can view all reviews below.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* All Reviews List */}
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <FaComment />
                                <h3>All Reviews ({task.reviews?.length || 0})</h3>
                            </div>

                            {task.reviews && task.reviews.length > 0 ? (
                                <div className={styles.reviewsList}>
                                    {task.reviews.map((review, index) => {
                                        const isCurrentUserReview = review.user?.id === user.id;
                                        const isReviewMenuOpen = showReviewMenu === review.id;
                                        const isAdminReview = review.is_admin;

                                        return (
                                            <div
                                                key={review.id || index}
                                                className={`${styles.reviewItem} ${isCurrentUserReview ? styles.currentUserReview : ""} ${isAdminReview ? styles.adminReview : ""}`}
                                            >
                                                <div className={styles.reviewHeader}>
                                                    <div className={styles.reviewerInfo}>
                                                        <div className={styles.reviewerName}>
                                                            <ProfilePicture
                                                                src={review.user?.profile_pic_url}
                                                                alt={getUserDisplayName(review.user)}
                                                                size="small"
                                                            />
                                                            <span>{getUserDisplayName(review.user)}</span>
                                                            {isAdminReview && (
                                                                <span className={styles.adminReviewBadge}>
                                                                    <FaCrown /> Admin
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className={styles.reviewerRole}>
                                                            {isAdminReview ? (
                                                                <span className={styles.roleBadgeAdmin}>Administrator</span>
                                                            ) : (
                                                                <span className={styles.roleBadgeUser}>User</span>
                                                            )}
                                                            {isCurrentUserReview && (
                                                                <span className={styles.roleBadgeYou}>Your Review</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className={styles.reviewActions}>
                                                        <div className={styles.reviewRating}>
                                                            {[...Array(5)].map((_, i) => (
                                                                <FaStar
                                                                    key={i}
                                                                    className={`${styles.reviewStar} ${i < review.rating ? styles.filled : ""}`}
                                                                />
                                                            ))}
                                                            <span className={styles.ratingValue}>
                                                                {review.rating}.0
                                                            </span>
                                                        </div>

                                                        {/* Review Options Menu (only for admin reviews by current admin) */}
                                                        {isCurrentUserReview && isAdminReview && (
                                                            <div className={styles.reviewOptions}>
                                                                <button
                                                                    className={styles.reviewOptionsToggle}
                                                                    onClick={() => setShowReviewMenu(isReviewMenuOpen ? null : review.id)}
                                                                >
                                                                    <FaEllipsisV />
                                                                </button>

                                                                {isReviewMenuOpen && (
                                                                    <div className={styles.reviewOptionsMenu}>
                                                                        <button
                                                                            className={styles.reviewOption}
                                                                            onClick={() => handleEditReview(review)}
                                                                        >
                                                                            <FaEdit /> Edit Review
                                                                        </button>
                                                                        <ConfirmAction
                                                                            title="Delete Review"
                                                                            message="Are you sure you want to delete this review? This will unmark the task as rated."
                                                                            confirmText="Delete"
                                                                            cancelText="Cancel"
                                                                            onConfirm={handleDeleteReview}
                                                                        >
                                                                            <button
                                                                                className={`${styles.reviewOption} ${styles.deleteOption}`}
                                                                                disabled={submittingDelete}
                                                                            >
                                                                                {submittingDelete ? "Deleting..." : (
                                                                                    <>
                                                                                        <FaTrash /> Delete Review
                                                                                    </>
                                                                                )}
                                                                            </button>
                                                                        </ConfirmAction>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className={styles.reviewDate}>
                                                    <FaCalendar /> {formatDate(review.created_at)}
                                                    {review.updated_at && review.updated_at !== review.created_at && (
                                                        <span className={styles.updatedDate}>
                                                            (Edited: {formatDate(review.updated_at)})
                                                        </span>
                                                    )}
                                                </div>

                                                <div className={styles.reviewFeedback}>
                                                    {review.feedback}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className={styles.noReviews}>
                                    <FaComment />
                                    <p>No reviews yet. Be the first to review this learning task!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </SideBar>
        </div>
    );
}