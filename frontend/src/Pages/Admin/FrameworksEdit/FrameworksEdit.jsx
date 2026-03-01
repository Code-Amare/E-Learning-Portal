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
    FaTrash,
    FaSave,
    FaLanguage
} from "react-icons/fa";
import {
    MdEdit,
    MdCode,
    MdLanguage
} from "react-icons/md";
import styles from "./FrameworksEdit.module.css";
import { useNotifContext } from "../../../Context/NotifContext";

export default function FrameworksEdit() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user } = useUser();

    const [framework, setFramework] = useState({
        language_id: "",
        name: ""
    });

    const [languages, setLanguages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [errors, setErrors] = useState({});
    const [originalData, setOriginalData] = useState(null);
    const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
    const [deleteError, setDeleteError] = useState("");
    const { updatePageTitle } = useNotifContext()
    useEffect(() => {
        updatePageTitle("Edit Framework")
    }, [])

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        setFetching(true);
        try {
            // Fetch framework data
            const frameworkResponse = await api.get(`/api/management/frameworks/${id}/`);
            const frameworkData = {
                language_id: frameworkResponse.data.language?.id || "",
                name: frameworkResponse.data.name || ""
            };
            setFramework(frameworkData);
            setOriginalData(frameworkData);

            // Fetch languages for dropdown
            const languagesResponse = await api.get("/api/management/languages/");
            setLanguages(languagesResponse.data);
        } catch (error) {
            console.error("Error fetching data:", error);
            neonToast.error("Failed to load framework data", "error");
            navigate("/admin/frameworks");
        } finally {
            setFetching(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFramework(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!framework.language_id) newErrors.language_id = "Please select a language";
        if (!framework.name.trim()) newErrors.name = "Framework name is required";
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
            const frameworkData = {
                language_id: parseInt(framework.language_id),
                name: framework.name.trim()
            };

            await api.patch(`/api/management/frameworks/edit/${id}/`, frameworkData);
            neonToast.success("Framework updated successfully!", "success");
            navigate("/admin/frameworks");

        } catch (error) {
            console.error("Error updating framework:", error?.response?.data || error);
            if (error.response?.data?.error) {
                neonToast.error(error.response.data.error, "error");
            } else if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
                neonToast.error("Please fix the errors in the form", "error");
            } else if (error.response?.data?.non_field_errors) {
                neonToast.error(error.response.data.non_field_errors[0], "error");
            } else {
                neonToast.error(
                    error.response?.data?.detail || "Failed to update framework",
                    "error"
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteFramework = async () => {
        // Clear previous errors
        setDeleteError("");

        // Validate the confirmation text
        if (deleteConfirmationText !== framework.name) {
            setDeleteError(`Please type "${framework.name}" exactly to confirm deletion.`);
            return false;
        }

        try {
            await api.delete(`/api/management/frameworks/delete/${id}/`);
            neonToast.success("Framework deleted successfully", "success");
            navigate("/admin/frameworks");
            return true;
        } catch (error) {
            console.error("Error deleting framework:", error);
            neonToast.error("Failed to delete framework", "error");
            return false;
        }
    };

    const hasChanges = () => {
        if (!originalData) return false;
        return (
            framework.language_id !== originalData.language_id ||
            framework.name !== originalData.name
        );
    };

    // Reset delete confirmation when modal opens/closes
    const handleDeleteModalOpen = () => {
        setDeleteConfirmationText("");
        setDeleteError("");
    };

    if (fetching) {
        return (
            <div className={styles.container}>
                <SideBar>
                    <div className={styles.loadingContainer}>
                        <div className={styles.loadingSpinner}></div>
                        <p>Loading framework data...</p>
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
                        <button className={styles.backBtn} onClick={() => navigate("/admin/frameworks")}>
                            <FaArrowLeft /> Back to Frameworks
                        </button>
                        <h1 className={styles.title}>
                            <MdEdit /> Edit Framework: {originalData?.name}
                        </h1>
                    </div>
                    <p className={styles.subtitle}>
                        Edit the details of this framework. Make changes and save or delete the framework.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formSection}>
                        <h2 className={styles.sectionTitle}>
                            <FaCode /> Framework Information
                        </h2>

                        {hasChanges() && (
                            <div className={styles.changesIndicator}>
                                <span>You have unsaved changes</span>
                            </div>
                        )}

                        <div className={styles.formGroup}>
                            <label htmlFor="language_id">
                                Programming Language <span className={styles.required}>*</span>
                            </label>
                            <div className={styles.inputWithIcon}>
                                <MdLanguage className={styles.inputIcon} />
                                <select
                                    id="language_id"
                                    name="language_id"
                                    value={framework.language_id}
                                    onChange={handleChange}
                                    className={errors.language_id ? styles.errorInput : ""}
                                    disabled={loading || fetching}
                                    required
                                >
                                    <option value="">Select a language...</option>
                                    {languages.map(lang => (
                                        <option key={lang.id} value={lang.id}>
                                            {lang.name} ({lang.code})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {errors.language_id && <span className={styles.errorText}>{errors.language_id}</span>}
                            {errors.language && <span className={styles.errorText}>{errors.language}</span>}
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="name">
                                Framework Name <span className={styles.required}>*</span>
                            </label>
                            <div className={styles.inputWithIcon}>
                                <MdCode className={styles.inputIcon} />
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={framework.name}
                                    onChange={handleChange}
                                    placeholder="e.g., React, Django, Spring Boot"
                                    className={errors.name ? styles.errorInput : ""}
                                    required
                                    disabled={loading}
                                />
                            </div>
                            {errors.name && <span className={styles.errorText}>{errors.name}</span>}
                            <small className={styles.helpText}>Name of the framework or library</small>
                        </div>
                    </div>

                    <div className={styles.formActions}>
                        <div className={styles.leftActions}>
                            <button
                                type="button"
                                className={styles.secondaryBtn}
                                onClick={() => navigate("/admin/frameworks")}
                                disabled={loading}
                            >
                                Cancel
                            </button>

                            <ConfirmAction
                                onConfirm={handleDeleteFramework}
                                onOpen={handleDeleteModalOpen}
                                title="Delete Framework"
                                message={
                                    <div className={styles.deleteConfirmation}>
                                        <p>Are you sure you want to delete <strong>"{framework.name}"</strong>? This action cannot be undone.</p>
                                        <p className={styles.warningText}>
                                            <strong>Warning:</strong> This will permanently delete the framework and all associated data.
                                        </p>
                                        <div className={styles.confirmationInputGroup}>
                                            <label htmlFor="deleteConfirmation">
                                                Type <strong>"{framework.name}"</strong> to confirm:
                                            </label>
                                            <input
                                                type="text"
                                                id="deleteConfirmation"
                                                value={deleteConfirmationText}
                                                onChange={(e) => {
                                                    setDeleteConfirmationText(e.target.value);
                                                    setDeleteError("");
                                                }}
                                                placeholder={`Type "${framework.name}" here`}
                                                className={`${styles.confirmationInput} ${deleteError ? styles.errorInput : ""}`}
                                                autoComplete="off"
                                            />
                                            {deleteError && (
                                                <span className={styles.errorText}>{deleteError}</span>
                                            )}
                                        </div>
                                    </div>
                                }
                                confirmText="Delete Framework"
                                cancelText="Cancel"
                                confirmButtonProps={{
                                    disabled: deleteConfirmationText !== framework.name
                                }}
                            >
                                <button
                                    type="button"
                                    className={styles.dangerBtn}
                                    disabled={loading}
                                >
                                    <FaTrash /> Delete Framework
                                </button>
                            </ConfirmAction>
                        </div>

                        <div className={styles.rightActions}>
                            <AsyncButton
                                type="submit"
                                className={styles.primaryBtn}
                                loading={loading}
                                disabled={loading || !hasChanges()}
                            >
                                <FaSave /> Update Framework
                            </AsyncButton>
                        </div>
                    </div>
                </form>
            </SideBar>
        </div>
    );
}