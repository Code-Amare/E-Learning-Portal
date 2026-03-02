import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../../Context/UserContext";
import api from "../../../Utils/api";
import { neonToast } from "../../../Components/NeonToast/NeonToast";
import SideBar from "../../../Components/SideBar/SideBar";
import {
    FaBook,
    FaSpinner,
    FaExclamationTriangle,
    FaSearch,
} from "react-icons/fa";
import styles from "./UserCourses.module.css";
import { useNotifContext } from "../../../Context/NotifContext";

export default function UserCourses() {
    const navigate = useNavigate();
    const { user } = useUser();
    const { updatePageTitle } = useNotifContext();

    useEffect(() => {
        updatePageTitle("All Courses");
    }, []);

    const [courses, setCourses] = useState([]);
    const [filteredCourses, setFilteredCourses] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.isAuthenticated === false) {
            navigate("/login");
            return;
        }
        fetchCourses();
    }, [user, navigate]);

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const response = await api.get("/api/courses/");
            // Assuming the API returns { courses: [...] } or directly an array
            const coursesData = response.data.courses || response.data;
            setCourses(coursesData);
            setFilteredCourses(coursesData);
        } catch (error) {
            console.error("Error fetching courses:", error);
            neonToast.error("Failed to load courses", "error");
        } finally {
            setLoading(false);
        }
    };

    // Helper to extract YouTube thumbnail from a YouTube link
    const getYouTubeThumbnail = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        const videoId = match && match[2].length === 11 ? match[2] : null;
        return videoId ? `https://img.youtube.com/vi/${videoId}/0.jpg` : null;
    };

    const handleSearch = (e) => {
        const term = e.target.value.toLowerCase();
        setSearchTerm(term);
        const filtered = courses.filter(
            (course) =>
                course.title.toLowerCase().includes(term) ||
                course.short_note.toLowerCase().includes(term) ||
                course.field.toLowerCase().includes(term)
        );
        setFilteredCourses(filtered);
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <SideBar>
                    <div className={styles.loadingContainer}>
                        <FaSpinner className={styles.loadingSpinner} />
                        <p>Loading courses...</p>
                    </div>
                </SideBar>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <SideBar>
                <div className={styles.header}>
                    <h1>All Courses</h1>
                    <p className={styles.subtitle}>Explore our course catalog</p>
                </div>

                {/* Search Bar */}
                <div className={styles.searchContainer}>
                    <div className={styles.searchInputWrapper}>
                        <FaSearch className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Search by title, field, or description..."
                            value={searchTerm}
                            onChange={handleSearch}
                            className={styles.searchInput}
                        />
                    </div>
                </div>

                {/* Course Grid */}
                {filteredCourses.length === 0 ? (
                    <div className={styles.emptyState}>
                        <FaExclamationTriangle size={48} />
                        <h2>No courses found</h2>
                        <p>Try adjusting your search criteria.</p>
                    </div>
                ) : (
                    <div className={styles.coursesGrid}>
                        {filteredCourses.map((course) => {
                            const thumbnailUrl = getYouTubeThumbnail(course.youtube_link);
                            return (
                                <div
                                    key={course.id}
                                    className={styles.courseCard}
                                    onClick={() => navigate(`/courses/${course.id}`)}
                                >
                                    <div className={styles.thumbnailContainer}>
                                        {thumbnailUrl ? (
                                            <img
                                                src={thumbnailUrl}
                                                alt={course.title}
                                                className={styles.thumbnail}
                                                onError={(e) => {
                                                    e.target.style.display = "none";
                                                    e.target.nextSibling.style.display = "flex";
                                                }}
                                            />
                                        ) : null}
                                        <div
                                            className={styles.thumbnailFallback}
                                            style={{
                                                display: thumbnailUrl ? "none" : "flex",
                                                background: "linear-gradient(135deg, #4f46e5, #6366f1)",
                                            }}
                                        >
                                            <FaBook size={32} />
                                        </div>
                                    </div>
                                    <div className={styles.courseInfo}>
                                        <h3>{course.title}</h3>
                                        <p className={styles.shortNote}>{course.short_note}</p>
                                        <div className={styles.courseMeta}>
                                            <span className={styles.fieldBadge}>
                                                {course.field_label || course.field}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </SideBar>
        </div>
    );
}