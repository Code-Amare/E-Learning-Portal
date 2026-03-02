import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../../Context/UserContext";
import api from "../../../Utils/api";
import { neonToast } from "../../../Components/NeonToast/NeonToast";
import AsyncButton from "../../../Components/AsyncButton/AsyncButton";
import SideBar from "../../../Components/SideBar/SideBar";
import {
    FaArrowLeft,
    FaSave,
    FaBook,
    FaLink,
    FaAlignLeft,
    FaStickyNote,
    FaTag
} from "react-icons/fa";
import { MdClass } from "react-icons/md";
import styles from "./CreateCourse.module.css";
import { useNotifContext } from "../../../Context/NotifContext";

export default function CreateCourse() {
    const navigate = useNavigate();
    const { user } = useUser();
    const { updatePageTitle } = useNotifContext();

    useEffect(() => {
        updatePageTitle("Create Course");
    }, []);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        short_note: "",
        youtube_link: "",
        field: "",
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // Field options – adjust as needed based on your backend choices
    const fieldOptions = [
        { value: "frontend", label: "Frontend" },
        { value: "backend", label: "Backend" },
        { value: "ai", label: "AI" },
        { value: "embedded", label: "Embedded" },
        { value: "cyber", label: "Cyber" },
        { value: "other", label: "Other" },
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error for this field if it exists
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: "" }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = "Title is required";
        }

        if (!formData.description.trim()) {
            newErrors.description = "Description is required";
        }

        if (!formData.short_note.trim()) {
            newErrors.short_note = "Short note is required";
        }

        if (!formData.youtube_link.trim()) {
            newErrors.youtube_link = "YouTube link is required";
        } else {
            // Simple YouTube URL validation (allow typical formats)
            const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
            if (!youtubeRegex.test(formData.youtube_link)) {
                newErrors.youtube_link = "Please enter a valid YouTube URL";
            }
        }

        if (!formData.field) {
            newErrors.field = "Field is required";
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
            // POST to the create endpoint
            const response = await api.post("/api/courses/create/", formData);

            neonToast.success("Course created successfully!", "success");

            // Navigate to courses list (adjust path as needed)
            navigate("/admin/courses");
        } catch (error) {
            console.error("Error creating course:", error);

            if (error.response?.status === 400) {
                // Handle validation errors from backend
                const backendErrors = error.response.data || {};
                const newErrors = {};

                // Assuming backend returns field-specific errors in a similar format
                Object.keys(backendErrors).forEach(key => {
                    if (backendErrors[key] && Array.isArray(backendErrors[key])) {
                        newErrors[key] = backendErrors[key][0];
                    } else if (backendErrors[key] && typeof backendErrors[key] === "string") {
                        newErrors[key] = backendErrors[key];
                    }
                });

                if (Object.keys(newErrors).length > 0) {
                    setErrors(newErrors);
                    const firstErrorKey = Object.keys(newErrors)[0];
                    neonToast.error(newErrors[firstErrorKey], "error");
                } else if (error.response.data?.detail) {
                    neonToast.error(error.response.data.detail, "error");
                } else {
                    neonToast.error("Please check the form data", "error");
                }
            } else if (error.response?.status === 403) {
                neonToast.error("You don't have permission to create courses", "error");
            } else if (error.response?.data?.detail) {
                neonToast.error(error.response.data.detail, "error");
            } else {
                neonToast.error("Failed to create course. Please try again.", "error");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <SideBar>
                <div className={styles.header}>
                    <div className={styles.headerTop}>
                        <button
                            className={styles.backBtn}
                            onClick={() => navigate("/admin/courses")}
                        >
                            <FaArrowLeft /> Back to Courses
                        </button>
                    </div>

                    <div className={styles.pageHeader}>
                        <h1 className={styles.title}>
                            <FaBook /> Create New Course
                        </h1>
                        <p className={styles.subtitle}>
                            Fill in the details below to add a new course to the platform.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formCard}>
                        <div className={styles.formSection}>
                            <h2 className={styles.sectionTitle}>
                                <FaBook /> Course Information
                            </h2>

                            <div className={styles.formGroup}>
                                <label htmlFor="title">
                                    Course Title <span className={styles.required}>*</span>
                                </label>
                                <div className={styles.inputWithIcon}>
                                    <FaTag className={styles.inputIcon} />
                                    <input
                                        type="text"
                                        id="title"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        placeholder="e.g., Introduction to React"
                                        className={errors.title ? styles.errorInput : ""}
                                    />
                                </div>
                                {errors.title && (
                                    <span className={styles.errorText}>{errors.title}</span>
                                )}
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="field">
                                    Field of Study <span className={styles.required}>*</span>
                                </label>
                                <div className={styles.inputWithIcon}>
                                    <MdClass className={styles.inputIcon} />
                                    <select
                                        id="field"
                                        name="field"
                                        value={formData.field}
                                        onChange={handleChange}
                                        className={errors.field ? styles.errorInput : ""}
                                    >
                                        <option value="">Select a field</option>
                                        {fieldOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {errors.field && (
                                    <span className={styles.errorText}>{errors.field}</span>
                                )}
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="short_note">
                                    Short Note <span className={styles.required}>*</span>
                                </label>
                                <div className={styles.inputWithIcon}>
                                    <FaStickyNote className={styles.inputIcon} />
                                    <input
                                        type="text"
                                        id="short_note"
                                        name="short_note"
                                        value={formData.short_note}
                                        onChange={handleChange}
                                        placeholder="A brief summary (max 200 characters)"
                                        className={errors.short_note ? styles.errorInput : ""}
                                    />
                                </div>
                                {errors.short_note && (
                                    <span className={styles.errorText}>{errors.short_note}</span>
                                )}
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="youtube_link">
                                    YouTube Link <span className={styles.required}>*</span>
                                </label>
                                <div className={styles.inputWithIcon}>
                                    <FaLink className={styles.inputIcon} />
                                    <input
                                        type="url"
                                        id="youtube_link"
                                        name="youtube_link"
                                        value={formData.youtube_link}
                                        onChange={handleChange}
                                        placeholder="https://youtube.com/watch?v=..."
                                        className={errors.youtube_link ? styles.errorInput : ""}
                                    />
                                </div>
                                {errors.youtube_link && (
                                    <span className={styles.errorText}>{errors.youtube_link}</span>
                                )}
                                <small className={styles.helperText}>
                                    Provide a valid YouTube video URL.
                                </small>
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="description">
                                    Description <span className={styles.required}>*</span>
                                </label>
                                <div className={styles.inputWithIcon}>
                                    <FaAlignLeft className={styles.inputIcon} />
                                    <textarea
                                        id="description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        placeholder="Full course description (what students will learn, prerequisites, etc.)"
                                        rows="5"
                                        className={errors.description ? styles.errorInput : ""}
                                    />
                                </div>
                                {errors.description && (
                                    <span className={styles.errorText}>{errors.description}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className={styles.formActions}>
                        <button
                            type="button"
                            className={styles.secondaryBtn}
                            onClick={() => navigate("/admin/courses")}
                            disabled={loading}
                        >
                            Cancel
                        </button>

                        <AsyncButton
                            type="submit"
                            className={styles.primaryBtn}
                            loading={loading}
                            disabled={loading}
                        >
                            <FaSave /> Create Course
                        </AsyncButton>
                    </div>
                </form>
            </SideBar>
        </div>
    );
}