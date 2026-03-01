import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUser } from "../../../Context/UserContext";
import api from "../../../Utils/api";
import { neonToast } from "../../../Components/NeonToast/NeonToast";
import AsyncButton from "../../../Components/AsyncButton/AsyncButton";
import ConfirmAction from "../../../Components/ConfirmAction/ConfirmAction";
import SideBar from "../../../Components/SideBar/SideBar";
import {
    FaArrowLeft,
    FaGlobe,
    FaLock,
    FaLink,
    FaTimes,
    FaTrash,
    FaSave,
    FaStar
} from "react-icons/fa";
import { MdTitle, MdDescription, MdLanguage, MdCode, MdEdit } from "react-icons/md";
import styles from "./LearningTaskEdit.module.css";
import { useNotifContext } from "../../../Context/NotifContext";

export default function LearningTaskEdit() {
    const navigate = useNavigate();
    const { id } = useParams();


    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [languages, setLanguages] = useState([]);
    const [frameworks, setFrameworks] = useState([]);
    const [errors, setErrors] = useState({});
    const [deleteConfirmation, setDeleteConfirmation] = useState("");
    const [deleteError, setDeleteError] = useState("");

    const [task, setTask] = useState({
        title: "",
        description: "",
        git_link: "",
        is_public: false,
        language_ids: [],
        framework_ids: [],
        status: "",
        reviews: [],
        user: null
    });

    const { updatePageTitle } = useNotifContext()

    useEffect(() => {
        if (!task.title === "") return
        updatePageTitle(`Edit Learning Task '${task.title}'`)
    }, [task])

    useEffect(() => {
        fetchTaskData();
    }, [id]);

    const fetchTaskData = async () => {
        setFetching(true);
        try {
            const taskRes = await api.get(`/api/learning-task/${id}/`);
            const taskData = taskRes.data.task;

            if (taskData.status == "rated") {
                neonToast.error("This task has been rated and cannot be edited");
                navigate(`/user/learning-task/${id}`);
                return;
            }

            setTask({
                title: taskData.title,
                description: taskData.description,
                git_link: taskData.git_link || "",
                is_public: taskData.is_public,
                language_ids: taskData.languages.map(l => l.id),
                framework_ids: taskData.frameworks.map(f => f.id),
                status: taskData.status,
                reviews: taskData.reviews,
                user: taskData.user
            });

            const [langsRes, fwRes] = await Promise.all([
                api.get("/api/management/languages/"),
                api.get("/api/management/frameworks/")
            ]);

            setLanguages(langsRes.data);
            setFrameworks(fwRes.data);

        } catch (err) {
            neonToast.error("Failed to load task");
            navigate(`/user/learning-tasks/${id}`);
        } finally {
            setFetching(false);
        }
    };

    const handleChange = e => {
        const { name, value, type, checked } = e.target;
        setTask(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: "" }));
        }
    };

    const toggleLanguage = id => {
        setTask(prev => ({
            ...prev,
            language_ids: prev.language_ids.includes(id)
                ? prev.language_ids.filter(l => l !== id)
                : [...prev.language_ids, id]
        }));
        // Clear languages error when user selects one
        if (errors.language_ids) {
            setErrors(prev => ({ ...prev, language_ids: "" }));
        }
    };

    const toggleFramework = id => {
        setTask(prev => ({
            ...prev,
            framework_ids: prev.framework_ids.includes(id)
                ? prev.framework_ids.filter(f => f !== id)
                : [...prev.framework_ids, id]
        }));
    };

    const validateForm = () => {
        const e = {};
        if (!task.title.trim()) e.title = "Title is required";
        if (!task.description.trim()) e.description = "Description is required";
        if (task.language_ids.length === 0) e.language_ids = "Select at least one language";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async e => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            await api.patch(`/api/learning-task/edit/${id}/`, {
                title: task.title.trim(),
                description: task.description.trim(),
                git_link: task.git_link || null,
                is_public: task.is_public,
                language_ids: task.language_ids,
                framework_ids: task.framework_ids
            });

            neonToast.success("Task updated successfully!");
            navigate(`/user/learning-task/${id}`);

        } catch (err) {
            console.error("Update failed:", err);
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            }
            neonToast.error(err.response?.data?.error || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (deleteConfirmation !== task.title) {
            setDeleteError(`Please type "${task.title}" exactly to confirm deletion.`);
            return false;
        }

        try {
            await api.delete(`/api/learning-task/delete/${id}/`);
            neonToast.success("Task deleted successfully!");
            navigate("/user/learning-tasks");
            return true;
        } catch (err) {
            console.error("Delete failed:", err);
            neonToast.error("Failed to delete task");
            return false;
        }
    };

    if (fetching) {
        return (
            <div className={styles.container}>
                <SideBar>
                    <div className={styles.loadingContainer}>
                        <div className={styles.loadingSpinner}></div>
                        <p>Loading task data...</p>
                    </div>
                </SideBar>
            </div>
        );
    }

    // Check if task is rated
    if (task.status == "rated") {
        return (
            <div className={styles.container}>
                <SideBar>
                    <div className={styles.ratedContainer}>
                        <div className={styles.ratedMessage}>
                            <FaStar className={styles.ratedIcon} />
                            <h2>Task Already Rated</h2>
                            <p>This task has been reviewed and rated. It can no longer be edited or deleted.</p>
                            <div className={styles.ratedActions}>
                                <button
                                    className={styles.secondaryBtn}
                                    onClick={() => navigate(`/user/learning-task/${id}`)}
                                >
                                    View Task
                                </button>
                                <button
                                    className={styles.primaryBtn}
                                    onClick={() => navigate("/user/learning-tasks")}
                                >
                                    Back to Tasks
                                </button>
                            </div>
                        </div>
                    </div>
                </SideBar>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <SideBar>
                <div className={styles.header}>
                    <div className={styles.headerContent}>
                        <button
                            className={styles.backBtn}
                            onClick={() => navigate(`/user/learning-task/${id}`)}
                        >
                            <FaArrowLeft /> Back to Task
                        </button>
                        <div className={styles.titleSection}>
                            <MdEdit className={styles.titleIcon} />
                            <div>
                                <h1>Edit Learning Task</h1>
                                <p>Make changes to your learning task</p>
                            </div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGrid}>
                        {/* Left Column */}
                        <div className={styles.formColumn}>
                            {/* Title */}
                            <div className={styles.formGroup}>
                                <label htmlFor="title">
                                    <MdTitle /> Task Title <span className={styles.required}>*</span>
                                </label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    value={task.title}
                                    onChange={handleChange}
                                    placeholder="e.g., E-commerce Website, Todo App"
                                    className={errors.title ? styles.errorInput : ""}
                                    disabled={loading}
                                    maxLength={200}
                                />
                                {errors.title && <span className={styles.errorText}>{errors.title}</span>}
                                <small className={styles.helpText}>
                                    A clear, descriptive title for your project (max 200 characters)
                                </small>
                            </div>

                            {/* Description */}
                            <div className={styles.formGroup}>
                                <label htmlFor="description">
                                    <MdDescription /> Description <span className={styles.required}>*</span>
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={task.description}
                                    onChange={handleChange}
                                    placeholder="Describe your project, features, technologies used..."
                                    className={`${styles.textarea} ${errors.description ? styles.errorInput : ""}`}
                                    disabled={loading}
                                    rows={6}
                                    maxLength={2000}
                                />
                                {errors.description && <span className={styles.errorText}>{errors.description}</span>}
                                <small className={styles.helpText}>
                                    Detailed description of your project (max 2000 characters)
                                </small>
                            </div>

                            {/* GitHub Link */}
                            <div className={styles.formGroup}>
                                <label htmlFor="git_link">
                                    <FaLink /> GitHub Repository Link
                                </label>
                                <div className={styles.inputWithIcon}>
                                    <FaLink className={styles.inputIcon} />
                                    <input
                                        type="url"
                                        id="git_link"
                                        name="git_link"
                                        value={task.git_link}
                                        onChange={handleChange}
                                        placeholder="https://github.com/username/repository"
                                        className={errors.git_link ? styles.errorInput : ""}
                                        disabled={loading}
                                    />
                                </div>
                                {errors.git_link && <span className={styles.errorText}>{errors.git_link}</span>}
                                <small className={styles.helpText}>
                                    Optional: Link to your GitHub repository
                                </small>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className={styles.formColumn}>
                            {/* Visibility */}
                            <div className={styles.formGroup}>
                                <label className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        name="is_public"
                                        checked={task.is_public}
                                        onChange={handleChange}
                                        disabled={loading}
                                    />
                                    <span className={styles.checkboxCustom}></span>
                                    <div className={styles.checkboxContent}>
                                        <div className={styles.checkboxTitle}>
                                            <FaGlobe /> Make this task public
                                        </div>
                                        <div className={styles.checkboxDescription}>
                                            Public tasks are visible to everyone and can be reviewed by admins
                                        </div>
                                    </div>
                                </label>
                                <div className={styles.visibilityNote}>
                                    {task.is_public ? (
                                        <>
                                            <FaGlobe className={styles.publicIcon} />
                                            <span>This task will be visible to everyone</span>
                                        </>
                                    ) : (
                                        <>
                                            <FaLock className={styles.privateIcon} />
                                            <span>This task is private (only you can see it)</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Languages */}
                            <div className={styles.formGroup}>
                                <label>
                                    <MdLanguage /> Programming Languages <span className={styles.required}>*</span>
                                </label>
                                {errors.language_ids && <span className={styles.errorText}>{errors.language_ids}</span>}
                                <small className={styles.helpText}>
                                    Select all programming languages used in this task
                                </small>

                                <div className={styles.selectionGrid}>
                                    {languages.map(language => (
                                        <button
                                            key={language.id}
                                            type="button"
                                            className={`${styles.selectionItem} ${task.language_ids.includes(language.id) ? styles.selected : ""
                                                }`}
                                            onClick={() => toggleLanguage(language.id)}
                                            disabled={loading}
                                        >
                                            <div className={styles.selectionIcon}>
                                                <div
                                                    style={{
                                                        backgroundColor: language.color || "#3b82f6",
                                                        width: "100%",
                                                        height: "100%",
                                                        borderRadius: "6px"
                                                    }}
                                                />
                                            </div>
                                            <div className={styles.selectionInfo}>
                                                <span className={styles.selectionName}>
                                                    {language.name}
                                                </span>
                                                <span className={styles.selectionCode}>
                                                    {language.code}
                                                </span>
                                            </div>
                                            {task.language_ids.includes(language.id) && (
                                                <FaTimes className={styles.removeIcon} />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Frameworks */}
                            <div className={styles.formGroup}>
                                <label>
                                    <MdCode /> Frameworks & Libraries
                                </label>
                                <small className={styles.helpText}>
                                    Optional: Select frameworks and libraries used
                                </small>

                                <div className={styles.selectionGrid}>
                                    {frameworks.map(framework => (
                                        <button
                                            key={framework.id}
                                            type="button"
                                            className={`${styles.selectionItem} ${task.framework_ids.includes(framework.id) ? styles.selected : ""
                                                }`}
                                            onClick={() => toggleFramework(framework.id)}
                                            disabled={loading}
                                        >
                                            <div className={styles.selectionIcon}>
                                                <MdCode />
                                            </div>
                                            <div className={styles.selectionInfo}>
                                                <span className={styles.selectionName}>
                                                    {framework.name}
                                                </span>
                                                <span className={styles.selectionLanguage}>
                                                    {framework.language?.name}
                                                </span>
                                            </div>
                                            {task.framework_ids.includes(framework.id) && (
                                                <FaTimes className={styles.removeIcon} />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Selected Counts */}
                            <div className={styles.selectedCounts}>
                                <div className={styles.countItem}>
                                    <span className={styles.countLabel}>Languages:</span>
                                    <span className={styles.countValue}>
                                        {task.language_ids.length} selected
                                    </span>
                                </div>
                                <div className={styles.countItem}>
                                    <span className={styles.countLabel}>Frameworks:</span>
                                    <span className={styles.countValue}>
                                        {task.framework_ids.length} selected
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className={styles.formActions}>
                        <div className={styles.leftActions}>
                            <ConfirmAction
                                onConfirm={handleDelete}
                                onOpen={() => {
                                    setDeleteConfirmation("");
                                    setDeleteError("");
                                }}
                                title="Delete Learning Task"
                                message={
                                    <div className={styles.deleteConfirmation}>
                                        <p>Are you sure you want to delete <strong>"{task.title}"</strong>? This action cannot be undone.</p>
                                        <div className={styles.confirmationInputGroup}>
                                            <label htmlFor="deleteConfirmation">
                                                Type <strong>"{task.title}"</strong> to confirm:
                                            </label>
                                            <input
                                                type="text"
                                                id="deleteConfirmation"
                                                value={deleteConfirmation}
                                                onChange={(e) => {
                                                    setDeleteConfirmation(e.target.value);
                                                    setDeleteError("");
                                                }}
                                                placeholder={`Type "${task.title}" here`}
                                                className={`${styles.confirmationInput} ${deleteError ? styles.errorInput : ""}`}
                                                autoComplete="off"
                                            />
                                            {deleteError && (
                                                <span className={styles.errorText}>{deleteError}</span>
                                            )}
                                        </div>
                                    </div>
                                }
                                confirmText="Delete Task"
                                cancelText="Cancel"
                                confirmButtonProps={{
                                    disabled: deleteConfirmation !== task.title
                                }}
                            >
                                <button
                                    type="button"
                                    className={styles.dangerBtn}
                                    disabled={loading}
                                >
                                    <FaTrash /> Delete Task
                                </button>
                            </ConfirmAction>
                        </div>

                        <div className={styles.rightActions}>
                            <button
                                type="button"
                                className={styles.secondaryBtn}
                                onClick={() => navigate(`/user/learning-task/${id}`)}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <AsyncButton
                                type="submit"
                                className={styles.primaryBtn}
                                loading={loading || undefined}
                                disabled={loading}
                            >
                                <FaSave /> Update Task
                            </AsyncButton>
                        </div>
                    </div>
                </form>
            </SideBar>
        </div>
    );
}