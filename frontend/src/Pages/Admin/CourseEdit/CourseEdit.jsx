import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import styles from "./CourseEdit.module.css";
import { useNotifContext } from "../../../Context/NotifContext";

export default function CourseEdit() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user } = useUser();
    const { updatePageTitle } = useNotifContext();

    useEffect(() => {
        updatePageTitle("Edit Course");
    }, []);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        short_note: "",
        youtube_link: "",
        field: "",
    });
    const [originalData, setOriginalData] = useState(null);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [hasChanges, setHasChanges] = useState(false);

    const fieldOptions = [
        { value: "frontend", label: "Frontend" },
        { value: "backend", label: "Backend" },
        { value: "ai", label: "AI" },
        { value: "embedded", label: "Embedded" },
        { value: "cyber", label: "Cyber" },
        { value: "other", label: "Other" },
    ];

    useEffect(() => {
        if (user?.isAuthenticated === false) {
            navigate("/login");
            return;
        }
        fetchCourse();
    }, [id, user]);

    const fetchCourse = async () => {
        setFetching(true);
        try {
            const response = await api.get(`/api/courses/${id}/`);
            const course = response.data.course;
            setOriginalData(course);
            setFormData({
                title: course.title || "",
                description: course.description || "",
                short_note: course.short_note || "",
                youtube_link: course.youtube_link || "",
                field: course.field || "",
            });
        } catch (error) {
            console.error("Error fetching course:", error);
            if (error.response?.status === 404) {
                neonToast.error("Course not found", "error");
            } else {
                neonToast.error("Failed to load course data", "error");
            }
            navigate("/admin/courses");
        } finally {
            setFetching(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        // Check if changed from original
        if (originalData) {
            const isChanged = value !== originalData[name];
            setHasChanges((prev) => isChanged || prev);
        }

        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) newErrors.title = "Title is required";
        if (!formData.description.trim()) newErrors.description = "Description is required";
        if (!formData.short_note.trim()) newErrors.short_note = "Short note is required";
        if (!formData.youtube_link.trim()) {
            newErrors.youtube_link = "YouTube link is required";
        } else {
            const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
            if (!youtubeRegex.test(formData.youtube_link)) {
                newErrors.youtube_link = "Please enter a valid YouTube URL";
            }
        }
        if (!formData.field) newErrors.field = "Field is required";

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
            const response = await api.patch(`/api/courses/${id}/update/`, formData);
            neonToast.success("Course updated successfully!", "success");
            navigate(`/admin/courses/${id}`);
        } catch (error) {
            console.error("Error updating course:", error);
            if (error.response?.status === 400) {
                const backendErrors = error.response.data?.errors || {};
                const newErrors = {};
                Object.keys(backendErrors).forEach((key) => {
                    if (Array.isArray(backendErrors[key])) {
                        newErrors[key] = backendErrors[key][0];
                    } else if (typeof backendErrors[key] === "string") {
                        newErrors[key] = backendErrors[key];
                    }
                });
                if (Object.keys(newErrors).length > 0) {
                    setErrors(newErrors);
                    neonToast.error(Object.values(newErrors)[0], "error");
                } else {
                    neonToast.error("Please check the form data", "error");
                }
            } else if (error.response?.status === 403) {
                neonToast.error("You don't have permission to edit this course", "error");
            } else if (error.response?.data?.detail) {
                neonToast.error(error.response.data.detail, "error");
            } else {
                neonToast.error("Failed to update course. Please try again.", "error");
            }
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className={styles.container}>
                <SideBar>
                    <div className={styles.loadingContainer}>
                        <div className={styles.loadingSpinner}></div>
                        <p>Loading course data...</p>
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
                        <button
                            className={styles.backBtn}
                            onClick={() => navigate(`/admin/courses/${id}`)}
                        >
                            <FaArrowLeft /> Back to Course
                        </button>
                    </div>

                    <div className={styles.pageHeader}>
                        <h1 className={styles.title}>
                            <FaBook /> Edit Course: {formData.title}
                        </h1>
                        <p className={styles.subtitle}>
                            Update the course details below.
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
                                {errors.title && <span className={styles.errorText}>{errors.title}</span>}
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
                                        {fieldOptions.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {errors.field && <span className={styles.errorText}>{errors.field}</span>}
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
                                {errors.short_note && <span className={styles.errorText}>{errors.short_note}</span>}
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
                                {errors.youtube_link && <span className={styles.errorText}>{errors.youtube_link}</span>}
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
                                {errors.description && <span className={styles.errorText}>{errors.description}</span>}
                            </div>
                        </div>
                    </div>

                    <div className={styles.formActions}>
                        <button
                            type="button"
                            className={styles.secondaryBtn}
                            onClick={() => navigate(`/admin/courses/${id}`)}
                            disabled={loading}
                        >
                            Cancel
                        </button>

                        <AsyncButton
                            type="submit"
                            className={styles.primaryBtn}
                            loading={loading}
                            disabled={loading || !hasChanges}
                        >
                            <FaSave /> {hasChanges ? "Save Changes" : "No Changes"}
                        </AsyncButton>
                    </div>

                    {hasChanges && (
                        <div className={styles.unsavedChanges}>
                            <small>You have unsaved changes. Click "Save Changes" to update.</small>
                        </div>
                    )}
                </form>
            </SideBar>
        </div>
    );
}