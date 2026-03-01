import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../../Context/UserContext";
import api from "../../../Utils/api";
import { neonToast } from "../../../Components/NeonToast/NeonToast";
import AsyncButton from "../../../Components/AsyncButton/AsyncButton";
import SideBar from "../../../Components/SideBar/SideBar";
import {
    FaArrowLeft,
    FaUpload,
    FaList,
    FaFileImport
} from "react-icons/fa";
import {
    MdAdd,
    MdDelete,
    MdCode,
    MdLanguage
} from "react-icons/md";
import styles from "./FrameworkAdd.module.css";
import { useNotifContext } from "../../../Context/NotifContext";

export default function FrameworkAdd() {
    const navigate = useNavigate();

    const [mode, setMode] = useState("single");
    const [languages, setLanguages] = useState([]);
    const [loadingLanguages, setLoadingLanguages] = useState(false);
    const [singleFramework, setSingleFramework] = useState({
        language_id: "",
        name: ""
    });

    const [bulkFrameworks, setBulkFrameworks] = useState([
        { language_id: "", name: "" }
    ]);

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [bulkError, setBulkError] = useState("");
    const [submitAction, setSubmitAction] = useState("add");
    const { updatePageTitle } = useNotifContext()
    useEffect(() => {
        updatePageTitle("Add Framework")
    }, [])

    // Fetch languages for dropdown
    useEffect(() => {
        fetchLanguages();
    }, []);

    const fetchLanguages = async () => {
        setLoadingLanguages(true);
        try {
            const response = await api.get("/api/management/languages/");
            setLanguages(response.data);
        } catch (error) {
            console.error("Error fetching languages:", error);
            neonToast.error("Failed to load languages", "error");
        } finally {
            setLoadingLanguages(false);
        }
    };

    const handleSingleChange = (e) => {
        const { name, value } = e.target;
        setSingleFramework(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
    };

    const handleBulkChange = (index, e) => {
        const { name, value } = e.target;
        const updatedFrameworks = [...bulkFrameworks];
        updatedFrameworks[index][name] = value;
        setBulkFrameworks(updatedFrameworks);
    };

    const addBulkFrameworkRow = () => {
        setBulkFrameworks([...bulkFrameworks, { language_id: "", name: "" }]);
    };

    const removeBulkFrameworkRow = (index) => {
        if (bulkFrameworks.length > 1) {
            const updatedFrameworks = bulkFrameworks.filter((_, i) => i !== index);
            setBulkFrameworks(updatedFrameworks);
        }
    };

    const validateSingleForm = () => {
        const newErrors = {};
        if (!singleFramework.language_id) newErrors.language_id = "Please select a language";
        if (!singleFramework.name.trim()) newErrors.name = "Framework name is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateBulkForm = () => {
        const errors = [];

        bulkFrameworks.forEach((framework, index) => {
            if (!framework.language_id) {
                errors.push(`Row ${index + 1}: Please select a language`);
            }
            if (!framework.name.trim()) {
                errors.push(`Row ${index + 1}: Framework name is required`);
            }
        });

        // Check for duplicates within same language
        const frameworkMap = new Map();
        bulkFrameworks.forEach((framework, index) => {
            if (framework.language_id && framework.name.trim()) {
                const key = `${framework.language_id}-${framework.name.trim().toLowerCase()}`;
                if (frameworkMap.has(key)) {
                    errors.push(`Row ${index + 1}: Duplicate framework name for the same language`);
                } else {
                    frameworkMap.set(key, index);
                }
            }
        });

        setBulkError(errors.length > 0 ? errors.join(". ") : "");
        return errors.length === 0;
    };

    const handleSingleSubmit = async (e) => {
        e.preventDefault();
        if (!validateSingleForm()) {
            neonToast.error("Please fix the errors in the form", "error");
            return;
        }

        setLoading(true);
        try {
            const frameworkData = {
                language_id: parseInt(singleFramework.language_id),
                name: singleFramework.name.trim()
            };


            await api.post("/api/management/frameworks/create/", frameworkData);

            neonToast.success("Framework added successfully!", "success");

            if (submitAction === "saveAndNew") {
                setSingleFramework({
                    language_id: "",
                    name: ""
                });
                setErrors({});
                window.scrollTo(0, 0);
                neonToast.info("Form cleared. Add another framework.", "info");
            } else {
                navigate("/admin/frameworks");
            }
        } catch (error) {
            console.error("Error adding framework:", error?.response?.data || error);
            if (error.response?.data?.error) {
                neonToast.error(error.response.data.error, "error");
            } else if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
                neonToast.error("Please fix the errors in the form", "error");
            } else if (error.response?.data?.non_field_errors) {
                neonToast.error(error.response.data.non_field_errors[0], "error");
            } else if (error.response?.data?.detail) {
                neonToast.error(error.response.data.detail, "error");
            } else {
                neonToast.error(
                    error.response?.data?.error || "Failed to add framework",
                    "error"
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const handleBulkSubmit = async (e) => {
        e.preventDefault();
        if (!validateBulkForm()) {
            neonToast.error("Please fix the errors in the form", "error");
            return;
        }

        setLoading(true);
        try {
            const frameworksData = bulkFrameworks.map(framework => ({
                language_id: parseInt(framework.language_id),
                name: framework.name.trim()
            }));


            const response = await api.post("/api/management/frameworks/bulk/", frameworksData);

            neonToast.success(`${frameworksData.length} framework(s) added successfully!`, "success");

            if (submitAction === "saveAndNew") {
                setBulkFrameworks([{ language_id: "", name: "" }]);
                setBulkError("");
                window.scrollTo(0, 0);
                neonToast.info("Form cleared. Add more frameworks.", "info");
            } else {
                navigate("/admin/frameworks");
            }
        } catch (error) {
            console.error("Error adding frameworks in bulk:", error?.response?.data || error);
            if (error.response?.data?.error) {
                neonToast.error(error.response.data.error, "error");
            } else if (error.response?.data?.errors) {
                const errorMessages = error.response.data.errors.map(err =>
                    typeof err === 'object' ? JSON.stringify(err) : err
                ).join('. ');
                setBulkError(errorMessages);
                neonToast.error("Please fix the errors in the form", "error");
            } else if (error.response?.data?.detail) {
                neonToast.error(error.response.data.detail, "error");
            } else {
                neonToast.error(
                    "Failed to add frameworks. Please check your data.",
                    "error"
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const parseBulkInput = (text) => {
        const lines = text.split('\n').filter(line => line.trim() !== '');
        const parsedFrameworks = lines.map(line => {
            const parts = line.split(',').map(part => part.trim());

            // Find language by name or code
            let languageId = "";
            if (parts[0]) {
                const foundLanguage = languages.find(lang =>
                    lang.name.toLowerCase() === parts[0].toLowerCase() ||
                    lang.code.toLowerCase() === parts[0].toLowerCase()
                );
                if (foundLanguage) {
                    languageId = foundLanguage.id;
                }
            }

            return {
                language_id: languageId,
                name: parts[1] || ""
            };
        });

        if (parsedFrameworks.length > 0) {
            setBulkFrameworks(parsedFrameworks);
        }
    };

    return (
        <div className={styles.container}>
            <SideBar>
                <div className={styles.header}>
                    <div className={styles.headerTop}>
                        <button className={styles.backBtn} onClick={() => navigate("/admin/frameworks")}>
                            <FaArrowLeft /> Back to Frameworks
                        </button>
                        <h1 className={styles.title}>
                            <MdCode /> Add Frameworks
                        </h1>
                    </div>
                    <p className={styles.subtitle}>
                        Add new frameworks to the system. Frameworks must be associated with a programming language.
                    </p>
                </div>

                <div className={styles.modeSelector}>
                    <button
                        className={`${styles.modeBtn} ${mode === "single" ? styles.activeMode : ""}`}
                        onClick={() => setMode("single")}
                        type="button"
                    >
                        <MdAdd /> Single Framework
                    </button>
                    <button
                        className={`${styles.modeBtn} ${mode === "bulk" ? styles.activeMode : ""}`}
                        onClick={() => setMode("bulk")}
                        type="button"
                    >
                        <FaUpload /> Bulk Upload
                    </button>
                </div>

                {mode === "single" ? (
                    <form onSubmit={handleSingleSubmit} className={styles.form}>
                        <div className={styles.formSection}>
                            <h2 className={styles.sectionTitle}>
                                <MdCode /> Framework Information
                            </h2>

                            <div className={styles.formGroup}>
                                <label htmlFor="language_id">
                                    Programming Language <span className={styles.required}>*</span>
                                </label>
                                <div className={styles.inputWithIcon}>
                                    <MdLanguage className={styles.inputIcon} />
                                    <select
                                        id="language_id"
                                        name="language_id"
                                        value={singleFramework.language_id}
                                        onChange={handleSingleChange}
                                        className={errors.language_id ? styles.errorInput : ""}
                                        disabled={loadingLanguages}
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
                                {loadingLanguages && (
                                    <small className={styles.helpText}>Loading languages...</small>
                                )}
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="name">
                                    Framework Name <span className={styles.required}>*</span>
                                </label>
                                <div className={styles.inputWithIcon}>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={singleFramework.name}
                                        onChange={handleSingleChange}
                                        placeholder="e.g., React, Django, Spring Boot"
                                        className={errors.name ? styles.errorInput : ""}
                                        required
                                    />
                                </div>
                                {errors.name && <span className={styles.errorText}>{errors.name}</span>}
                                <small className={styles.helpText}>Name of the framework or library</small>
                            </div>
                        </div>

                        <div className={styles.formActions}>
                            <button
                                type="button"
                                className={styles.secondaryBtn}
                                onClick={() => navigate("/admin/frameworks")}
                                disabled={loading || loadingLanguages}
                            >
                                Cancel
                            </button>

                            <div className={styles.primaryActions}>
                                <AsyncButton
                                    type="submit"
                                    className={styles.secondaryBtn}
                                    loading={loading}
                                    disabled={loading || loadingLanguages}
                                    onClick={() => setSubmitAction("saveAndNew")}
                                >
                                    Save & Add Another
                                </AsyncButton>

                                <AsyncButton
                                    type="submit"
                                    className={styles.primaryBtn}
                                    loading={loading}
                                    disabled={loading || loadingLanguages}
                                    onClick={() => setSubmitAction("add")}
                                >
                                    <MdAdd /> Add Framework
                                </AsyncButton>
                            </div>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleBulkSubmit} className={styles.form}>
                        <div className={styles.formSection}>
                            <h2 className={styles.sectionTitle}><FaUpload /> Bulk Upload Frameworks</h2>

                            <div className={styles.bulkHelp}>
                                <p>Enter multiple frameworks below, or use the text area to paste in bulk format.</p>
                                <p className={styles.formatHint}>
                                    <strong>Format:</strong> Each framework on a new line, or comma-separated: LanguageName/FrameworkName
                                    <br />
                                    <small>Example: JavaScript/React, Python/Django, Java/Spring Boot</small>
                                </p>
                                <div className={styles.bulkImport}>
                                    <textarea
                                        className={styles.bulkTextarea}
                                        placeholder={`JavaScript,React\nPython,Django\nJava,Spring Boot`}
                                        rows="4"
                                        onChange={(e) => parseBulkInput(e.target.value)}
                                        disabled={loadingLanguages}
                                    />
                                    <button
                                        type="button"
                                        className={styles.importBtn}
                                        onClick={() => parseBulkInput(document.querySelector(`.${styles.bulkTextarea}`).value)}
                                        disabled={loadingLanguages}
                                    >
                                        <FaFileImport /> Import
                                    </button>
                                </div>
                            </div>

                            <div className={styles.bulkTableContainer}>
                                <div className={styles.bulkTableHeader}>
                                    <span>Programming Language <span className={styles.required}>*</span></span>
                                    <span>Framework Name <span className={styles.required}>*</span></span>
                                    <span>Actions</span>
                                </div>

                                {bulkFrameworks.map((framework, index) => (
                                    <div key={index} className={styles.bulkRow}>
                                        <div className={styles.bulkInputGroup}>
                                            <select
                                                name="language_id"
                                                value={framework.language_id}
                                                onChange={(e) => handleBulkChange(index, e)}
                                                className={framework.language_id ? "" : styles.errorInput}
                                                disabled={loadingLanguages}
                                                required
                                            >
                                                <option value="">Select language...</option>
                                                {languages.map(lang => (
                                                    <option key={lang.id} value={lang.id}>
                                                        {lang.name} ({lang.code})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className={styles.bulkInputGroup}>
                                            <input
                                                type="text"
                                                name="name"
                                                value={framework.name}
                                                onChange={(e) => handleBulkChange(index, e)}
                                                placeholder="Framework name"
                                                className={!framework.name.trim() ? styles.errorInput : ""}
                                                required
                                            />
                                        </div>
                                        <div className={styles.bulkActions}>
                                            {bulkFrameworks.length > 1 && (
                                                <button
                                                    type="button"
                                                    className={styles.removeBtn}
                                                    onClick={() => removeBulkFrameworkRow(index)}
                                                    title="Remove row"
                                                >
                                                    <MdDelete />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    className={styles.addRowBtn}
                                    onClick={addBulkFrameworkRow}
                                    disabled={loadingLanguages}
                                >
                                    <MdAdd /> Add Another Row
                                </button>
                            </div>

                            {bulkError && (
                                <div className={styles.bulkError}>
                                    {bulkError}
                                </div>
                            )}

                            <div className={styles.bulkStats}>
                                <FaList /> Total Frameworks: {bulkFrameworks.length}
                            </div>
                        </div>

                        <div className={styles.formActions}>
                            <button
                                type="button"
                                className={styles.secondaryBtn}
                                onClick={() => navigate("/admin/frameworks")}
                                disabled={loading || loadingLanguages}
                            >
                                Cancel
                            </button>

                            <div className={styles.primaryActions}>
                                <AsyncButton
                                    type="submit"
                                    className={styles.secondaryBtn}
                                    loading={loading}
                                    disabled={loading || loadingLanguages}
                                    onClick={() => setSubmitAction("saveAndNew")}
                                >
                                    Save & Add More
                                </AsyncButton>

                                <AsyncButton
                                    type="submit"
                                    className={styles.primaryBtn}
                                    loading={loading}
                                    disabled={loading || loadingLanguages}
                                    onClick={() => setSubmitAction("add")}
                                >
                                    <FaUpload /> Add {bulkFrameworks.length} Framework{bulkFrameworks.length !== 1 ? 's' : ''}
                                </AsyncButton>
                            </div>
                        </div>
                    </form>
                )}
            </SideBar>
        </div>
    );
}