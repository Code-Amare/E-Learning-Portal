import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../Context/UserContext";
import api from "../../Utils/api";
import { neonToast } from "../../Components/NeonToast/NeonToast";
import AsyncButton from "../../Components/AsyncButton/AsyncButton";
import SideBar from "../../Components/SideBar/SideBar";
import styles from "./EditProfile.module.css";
import { useNotifContext } from "../../Context/NotifContext";

const FIELD_CHOICES = [
    { value: "frontend", label: "Frontend" },
    { value: "backend", label: "Backend" },
    { value: "ai", label: "AI" },
    { value: "embedded", label: "Embedded" },
    { value: "cyber", label: "Cyber" },
    { value: "other", label: "Other" },
];

export default function EditProfile() {
    const navigate = useNavigate();
    const { user, getUser } = useUser();
    const { updatePageTitle } = useNotifContext();

    useEffect(() => {
        updatePageTitle("Edit Profile");
    }, []);

    const [form, setForm] = useState({
        full_name: "",
        grade: "",
        section: "",
        field: "",
        account: "",
        phone_number: "",
    });

    const [profileImage, setProfileImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [removeProfilePic, setRemoveProfilePic] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    // Wait for user data to load, then populate form
    useEffect(() => {
        if (user.isAuthenticated === null) return; // still loading

        if (!user.isAuthenticated) {
            navigate("/login");
            return;
        }

        // User is authenticated – fill form from context
        setForm({
            full_name: user.fullName || "",
            grade: user.grade || "",
            section: user.section || "",
            field: user.field || "",
            account: user.account || "",
            phone_number: user.phoneNumber || "",
        });

        // Set profile preview from context (immediately shows current image)
        setPreview(user.profilePicURL || null);
        setIsFetching(false);
    }, [user, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((s) => ({ ...s, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            neonToast.error("Image must be less than 5MB", "error");
            return;
        }
        if (!file.type.startsWith("image/")) {
            neonToast.error("Please select an image file", "error");
            return;
        }

        // Clean up old blob URL if any
        if (preview && preview.startsWith("blob:")) {
            URL.revokeObjectURL(preview);
        }

        setProfileImage(file);
        setPreview(URL.createObjectURL(file));
        setRemoveProfilePic(false);
    };

    const removeImage = () => {
        if (preview && preview.startsWith("blob:")) {
            URL.revokeObjectURL(preview);
        }
        setProfileImage(null);
        setRemoveProfilePic(true);
        setPreview(null);
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            const data = new FormData();
            data.append("full_name", form.full_name.trim());
            data.append("grade", form.grade || "");
            data.append("section", form.section || "");
            data.append("field", form.field || "");
            data.append("account", form.account || "");
            data.append("phone_number", form.phone_number || "");

            if (removeProfilePic) {
                data.append("remove_profile_pic", "true");
            } else if (profileImage) {
                data.append("profile_pic", profileImage);
            }

            await api.patch("/api/users/edit/", data);
            await getUser(); // refresh context so sidebar etc. show new data

            neonToast.success("Profile updated successfully", "success");
            navigate("/profile");
        } catch (err) {
            console.error("Update error:", err);
            const message =
                err.response?.data?.error ||
                err.response?.data?.message ||
                err.response?.data?.non_field_errors?.[0] ||
                "Failed to update profile";
            neonToast.error(message, "error");
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <p>Loading profile...</p>
            </div>
        );
    }

    return (
        <div className={styles.editProfilePage}>
            <SideBar>
                <div className={styles.editProfileContent}>
                    {/* Avatar card */}
                    <div className={styles.avatarCard}>
                        <div className={styles.avatarWrapper}>
                            <label htmlFor="profileImage" className={styles.avatarLabel}>
                                {preview ? (
                                    <img src={preview} alt="Profile" className={styles.avatar} />
                                ) : (
                                    <div className={styles.avatarPlaceholder}>
                                        {form.full_name?.charAt(0) || "U"}
                                    </div>
                                )}
                                <div className={styles.avatarOverlay}>
                                    <span>Change</span>
                                </div>
                            </label>
                            <input
                                id="profileImage"
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className={styles.fileInput}
                            />
                            {preview && (
                                <button
                                    type="button"
                                    className={styles.removeAvatarBtn}
                                    onClick={removeImage}
                                    title="Remove photo"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                        <p className={styles.avatarHint}>
                            Click to upload a new photo (max 5MB)
                        </p>
                    </div>

                    {/* Form card */}
                    <div className={styles.formCard}>
                        <h2 className={styles.formTitle}>Edit Profile</h2>

                        <form onSubmit={(e) => e.preventDefault()} className={styles.form}>
                            <div className={styles.formGrid}>
                                {/* Full Name */}
                                <div className={styles.field}>
                                    <label>Full Name</label>
                                    <input
                                        type="text"
                                        name="full_name"
                                        value={form.full_name}
                                        onChange={handleChange}
                                        placeholder="Your full name"
                                    />
                                </div>

                                {/* Grade */}
                                <div className={styles.field}>
                                    <label>Grade</label>
                                    <input
                                        type="number"
                                        name="grade"
                                        value={form.grade}
                                        onChange={handleChange}
                                        min="1"
                                        max="12"
                                        placeholder="e.g., 10"
                                    />
                                </div>

                                {/* Section */}
                                <div className={styles.field}>
                                    <label>Section</label>
                                    <input
                                        type="text"
                                        name="section"
                                        value={form.section}
                                        onChange={handleChange}
                                        maxLength="1"
                                        placeholder="A, B, C..."
                                        style={{ textTransform: "uppercase" }}
                                    />
                                </div>

                                {/* Field */}
                                <div className={styles.field}>
                                    <label>Field</label>
                                    <select
                                        name="field"
                                        value={form.field}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select a field</option>
                                        {FIELD_CHOICES.map((c) => (
                                            <option key={c.value} value={c.value}>
                                                {c.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Account */}
                                <div className={styles.field}>
                                    <label>Account</label>
                                    <input
                                        type="text"
                                        name="account"
                                        value={form.account}
                                        onChange={handleChange}
                                        placeholder="Username or account ID"
                                    />
                                </div>

                                {/* Phone */}
                                <div className={styles.field}>
                                    <label>Phone Number</label>
                                    <input
                                        type="tel"
                                        name="phone_number"
                                        value={form.phone_number}
                                        onChange={handleChange}
                                        placeholder="+1234567890"
                                    />
                                </div>
                            </div>

                            <div className={styles.formActions}>
                                <AsyncButton
                                    onClick={handleSubmit}
                                    loading={isLoading}
                                    className={styles.saveBtn}
                                >
                                    Save Changes
                                </AsyncButton>
                                <button
                                    type="button"
                                    onClick={() => navigate("/profile")}
                                    className={styles.cancelBtn}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </SideBar>
        </div>
    );
}