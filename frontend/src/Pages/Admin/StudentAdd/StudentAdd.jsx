import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../../Context/UserContext";
import api from "../../../Utils/api";
import { neonToast } from "../../../Components/NeonToast/NeonToast";
import AsyncButton from "../../../Components/AsyncButton/AsyncButton";
import SideBar from "../../../Components/SideBar/SideBar";
import {
    FaArrowLeft,
    FaUser,
    FaDownload,
    FaUpload
} from "react-icons/fa";
import {
    MdPerson,
    MdEmail,
    MdPhone,
    MdSchool,
    MdClass
} from "react-icons/md";
import styles from "./StudentAdd.module.css";
import { useNotifContext } from "../../../Context/NotifContext";

export default function StudentAdd() {
    const navigate = useNavigate();
    const { updatePageTitle } = useNotifContext()
    useEffect(() => {
        updatePageTitle("Add Student")
    }, [])
    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        grade: "",
        section: "",
        field: "",
        phone_number: "",
        account: "", // This is optional, will default to "N/A"
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [submitAction, setSubmitAction] = useState("add");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
    };

    const validateForm = () => {
        const newErrors = {};

        // All these fields are REQUIRED based on your Profile model
        if (!formData.full_name.trim()) newErrors.full_name = "Full name is required";
        if (!formData.email.trim()) newErrors.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email is invalid";

        if (!formData.grade) newErrors.grade = "Grade is required";
        else if (isNaN(formData.grade) || formData.grade < 1 || formData.grade > 12)
            newErrors.grade = "Grade must be a number between 1-12";

        if (!formData.section) newErrors.section = "Section is required";
        else if (formData.section.length !== 1 || !/^[A-Za-z]$/.test(formData.section))
            newErrors.section = "Section must be a single letter (A-Z)";

        if (!formData.field) newErrors.field = "Field is required";

        if (!formData.phone_number.trim()) newErrors.phone_number = "Phone number is required";
        else if (!/^[\d\s\-\+\(\)]+$/.test(formData.phone_number))
            newErrors.phone_number = "Phone number is invalid";

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
            // Prepare data exactly as your backend expects
            const studentData = {
                full_name: formData.full_name.trim(),
                email: formData.email.trim().toLowerCase(),
                grade: parseInt(formData.grade),
                section: formData.section.toUpperCase(), // Store as uppercase
                field: formData.field,
                phone_number: formData.phone_number.trim(),
                account: formData.account.trim() || "N/A", // Optional, default to "N/A"
            };

            // Use the correct endpoint from your routes
            const response = await api.post("/api/management/students/create/", studentData);

            neonToast.success("Student added successfully!", "success");

            if (submitAction === "saveAndNew") {
                // Reset form for new entry
                setFormData({
                    full_name: "",
                    email: "",
                    grade: "",
                    section: "",
                    field: "",
                    phone_number: "",
                    account: "",
                });
                setErrors({});
                window.scrollTo(0, 0);
                neonToast.info("Form cleared. Add another student.", "info");
            } else {
                // Navigate to student detail or list
                const studentId = response?.data?.id || response?.data?.student?.id;
                if (studentId) {
                    navigate(`/admin/student/${studentId}`);
                } else {
                    navigate("/admin/students");
                }
            }
        } catch (error) {
            console.error("Error adding student:", error?.response?.data || error);

            if (error.response?.status === 400) {
                // Handle validation errors from backend
                if (error.response.data?.email) {
                    setErrors({ email: error.response.data.email[0] });
                    neonToast.error(error.response.data.email[0], "error");
                } else if (error.response.data?.detail) {
                    neonToast.error(error.response.data.detail, "error");
                } else {
                    neonToast.error("Please check the form data", "error");
                }
            } else if (error.response?.data?.error) {
                neonToast.error(error.response.data.error, "error");
            } else {
                neonToast.error("Failed to add student. Please try again.", "error");
            }
        } finally {
            setLoading(false);
        }
    };

    // Download template function
    const downloadTemplate = async () => {
        try {
            const response = await api.get("/api/management/students/template/", {
                responseType: 'blob'
            });

            // Create a download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'student_template.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();

            neonToast.success("Template downloaded successfully!", "success");
        } catch (error) {
            console.error("Error downloading template:", error);
            neonToast.error("Failed to download template", "error");
        }
    };

    // Navigate to bulk upload
    const goToBulkUpload = () => {
        navigate("/admin/students/bulk");
    };

    return (
        <div className={styles.container}>
            <SideBar>
                <div className={styles.header}>
                    <div className={styles.headerTop}>
                        <button className={styles.backBtn} onClick={() => navigate("/admin/students")}>
                            <FaArrowLeft /> Back to Students
                        </button>
                        <h1 className={styles.title}><FaUser /> Add New Student</h1>
                    </div>

                    <div className={styles.headerActions}>
                        <button className={styles.templateBtn} onClick={downloadTemplate}>
                            <FaDownload /> Download Template
                        </button>
                        <button className={styles.uploadBtn} onClick={goToBulkUpload}>
                            <FaUpload /> Bulk Upload
                        </button>
                    </div>

                    <p className={styles.subtitle}>
                        Add a new student to the system. All fields are required except account.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGrid}>
                        <div className={styles.formSection}>
                            <h2 className={styles.sectionTitle}><MdPerson /> Personal Information</h2>

                            <div className={styles.formGroup}>
                                <label htmlFor="full_name">Full Name *</label>
                                <div className={styles.inputWithIcon}>
                                    <FaUser className={styles.inputIcon} />
                                    <input
                                        type="text"
                                        id="full_name"
                                        name="full_name"
                                        value={formData.full_name}
                                        onChange={handleChange}
                                        placeholder="Enter student's full name"
                                        className={errors.full_name ? styles.errorInput : ""}
                                        required
                                    />
                                </div>
                                {errors.full_name && <span className={styles.errorText}>{errors.full_name}</span>}
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="email">Email Address *</label>
                                <div className={styles.inputWithIcon}>
                                    <MdEmail className={styles.inputIcon} />
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="student@example.com"
                                        className={errors.email ? styles.errorInput : ""}
                                        required
                                    />
                                </div>
                                {errors.email && <span className={styles.errorText}>{errors.email}</span>}
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="phone_number">Phone Number *</label>
                                <div className={styles.inputWithIcon}>
                                    <MdPhone className={styles.inputIcon} />
                                    <input
                                        type="tel"
                                        id="phone_number"
                                        name="phone_number"
                                        value={formData.phone_number}
                                        onChange={handleChange}
                                        placeholder="+1234567890"
                                        className={errors.phone_number ? styles.errorInput : ""}
                                        required
                                    />
                                </div>
                                {errors.phone_number && <span className={styles.errorText}>{errors.phone_number}</span>}
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="account">Account Identifier</label>
                                <div className={styles.inputWithIcon}>
                                    <MdPerson className={styles.inputIcon} />
                                    <input
                                        type="text"
                                        id="account"
                                        name="account"
                                        value={formData.account}
                                        onChange={handleChange}
                                        placeholder="Optional - leave empty for 'N/A'"
                                    />
                                </div>
                                <small className={styles.helperText}>
                                    Leave empty to use default value "N/A"
                                </small>
                            </div>
                        </div>

                        <div className={styles.formSection}>
                            <h2 className={styles.sectionTitle}><MdSchool /> Academic Information</h2>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label htmlFor="grade">Grade Level *</label>
                                    <div className={styles.inputWithIcon}>
                                        <MdSchool className={styles.inputIcon} />
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
                                    </div>
                                    {errors.grade && <span className={styles.errorText}>{errors.grade}</span>}
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="section">Section *</label>
                                    <div className={styles.inputWithIcon}>
                                        <MdClass className={styles.inputIcon} />
                                        <select
                                            id="section"
                                            name="section"
                                            value={formData.section}
                                            onChange={handleChange}
                                            className={errors.section ? styles.errorInput : ""}
                                            required
                                        >
                                            <option value="">Select Section</option>
                                            {[...Array(8)].map((_, i) => (
                                                <option key={i} value={String.fromCharCode(65 + i)}>
                                                    Section {String.fromCharCode(65 + i)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    {errors.section && <span className={styles.errorText}>{errors.section}</span>}
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="field">Field of Study *</label>
                                <div className={styles.inputWithIcon}>
                                    <MdClass className={styles.inputIcon} />
                                    <select
                                        id="field"
                                        name="field"
                                        value={formData.field}
                                        onChange={handleChange}
                                        className={errors.field ? styles.errorInput : ""}
                                        required
                                    >
                                        <option value="">Select field</option>
                                        <option value="frontend">Frontend</option>
                                        <option value="backend">Backend</option>
                                        <option value="ai">AI</option>
                                        <option value="embadded">Embedded</option>
                                        <option value="cyber">Cyber</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                {errors.field && <span className={styles.errorText}>{errors.field}</span>}
                            </div>
                        </div>
                    </div>

                    <div className={styles.formActions}>
                        <button
                            type="button"
                            className={styles.secondaryBtn}
                            onClick={() => navigate("/admin/students")}
                            disabled={loading}
                        >
                            Cancel
                        </button>

                        <div className={styles.primaryActions}>
                            <AsyncButton
                                type="button"
                                className={styles.secondaryBtn}
                                loading={loading}
                                disabled={loading}
                                onClick={() => {
                                    setSubmitAction("saveAndNew");
                                    setTimeout(() => {
                                        const form = document.querySelector(`.${styles.form}`);
                                        if (form) form.requestSubmit();
                                    }, 0);
                                }}
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
                                <FaUser /> Add Student
                            </AsyncButton>
                        </div>
                    </div>
                </form>
            </SideBar>
        </div>
    );
}