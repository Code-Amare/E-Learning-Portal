import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../../Context/UserContext";
import api from "../../../Utils/api";
import { neonToast } from "../../../Components/NeonToast/NeonToast";
import SideBar from "../../../Components/SideBar/SideBar";
import {
    FaArrowLeft,
    FaPlus,
    FaEdit,
    FaCode,
    FaLanguage,
} from "react-icons/fa";
import {
    MdSort,
    MdRefresh,
} from "react-icons/md";
import styles from "./FrameworksList.module.css";
import { useNotifContext } from "../../../Context/NotifContext";

export default function FrameworksList() {
    const navigate = useNavigate();

    const [frameworks, setFrameworks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("name");
    const [sortOrder, setSortOrder] = useState("asc");

    const { updatePageTitle } = useNotifContext()
    useEffect(() => {
        updatePageTitle("Frameworks")
    }, [])

    useEffect(() => {
        fetchFrameworks();
    }, []);

    const fetchFrameworks = async () => {
        setLoading(true);
        try {
            const response = await api.get("/api/management/frameworks/");
            setFrameworks(response.data || []);
        } catch (error) {
            console.error("Error fetching frameworks:", error);
            neonToast.error("Failed to load frameworks", "error");
        } finally {
            setLoading(false);
        }
    };

    const filteredFrameworks = frameworks
        .filter(framework => {
            const matchesSearch = searchTerm === "" ||
                framework.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (framework.language &&
                    (framework.language.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        framework.language.code.toLowerCase().includes(searchTerm.toLowerCase())));

            return matchesSearch;
        })
        .sort((a, b) => {
            let comparison = 0;

            if (sortBy === "name") {
                comparison = a.name.localeCompare(b.name);
            } else if (sortBy === "language") {
                const langA = a.language?.name || "";
                const langB = b.language?.name || "";
                comparison = langA.localeCompare(langB);
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
                        <h1 className={styles.title}><FaCode /> Frameworks & Libraries</h1>
                    </div>
                    <p className={styles.subtitle}>
                        Manage frameworks and libraries in the system. Frameworks are associated with programming languages.
                    </p>
                </div>

                {/* Controls */}
                <div className={styles.controls}>
                    <div className={styles.searchContainer}>
                        <div className={styles.searchWithIcon}>
                            <input
                                type="text"
                                placeholder="Search frameworks by name or language..."
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
                                <option value="language-asc">Sort by Language (A-Z)</option>
                                <option value="language-desc">Sort by Language (Z-A)</option>
                            </select>
                        </div>

                        <button
                            className={styles.refreshBtn}
                            onClick={fetchFrameworks}
                            disabled={loading}
                        >
                            <MdRefresh /> Refresh
                        </button>

                        <button
                            className={styles.addBtn}
                            onClick={() => navigate("/admin/frameworks/add")}
                        >
                            <FaPlus /> Add Framework
                        </button>
                    </div>
                </div>

                {/* Frameworks Table */}
                {loading ? (
                    <div className={styles.loadingContainer}>
                        <div className={styles.loadingSpinner}></div>
                        <p>Loading frameworks...</p>
                    </div>
                ) : filteredFrameworks.length === 0 ? (
                    <div className={styles.emptyState}>
                        <FaCode className={styles.emptyIcon} />
                        <h3>No frameworks found</h3>
                        <p>{searchTerm
                            ? "Try adjusting your search criteria"
                            : "Get started by adding your first framework"}
                        </p>
                        <button
                            className={styles.emptyActionBtn}
                            onClick={() => navigate("/admin/frameworks/add")}
                        >
                            <FaPlus /> Add First Framework
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
                                            className={`${styles.tableCell} ${styles.colFramework} ${styles.sortable}`}
                                            onClick={() => handleSort("name")}
                                        >
                                            Framework {getSortIcon("name")}
                                        </div>
                                        <div
                                            className={`${styles.tableCell} ${styles.colLanguage} ${styles.sortable}`}
                                            onClick={() => handleSort("language")}
                                        >
                                            Language {getSortIcon("language")}
                                        </div>
                                        <div className={`${styles.tableCell} ${styles.colActions}`}>
                                            Actions
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.tableBody}>
                                    {filteredFrameworks.map((framework) => (
                                        <div key={framework.id} className={styles.tableRow}>
                                            <div className={`${styles.tableCell} ${styles.colFramework}`}>
                                                <div className={styles.frameworkName}>
                                                    <FaCode className={styles.frameworkIcon} />
                                                    <span>{framework.name}</span>
                                                </div>
                                            </div>
                                            <div className={`${styles.tableCell} ${styles.colLanguage}`}>
                                                <div className={styles.languageInfo}>
                                                    <FaLanguage className={styles.languageIcon} />
                                                    <div>
                                                        <div className={styles.languageName}>
                                                            {framework.language?.name}
                                                        </div>
                                                        <div className={styles.languageCode}>
                                                            <code>{framework.language?.code}</code>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={`${styles.tableCell} ${styles.colActions}`}>
                                                <div className={styles.actionButtons}>
                                                    <button
                                                        className={styles.editBtn}
                                                        onClick={() => navigate(`/admin/frameworks/edit/${framework.id}`)}
                                                        title="Edit framework"
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
                                        Showing {filteredFrameworks.length} of {frameworks.length} frameworks
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Cards */}
                        <div className={styles.mobileCards}>
                            {filteredFrameworks.map((framework) => (
                                <div key={framework.id} className={styles.mobileCard}>
                                    <div className={styles.mobileCardHeader}>
                                        <FaCode className={styles.mobileFrameworkIcon} />
                                        <div>
                                            <h4>{framework.name}</h4>
                                            <div className={styles.mobileLanguageBadge}>
                                                <FaLanguage className={styles.mobileLanguageIcon} />
                                                <span>{framework.language?.name} ({framework.language?.code})</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles.mobileCardActions}>
                                        <button
                                            className={styles.mobileEditBtn}
                                            onClick={() => navigate(`/admin/frameworks/edit/${framework.id}`)}
                                        >
                                            <FaEdit /> Edit Framework
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