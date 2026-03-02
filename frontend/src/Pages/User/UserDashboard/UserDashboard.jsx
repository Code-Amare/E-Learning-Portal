import styles from "./UserDashboard.module.css";
import SideBar from "../../../Components/SideBar/SideBar";
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    FaBook,
    FaChartBar,
    FaTasks,
    FaProjectDiagram,
    FaStar,
    FaGraduationCap,
    FaSpinner,
    FaExclamationTriangle,
    FaHeart,
    FaCheckCircle,
    FaClock,
    FaTimesCircle,
    FaUserCheck,
    FaCalendarAlt,
    FaRocket,
} from "react-icons/fa";
import { FiTrendingUp } from "react-icons/fi";
import { useUser } from "../../../Context/UserContext";
import api from "../../../Utils/api";
import { neonToast } from "../../../Components/NeonToast/NeonToast";
import { useNotifContext } from "../../../Context/NotifContext";

export default function UserDashboard() {
    const navigate = useNavigate();
    const { userId } = useParams(); // optional – if admin viewing a specific user
    const { user } = useUser();
    const { updatePageTitle } = useNotifContext();

    useEffect(() => {
        updatePageTitle("User Dashboard");
    }, []);

    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState({
        stats: {
            completion_rate: 0,
            finished_courses: 0,
            in_progress_count: 0,
            recent_finished_30d: 0,
            started_courses: 0,
            total_courses: 0,
        },
        status_distribution: { finished: 0, started: 0 },
        weekly_activity: [],
        recommendations: [],
        recent_activity: [],
        field_distribution: [],
    });
    const [cssVars, setCssVars] = useState({
        borderColor: "#e5e7eb",
        textSecondary: "#4b5563",
    });

    useEffect(() => {
        if (user?.isAuthenticated === false) {
            navigate("/login");
            return;
        }

        // If userId exists, fetch for that specific user, else fetch for the logged-in user
        const endpoint = "/api/users/data/";
        fetchDashboardData(endpoint);

        const getCssVariable = (name) => {
            return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
        };

        setCssVars({
            borderColor: getCssVariable("--border-color") || "#e5e7eb",
            textSecondary: getCssVariable("--text-secondary") || "#4b5563",
        });
    }, [user, userId, navigate]);

    const fetchDashboardData = async (endpoint) => {
        setLoading(true);
        try {
            const response = await api.get(endpoint);
            const data = response.data;
            console.log(data);

            setDashboardData({
                stats: data.stats || dashboardData.stats,
                status_distribution: data.status_distribution || { finished: 0, started: 0 },
                weekly_activity: data.weekly_activity || [],
                recommendations: data.recommendations || [],
                recent_activity: data.recent_activity || [],
                field_distribution: data.field_distribution || [],
            });
        } catch (error) {
            console.error("Error fetching user dashboard:", error);
            neonToast.error("Failed to load dashboard data", "error");
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

    // Custom tooltip for charts
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className={styles.tooltip}>
                    <p className={styles.tooltipLabel}>{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color }}>
                            {entry.name}: {entry.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <SideBar>
                    <div className={styles.loadingContainer}>
                        <FaSpinner className={styles.loadingSpinner} />
                        <p>Loading dashboard...</p>
                    </div>
                </SideBar>
            </div>
        );
    }

    const { stats, status_distribution, weekly_activity, recommendations } = dashboardData;

    // Prepare data for status distribution pie
    const statusPieData = [
        { name: "Finished", value: status_distribution.finished || 0, color: "#10b981" },
        { name: "Started", value: status_distribution.started || 0, color: "#f59e0b" },
    ].filter((item) => item.value > 0);

    // If no data, show empty message
    const noStatusData = statusPieData.length === 0;

    return (
        <div className={styles.container}>
            <SideBar>
                <div className={styles.dashboard}>
                    <header className={styles.header}>
                        <h1>User Dashboard</h1>
                        <p className={styles.subtitle}>Track your learning progress and recommendations.</p>
                    </header>

                    {/* Stats Cards */}
                    <div className={styles.statsGrid}>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon} style={{ backgroundColor: "rgba(79, 70, 229, 0.1)" }}>
                                <FaBook className={styles.statIconSvg} />
                            </div>
                            <div className={styles.statContent}>
                                <h3>Total Courses</h3>
                                <p className={styles.statValue}>{stats.total_courses || 0}</p>
                                <span className={styles.statTrend}>
                                    <FiTrendingUp /> {stats.finished_courses || 0} finished
                                </span>
                            </div>
                        </div>

                        <div className={styles.statCard}>
                            <div className={styles.statIcon} style={{ backgroundColor: "rgba(16, 185, 129, 0.1)" }}>
                                <FaCheckCircle className={styles.statIconSvg} />
                            </div>
                            <div className={styles.statContent}>
                                <h3>Completed</h3>
                                <p className={styles.statValue}>{stats.finished_courses || 0}</p>
                                <span className={styles.statTrend}>
                                    <FiTrendingUp /> {stats.completion_rate || 0}% completion rate
                                </span>
                            </div>
                        </div>

                        <div className={styles.statCard}>
                            <div className={styles.statIcon} style={{ backgroundColor: "rgba(245, 158, 11, 0.1)" }}>
                                <FaClock className={styles.statIconSvg} />
                            </div>
                            <div className={styles.statContent}>
                                <h3>In Progress</h3>
                                <p className={styles.statValue}>{stats.in_progress_count || 0}</p>
                                <span className={styles.statTrend}>
                                    <FiTrendingUp /> {stats.started_courses || 0} started
                                </span>
                            </div>
                        </div>

                        <div className={styles.statCard}>
                            <div className={styles.statIcon} style={{ backgroundColor: "rgba(236, 72, 153, 0.1)" }}>
                                <FaCalendarAlt className={styles.statIconSvg} />
                            </div>
                            <div className={styles.statContent}>
                                <h3>Recent (30d)</h3>
                                <p className={styles.statValue}>{stats.recent_finished_30d || 0}</p>
                                <span className={styles.statTrend}>
                                    <FiTrendingUp /> finished last 30 days
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Charts Row */}
                    <div className={styles.chartsRow}>
                        {/* Weekly Activity Bar Chart */}
                        <div className={styles.chartCard}>
                            <div className={styles.chartHeader}>
                                <h2>
                                    <FaChartBar className={styles.chartIcon} /> Weekly Activity
                                </h2>
                                <p className={styles.chartSubtitle}>Courses started/finished per day</p>
                            </div>
                            <div className={styles.chartContainer}>
                                {weekly_activity.length === 0 ? (
                                    <div className={styles.noDataMessage}>
                                        <FaExclamationTriangle size={24} />
                                        <p>No activity data available</p>
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={250}>
                                        <BarChart
                                            data={weekly_activity}
                                            margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                stroke={cssVars.borderColor}
                                            />
                                            <XAxis
                                                dataKey="day_name"
                                                stroke={cssVars.textSecondary}
                                                tick={{ fill: cssVars.textSecondary }}
                                            />
                                            <YAxis
                                                stroke={cssVars.textSecondary}
                                                tick={{ fill: cssVars.textSecondary }}
                                                allowDecimals={false}
                                            />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend />
                                            <Bar
                                                dataKey="started"
                                                name="Started"
                                                fill="#f59e0b"
                                                radius={[4, 4, 0, 0]}
                                            />
                                            <Bar
                                                dataKey="finished"
                                                name="Finished"
                                                fill="#10b981"
                                                radius={[4, 4, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>

                        {/* Status Distribution Pie Chart */}
                        <div className={styles.chartCard}>
                            <div className={styles.chartHeader}>
                                <h2>
                                    <FaProjectDiagram className={styles.chartIcon} /> Status Distribution
                                </h2>
                                <p className={styles.chartSubtitle}>Started vs Finished courses</p>
                            </div>
                            <div className={styles.chartContainer}>
                                {noStatusData ? (
                                    <div className={styles.noDataMessage}>
                                        <FaExclamationTriangle size={24} />
                                        <p>No status data available</p>
                                    </div>
                                ) : (
                                    <>
                                        <ResponsiveContainer width="100%" height={250}>
                                            <PieChart>
                                                <Pie
                                                    data={statusPieData}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, percent }) =>
                                                        `${name}: ${(percent * 100).toFixed(0)}%`
                                                    }
                                                    outerRadius={80}
                                                    innerRadius={40}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                    paddingAngle={2}
                                                >
                                                    {statusPieData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    content={({ active, payload }) => {
                                                        if (active && payload && payload.length) {
                                                            const data = payload[0].payload;
                                                            return (
                                                                <div className={styles.tooltip}>
                                                                    <p className={styles.tooltipLabel}>
                                                                        {data.name}
                                                                    </p>
                                                                    <p style={{ color: data.color }}>
                                                                        Count: {data.value}
                                                                    </p>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className={styles.pieLegend}>
                                            {statusPieData.map((item) => (
                                                <div key={item.name} className={styles.legendItem}>
                                                    <div
                                                        className={styles.colorBox}
                                                        style={{ backgroundColor: item.color }}
                                                    ></div>
                                                    <span className={styles.legendLabel}>{item.name}</span>
                                                    <span className={styles.legendValue}>{item.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Recommendations Section */}
                    <div className={styles.recommendationsSection}>
                        <div className={styles.sectionHeader}>
                            <h2>
                                <FaRocket className={styles.sectionIcon} /> Recommended for You
                            </h2>
                            <p className={styles.sectionSubtitle}>Based on your interests and progress</p>
                        </div>
                        {recommendations.length === 0 ? (
                            <div className={styles.noDataMessage}>
                                <FaExclamationTriangle size={24} />
                                <p>No recommendations available</p>
                            </div>
                        ) : (
                            <div className={styles.recommendationsGrid}>
                                {recommendations.map((course) => {
                                    const thumbnailUrl = getYouTubeThumbnail(course.youtube_link);
                                    return (
                                        <div
                                            key={course.id}
                                            className={styles.recommendationCard}
                                            onClick={() => navigate(`/admin/courses/${course.id}`)}
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
                    </div>
                </div>
            </SideBar>
        </div>
    );
}