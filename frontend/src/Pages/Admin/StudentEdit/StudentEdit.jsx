import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUser } from "../../../Context/UserContext";
import api from "../../../Utils/api";
import { neonToast } from "../../../Components/NeonToast/NeonToast";
import AsyncButton from "../../../Components/AsyncButton/AsyncButton";
import SideBar from "../../../Components/SideBar/SideBar";
import ConfirmAction from "../../../Components/ConfirmAction/ConfirmAction";
import {
    FaArrowLeft,
    FaUser,
    FaSave,
    FaTrash,
    FaTasks,
    FaCamera,
    FaTimes,
    FaEye
} from "react-icons/fa";
import {
    MdPerson,
    MdEmail,
    MdPhone,
    MdSchool,
    MdClass
} from "react-icons/md";
import styles from "./StudentEdit.module.css";
import { useNotifContext } from "../../../Context/NotifContext";

export default function StudentEdit() {
    const navigate = useNavigate();
    const { id } = useParams();
    const fileInputRef = useRef(null);
    const { updatePageTitle } = useNotifContext()
    useEffect(() => {
        updatePageTitle("Edit Student")
    }, [])

    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        gender: "",
        grade: "",
        section: "",
        field: "",
        phone_number: "",
        account: "",
        account_status: "active",
        task_limit: 0,
    });

    const [profilePic, setProfilePic] = useState(null);
    const [profilePicFile, setProfilePicFile] = useState(null);
    const [profilePicPreview, setProfilePicPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [errors, setErrors] = useState({});
    const [originalData, setOriginalData] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        fetchStudentData();
    }, [id]);

    const fetchStudentData = async () => {
        try {
            setFetching(true);
            const response = await api.get(`/api/management/student/data/${id}/`);

            let student;
            if (response.data && response.data.student) {
                student = response.data.student;
            } else if (response.data && response.data.id) {
                student = response.data;
            } else {
                throw new Error("Invalid response structure from server");
            }
            setOriginalData(student);

            // Get task limit from nested structure if available
            const taskLimit = student.task_limit?.limit || student.task_limit || 0;

            setFormData({
                full_name: student.full_name || "",
                email: student.email || "",
                gender: student.gender || "",
                grade: student.grade?.toString() || "",
                section: student.section || "",
                field: student.field || "",
                phone_number: student.phone_number || "",
                account: student.account || "",
                account_status: student.account_status || "active",
                task_limit: taskLimit,
            });

            // Set profile picture URL if available
            if (student.profile_pic_url) {
                setProfilePic(student.profile_pic_url);
                setProfilePicPreview(student.profile_pic_url);
            }

        } catch (error) {

            if (error.response?.status === 404) {
                neonToast.error("Student not found", "error");
                navigate("/admin/students");
            } else if (error.response?.data?.detail) {
                neonToast.error(error.response.data.detail, "error");
            } else {
                neonToast.error("Failed to load student data", "error");
            }

            navigate("/admin/students");
        } finally {
            setFetching(false);
        }
    };

    const handleProfilePicChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            neonToast.error("Profile picture must be less than 10MB", "error");
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            neonToast.error("Only image files are allowed", "error");
            return;
        }

        setProfilePicFile(file);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setProfilePicPreview(reader.result);
        };
        reader.readAsDataURL(file);

        setHasChanges(true);
        if (errors.profile_pic) {
            setErrors(prev => ({ ...prev, profile_pic: "" }));
        }
    };

    const removeProfilePic = () => {
        setProfilePicFile(null);
        setProfilePicPreview(profilePic); // Reset to original profile picture
        setHasChanges(true);
    };

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (originalData) {
            const originalTaskLimit = originalData.task_limit?.limit || originalData.task_limit || 0;

            const isChanged =
                (name === "full_name" && value !== originalData.full_name) ||
                (name === "email" && value !== originalData.email) ||
                (name === "gender" && value !== originalData.gender) ||
                (name === "grade" && value !== originalData.grade?.toString()) ||
                (name === "section" && value !== originalData.section) ||
                (name === "field" && value !== originalData.field) ||
                (name === "phone_number" && value !== originalData.phone_number) ||
                (name === "account" && value !== originalData.account) ||
                (name === "account_status" && value !== originalData.account_status) ||
                (name === "task_limit" && parseInt(value) !== originalTaskLimit);

            setHasChanges(prev => isChanged || prev);

        }

        if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.full_name.trim()) newErrors.full_name = "Full name is required";
        if (!formData.email.trim()) newErrors.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email is invalid";

        if (!formData.gender) newErrors.gender = "Gender is required";

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

        // Validate task limit
        if (isNaN(formData.task_limit))
            newErrors.task_limit = "Task limit must be a number";
        else if (parseInt(formData.task_limit) < 0)
            newErrors.task_limit = "Task limit cannot be negative";
        else if (parseInt(formData.task_limit) > 100)
            newErrors.task_limit = "Task limit cannot exceed 100";

        // Validate profile picture if new file is selected
        if (profilePicFile) {
            if (profilePicFile.size > 10 * 1024 * 1024) {
                newErrors.profile_pic = "Profile picture must be less than 10MB";
            }
            if (!profilePicFile.type.startsWith("image/")) {
                newErrors.profile_pic = "Only image files are allowed";
            }
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
            // Create FormData object to handle file upload
            const formDataToSend = new FormData();

            // Append all form fields
            formDataToSend.append("full_name", formData.full_name.trim());
            formDataToSend.append("email", formData.email.trim().toLowerCase());
            formDataToSend.append("gender", formData.gender);
            formDataToSend.append("grade", parseInt(formData.grade));
            formDataToSend.append("section", formData.section.toUpperCase());
            formDataToSend.append("field", formData.field);
            formDataToSend.append("phone_number", formData.phone_number.trim());
            formDataToSend.append("account", formData.account.trim() || "N/A");
            formDataToSend.append("account_status", formData.account_status);
            formDataToSend.append("task_limit", Number(formData.task_limit));


            // Append profile picture if selected
            if (profilePicFile) {
                formDataToSend.append("profile_pic", profilePicFile);
            }

            // Send request with FormData
            const response = await api.put(
                `/api/management/student/edit/${id}/`,
                formDataToSend,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            neonToast.success("Student updated successfully!", "success");
            setOriginalData(response.data);
            setHasChanges(false);

            // Update profile picture preview with new URL if returned
            if (response.data.user?.profile_pic_url) {
                setProfilePic(response.data.user.profile_pic_url);
                setProfilePicPreview(response.data.user.profile_pic_url);
            }

            // Clear the file input
            setProfilePicFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }

            navigate(`/admin/student/${id}`);

        } catch (error) {

            if (error.response?.status === 400) {
                const backendErrors = error.response.data?.errors || {};
                const newErrors = {};

                Object.keys(backendErrors).forEach(key => {
                    if (backendErrors[key] && backendErrors[key][0]) {
                        newErrors[key] = backendErrors[key][0];
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
            } else if (error.response?.status === 404) {
                neonToast.error("Student not found", "error");
            } else if (error.response?.data?.detail) {
                neonToast.error(error.response.data.detail, "error");
            } else if (error.response?.data?.error) {
                neonToast.error(error.response.data.error, "error");
            } else {
                neonToast.error("Failed to update student. Please try again.", "error");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (event, typedName) => {
        if (!originalData) return false;

        if (typedName !== originalData.full_name) {
            neonToast.error(
                `The name you typed does not match the student's full name. Please type "${originalData.full_name}" exactly to delete.`,
                "error"
            );
            return false;
        }

        setLoading(true);
        try {
            await api.delete(`/api/management/student/delete/${id}/`);
            neonToast.success("Student deleted successfully!", "success");
            navigate("/admin/students");
            return true;
        } catch (error) {

            if (error.response?.status === 404) {
                neonToast.error("Student not found", "error");
            } else if (error.response?.data?.detail) {
                neonToast.error(error.response.data.detail, "error");
            } else {
                neonToast.error("Failed to delete student", "error");
            }
            return false;
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
                        <p>Loading student data...</p>
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
                        <button className={styles.backBtn} onClick={() => navigate("/admin/students")}>
                            <FaArrowLeft /> Back to Students
                        </button>
                        <div className={styles.headerActions}>
                            <button
                                className={styles.viewBtn}
                                onClick={() => navigate(`/admin/student/${id}`)}
                            >
                                <FaEye /> View Student
                            </button>
                        </div>
                    </div>

                    <div className={styles.studentHeader}>
                        <div className={styles.studentAvatar}>
                            <div className={styles.profilePicCenter}>
                                <div className={styles.profilePicWrapper}>
                                    {profilePicPreview ? (
                                        <img
                                            src={profilePicPreview}
                                            alt="Profile preview"
                                            className={styles.profilePicImage}
                                        />
                                    ) : (
                                        <div className={styles.profilePicPlaceholder}>
                                            <FaUser size={32} />
                                        </div>
                                    )}
                                    {profilePicFile && (
                                        <button
                                            type="button"
                                            className={styles.removeProfilePicBtn}
                                            onClick={removeProfilePic}
                                            title="Remove selected image"
                                        >
                                            <FaTimes />
                                        </button>
                                    )}
                                </div>
                                <div className={styles.profilePicActions}>
                                    <button
                                        type="button"
                                        className={styles.uploadPicBtn}
                                        onClick={triggerFileInput}
                                    >
                                        <FaCamera /> {profilePicPreview ? "Change Picture" : "Upload Picture"}
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleProfilePicChange}
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                    />
                                    <small className={styles.helperText}>
                                        Max size: 10MB. Allowed: JPG, PNG, GIF, WEBP
                                    </small>
                                </div>
                            </div>
                        </div>
                        <div className={styles.studentInfo}>
                            <h1 className={styles.title}><FaUser /> Edit Student: {formData.full_name}</h1>
                            <div className={styles.studentMeta}>
                                <span className={styles.studentId}>ID: {id}</span>
                                <span className={`${styles.status} ${styles[formData.account_status]}`}>
                                    {formData.account_status === "active" ? "Active" : "Inactive"}
                                </span>
                                {formData.grade && (
                                    <span className={styles.gradeBadge}>
                                        <MdSchool /> Grade {formData.grade}
                                    </span>
                                )}
                                {formData.section && (
                                    <span className={styles.sectionBadge}>
                                        <MdClass /> Section {formData.section}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
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
                                <label htmlFor="gender">Gender *</label>
                                <div className={styles.inputWithIcon}>
                                    <FaUser className={styles.inputIcon} />
                                    <select
                                        id="gender"
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                        className={errors.gender ? styles.errorInput : ""}
                                        required
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                    </select>
                                </div>
                                {errors.gender && <span className={styles.errorText}>{errors.gender}</span>}
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

                            <div className={styles.formGroup}>
                                <label htmlFor="task_limit">Task Limit</label>
                                <div className={styles.inputWithIcon}>
                                    <FaTasks className={styles.inputIcon} />
                                    <input
                                        type="number"
                                        id="task_limit"
                                        name="task_limit"
                                        value={formData.task_limit ?? 0}
                                        onChange={(e) => {
                                            const value = e.target.value === "" ? 0 : Number(e.target.value); // always number
                                            setFormData(prev => ({ ...prev, task_limit: value }));

                                            // also update hasChanges flag
                                            if (originalData) {
                                                const originalTaskLimit = originalData.task_limit?.limit || originalData.task_limit || 0;
                                                setHasChanges(prev => value !== originalTaskLimit || prev);
                                            }

                                            if (errors.task_limit) setErrors(prev => ({ ...prev, task_limit: "" }));
                                        }}
                                        placeholder="0"
                                        min="0"
                                        max="300"
                                        className={errors.task_limit ? styles.errorInput : ""}
                                    />
                                </div>
                                {errors.task_limit && <span className={styles.errorText}>{errors.task_limit}</span>}
                                <small className={styles.helperText}>
                                    Maximum number of tasks allowed (0-100)
                                </small>
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="account_status">Account Status</label>
                                <div className={styles.inputWithIcon}>
                                    <select
                                        id="account_status"
                                        name="account_status"
                                        value={formData.account_status}
                                        onChange={handleChange}
                                        className={styles.statusSelect}
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                                <small className={styles.helperText}>
                                    {formData.account_status === "active"
                                        ? "Student can log in and access the system"
                                        : "Student cannot log in"}
                                </small>
                            </div>
                        </div>
                    </div>

                    <div className={styles.formActions}>
                        <button
                            type="button"
                            className={styles.secondaryBtn}
                            onClick={() => navigate(`/admin/student/${id}`)}
                            disabled={loading}
                        >
                            Cancel
                        </button>

                        <div className={styles.primaryActions}>
                            <ConfirmAction
                                title="Delete Student"
                                message={`Are you sure you want to delete this student? This action cannot be undone. To confirm, please type the student's full name exactly as shown below:`}
                                confirmText="Delete Student"
                                cancelText="Cancel"
                                requireReason={true}
                                placeholder={`Type: "${originalData?.full_name}"`}
                                onConfirm={handleDelete}
                            >
                                <AsyncButton
                                    type="button"
                                    className={styles.dangerBtn}
                                    loading={loading}
                                    disabled={loading}
                                >
                                    <FaTrash /> Delete Student
                                </AsyncButton>
                            </ConfirmAction>

                            <AsyncButton
                                type="submit"
                                className={styles.primaryBtn}
                                loading={loading}
                                disabled={loading || !hasChanges}
                            >
                                <FaSave /> {hasChanges ? "Save Changes" : "No Changes"}
                            </AsyncButton>
                        </div>
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