import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../../Context/UserContext";
import api from "../../../Utils/api";
import { neonToast } from "../../../Components/NeonToast/NeonToast";
import AsyncButton from "../../../Components/AsyncButton/AsyncButton";
import SideBar from "../../../Components/SideBar/SideBar";
import {
    FaArrowLeft,
    FaCode,
    FaGlobe,
    FaLock,
    FaLink,
    FaPalette,
    FaTimes
} from "react-icons/fa";
import { MdTitle, MdDescription, MdLanguage, MdCode } from "react-icons/md";
import styles from "./LearningTaskCreate.module.css";
import { useNotifContext } from "../../../Context/NotifContext";

export default function LearningTaskCreate() {
    const navigate = useNavigate();
    const { user } = useUser();

    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(false);
    const [languages, setLanguages] = useState([]);
    const [frameworks, setFrameworks] = useState([]);
    const [errors, setErrors] = useState({});

    const { updatePageTitle } = useNotifContext()
    useEffect(() => {
        updatePageTitle("Create Learning Task")
    }, [])

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        git_link: "",
        is_public: false,
        language_ids: [],
        framework_ids: []
    });

    useEffect(() => {
        if (user.isAuthenticated && user.is_staff) {
            neonToast.error("Admins cannot create learning tasks", "error");
            navigate("/learning-tasks");
        }
    }, [user, navigate]);

    useEffect(() => {
        const fetchData = async () => {
            setLoadingData(true);
            try {
                const [languagesRes, frameworksRes] = await Promise.all([
                    api.get("/api/management/languages/"),
                    api.get("/api/management/frameworks/")
                ]);
                setLanguages(languagesRes.data || []);
                setFrameworks(frameworksRes.data || []);
            } catch (error) {
                console.error("Error fetching data:", error);
                neonToast.error("Failed to load languages and frameworks", "error");
            } finally {
                setLoadingData(false);
            }
        };
        fetchData();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
    };

    const handleLanguageSelect = (languageId) => {
        setFormData(prev => {
            const newIds = prev.language_ids.includes(languageId)
                ? prev.language_ids.filter(id => id !== languageId)
                : [...prev.language_ids, languageId];
            return { ...prev, language_ids: newIds };
        });
    };

    const handleFrameworkSelect = (frameworkId) => {
        setFormData(prev => {
            const newIds = prev.framework_ids.includes(frameworkId)
                ? prev.framework_ids.filter(id => id !== frameworkId)
                : [...prev.framework_ids, frameworkId];
            return { ...prev, framework_ids: newIds };
        });
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.title.trim()) newErrors.title = "Title is required";
        if (!formData.description.trim()) newErrors.description = "Description is required";
        if (formData.language_ids.length === 0) newErrors.language_ids = "Select at least one language";
        if (formData.git_link && !formData.git_link.startsWith("https://github.com/")) {
            newErrors.git_link = "GitHub link must start with https://github.com/";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            neonToast.error("Please fix the errors in the form", "error");
            return;
        }

        setLoading(true);
        try {
            const taskData = {
                ...formData,
                title: formData.title.trim(),
                description: formData.description.trim(),
                git_link: formData.git_link.trim() || null
            };

            await api.post("/api/learning-task/create/", taskData);
            neonToast.success("Learning task created successfully!", "success");
            navigate("/user/learning-tasks");

        } catch (error) {
            console.error("Error creating learning task:", error?.response?.data?.error || error);
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
                neonToast.error("Please fix the errors in the form", "error");
            } else if (error.response?.data?.non_field_errors) {
                neonToast.error(error.response.data.non_field_errors[0], "error");
            } else {
                neonToast.error(error.response?.data?.error || "Failed to create learning task", "error");
            }
        } finally {
            setLoading(false);
        }
    };

    const clearForm = () => {
        setFormData({
            title: "",
            description: "",
            git_link: "",
            is_public: false,
            language_ids: [],
            framework_ids: []
        });
        setErrors({});
        window.scrollTo(0, 0);
        neonToast.info("Form cleared", "info");
    };

    return (
        <div className={styles.container}>
            <SideBar>
                <div className={styles.header}>
                    <div className={styles.headerContent}>
                        <button
                            className={styles.backBtn}
                            onClick={() => navigate("/user/learning-tasks")}
                        >
                            <FaArrowLeft /> Back to Tasks
                        </button>
                        <div className={styles.titleSection}>
                            <FaCode className={styles.titleIcon} />
                            <div>
                                <h1>Create Learning Task</h1>
                                <p>Create a new programming task to showcase your skills</p>
                            </div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGrid}>
                        <div className={styles.formColumn}>
                            <div className={styles.formGroup}>
                                <label htmlFor="title">
                                    <MdTitle /> Task Title <span className={styles.required}>*</span>
                                </label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="e.g., E-commerce Website, Todo App, Weather Dashboard"
                                    className={errors.title ? styles.errorInput : ""}
                                    disabled={loading || loadingData}
                                    maxLength={200}
                                />
                                {errors.title && <span className={styles.errorText}>{errors.title}</span>}
                                <small className={styles.helpText}>
                                    A clear, descriptive title for your project (max 200 characters)
                                </small>
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="description">
                                    <MdDescription /> Description <span className={styles.required}>*</span>
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Describe your project, features, technologies used, and what you learned..."
                                    className={`${styles.textarea} ${errors.description ? styles.errorInput : ""}`}
                                    disabled={loading || loadingData}
                                    rows={6}
                                    maxLength={2000}
                                />
                                {errors.description && <span className={styles.errorText}>{errors.description}</span>}
                                <small className={styles.helpText}>
                                    Detailed description of your project (max 2000 characters)
                                </small>
                            </div>

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
                                        value={formData.git_link}
                                        onChange={handleChange}
                                        placeholder="https://github.com/username/repository"
                                        className={errors.git_link ? styles.errorInput : ""}
                                        disabled={loading || loadingData}
                                    />
                                </div>
                                {errors.git_link && <span className={styles.errorText}>{errors.git_link}</span>}
                                <small className={styles.helpText}>
                                    Optional: Link to your GitHub repository
                                </small>
                            </div>
                        </div>

                        <div className={styles.formColumn}>
                            <div className={styles.formGroup}>
                                <label className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        name="is_public"
                                        checked={formData.is_public}
                                        onChange={handleChange}
                                        disabled={loading || loadingData}
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
                                    {formData.is_public ? (
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

                            <div className={styles.formGroup}>
                                <label>
                                    <MdLanguage /> Programming Languages <span className={styles.required}>*</span>
                                </label>
                                {errors.language_ids && <span className={styles.errorText}>{errors.language_ids}</span>}
                                <small className={styles.helpText}>
                                    Select all programming languages used in this task
                                </small>

                                <div className={styles.selectionGrid}>
                                    {loadingData ? (
                                        <div className={styles.loadingText}>Loading languages...</div>
                                    ) : languages.length === 0 ? (
                                        <div className={styles.emptyText}>No languages available</div>
                                    ) : (
                                        languages.map(language => (
                                            <button
                                                key={language.id}
                                                type="button"
                                                className={`${styles.selectionItem} ${formData.language_ids.includes(language.id) ? styles.selected : ""}`}
                                                onClick={() => handleLanguageSelect(language.id)}
                                                disabled={loading}
                                            >
                                                <div className={styles.selectionIcon}>
                                                    <FaPalette style={{ color: language.color }} />
                                                </div>
                                                <div className={styles.selectionInfo}>
                                                    <span className={styles.selectionName}>{language.name}</span>
                                                    <span className={styles.selectionCode}>{language.code}</span>
                                                </div>
                                                {formData.language_ids.includes(language.id) && <FaTimes className={styles.removeIcon} />}
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label>
                                    <MdCode /> Frameworks & Libraries
                                </label>
                                <small className={styles.helpText}>
                                    Optional: Select frameworks and libraries used
                                </small>

                                <div className={styles.selectionGrid}>
                                    {loadingData ? (
                                        <div className={styles.loadingText}>Loading frameworks...</div>
                                    ) : frameworks.length === 0 ? (
                                        <div className={styles.emptyText}>No frameworks available</div>
                                    ) : (
                                        frameworks.map(framework => (
                                            <button
                                                key={framework.id}
                                                type="button"
                                                className={`${styles.selectionItem} ${formData.framework_ids.includes(framework.id) ? styles.selected : ""}`}
                                                onClick={() => handleFrameworkSelect(framework.id)}
                                                disabled={loading}
                                            >
                                                <div className={styles.selectionIcon}>
                                                    <MdCode />
                                                </div>
                                                <div className={styles.selectionInfo}>
                                                    <span className={styles.selectionName}>{framework.name}</span>
                                                    <span className={styles.selectionLanguage}>{framework.language?.name}</span>
                                                </div>
                                                {formData.framework_ids.includes(framework.id) && <FaTimes className={styles.removeIcon} />}
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className={styles.selectedCounts}>
                                <div className={styles.countItem}>
                                    <span className={styles.countLabel}>Languages:</span>
                                    <span className={styles.countValue}>{formData.language_ids.length} selected</span>
                                </div>
                                <div className={styles.countItem}>
                                    <span className={styles.countLabel}>Frameworks:</span>
                                    <span className={styles.countValue}>{formData.framework_ids.length} selected</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.formActions}>
                        <button
                            type="button"
                            className={styles.secondaryBtn}
                            onClick={clearForm}
                            disabled={loading || loadingData}
                        >
                            Clear Form
                        </button>
                        <div className={styles.primaryActions}>
                            <button
                                type="button"
                                className={styles.secondaryBtn}
                                onClick={() => navigate("/user/learning-tasks")}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <AsyncButton
                                type="submit"
                                className={styles.primaryBtn}
                                loading={loading || undefined}
                                disabled={loading || loadingData}
                            >
                                <FaCode /> Create Learning Task
                            </AsyncButton>
                        </div>
                    </div>
                </form>
            </SideBar>
        </div>
    );
}