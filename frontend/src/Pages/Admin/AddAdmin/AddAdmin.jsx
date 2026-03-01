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
    FaEnvelope,
    FaPhone,
    FaGraduationCap,
    FaFont,
    FaCode,
    FaUserTie
} from "react-icons/fa";
import {
    MdPerson,
    MdEmail,
    MdPhone,
    MdSchool,
    MdClass
} from "react-icons/md";
import styles from "./AddAdmin.module.css";
import { useNotifContext } from "../../../Context/NotifContext";

export default function AddAdmin() {
    const { user } = useUser()
    const navigate = useNavigate();
    const { updatePageTitle } = useNotifContext();
    useEffect(() => {
        if (!user?.isSuperUser) {
            navigate(-1)
        }
        updatePageTitle("Add Administrator");
    }, []);

    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        grade: "",
        section: "",
        field: "",
        phone_number: "",
        account: "N/A", // Default as in backend POST
        is_superuser: false,
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [submitAction, setSubmitAction] = useState("add");

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
    };

    const validateForm = () => {
        const newErrors = {};

        // Email
        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Email is invalid";
        }

        // Full name
        if (!formData.full_name.trim()) {
            newErrors.full_name = "Full name is required";
        }

        // Grade
        if (!formData.grade) {
            newErrors.grade = "Grade is required";
        } else {
            const gradeNum = parseInt(formData.grade);
            if (isNaN(gradeNum) || gradeNum < 1 || gradeNum > 12) {
                newErrors.grade = "Grade must be between 1 and 12";
            }
        }

        // Section
        if (!formData.section) {
            newErrors.section = "Section is required";
        } else if (formData.section.length !== 1 || !/^[A-Za-z]$/.test(formData.section)) {
            newErrors.section = "Section must be a single letter (A-Z)";
        }

        // Field
        if (!formData.field) {
            newErrors.field = "Field is required";
        }

        // Phone number
        if (!formData.phone_number.trim()) {
            newErrors.phone_number = "Phone number is required";
        } else if (!/^[\d\s\-\+\(\)]+$/.test(formData.phone_number)) {
            newErrors.phone_number = "Phone number format is invalid";
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
            const adminData = {
                full_name: formData.full_name.trim(),
                email: formData.email.trim().toLowerCase(),
                grade: parseInt(formData.grade),
                section: formData.section.toUpperCase(),
                field: formData.field,
                phone_number: formData.phone_number.trim(),
                account: formData.account || "N/A",
                is_superuser: formData.is_superuser,
            };

            const response = await api.post("/api/management/admins/", adminData);

            neonToast.success("Administrator added successfully!", "success");

            if (submitAction === "saveAndNew") {
                setFormData({
                    full_name: "",
                    email: "",
                    grade: "",
                    section: "",
                    field: "",
                    phone_number: "",
                    account: "N/A",
                    is_superuser: false,
                });
                setErrors({});
                window.scrollTo(0, 0);
                neonToast.info("Form cleared. Add another administrator.", "info");
            } else {
                const adminId = response?.data?.id || response?.data?.admin?.id;
                if (adminId) {
                    navigate(`/admin/staff/${adminId}`);
                } else {
                    navigate("/admin/staff");
                }
            }
        } catch (error) {
            console.error("Error adding admin:", error?.response?.data || error);

            if (error.response?.status === 400) {
                if (error.response.data?.errors) {
                    // Backend returns { errors: { field: ["message"] } }
                    const backendErrors = error.response.data.errors;
                    const formattedErrors = {};
                    Object.keys(backendErrors).forEach(field => {
                        formattedErrors[field] = backendErrors[field][0];
                    });
                    setErrors(formattedErrors);
                    neonToast.error("Validation failed", "error");
                } else if (error.response.data?.email) {
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
                neonToast.error("Failed to add administrator. Please try again.", "error");
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
                        <button className={styles.backBtn} onClick={() => navigate("/admin/staff")}>
                            <FaArrowLeft /> Back to Administrators
                        </button>
                        <h1 className={styles.title}><FaUser /> Add New Administrator</h1>
                    </div>

                    <p className={styles.subtitle}>
                        Add a new admin or staff member. All fields are required.
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
                                        placeholder="Enter full name"
                                        className={errors.full_name ? styles.errorInput : ""}
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
                                        placeholder="admin@example.com"
                                        className={errors.email ? styles.errorInput : ""}
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
                                        placeholder="Optional"
                                    />
                                </div>
                                <small className={styles.helperText}>
                                    Defaults to "N/A" if left empty
                                </small>
                            </div>
                        </div>

                        <div className={styles.formSection}>
                            <h2 className={styles.sectionTitle}><MdSchool /> Academic & Role Information</h2>

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

                            <div className={styles.formGroup}>
                                <label htmlFor="is_superuser">
                                    <FaUserTie className={styles.checkboxIcon} /> Administrator Role
                                </label>
                                <div className={styles.toggleContainer}>
                                    <label className={styles.toggleLabel}>
                                        <span className={formData.is_superuser ? styles.inactiveRole : styles.activeRole}>Staff</span>
                                        <div className={styles.toggleSwitch}>
                                            <input
                                                type="checkbox"
                                                name="is_superuser"
                                                checked={formData.is_superuser}
                                                onChange={handleChange}
                                            />
                                            <span className={styles.toggleSlider}></span>
                                        </div>
                                        <span className={formData.is_superuser ? styles.activeRole : styles.inactiveRole}>Admin</span>
                                    </label>
                                    <small className={styles.helperText}>
                                        Toggle to switch between Staff (limited) and Admin (full access)
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.formActions}>
                        <button
                            type="button"
                            className={styles.secondaryBtn}
                            onClick={() => navigate("/admin/staff")}
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
                                <FaUser /> Add Administrator
                            </AsyncButton>
                        </div>
                    </div>
                </form>
            </SideBar>
        </div>
    );
}