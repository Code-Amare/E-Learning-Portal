import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../../Context/UserContext";
import api from "../../../Utils/api";
import { neonToast } from "../../../Components/NeonToast/NeonToast";
import AsyncButton from "../../../Components/AsyncButton/AsyncButton";
import SideBar from "../../../Components/SideBar/SideBar";
import {
    FaArrowLeft,
    FaLanguage,
    FaUpload,
    FaList,
    FaFileImport,
    FaPalette
} from "react-icons/fa";
import {
    MdLanguage,
    MdCode,
    MdAdd,
    MdDelete
} from "react-icons/md";
import styles from "./LanguagesAdd.module.css";
import { useNotifContext } from "../../../Context/NotifContext";

export default function LanguagesAdd() {
    const navigate = useNavigate();
    const { user } = useUser();

    const [mode, setMode] = useState("single");
    const [singleLanguage, setSingleLanguage] = useState({
        name: "",
        code: "",
        color: "#3b82f6"
    });
    const { updatePageTitle } = useNotifContext()
    useEffect(() => {
        updatePageTitle("Add Language")
    }, [])

    const [bulkLanguages, setBulkLanguages] = useState([
        { name: "", code: "", color: "#3b82f6" }
    ]);

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [bulkError, setBulkError] = useState("");
    const [submitAction, setSubmitAction] = useState("add");

    const handleSingleChange = (e) => {
        const { name, value } = e.target;
        setSingleLanguage(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
    };

    const handleBulkChange = (index, e) => {
        const { name, value } = e.target;
        const updatedLanguages = [...bulkLanguages];
        updatedLanguages[index][name] = value;
        setBulkLanguages(updatedLanguages);
    };

    const addBulkLanguageRow = () => {
        setBulkLanguages([...bulkLanguages, { name: "", code: "", color: "#3b82f6" }]);
    };

    const removeBulkLanguageRow = (index) => {
        if (bulkLanguages.length > 1) {
            const updatedLanguages = bulkLanguages.filter((_, i) => i !== index);
            setBulkLanguages(updatedLanguages);
        }
    };

    const validateSingleForm = () => {
        const newErrors = {};
        if (!singleLanguage.name.trim()) newErrors.name = "Language name is required";
        if (!singleLanguage.code.trim()) newErrors.code = "Language code is required";
        if (singleLanguage.code.trim() && singleLanguage.code.length > 10)
            newErrors.code = "Code must be 10 characters or less";
        if (singleLanguage.color && !/^#[0-9A-F]{6}$/i.test(singleLanguage.color))
            newErrors.color = "Color must be a valid hex code (e.g., #3b82f6)";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateBulkForm = () => {
        const errors = [];

        bulkLanguages.forEach((lang, index) => {
            if (!lang.name.trim()) {
                errors.push(`Row ${index + 1}: Language name is required`);
            }
            if (!lang.code.trim()) {
                errors.push(`Row ${index + 1}: Language code is required`);
            }
            if (lang.code.trim() && lang.code.length > 10) {
                errors.push(`Row ${index + 1}: Code must be 10 characters or less`);
            }
            if (lang.color && !/^#[0-9A-F]{6}$/i.test(lang.color)) {
                errors.push(`Row ${index + 1}: Color must be a valid hex code`);
            }
        });

        const codes = bulkLanguages.map(lang => lang.code.trim().toLowerCase());
        const duplicateCodes = codes.filter((code, index) => codes.indexOf(code) !== index);
        if (duplicateCodes.length > 0) {
            errors.push("Duplicate language codes found");
        }

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
            const languageData = {
                name: singleLanguage.name,
                code: singleLanguage.code,
                color: singleLanguage.color
            };

            await api.post("/api/management/languages/create/", languageData);

            neonToast.success("Language added successfully!", "success");

            if (submitAction === "saveAndNew") {
                setSingleLanguage({
                    name: "",
                    code: "",
                    color: "#3b82f6"
                });
                setErrors({});
                window.scrollTo(0, 0);
                neonToast.info("Form cleared. Add another language.", "info");
            } else {
                navigate("/admin/languages");
            }
        } catch (error) {
            console.error("Error adding language:", error?.response?.data || error);
            if (error.response?.data?.error) {
                neonToast.error(error.response.data.error, "error");
            } else if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
                neonToast.error("Please fix the errors in the form", "error");
            } else {
                neonToast.error(
                    error.response?.data?.detail || "Failed to add language",
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
            const languagesData = bulkLanguages.map(lang => ({
                name: lang.name,
                code: lang.code,
                color: lang.color
            }));

            const response = await api.post("/api/management/languages/bulk/", languagesData);

            neonToast.success(`${languagesData.length} language(s) added successfully!`, "success");

            if (submitAction === "saveAndNew") {
                setBulkLanguages([{ name: "", code: "", color: "#3b82f6" }]);
                setBulkError("");
                window.scrollTo(0, 0);
                neonToast.info("Form cleared. Add more languages.", "info");
            } else {
                navigate("/admin/languages");
            }
        } catch (error) {
            console.error("Error adding languages in bulk:", error?.response?.data || error);
            if (error.response?.data?.error) {
                neonToast.error(error.response.data.error, "error");
            } else if (error.response?.data?.errors) {
                const errorMessages = error.response.data.errors.map(err =>
                    typeof err === 'object' ? JSON.stringify(err) : err
                ).join('. ');
                setBulkError(errorMessages);
                neonToast.error("Please fix the errors in the form", "error");
            } else {
                neonToast.error(
                    error.response?.data?.detail || "Failed to add languages",
                    "error"
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const parseBulkInput = (text) => {
        const lines = text.split('\n').filter(line => line.trim() !== '');
        const parsedLanguages = lines.map(line => {
            const parts = line.split(',').map(part => part.trim());
            return {
                name: parts[0] || "",
                code: parts[1] || "",
                color: parts[2] || "#3b82f6"
            };
        });

        if (parsedLanguages.length > 0) {
            setBulkLanguages(parsedLanguages);
        }
    };

    const handleColorChange = (e) => {
        const { name, value } = e.target;
        setSingleLanguage(prev => ({ ...prev, [name]: value }));
    };

    const handleBulkColorChange = (index, e) => {
        const { name, value } = e.target;
        const updatedLanguages = [...bulkLanguages];
        updatedLanguages[index][name] = value;
        setBulkLanguages(updatedLanguages);
    };

    return (
        <div className={styles.container}>
            <SideBar>
                <div className={styles.header}>
                    <div className={styles.headerTop}>
                        <button className={styles.backBtn} onClick={() => navigate("/admin/languages")}>
                            <FaArrowLeft /> Back to Languages
                        </button>
                        <h1 className={styles.title}>
                            <FaLanguage /> Add Languages
                        </h1>
                    </div>
                    <p className={styles.subtitle}>
                        Add new programming languages to the system. Choose between single or bulk mode.
                    </p>
                </div>

                <div className={styles.modeSelector}>
                    <button
                        className={`${styles.modeBtn} ${mode === "single" ? styles.activeMode : ""}`}
                        onClick={() => setMode("single")}
                        type="button"
                    >
                        <MdAdd /> Single Language
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
                                <MdLanguage /> Language Information
                            </h2>

                            <div className={styles.formGroup}>
                                <label htmlFor="name">
                                    Language Name <span className={styles.required}>*</span>
                                </label>
                                <div className={styles.inputWithIcon}>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={singleLanguage.name}
                                        onChange={handleSingleChange}
                                        placeholder="e.g., Python, JavaScript, Java"
                                        className={errors.name ? styles.errorInput : ""}
                                        required
                                    />
                                </div>
                                {errors.name && <span className={styles.errorText}>{errors.name}</span>}
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="code">
                                    Language Code <span className={styles.required}>*</span>
                                </label>
                                <div className={styles.inputWithIcon}>
                                    <input
                                        type="text"
                                        id="code"
                                        name="code"
                                        value={singleLanguage.code}
                                        onChange={handleSingleChange}
                                        placeholder="e.g., PY, JS, JAVA"
                                        className={errors.code ? styles.errorInput : ""}
                                        maxLength="10"
                                        required
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
                                            backgroundColor: singleLanguage.color,
                                            boxShadow: `0 2px 8px ${singleLanguage.color}40`
                                        }}
                                    >
                                        <FaPalette className={styles.colorIcon} />
                                    </div>
                                    <div className={styles.hexInputContainer}>
                                        <input
                                            type="text"
                                            id="color"
                                            name="color"
                                            value={singleLanguage.color.replace('#', '')}
                                            onChange={(e) => {
                                                const value = e.target.value.startsWith('#')
                                                    ? e.target.value
                                                    : `#${e.target.value}`;
                                                handleColorChange({ target: { name: 'color', value } });
                                            }}
                                            placeholder="3b82f6"
                                            className={`${styles.colorInput} ${errors.color ? styles.errorInput : ""}`}
                                            maxLength="6"
                                            required
                                        />
                                    </div>
                                    <div className={styles.colorPickerBtn}>
                                        <FaPalette />
                                        <input
                                            type="color"
                                            id="colorPicker"
                                            name="color"
                                            value={singleLanguage.color}
                                            onChange={handleColorChange}
                                            className={styles.colorPickerInput}
                                        />
                                    </div>
                                </div>
                                <small className={styles.helpText}>Hex color code (e.g., 3b82f6 or #3b82f6)</small>
                                {errors.color && <span className={styles.errorText}>{errors.color}</span>}
                            </div>
                        </div>

                        <div className={styles.formActions}>
                            <button
                                type="button"
                                className={styles.secondaryBtn}
                                onClick={() => navigate("/admin/languages")}
                                disabled={loading}
                            >
                                Cancel
                            </button>

                            <div className={styles.primaryActions}>
                                <AsyncButton
                                    type="submit"
                                    className={styles.secondaryBtn}
                                    loading={loading}
                                    disabled={loading}
                                    onClick={() => setSubmitAction("saveAndNew")}
                                >
                                    Save & Add Another
                                </AsyncButton>

                                <AsyncButton
                                    type="submit"
                                    className={styles.primaryBtn}
                                    loading={loading}
                                    disabled={loading}
                                    onClick={() => setSubmitAction("add")}
                                >
                                    <FaLanguage /> Add Language
                                </AsyncButton>
                            </div>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleBulkSubmit} className={styles.form}>
                        <div className={styles.formSection}>
                            <h2 className={styles.sectionTitle}><FaUpload /> Bulk Upload Languages</h2>

                            <div className={styles.bulkHelp}>
                                <p>Enter multiple languages below, or use the text area to paste in bulk format.</p>
                                <p className={styles.formatHint}>
                                    <strong>Format:</strong> Each language on a new line, or comma-separated: Name,Code,Color
                                </p>
                                <div className={styles.bulkImport}>
                                    <textarea
                                        className={styles.bulkTextarea}
                                        placeholder={`JavaScript,JS,#f7df1e\nPython,PY,#306998\nJava,JAVA,#007396`}
                                        rows="4"
                                        onChange={(e) => parseBulkInput(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className={styles.importBtn}
                                        onClick={() => parseBulkInput(document.querySelector(`.${styles.bulkTextarea}`).value)}
                                    >
                                        <FaFileImport /> Import
                                    </button>
                                </div>
                            </div>

                            <div className={styles.bulkTableContainer}>
                                <div className={styles.bulkTableHeader}>
                                    <span>Language Name <span className={styles.required}>*</span></span>
                                    <span>Code <span className={styles.required}>*</span></span>
                                    <span>Color <span className={styles.required}>*</span></span>
                                    <span>Actions</span>
                                </div>

                                {bulkLanguages.map((language, index) => (
                                    <div key={index} className={styles.bulkRow}>
                                        <div className={styles.bulkInputGroup}>
                                            <input
                                                type="text"
                                                name="name"
                                                value={language.name}
                                                onChange={(e) => handleBulkChange(index, e)}
                                                placeholder="Language name"
                                                required
                                            />
                                        </div>
                                        <div className={styles.bulkInputGroup}>
                                            <input
                                                type="text"
                                                name="code"
                                                value={language.code}
                                                onChange={(e) => handleBulkChange(index, e)}
                                                placeholder="Code (max 10)"
                                                maxLength="10"
                                                required
                                            />
                                        </div>
                                        <div className={styles.bulkInputGroup}>
                                            <div className={styles.bulkColorInput}>
                                                <div
                                                    className={styles.bulkColorPreview}
                                                    style={{ backgroundColor: language.color }}
                                                />
                                                <div className={styles.bulkHexInput}>
                                                    <span className={styles.bulkHexPrefix}>#</span>
                                                    <input
                                                        type="text"
                                                        name="color"
                                                        value={language.color.replace('#', '')}
                                                        onChange={(e) => {
                                                            const value = e.target.value.startsWith('#')
                                                                ? e.target.value
                                                                : `#${e.target.value}`;
                                                            handleBulkColorChange(index, {
                                                                target: { name: 'color', value }
                                                            });
                                                        }}
                                                        placeholder="3b82f6"
                                                        maxLength="6"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className={styles.bulkActions}>
                                            {bulkLanguages.length > 1 && (
                                                <button
                                                    type="button"
                                                    className={styles.removeBtn}
                                                    onClick={() => removeBulkLanguageRow(index)}
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
                                    onClick={addBulkLanguageRow}
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
                                <FaList /> Total Languages: {bulkLanguages.length}
                            </div>
                        </div>

                        <div className={styles.formActions}>
                            <button
                                type="button"
                                className={styles.secondaryBtn}
                                onClick={() => navigate("/admin/languages")}
                                disabled={loading}
                            >
                                Cancel
                            </button>

                            <div className={styles.primaryActions}>
                                <AsyncButton
                                    type="submit"
                                    className={styles.secondaryBtn}
                                    loading={loading}
                                    disabled={loading}
                                    onClick={() => setSubmitAction("saveAndNew")}
                                >
                                    Save & Add More
                                </AsyncButton>

                                <AsyncButton
                                    type="submit"
                                    className={styles.primaryBtn}
                                    loading={loading}
                                    disabled={loading}
                                    onClick={() => setSubmitAction("add")}
                                >
                                    <FaUpload /> Add {bulkLanguages.length} Language{bulkLanguages.length !== 1 ? 's' : ''}
                                </AsyncButton>
                            </div>
                        </div>
                    </form>
                )}
            </SideBar>
        </div>
    );
}