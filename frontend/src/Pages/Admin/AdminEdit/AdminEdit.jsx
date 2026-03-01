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
    FaCamera,
    FaTimes,
    FaEye,
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
import styles from "./AdminEdit.module.css";
import { useNotifContext } from "../../../Context/NotifContext";

export default function AdminEdit() {
    const navigate = useNavigate();
    const { id } = useParams();
    const fileInputRef = useRef(null);
    const { updatePageTitle } = useNotifContext();

    useEffect(() => {
        updatePageTitle("Edit Administrator");
    }, []);

    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        gender: "",
        grade: "",
        section: "",
        field: "",
        phone_number: "",
        account: "",
        account_status: "active", // is_active
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
        fetchAdminData();
    }, [id]);

    const fetchAdminData = async () => {
        try {
            setFetching(true);
            const response = await api.get(`/api/management/admin/${id}/`);

            let admin;
            if (response.data && response.data.admin) {
                admin = response.data.admin;
            } else {
                throw new Error("Invalid response structure from server");
            }

            setOriginalData(admin);
            const profile = admin.profile || {};

            setFormData({
                full_name: admin.full_name || "",
                email: admin.email || "",
                gender: admin.gender || "",
                grade: profile.grade?.toString() || "",
                section: profile.section || "",
                field: profile.field || "",
                phone_number: profile.phone_number || "",
                account: profile.account || "",
                account_status: admin.is_active ? "active" : "inactive",
            });

            // Set profile picture URL if available
            if (admin.profile_pic_url) {
                setProfilePic(admin.profile_pic_url);
                setProfilePicPreview(admin.profile_pic_url);
            }

        } catch (error) {
            console.error("Error fetching admin:", error);
            if (error.response?.status === 404) {
                neonToast.error("Administrator not found", "error");
                navigate("/admin/staff");
            } else {
                neonToast.error("Failed to load administrator data", "error");
                navigate("/admin/staff");
            }
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
            const profile = originalData.profile || {};
            const isChanged =
                (name === "full_name" && value !== originalData.full_name) ||
                (name === "email" && value !== originalData.email) ||
                (name === "gender" && value !== originalData.gender) ||
                (name === "grade" && value !== profile.grade?.toString()) ||
                (name === "section" && value !== profile.section) ||
                (name === "field" && value !== profile.field) ||
                (name === "phone_number" && value !== profile.phone_number) ||
                (name === "account" && value !== profile.account) ||
                (name === "account_status" && (value === "active") !== originalData.is_active);

            setHasChanges(prev => isChanged || prev);
        }

        if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.full_name.trim()) newErrors.full_name = "Full name is required";
        if (!formData.email.trim()) newErrors.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email is invalid";

        // Gender is optional in admin? In model it's blank=True, but we can include validation if needed.
        // We'll treat it as optional; no error if empty.

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
            const formDataToSend = new FormData();

            formDataToSend.append("full_name", formData.full_name.trim());
            formDataToSend.append("email", formData.email.trim().toLowerCase());
            if (formData.gender) formDataToSend.append("gender", formData.gender);
            formDataToSend.append("grade", parseInt(formData.grade));
            formDataToSend.append("section", formData.section.toUpperCase());
            formDataToSend.append("field", formData.field);
            formDataToSend.append("phone_number", formData.phone_number.trim());
            formDataToSend.append("account", formData.account.trim() || "N/A");
            formDataToSend.append("account_status", formData.account_status); // will map to is_active in backend? The PUT expects is_active? It uses account_status to set is_active? In the view, it maps account_status to is_active: `"is_active": account_status == "active"`. Yes.

            if (profilePicFile) {
                formDataToSend.append("profile_pic", profilePicFile);
            }

            const response = await api.put(
                `/api/management/admin/${id}/`,
                formDataToSend,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            neonToast.success("Administrator updated successfully!", "success");
            setOriginalData(response.data);
            setHasChanges(false);

            // Update profile picture preview if returned
            if (response.data.user?.profile_pic_url) {
                setProfilePic(response.data.user.profile_pic_url);
                setProfilePicPreview(response.data.user.profile_pic_url);
            } else if (response.data.profile_pic_url) {
                setProfilePic(response.data.profile_pic_url);
                setProfilePicPreview(response.data.profile_pic_url);
            }

            setProfilePicFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }

            navigate(`/admin/staff/${id}`);

        } catch (error) {
            console.error("Error updating admin:", error);
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
                neonToast.error("Administrator not found", "error");
            } else {
                neonToast.error("Failed to update administrator. Please try again.", "error");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (event, typedName) => {
        if (!originalData) return false;

        if (typedName !== originalData.full_name) {
            neonToast.error(
                `The name you typed does not match the administrator's full name. Please type "${originalData.full_name}" exactly to delete.`,
                "error"
            );
            return false;
        }

        setLoading(true);
        try {
            await api.delete(`/api/management/admin/${id}/`);
            neonToast.success("Administrator deleted successfully!", "success");
            navigate("/admin/staff");
            return true;
        } catch (error) {
            console.error("Error deleting admin:", error);
            if (error.response?.status === 404) {
                neonToast.error("Administrator not found", "error");
            } else {
                neonToast.error("Failed to delete administrator", "error");
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
                        <p>Loading administrator data...</p>
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
                        <button className={styles.backBtn} onClick={() => navigate("/admin/staff")}>
                            <FaArrowLeft /> Back to Administrators
                        </button>
                        <div className={styles.headerActions}>
                            <button
                                className={styles.viewBtn}
                                onClick={() => navigate(`/admin/staff/${id}`)}
                            >
                                <FaEye /> View Administrator
                            </button>
                        </div>
                    </div>

                    <div className={styles.adminHeader}>
                        <div className={styles.adminAvatar}>
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
                        <div className={styles.adminInfo}>
                            <h1 className={styles.title}><FaUser /> Edit Administrator: {formData.full_name}</h1>
                            <div className={styles.adminMeta}>
                                <span className={styles.adminId}>ID: {id}</span>
                                <span className={`${styles.roleBadge} ${originalData?.is_superuser ? styles.adminRole : styles.staffRole}`}>
                                    <FaUserTie /> {originalData?.is_superuser ? "Administrator" : "Staff"}
                                </span>
                                <span className={`${styles.status} ${formData.account_status === "active" ? styles.active : styles.inactive}`}>
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
                                        placeholder="Enter full name"
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
                                        placeholder="admin@example.com"
                                        className={errors.email ? styles.errorInput : ""}
                                        required
                                    />
                                </div>
                                {errors.email && <span className={styles.errorText}>{errors.email}</span>}
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="gender">Gender</label>
                                <div className={styles.inputWithIcon}>
                                    <FaUser className={styles.inputIcon} />
                                    <select
                                        id="gender"
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                        className={errors.gender ? styles.errorInput : ""}
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
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
                            <h2 className={styles.sectionTitle}><MdSchool /> Academic & Account Information</h2>

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
                                        ? "Administrator can log in"
                                        : "Administrator cannot log in"}
                                </small>
                            </div>
                        </div>
                    </div>

                    <div className={styles.formActions}>
                        <button
                            type="button"
                            className={styles.secondaryBtn}
                            onClick={() => navigate(`/admin/staff/${id}`)}
                            disabled={loading}
                        >
                            Cancel
                        </button>

                        <div className={styles.primaryActions}>
                            <ConfirmAction
                                title="Delete Administrator"
                                message={`Are you sure you want to delete this administrator? This action cannot be undone. To confirm, please type the administrator's full name exactly as shown below:`}
                                confirmText="Delete Administrator"
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
                                    <FaTrash /> Delete Administrator
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