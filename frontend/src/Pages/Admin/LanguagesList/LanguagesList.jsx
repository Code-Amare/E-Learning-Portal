import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../../Context/UserContext";
import api from "../../../Utils/api";
import { neonToast } from "../../../Components/NeonToast/NeonToast";
import SideBar from "../../../Components/SideBar/SideBar";
import {
    FaArrowLeft,
    FaLanguage,
    FaPlus,
    FaEdit,
    FaCopy,
} from "react-icons/fa";
import {
    MdSort,
    MdRefresh,
    MdCode
} from "react-icons/md";
import styles from "./LanguagesList.module.css";
import { useNotifContext } from "../../../Context/NotifContext";

export default function LanguagesList() {
    const navigate = useNavigate();
    const { user } = useUser();

    const [languages, setLanguages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("name");
    const [sortOrder, setSortOrder] = useState("asc");
    const { updatePageTitle } = useNotifContext()
    useEffect(() => {
        updatePageTitle("Languages")
    }, [])

    useEffect(() => {
        fetchLanguages();
    }, []);

    const fetchLanguages = async () => {
        setLoading(true);
        try {
            const response = await api.get("/api/management/languages/");
            setLanguages(response.data || []);
        } catch (error) {
            console.error("Error fetching languages:", error);
            neonToast.error("Failed to load languages", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleCopyColor = (color) => {
        navigator.clipboard.writeText(color)
            .then(() => {
                neonToast.success(`Color ${color} copied to clipboard`, "success");
            })
            .catch(err => {
                console.error("Failed to copy: ", err);
                neonToast.error("Failed to copy color", "error");
            });
    };

    const filteredLanguages = languages
        .filter(language => {
            const matchesSearch = searchTerm === "" ||
                language.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                language.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                language.color.toLowerCase().includes(searchTerm.toLowerCase());

            return matchesSearch;
        })
        .sort((a, b) => {
            let comparison = 0;

            if (sortBy === "name") {
                comparison = a.name.localeCompare(b.name);
            } else if (sortBy === "code") {
                comparison = a.code.localeCompare(b.code);
            } else if (sortBy === "created_at") {
                comparison = new Date(a.created_at) - new Date(b.created_at);
            }

            return sortOrder === "desc" ? -comparison : comparison;
        });

    const handleSort = (column) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortBy(column);
            setSortOrder("asc");
        }
    };

    const getSortIcon = (column) => {
        if (sortBy !== column) return null;
        return sortOrder === "asc" ? "↑" : "↓";
    };

    return (
        <div className={styles.container}>
            <SideBar>
                <div className={styles.header}>
                    <div className={styles.headerTop}>
                        <button className={styles.backBtn} onClick={() => navigate("/admin")}>
                            <FaArrowLeft /> Back to Dashboard
                        </button>
                        <h1 className={styles.title}><FaLanguage /> Programming Languages</h1>
                    </div>
                    <p className={styles.subtitle}>
                        Manage programming languages in the system. Add new languages or edit existing ones.
                    </p>
                </div>

                {/* Controls */}
                <div className={styles.controls}>
                    <div className={styles.searchContainer}>
                        <div className={styles.searchWithIcon}>
                            <input
                                type="text"
                                placeholder="Search languages by name, code, or color..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={styles.searchInput}
                            />
                        </div>
                    </div>

                    <div className={styles.filterControls}>
                        <div className={styles.sortGroup}>
                            <MdSort className={styles.sortIcon} />
                            <select
                                value={`${sortBy}-${sortOrder}`}
                                onChange={(e) => {
                                    const [newSortBy, newSortOrder] = e.target.value.split('-');
                                    setSortBy(newSortBy);
                                    setSortOrder(newSortOrder);
                                }}
                                className={styles.sortSelect}
                            >
                                <option value="name-asc">Sort by Name (A-Z)</option>
                                <option value="name-desc">Sort by Name (Z-A)</option>
                                <option value="code-asc">Sort by Code (A-Z)</option>
                                <option value="code-desc">Sort by Code (Z-A)</option>
                            </select>
                        </div>

                        <button
                            className={styles.refreshBtn}
                            onClick={fetchLanguages}
                            disabled={loading}
                        >
                            <MdRefresh /> Refresh
                        </button>

                        <button
                            className={styles.addBtn}
                            onClick={() => navigate("/admin/languages/add")}
                        >
                            <FaPlus /> Add Language
                        </button>
                    </div>
                </div>

                {/* Languages Table */}
                {loading ? (
                    <div className={styles.loadingContainer}>
                        <div className={styles.loadingSpinner}></div>
                        <p>Loading languages...</p>
                    </div>
                ) : filteredLanguages.length === 0 ? (
                    <div className={styles.emptyState}>
                        <FaLanguage className={styles.emptyIcon} />
                        <h3>No languages found</h3>
                        <p>{searchTerm
                            ? "Try adjusting your search criteria"
                            : "Get started by adding your first programming language"}
                        </p>
                        <button
                            className={styles.emptyActionBtn}
                            onClick={() => navigate("/admin/languages/add")}
                        >
                            <FaPlus /> Add First Language
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className={styles.desktopTable}>
                            <div className={styles.tableContainer}>
                                <div className={styles.tableHeader}>
                                    <div className={styles.tableRow}>
                                        <div
                                            className={`${styles.tableCell} ${styles.colName} ${styles.sortable}`}
                                            onClick={() => handleSort("name")}
                                        >
                                            Name {getSortIcon("name")}
                                        </div>
                                        <div
                                            className={`${styles.tableCell} ${styles.colCode} ${styles.sortable}`}
                                            onClick={() => handleSort("code")}
                                        >
                                            Code {getSortIcon("code")}
                                        </div>
                                        <div className={`${styles.tableCell} ${styles.colColor}`}>
                                            Color
                                        </div>
                                        <div className={`${styles.tableCell} ${styles.colActions}`}>
                                            Actions
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.tableBody}>
                                    {filteredLanguages.map((language) => (
                                        <div key={language.id} className={styles.tableRow}>
                                            <div className={`${styles.tableCell} ${styles.colName}`}>
                                                <div className={styles.languageName}>
                                                    <FaLanguage className={styles.langIcon} />
                                                    <span>{language.name}</span>
                                                </div>
                                            </div>
                                            <div className={`${styles.tableCell} ${styles.colCode}`}>
                                                <div className={styles.languageCode}>
                                                    <MdCode className={styles.codeIcon} />
                                                    <code>{language.code}</code>
                                                </div>
                                            </div>
                                            <div className={`${styles.tableCell} ${styles.colColor}`}>
                                                <div className={styles.colorDisplay}>
                                                    <div
                                                        className={styles.colorPreview}
                                                        style={{
                                                            backgroundColor: language.color,
                                                            boxShadow: `0 2px 8px ${language.color}40`
                                                        }}
                                                        title={`Click to copy ${language.color}`}
                                                        onClick={() => handleCopyColor(language.color)}
                                                    >
                                                        <FaCopy className={styles.copyIcon} />
                                                    </div>
                                                    <div className={styles.colorInfo}>
                                                        <span className={styles.colorHex} title={language.color}>
                                                            {language.color.toUpperCase()}
                                                        </span>
                                                        <small className={styles.colorSample}>Click to copy</small>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={`${styles.tableCell} ${styles.colActions}`}>
                                                <div className={styles.actionButtons}>
                                                    <button
                                                        className={styles.editBtn}
                                                        onClick={() => navigate(`/admin/languages/edit/${language.id}`)}
                                                        title="Edit language"
                                                    >
                                                        <FaEdit /> Edit
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className={styles.tableFooter}>
                                    <div className={styles.stats}>
                                        Showing {filteredLanguages.length} of {languages.length} languages
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Cards */}
                        <div className={styles.mobileCards}>
                            {filteredLanguages.map((language) => (
                                <div key={language.id} className={styles.mobileCard}>
                                    <div className={styles.mobileCardHeader}>
                                        <FaLanguage className={styles.mobileLangIcon} />
                                        <div>
                                            <h4>{language.name}</h4>
                                            <code className={styles.mobileCode}>{language.code}</code>
                                        </div>
                                    </div>

                                    <div className={styles.mobileCardBody}>
                                        <div className={styles.mobileCardRow}>
                                            <span className={styles.mobileLabel}>Color:</span>
                                            <div className={styles.mobileColorDisplay}>
                                                <div
                                                    className={styles.mobileColorPreview}
                                                    style={{ backgroundColor: language.color }}
                                                    onClick={() => handleCopyColor(language.color)}
                                                    title={`Click to copy ${language.color}`}
                                                >
                                                    <FaCopy className={styles.mobileCopyIcon} />
                                                </div>
                                                <span className={styles.mobileColorHex}>{language.color.toUpperCase()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles.mobileCardActions}>
                                        <button
                                            className={styles.mobileEditBtn}
                                            onClick={() => navigate(`/admin/languages/edit/${language.id}`)}
                                        >
                                            <FaEdit /> Edit Language
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </SideBar>
        </div>
    );
}