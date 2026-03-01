import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
    FaCalendarAlt,
    FaUserTie,
    FaEdit,
    FaTrash,
    FaCheckCircle,
    FaTimesCircle,
    FaIdCard,
} from "react-icons/fa";
import { MdPerson, MdEmail, MdPhone, MdSchool, MdClass } from "react-icons/md";
import styles from "./AdminDetail.module.css";
import { useNotifContext } from "../../../Context/NotifContext";
import ConfirmAction from "../../../Components/ConfirmAction/ConfirmAction";

export default function AdminDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useUser();
    const { updatePageTitle } = useNotifContext();

    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        if (!user?.isSuperUser) {
            navigate(-1)
        }
        updatePageTitle("Admin Details");
    }, []);

    useEffect(() => {
        if (user.isAuthenticated === null) return;
        if (!user.isAuthenticated) {
            navigate("/login");
            return;
        }
        fetchAdmin();
    }, [id, user]);

    const fetchAdmin = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/api/management/admin/${id}/`);
            setAdmin(response.data.admin);
        } catch (error) {
            console.error("Error fetching admin:", error);
            if (error.response?.status === 404) {
                setError("Administrator not found");
                neonToast.error("Administrator not found", "error");
            } else {
                setError("Failed to load administrator details");
                neonToast.error("Failed to load administrator details", "error");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {


        setDeleteLoading(true);
        try {
            await api.delete(`/api/management/admin/${id}/`);
            neonToast.success("Administrator deleted successfully", "success");
            navigate("/admin/staff");
        } catch (error) {
            const errMsg = error.response?.data?.error || "Failed to delete administrator"
            neonToast.error(errMsg);
        } finally {
            setDeleteLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <SideBar>
                    <div className={styles.loadingContainer}>
                        <div className={styles.loadingSpinner}></div>
                        <p>Loading administrator details...</p>
                    </div>
                </SideBar>
            </div>
        );
    }

    if (error || !admin) {
        return (
            <div className={styles.container}>
                <SideBar>
                    <div className={styles.errorContainer}>
                        <FaTimesCircle className={styles.errorIcon} />
                        <h2>{error || "Administrator not found"}</h2>
                        <button onClick={() => navigate("/admin/staff")} className={styles.backBtn}>
                            <FaArrowLeft /> Back to Administrators
                        </button>
                    </div>
                </SideBar>
            </div>
        );
    }

    const profile = admin.profile || {};

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
                                className={styles.editBtn}
                                onClick={() => navigate(`/admin/staff/edit/${id}`)}
                            >
                                <FaEdit /> Edit
                            </button>
                            <ConfirmAction
                                title="Delete Administrator"
                                message="Are you sure you want to delete this administrator? This action cannot be undone."
                                confirmText="Delete"
                                cancelText="Cancel"
                                onConfirm={handleDelete}
                            >
                                <button className={styles.deleteBtn}>
                                    <FaTrash /> Delete
                                </button>
                            </ConfirmAction>
                        </div>
                    </div>
                </div>

                <div className={styles.profileCard}>
                    <div className={styles.profileHeader}>
                        <div className={styles.profileImageContainer}>
                            {admin.profile_pic_url ? (
                                <img
                                    src={admin.profile_pic_url}
                                    alt={admin.full_name}
                                    className={styles.profileImage}
                                />
                            ) : (
                                <div className={styles.profileInitials}>
                                    {admin.full_name?.charAt(0) || "?"}
                                </div>
                            )}
                        </div>
                        <div className={styles.profileTitle}>
                            <h1>{admin.full_name}</h1>
                            <div className={styles.badgeGroup}>
                                <span className={`${styles.roleBadge} ${admin.is_superuser ? styles.adminBadge : styles.staffBadge}`}>
                                    <FaUserTie /> {admin.is_superuser ? "Administrator" : "Staff"}
                                </span>
                                <span className={`${styles.statusBadge} ${admin.is_active ? styles.activeBadge : styles.inactiveBadge}`}>
                                    {admin.is_active ? <FaCheckCircle /> : <FaTimesCircle />}
                                    {admin.is_active ? "Active" : "Inactive"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.detailsGrid}>
                        {/* Personal Information */}
                        <div className={styles.detailsSection}>
                            <h2><MdPerson /> Personal Information</h2>
                            <div className={styles.detailRow}>
                                <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}><FaEnvelope /> Email</span>
                                    <span className={styles.detailValue}>{admin.email}</span>
                                </div>
                                <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}><FaPhone /> Phone</span>
                                    <span className={styles.detailValue}>{profile.phone_number || "—"}</span>
                                </div>
                                <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}><MdPerson /> Gender</span>
                                    <span className={styles.detailValue}>
                                        {admin.gender ? admin.gender.charAt(0).toUpperCase() + admin.gender.slice(1) : "—"}
                                    </span>
                                </div>
                                <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}><FaCalendarAlt /> Joined</span>
                                    <span className={styles.detailValue}>{formatDate(admin.date_joined)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Academic Information */}
                        <div className={styles.detailsSection}>
                            <h2><MdSchool /> Academic Information</h2>
                            <div className={styles.detailRow}>
                                <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}><FaGraduationCap /> Grade</span>
                                    <span className={styles.detailValue}>{profile.grade || "—"}</span>
                                </div>
                                <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}><FaFont /> Section</span>
                                    <span className={styles.detailValue}>{profile.section || "—"}</span>
                                </div>
                                <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}><FaCode /> Field</span>
                                    <span className={styles.detailValue}>{profile.field || "—"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Account Details */}
                        <div className={styles.detailsSection}>
                            <h2><FaIdCard /> Account Details</h2>
                            <div className={styles.detailRow}>
                                <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>Account ID</span>
                                    <span className={styles.detailValue}>{profile.account || "N/A"}</span>
                                </div>
                                <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>Email Verified</span>
                                    <span className={styles.detailValue}>
                                        {admin.email_verified ? (
                                            <span className={styles.verified}><FaCheckCircle /> Yes</span>
                                        ) : (
                                            <span className={styles.unverified}><FaTimesCircle /> No</span>
                                        )}
                                    </span>
                                </div>
                                <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>Two‑Factor Auth</span>
                                    <span className={styles.detailValue}>
                                        {admin.twofa_enabled ? (
                                            <span className={styles.verified}><FaCheckCircle /> Enabled</span>
                                        ) : (
                                            <span className={styles.unverified}><FaTimesCircle /> Disabled</span>
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </SideBar>
        </div>
    );
}