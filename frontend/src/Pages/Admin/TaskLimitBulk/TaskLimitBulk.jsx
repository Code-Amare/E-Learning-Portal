import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../../Context/UserContext";
import api from "../../../Utils/api";
import { neonToast } from "../../../Components/NeonToast/NeonToast";
import AsyncButton from "../../../Components/AsyncButton/AsyncButton";
import SideBar from "../../../Components/SideBar/SideBar";
import ConfirmAction from "../../../Components/ConfirmAction/ConfirmAction";
import {
    FaArrowLeft,
    FaSave,
    FaTasks,
    FaUsers,
    FaExclamationTriangle
} from "react-icons/fa";
import {
    MdSettings,
    MdArrowUpward,
    MdArrowDownward
} from "react-icons/md";
import styles from "./TaskLimitBulk.module.css";
import { useNotifContext } from "../../../Context/NotifContext";

export default function TaskLimitBulk() {
    const navigate = useNavigate();
    const { updatePageTitle } = useNotifContext()
    useEffect(() => {
        updatePageTitle("Task Limit Bulk Operation")
    }, [])
    const [formData, setFormData] = useState({
        operation: "set",
        value: "",
        scope: "all",
        grade: "",
        section: "",
        field: "",
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [stats, setStats] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: "" }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.value.trim()) {
            newErrors.value = "Value is required";
        } else if (isNaN(formData.value)) {
            newErrors.value = "Value must be a number";
        } else {
            const numValue = parseInt(formData.value);
            if (numValue < 0) newErrors.value = "Value cannot be negative";
            if (numValue > 300) newErrors.value = "Value cannot exceed 300";
        }

        if (formData.scope === "by_grade" && !formData.grade) {
            newErrors.grade = "Grade is required";
        }

        if (formData.scope === "by_field" && !formData.field) {
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
            const payload = {
                operation: formData.operation,
                value: parseInt(formData.value),
                scope: formData.scope,
                ...(formData.scope === "by_grade" && { grade: formData.grade }),
                ...(formData.scope === "by_field" && { field: formData.field }),
                ...(formData.section && { section: formData.section }),
            };

            const response = await api.post("/api/management/task-limits/bulk-update/", payload);


            neonToast.success(
                `Successfully updated ${response.data.total_users} users' task limits`,
                "success"
            );

            setStats(response.data);

            // Reset form
            setFormData({
                operation: "set",
                value: "",
                scope: "all",
                grade: "",
                section: "",
                field: "",
            });
        } catch (error) {
            if (error.response.data?.no_user) {
                neonToast.warning("No users found with the selected filters.")
                return
            }
            if (error.response?.data?.detail) {
                neonToast.error(error.response.data.detail, "error");
            } else {
                neonToast.error("Failed to update task limits", "error");
            }
        } finally {
            setLoading(false);
        }
    };

    const getOperationDescription = () => {
        const value = parseInt(formData.value) || 0;
        const scopeText = getScopeText();

        switch (formData.operation) {
            case "set":
                return `Set task limit to ${value} for ${scopeText}`;
            case "increment":
                return `Increase task limit by ${value} for ${scopeText}`;
            case "decrement":
                return `Decrease task limit by ${value} for ${scopeText}`;
            default:
                return "";
        }
    };

    const getScopeText = () => {
        switch (formData.scope) {
            case "all":
                return "all users";
            case "active":
                return "active users only";
            case "inactive":
                return "inactive users only";
            case "by_grade":
                return `Grade ${formData.grade} users${formData.section ? ` Section ${formData.section}` : ""}`;
            case "by_field":
                return `${formData.field} field users`;
            default:
                return "";
        }
    };

    const resetForm = () => {
        setFormData({
            operation: "set",
            value: "",
            scope: "all",
            grade: "",
            section: "",
            field: "",
        });
        setStats(null);
        setErrors({});
    };

    return (
        <div className={styles.container}>
            <SideBar>
                <div className={styles.header}>
                    <div className={styles.headerTop}>
                        <button
                            className={styles.backBtn}
                            onClick={() => navigate(-1)}
                        >
                            <FaArrowLeft /> Back to Dashboard
                        </button>
                        <div className={styles.headerActions}>
                            <button
                                className={styles.viewBtn}
                                onClick={() => navigate("/admin/students")}
                            >
                                <FaUsers /> View Students
                            </button>
                        </div>
                    </div>

                    <div className={styles.pageHeader}>
                        <div className={styles.pageIcon}>
                            <MdSettings size={48} />
                        </div>
                        <div className={styles.pageInfo}>
                            <h1 className={styles.title}>
                                <FaTasks /> Bulk Task Limit Management
                            </h1>
                            <div className={styles.pageDescription}>
                                Update task limits for multiple users at once.
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.content}>
                    <div className={styles.formSection}>
                        <h2 className={styles.sectionTitle}>
                            <MdSettings /> Update Configuration
                        </h2>

                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.formGrid}>
                                <div className={styles.operationSection}>
                                    <h3 className={styles.subsectionTitle}>Operation Type</h3>

                                    <div className={styles.operationButtons}>
                                        <button
                                            type="button"
                                            className={`${styles.operationBtn} ${formData.operation === "set" ? styles.activeOperation : ""}`}
                                            onClick={() => setFormData(prev => ({ ...prev, operation: "set" }))}
                                        >
                                            <MdSettings />
                                            <span>Set to Value</span>
                                            <small>Overwrite all limits</small>
                                        </button>

                                        <button
                                            type="button"
                                            className={`${styles.operationBtn} ${formData.operation === "increment" ? styles.activeOperation : ""}`}
                                            onClick={() => setFormData(prev => ({ ...prev, operation: "increment" }))}
                                        >
                                            <MdArrowUpward />
                                            <span>Increase By</span>
                                            <small>Add to current limits</small>
                                        </button>

                                        <button
                                            type="button"
                                            className={`${styles.operationBtn} ${formData.operation === "decrement" ? styles.activeOperation : ""}`}
                                            onClick={() => setFormData(prev => ({ ...prev, operation: "decrement" }))}
                                        >
                                            <MdArrowDownward />
                                            <span>Decrease By</span>
                                            <small>Subtract from current limits</small>
                                        </button>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="value">
                                            {formData.operation === "set" ? "New Task Limit" :
                                                formData.operation === "increment" ? "Increase Amount" :
                                                    "Decrease Amount"} *
                                        </label>
                                        <div className={styles.inputWithIcon}>
                                            <FaTasks className={styles.inputIcon} />
                                            <input
                                                type="number"
                                                id="value"
                                                name="value"
                                                value={formData.value}
                                                onChange={handleChange}
                                                placeholder="Enter value"
                                                min="0"
                                                max="300"
                                                className={errors.value ? styles.errorInput : ""}
                                                required
                                            />
                                        </div>
                                        {errors.value && (
                                            <span className={styles.errorText}>{errors.value}</span>
                                        )}
                                        <small className={styles.helperText}>
                                            Must be between 0 and 300
                                        </small>
                                    </div>
                                </div>

                                <div className={styles.scopeSection}>
                                    <h3 className={styles.subsectionTitle}>Scope of Update</h3>

                                    <div className={styles.scopeButtons}>
                                        <button
                                            type="button"
                                            className={`${styles.scopeBtn} ${formData.scope === "all" ? styles.activeScope : ""}`}
                                            onClick={() => setFormData(prev => ({ ...prev, scope: "all" }))}
                                        >
                                            <FaUsers />
                                            <span>All Users</span>
                                        </button>

                                        <button
                                            type="button"
                                            className={`${styles.scopeBtn} ${formData.scope === "active" ? styles.activeScope : ""}`}
                                            onClick={() => setFormData(prev => ({ ...prev, scope: "active" }))}
                                        >
                                            <FaUsers />
                                            <span>Active Only</span>
                                        </button>

                                        <button
                                            type="button"
                                            className={`${styles.scopeBtn} ${formData.scope === "inactive" ? styles.activeScope : ""}`}
                                            onClick={() => setFormData(prev => ({ ...prev, scope: "inactive" }))}
                                        >
                                            <FaUsers />
                                            <span>Inactive Only</span>
                                        </button>
                                    </div>

                                    <div className={styles.formRow}>
                                        <div className={styles.formGroup}>
                                            <label htmlFor="scope">Filter By</label>
                                            <select
                                                id="scope"
                                                name="scope"
                                                value={formData.scope}
                                                onChange={handleChange}
                                                className={styles.scopeSelect}
                                            >
                                                <option value="all">All Users</option>
                                                <option value="active">Active Users Only</option>
                                                <option value="inactive">Inactive Users Only</option>
                                                <option value="by_grade">By Grade</option>
                                                <option value="by_field">By Field</option>
                                            </select>
                                        </div>
                                    </div>

                                    {formData.scope === "by_grade" && (
                                        <div className={styles.formRow}>
                                            <div className={styles.formGroup}>
                                                <label htmlFor="grade">Grade *</label>
                                                <select
                                                    id="grade"
                                                    name="grade"
                                                    value={formData.grade}
                                                    onChange={handleChange}
                                                    className={errors.grade ? styles.errorInput : ""}
                                                    required
                                                >
                                                    <option value="">Select Grade</option>
                                                    {[...Array(12)].map((_, i) => (
                                                        <option key={i + 1} value={i + 1}>
                                                            Grade {i + 1}
                                                        </option>
                                                    ))}
                                                </select>
                                                {errors.grade && (
                                                    <span className={styles.errorText}>{errors.grade}</span>
                                                )}
                                            </div>

                                            <div className={styles.formGroup}>
                                                <label htmlFor="section">Section (Optional)</label>
                                                <select
                                                    id="section"
                                                    name="section"
                                                    value={formData.section}
                                                    onChange={handleChange}
                                                >
                                                    <option value="">All Sections</option>
                                                    {[...Array(8)].map((_, i) => (
                                                        <option key={i} value={String.fromCharCode(65 + i)}>
                                                            Section {String.fromCharCode(65 + i)}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    {formData.scope === "by_field" && (
                                        <div className={styles.formGroup}>
                                            <label htmlFor="field">Field *</label>
                                            <select
                                                id="field"
                                                name="field"
                                                value={formData.field}
                                                onChange={handleChange}
                                                className={errors.field ? styles.errorInput : ""}
                                                required
                                            >
                                                <option value="">Select Field</option>
                                                <option value="frontend">Frontend</option>
                                                <option value="backend">Backend</option>
                                                <option value="ai">AI</option>
                                                <option value="embadded">Embedded</option>
                                                <option value="cyber">Cyber</option>
                                                <option value="other">Other</option>
                                            </select>
                                            {errors.field && (
                                                <span className={styles.errorText}>{errors.field}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={styles.operationSummary}>
                                <div className={styles.summaryCard}>
                                    <h4><FaExclamationTriangle /> Operation Summary</h4>
                                    <p>{getOperationDescription()}</p>
                                </div>
                            </div>

                            <div className={styles.formActions}>
                                <button
                                    type="button"
                                    className={styles.secondaryBtn}
                                    onClick={resetForm}
                                    disabled={loading}
                                >
                                    Reset Form
                                </button>

                                <div className={styles.primaryActions}>
                                    <ConfirmAction
                                        title="Confirm Bulk Update"
                                        message={`You are about to ${formData.operation} task limits by ${formData.value} for ${getScopeText()}. This action cannot be undone.`}
                                        confirmText="Apply Changes"
                                        cancelText="Cancel"
                                        onConfirm={handleSubmit}
                                    >
                                        <AsyncButton
                                            type="submit"
                                            className={styles.primaryBtn}
                                            loading={loading}
                                            disabled={loading || !formData.value || Object.keys(errors).length > 0}
                                        >
                                            <FaSave /> Apply Changes
                                        </AsyncButton>
                                    </ConfirmAction>
                                </div>
                            </div>
                        </form>
                    </div>

                    {stats && (
                        <div className={styles.resultsSection}>
                            <h2 className={styles.sectionTitle}>
                                <FaTasks /> Update Results
                            </h2>
                            <div className={styles.statsGrid}>
                                <div className={styles.statCard}>
                                    <div className={styles.statValue}>{stats.updated_count}</div>
                                    <div className={styles.statLabel}>Users Updated</div>
                                </div>
                                <div className={styles.statCard}>
                                    <div className={styles.statValue}>{stats.skipped_count || 0}</div>
                                    <div className={styles.statLabel}>Users Skipped</div>
                                </div>
                                <div className={styles.statCard}>
                                    <div className={styles.statValue}>
                                        {stats.previous_avg?.toFixed(1) || 0}
                                    </div>
                                    <div className={styles.statLabel}>Previous Average</div>
                                </div>
                                <div className={styles.statCard}>
                                    <div className={styles.statValue}>
                                        {stats.new_avg?.toFixed(1) || 0}
                                    </div>
                                    <div className={styles.statLabel}>New Average</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </SideBar>
        </div>
    );
}
