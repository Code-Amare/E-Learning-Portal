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
    FaUsers,
    FaCalendar,
    FaThumbsUp,
    FaComment,
    FaCheck,
    FaTimes,
    FaExclamationTriangle,
    FaEye,
    FaExternalLinkAlt,
    FaClock,
    FaGift,
    FaCrown,
    FaAward,
    FaStickyNote,
    FaHashtag
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
    const { id } = useParams();
    const { user } = useUser();
    const { updatePageTitle } = useNotifContext();

    const [loading, setLoading] = useState(true);
    const [task, setTask] = useState(null);
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [bonus, setBonus] = useState({
        id: null,
        score: 0,
        created_at: null,
        updated_at: null,
        admin: {},
    });

    useEffect(() => {
        if (!task) return;
        updatePageTitle(`Learning Task Detail '${task.title}'`);
    }, [task]);

    // Review form for users
    const [reviewForm, setReviewForm] = useState({
        rating: 5,
        feedback: ""
    });
    const [reviewErrors, setReviewErrors] = useState({});
    const [submittingReview, setSubmittingReview] = useState(false);
    const [userReview, setUserReview] = useState(null);

    // Fetch task data
    useEffect(() => {
        if (id) {
            fetchTaskData();
        }
    }, [id]);

    const fetchTaskData = async () => {
        setLoading(true);
        try {
            const taskResponse = await api.get(`/api/learning-task/${id}/`);
            const responseData = taskResponse.data;

            let taskData;
            if (responseData.task) {
                taskData = responseData.task;
            } else {
                taskData = responseData;
            }

            setLiked(responseData.user_liked || false);
            setTask(taskData);
            setLikeCount(taskData.likes_count || 0);

            // Set bonus data if it exists
            if (responseData.bonus) {
                setBonus(responseData.bonus);
            }

            // Check if current user has already reviewed this task
            if (user.isAuthenticated && taskData.reviews) {
                const existingReview = taskData.reviews.find(
                    review => review.user?.id === user.id
                );

                if (existingReview) {
                    setUserReview(existingReview);
                    setReviewForm({
                        rating: existingReview.rating,
                        feedback: existingReview.feedback || ""
                    });
                }
            }

        } catch (err) {
            console.error("Error fetching task data:", err);
            const errorMsg = err.response?.data?.error || "Failed to load learning task";
            neonToast.error(errorMsg, "error");
            navigate("/user/my-learning-task");
        } finally {
            setLoading(false);
        }
    };

    // Handle like/unlike
    const handleLike = async () => {
        if (!user.isAuthenticated) {
            neonToast.error("Please login to like learning tasks", "error");
            return;
        }

        try {
            const response = await api.post(`/api/learning-task/like/${id}/`);
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
            const newErrors = { ...reviewErrors };
            delete newErrors[name];
            setReviewErrors(newErrors);
        }
    };

    // Validate review form
    const validateReviewForm = () => {
        const newErrors = {};

        if (!reviewForm.rating || reviewForm.rating < 1 || reviewForm.rating > 5) {
            newErrors.rating = "Please select a rating between 1 and 5";
        }
        if (!reviewForm.feedback.trim()) {
            newErrors.feedback = "Please add your feedback";
        }
        if (reviewForm.feedback.trim().length < 10) {
            newErrors.feedback = "Feedback must be at least 10 characters";
        }

        setReviewErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Submit review - For regular users
    const handleSubmitReview = async (e) => {
        e.preventDefault();

        if (!user.isAuthenticated) {
            neonToast.error("Please login to submit a review", "error");
            return;
        }

        // Users cannot review their own tasks
        if (task && user.id === task.user.id) {
            neonToast.error("You cannot review your own learning task", "error");
            return;
        }

        // Users can only review public tasks
        if (!task.is_public) {
            neonToast.error("You can only review public learning tasks", "error");
            return;
        }

        if (!validateReviewForm()) {
            return;
        }

        setSubmittingReview(true);
        try {
            if (userReview) {
                // Update existing review
                await api.patch(`/api/learning-task/review/edit/${id}/`, {
                    rating: parseInt(reviewForm.rating),
                    feedback: reviewForm.feedback.trim()
                });
                neonToast.success("Your review has been updated!", "success");
            } else {
                // Submit new review
                await api.post(`/api/learning-task/review/create/${id}/`, {
                    rating: parseInt(reviewForm.rating),
                    feedback: reviewForm.feedback.trim()
                });
                neonToast.success("Thank you for your review!", "success");
            }

            // Refresh task data
            await fetchTaskData();

        } catch (error) {
            console.error("Error submitting review:", error);
            if (error.response?.data?.errors) {
                setReviewErrors(error.response.data.errors);
                neonToast.error("Please fix the errors in your review", "error");
            } else {
                neonToast.error(
                    error.response?.data?.detail ||
                    error.response?.data?.error ||
                    "Failed to submit review",
                    "error"
                );
            }
        } finally {
            setSubmittingReview(false);
        }
    };

    // Delete user review
    const handleDeleteReview = async () => {
        try {
            await api.delete(`/api/learning-task/review/delete/${id}/`);
            neonToast.success("Your review has been removed", "success");

            // Reset form and state
            setReviewForm({ rating: 5, feedback: "" });
            setUserReview(null);

            // Refresh task data
            await fetchTaskData();
        } catch (error) {
            console.error("Error deleting review:", error);
            neonToast.error(
                error.response?.data?.error || "Failed to delete your review",
                "error"
            );
        }
    };

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get user display name safely
    const getUserDisplayName = (userObj) => {
        if (!userObj) return "Unknown User";
        if (typeof userObj === 'string') return userObj;
        if (typeof userObj === 'object') {
            return userObj.full_name || userObj.username || userObj.email || "Unknown User";
        }
        return String(userObj);
    };

    // Get user profile picture
    const getUserProfilePic = (userObj) => {
        if (!userObj) return null;
        if (typeof userObj === 'object') {
            return userObj?.profile_pic_url || null;
        }
        return null;
    };

    // Profile picture component
    const ProfilePicture = ({ user, size = "small" }) => {
        const sizeClass = size === "small" ? styles.profilePicSmall : styles.profilePicMedium;
        const profilePicUrl = getUserProfilePic(user);

        if (profilePicUrl) {
            return (
                <img
                    src={profilePicUrl}
                    alt={getUserDisplayName(user)}
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

    // Check if user is admin/staff
    const isUserAdminOrStaff = (userObj) => {
        if (!userObj || typeof userObj !== 'object') return false;
        return userObj.is_staff || userObj.is_admin || userObj.role === 'admin' || userObj.role === 'staff';
    };

    // Get user role badge
    const getUserRoleBadge = (reviewUser) => {
        if (!reviewUser) return null;

        if (task?.user && reviewUser.id === task.user.id) {
            return <span className={styles.roleBadgeOwner}>Task Owner</span>;
        } else if (isUserAdminOrStaff(reviewUser)) {
            return <span className={styles.roleBadgeAdmin}>Admin</span>;
        } else if (reviewUser.id === user.id) {
            return <span className={styles.roleBadgeYou}>You</span>;
        } else {
            return <span className={styles.roleBadgeUser}>User</span>;
        }
    };

    // Handle delete task (only for owner)
    const handleDeleteTask = async () => {
        try {
            await api.delete(`/api/learning-task/delete/${id}/`);
            neonToast.success("Task deleted successfully", "success");
            navigate(-1);
        } catch (error) {
            console.error("Error deleting task:", error);
            neonToast.error(error.response?.data?.error || "Failed to delete task", "error");
        }
    };

    // Calculate average rating
    const calculateAverageRating = () => {
        if (!task?.reviews || task.reviews.length === 0) return 0;
        const total = task.reviews.reduce((sum, review) => sum + review.rating, 0);
        return (total / task.reviews.length).toFixed(1);
    };

    // Get user reviews count (non-admin reviews)
    const getUserReviewsCount = () => {
        if (!task?.reviews) return 0;
        return task.reviews.filter(review => !isUserAdminOrStaff(review.user)).length;
    };

    // Get admin reviews count
    const getAdminReviewsCount = () => {
        if (!task?.reviews) return 0;
        return task.reviews.filter(review => isUserAdminOrStaff(review.user)).length;
    };

    // Get formatted bonus score display - SIMPLIFIED like in the example
    const getBonusScoreDisplay = () => {
        const score = bonus?.score || 0;
        return score > 0 ? `+${score}` : `${score}`;
    };

    // Check if bonus exists - SIMPLIFIED like in the example
    const hasBonus = () => {
        return bonus && bonus.score !== 0;
    };

    // Check if user is admin/staff for the current task
    const isOwner = user.isAuthenticated && user.id === task?.user?.id;

    // Users can review any public task except their own
    const canReview = user.isAuthenticated && !isOwner && task?.is_public;

    // Calculate values only when task exists
    const totalReviews = task?.reviews?.length || 0;
    const userReviewsCount = task ? getUserReviewsCount() : 0;
    const adminReviewsCount = task ? getAdminReviewsCount() : 0;
    const averageRating = task ? calculateAverageRating() : 0;

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
                            onClick={() => navigate("/user/my-learning-task")}
                        >
                            Go Back
                        </button>
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
                        <button
                            className={styles.backBtn}
                            onClick={() => navigate("/user/my-learning-task")}
                        >
                            <FaArrowLeft /> Go Back
                        </button>
                        <div className={styles.headerMain}>
                            <div className={styles.titleSection}>
                                <h1>{task.title}</h1>
                                <div className={styles.subtitle}>
                                    <span className={styles.userInfo}>
                                        <ProfilePicture user={task.user} size="small" />
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
                                </div>
                            </div>

                            {/* Action Buttons */}
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

                                {/* Edit and Delete for owner */}
                                {isOwner && (task.status === "draft" || task.status === "redo") && (
                                    <>
                                        <button
                                            className={styles.editBtn}
                                            onClick={() => navigate(`/user/learning-task/edit/${id}`)}
                                            title="Edit learning task"
                                        >
                                            <FaEdit />
                                        </button>
                                        <ConfirmAction
                                            title="Delete Learning Task"
                                            message="Are you sure you want to delete this task? This action cannot be undone."
                                            confirmText="Delete"
                                            cancelText="Cancel"
                                            onConfirm={handleDeleteTask}
                                        >
                                            <button
                                                className={styles.deleteBtn}
                                                title="Delete learning task"
                                            >
                                                <FaTrash />
                                            </button>
                                        </ConfirmAction>
                                    </>
                                )}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Status Banner */}
                {task.status === "draft" && (
                    <div className={styles.statusBanner}>
                        <FaExclamationTriangle />
                        <span>This task is in <strong>Draft</strong> status. It is only visible to you.</span>
                    </div>
                )}
                {task.status === "under_review" && (
                    <div className={styles.statusBanner}>
                        <FaClock />
                        <span>This task is <strong>Under Review</strong>. Administrators will review it soon.</span>
                    </div>
                )}
                {task.status === "rated" && (
                    <div className={styles.statusBanner}>
                        <FaStar />
                        <span>This task has been <strong>Rated</strong> by administrators.</span>
                    </div>
                )}
                {task.status === "redo" && (
                    <div className={styles.statusBanner}>
                        <FaExclamationTriangle />
                        <span>This task <strong>Needs Redo</strong>. The owner needs to update it based on feedback.</span>
                    </div>
                )}

                {/* Main Content */}
                <div className={styles.contentGrid}>
                    {/* Left Column - Learning Task Details */}
                    <div className={styles.leftColumn}>
                        {/* Description */}
                        <div className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <MdDescription />
                                <h3>Description</h3>
                            </div>
                            <div className={styles.description}>
                                {task.description || "No description provided."}
                            </div>
                        </div>

                        {/* GitHub Link */}
                        {task.git_link && (
                            <div className={styles.section}>
                                <div className={styles.sectionHeader}>
                                    <FaLink />
                                    <h3>GitHub Repository</h3>
                                </div>
                                <a
                                    href={task.git_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.githubLink}
                                >
                                    <FaExternalLinkAlt />
                                    <span>{task.git_link}</span>
                                </a>
                            </div>
                        )}

                        {/* Technologies */}
                        <div className={styles.section}>
                            <div className={styles.sectionHeader}>
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
                                                    style={{ backgroundColor: lang?.color || "#3b82f6" }}
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

                        {/* Learning Task Stats */}
                        <div className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <FaUsers />
                                <h3>Learning Task Statistics</h3>
                            </div>
                            <div className={styles.statsGrid}>
                                <div className={styles.statItem}>
                                    <div className={styles.statValue}>{likeCount}</div>
                                    <div className={styles.statLabel}>Likes</div>
                                </div>
                                <div className={styles.statItem}>
                                    <div className={styles.statValue}>
                                        {totalReviews}
                                    </div>
                                    <div className={styles.statLabel}>Total Reviews</div>
                                </div>
                                <div className={styles.statItem}>
                                    <div className={styles.statValue}>
                                        {averageRating}
                                    </div>
                                    <div className={styles.statLabel}>Avg Rating</div>
                                </div>
                                <div className={styles.statItem}>
                                    <div className={styles.statValue}>
                                        {task.is_public ? "Yes" : "No"}
                                    </div>
                                    <div className={styles.statLabel}>Public</div>
                                </div>
                                {/* Bonus Score Stat */}
                                <div className={styles.statItem}>
                                    <div className={styles.statValue}>
                                        {getBonusScoreDisplay()}
                                    </div>
                                    <div className={styles.statLabel}>Bonus Score</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Reviews & Bonus */}
                    <div className={styles.rightColumn}>
                        {/* Bonus Section - SIMPLIFIED like in the example */}
                        {hasBonus() && (
                            <div className={styles.section}>
                                <div className={styles.sectionHeader}>
                                    <FaGift />
                                    <h3>Bonus Awarded</h3>
                                </div>
                                <div className={styles.bonusCard}>
                                    <div className={styles.bonusMain}>
                                        <div className={styles.bonusScoreDisplay}>
                                            <span className={styles.bonusScoreValue}>{getBonusScoreDisplay()}</span>
                                            <span className={styles.bonusScoreLabel}>Points</span>
                                        </div>
                                        <div className={styles.bonusDescription}>
                                            <FaStar />
                                            <div>
                                                <h4>Exceptional Work!</h4>
                                                <p>Admin awarded bonus points</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Admin who gave the bonus - from bonus.admin */}
                                    {bonus.admin && (
                                        <div className={styles.bonusAdminInfo}>
                                            <div className={styles.bonusAdminLabel}>Awarded by:</div>
                                            <div className={styles.bonusAdminDetails}>
                                                <ProfilePicture user={bonus.admin} size="small" />
                                                <div className={styles.bonusAdminText}>
                                                    <div className={styles.bonusAdminName}>
                                                        {getUserDisplayName(bonus.admin)}
                                                    </div>
                                                    <div className={styles.bonusAdminRole}>
                                                        {bonus.admin?.role || 'Administrator'}
                                                    </div>
                                                    <div className={styles.bonusAdminEmail}>
                                                        {bonus.admin?.email || ''}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Bonus Date */}
                                    {bonus.created_at && (
                                        <div className={styles.bonusDate}>
                                            <FaCalendar />
                                            <span>Awarded on: {formatDate(bonus.created_at)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Review Form (for users except task owner) */}
                        {canReview && (
                            <div className={styles.section}>
                                <div className={styles.sectionHeader}>
                                    <FaComment />
                                    <h3>{userReview ? "Edit Your Review" : "Share Your Feedback"}</h3>
                                </div>
                                <form onSubmit={handleSubmitReview} className={styles.reviewForm}>
                                    {/* Rating */}
                                    <div className={styles.formGroup}>
                                        <label>Your Rating</label>
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
                                        <div className={styles.ratingValue}>
                                            {reviewForm.rating} / 5 stars
                                        </div>
                                        {reviewErrors.rating && (
                                            <span className={styles.errorText}>{reviewErrors.rating}</span>
                                        )}
                                    </div>

                                    {/* Feedback */}
                                    <div className={styles.formGroup}>
                                        <label>Your Feedback</label>
                                        <textarea
                                            name="feedback"
                                            value={reviewForm.feedback}
                                            onChange={handleReviewChange}
                                            placeholder="Share your thoughts about this learning task..."
                                            className={`${styles.feedbackInput} ${reviewErrors.feedback ? styles.errorInput : ""}`}
                                            rows={4}
                                            disabled={submittingReview}
                                            maxLength={500}
                                        />
                                        <div className={styles.charCount}>
                                            {reviewForm.feedback.length}/500 characters
                                        </div>
                                        {reviewErrors.feedback && (
                                            <span className={styles.errorText}>{reviewErrors.feedback}</span>
                                        )}
                                    </div>

                                    {/* Submit/Update Button */}
                                    <div className={styles.formActions}>
                                        <AsyncButton
                                            type="submit"
                                            className={styles.submitReviewBtn}
                                            loading={submittingReview}
                                            disabled={submittingReview}
                                        >
                                            <FaCheck /> {userReview ? "Update Review" : "Submit Review"}
                                        </AsyncButton>

                                        {/* Delete review button (only if user has already reviewed) */}
                                        {userReview && (
                                            <ConfirmAction
                                                title="Delete Your Review"
                                                message="Are you sure you want to delete your review? This action cannot be undone."
                                                confirmText="Delete"
                                                cancelText="Cancel"
                                                onConfirm={handleDeleteReview}
                                            >
                                                <button
                                                    type="button"
                                                    className={styles.deleteReviewBtn}
                                                    disabled={submittingReview}
                                                >
                                                    <FaTrash /> Delete Review
                                                </button>
                                            </ConfirmAction>
                                        )}
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* All Reviews List */}
                        <div className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <FaStar />
                                <h3>All Reviews ({totalReviews})</h3>
                                {adminReviewsCount > 0 && userReviewsCount > 0 && (
                                    <span className={styles.reviewStats}>
                                        ({adminReviewsCount} admin, {userReviewsCount} user)
                                    </span>
                                )}
                            </div>

                            {task.reviews && task.reviews.length > 0 ? (
                                <div className={styles.reviewsList}>
                                    {task.reviews.map((review, index) => {
                                        const isCurrentUserReview = review.user?.id === user.id;
                                        const isAdminReview = isUserAdminOrStaff(review.user);

                                        return (
                                            <div
                                                key={review.id || index}
                                                className={`${styles.reviewItem} 
                                                    ${isCurrentUserReview ? styles.currentUserReview : ""} 
                                                    ${isAdminReview ? styles.adminReview : styles.userReview}`}
                                            >
                                                <div className={styles.reviewHeader}>
                                                    <div className={styles.reviewerInfo}>
                                                        <div className={styles.reviewerName}>
                                                            <ProfilePicture user={review.user} size="small" />
                                                            <span>{getUserDisplayName(review.user)}</span>
                                                        </div>
                                                        <div className={styles.reviewerRole}>
                                                            {getUserRoleBadge(review.user)}
                                                        </div>
                                                    </div>
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
                                                </div>

                                                <div className={styles.reviewDate}>
                                                    <FaCalendar /> {formatDate(review.created_at)}
                                                    {review.updated_at && review.updated_at !== review.created_at && (
                                                        <span className={styles.updatedNote}>
                                                            (edited)
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
                                    <p>No reviews yet. {canReview ? "Be the first to share your feedback!" : "Check back later for reviews."}</p>
                                </div>
                            )}
                        </div>

                        {/* Learning Task Information */}
                        <div className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <FaEye />
                                <h3>Learning Task Information</h3>
                            </div>
                            <div className={styles.metadata}>
                                <div className={styles.metaItem}>
                                    <span className={styles.metaLabel}>Created:</span>
                                    <span className={styles.metaValue}>
                                        {formatDate(task.created_at)}
                                    </span>
                                </div>
                                {task.updated_at !== task.created_at && (
                                    <div className={styles.metaItem}>
                                        <span className={styles.metaLabel}>Updated:</span>
                                        <span className={styles.metaValue}>
                                            {formatDate(task.updated_at)}
                                        </span>
                                    </div>
                                )}
                                <div className={styles.metaItem}>
                                    <span className={styles.metaLabel}>Status:</span>
                                    <span className={`${styles.metaValue} ${styles[`status-${task.status}`]}`}>
                                        {task.status.charAt(0).toUpperCase() + task.status.slice(1).replace('_', ' ')}
                                    </span>
                                </div>
                                <div className={styles.metaItem}>
                                    <span className={styles.metaLabel}>Visibility:</span>
                                    <span className={`${styles.metaValue} ${task.is_public ? styles.public : styles.private}`}>
                                        {task.is_public ? "Public" : "Private"}
                                    </span>
                                </div>
                                {hasBonus() && (
                                    <div className={styles.metaItem}>
                                        <span className={styles.metaLabel}>Bonus Awarded:</span>
                                        <span className={styles.metaValue}>
                                            {getBonusScoreDisplay()} points
                                        </span>
                                    </div>
                                )}
                                <div className={styles.metaItem}>
                                    <span className={styles.metaLabel}>Task Owner:</span>
                                    <div className={styles.ownerInfo}>
                                        <ProfilePicture user={task.user} size="small" />
                                        <span className={styles.metaValue}>
                                            {getUserDisplayName(task.user)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </SideBar>
        </div>
    );
}