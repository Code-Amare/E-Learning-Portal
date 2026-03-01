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
    FaLanguage,
    FaPalette,
    FaTrash,
    FaSave,
    FaCopy
} from "react-icons/fa";
import {
    MdLanguage,
    MdCode,
    MdEdit
} from "react-icons/md";
import styles from "./LanguagesEdit.module.css";
import { useNotifContext } from "../../../Context/NotifContext";

export default function LanguagesEdit() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [language, setLanguage] = useState({
        name: "",
        code: "",
        color: "#3b82f6"
    });

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [errors, setErrors] = useState({});
    const [originalData, setOriginalData] = useState(null);
    const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
    const [deleteError, setDeleteError] = useState("");
    const { updatePageTitle } = useNotifContext()
    useEffect(() => {
        updatePageTitle("Edit Language")
    }, [])

    useEffect(() => {
        fetchLanguageData();
    }, [id]);

    const fetchLanguageData = async () => {
        setFetching(true);
        try {
            const response = await api.get(`/api/management/languages/${id}/`);
            const data = {
                name: response.data.name || "",
                code: response.data.code || "",
                color: response.data.color || "#3b82f6"
            };
            setLanguage(data);
            setOriginalData(data);
        } catch (error) {
            console.error("Error fetching language:", error);
            neonToast.error("Failed to load language data", "error");
            navigate("/admin/languages");
        } finally {
            setFetching(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setLanguage(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!language.name.trim()) newErrors.name = "Language name is required";
        if (!language.code.trim()) newErrors.code = "Language code is required";
        if (language.code.trim() && language.code.length > 10)
            newErrors.code = "Code must be 10 characters or less";
        if (language.color && !/^#[0-9A-F]{6}$/i.test(language.color))
            newErrors.color = "Color must be a valid hex code (e.g., #3b82f6)";
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
            const languageData = {
                name: language.name,
                code: language.code,
                color: language.color
            };

            await api.patch(`/api/management/languages/edit/${id}/`, languageData);
            neonToast.success("Language updated successfully!", "success");
            navigate("/admin/languages");

        } catch (error) {
            console.error("Error updating language:", error?.response?.data || error);
            if (error.response?.data?.error) {
                neonToast.error(error.response.data.error, "error");
            } else if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
                neonToast.error("Please fix the errors in the form", "error");
            } else {
                neonToast.error(
                    error.response?.data?.detail || "Failed to update language",
                    "error"
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteLanguage = async () => {
        // Clear previous errors
        setDeleteError("");

        // Validate the confirmation text
        if (deleteConfirmationText !== language.name) {
            setDeleteError(`Please type "${language.name}" exactly to confirm deletion.`);
            return false;
        }

        try {
            await api.delete(`/api/management/languages/delete/${id}/`);
            neonToast.success("Language deleted successfully", "success");
            navigate("/admin/languages");
            return true;
        } catch (error) {
            console.error("Error deleting language:", error);
            neonToast.error("Failed to delete language", "error");
            return false;
        }
    };

    const handleColorChange = (e) => {
        const { name, value } = e.target;
        setLanguage(prev => ({ ...prev, [name]: value }));
    };

    const handleCopyColor = () => {
        navigator.clipboard.writeText(language.color)
            .then(() => {
                neonToast.success(`Color ${language.color} copied to clipboard`, "success");
            })
            .catch(err => {
                console.error("Failed to copy: ", err);
                neonToast.error("Failed to copy color", "error");
            });
    };

    const hasChanges = () => {
        if (!originalData) return false;
        return (
            language.name !== originalData.name ||
            language.code !== originalData.code ||
            language.color !== originalData.color
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
                        <p>Loading language data...</p>
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
                        <button className={styles.backBtn} onClick={() => navigate("/admin/languages")}>
                            <FaArrowLeft /> Back to Languages
                        </button>
                        <h1 className={styles.title}>
                            <MdEdit /> Edit Language: {originalData?.name}
                        </h1>
                    </div>
                    <p className={styles.subtitle}>
                        Edit the details of this programming language. Make changes and save or delete the language.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formSection}>
                        <h2 className={styles.sectionTitle}>
                            <MdLanguage /> Language Information
                        </h2>

                        <div className={styles.currentInfo}>
                            <div className={styles.currentColorDisplay}>
                                <div
                                    className={styles.currentColorPreview}
                                    style={{
                                        backgroundColor: language.color,
                                        boxShadow: `0 2px 8px ${language.color}40`
                                    }}
                                    title={`Click to copy ${language.color}`}
                                    onClick={handleCopyColor}
                                >
                                    <FaCopy className={styles.copyIcon} />
                                </div>
                                <span className={styles.currentColorText}>
                                    Current Color: <strong>{language.color.toUpperCase()}</strong>
                                </span>
                            </div>
                            {hasChanges() && (
                                <div className={styles.changesIndicator}>
                                    <span>You have unsaved changes</span>
                                </div>
                            )}
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="name">
                                Language Name <span className={styles.required}>*</span>
                            </label>
                            <div className={styles.inputWithIcon}>
                                <MdLanguage className={styles.inputIcon} />
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={language.name}
                                    onChange={handleChange}
                                    placeholder="e.g., Python, JavaScript, Java"
                                    className={errors.name ? styles.errorInput : ""}
                                    required
                                    disabled={loading}
                                />
                            </div>
                            {errors.name && <span className={styles.errorText}>{errors.name}</span>}
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="code">
                                Language Code <span className={styles.required}>*</span>
                            </label>
                            <div className={styles.inputWithIcon}>
                                <MdCode className={styles.inputIcon} />
                                <input
                                    type="text"
                                    id="code"
                                    name="code"
                                    value={language.code}
                                    onChange={handleChange}
                                    placeholder="e.g., PY, JS, JAVA"
                                    className={errors.code ? styles.errorInput : ""}
                                    maxLength="10"
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <small className={styles.helpText}>Short code (max 10 characters)</small>
                            {errors.code && <span className={styles.errorText}>{errors.code}</span>}
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="color">
                                Color <span className={styles.required}>*</span>
                            </label>
                            <div className={styles.colorInputGroup}>
                                <div
                                    className={styles.colorPreview}
                                    style={{
                                        backgroundColor: language.color,
                                        boxShadow: `0 2px 8px ${language.color}40`
                                    }}
                                >
                                    <FaPalette className={styles.colorIcon} />
                                </div>
                                <div className={styles.hexInputContainer}>
                                    <span className={styles.hexPrefix}>#</span>
                                    <input
                                        type="text"
                                        id="color"
                                        name="color"
                                        value={language.color.replace('#', '')}
                                        onChange={(e) => {
                                            const value = e.target.value.startsWith('#')
                                                ? e.target.value
                                                : `#${e.target.value}`;
                                            handleChange({ target: { name: 'color', value } });
                                        }}
                                        placeholder="3b82f6"
                                        className={`${styles.colorInput} ${errors.color ? styles.errorInput : ""}`}
                                        maxLength="6"
                                        required
                                        disabled={loading}
                                    />
                                </div>
                                <div className={styles.colorPickerBtn}>
                                    <FaPalette />
                                    <input
                                        type="color"
                                        id="colorPicker"
                                        name="color"
                                        value={language.color}
                                        onChange={handleColorChange}
                                        className={styles.colorPickerInput}
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                            <small className={styles.helpText}>Hex color code (e.g., 3b82f6 or #3b82f6)</small>
                            {errors.color && <span className={styles.errorText}>{errors.color}</span>}
                        </div>
                    </div>

                    <div className={styles.formActions}>
                        <div className={styles.leftActions}>
                            <button
                                type="button"
                                className={styles.secondaryBtn}
                                onClick={() => navigate("/admin/languages")}
                                disabled={loading}
                            >
                                Cancel
                            </button>

                            <ConfirmAction
                                onConfirm={handleDeleteLanguage}
                                onOpen={handleDeleteModalOpen}
                                title="Delete Language"
                                message={
                                    <div className={styles.deleteConfirmation}>
                                        <p>Are you sure you want to delete <strong>"{language.name}"</strong>? This action cannot be undone.</p>
                                        <p className={styles.warningText}>
                                            <strong>Warning:</strong> This will permanently delete the language and all associated data.
                                        </p>
                                        <div className={styles.confirmationInputGroup}>
                                            <label htmlFor="deleteConfirmation">
                                                Type <strong>"{language.name}"</strong> to confirm:
                                            </label>
                                            <input
                                                type="text"
                                                id="deleteConfirmation"
                                                value={deleteConfirmationText}
                                                onChange={(e) => {
                                                    setDeleteConfirmationText(e.target.value);
                                                    setDeleteError("");
                                                }}
                                                placeholder={`Type "${language.name}" here`}
                                                className={`${styles.confirmationInput} ${deleteError ? styles.errorInput : ""}`}
                                                autoComplete="off"
                                            />
                                            {deleteError && (
                                                <span className={styles.errorText}>{deleteError}</span>
                                            )}
                                        </div>
                                    </div>
                                }
                                confirmText="Delete Language"
                                cancelText="Cancel"
                                confirmButtonProps={{
                                    disabled: deleteConfirmationText !== language.name
                                }}
                            >
                                <button
                                    type="button"
                                    className={styles.dangerBtn}
                                    disabled={loading}
                                >
                                    <FaTrash /> Delete Language
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
                                <FaSave /> Update Language
                            </AsyncButton>
                        </div>
                    </div>
                </form>
            </SideBar>
        </div>
    );
}