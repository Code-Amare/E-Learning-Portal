import styles from "./AdminDashboard.module.css";
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
import { useNavigate } from "react-router-dom";
import {
    FaUsers,
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
} from "react-icons/fa";
import { FiTrendingUp } from "react-icons/fi";
import { useUser } from "../../../Context/UserContext";
import api from "../../../Utils/api";
import { neonToast } from "../../../Components/NeonToast/NeonToast";
import { useNotifContext } from "../../../Context/NotifContext";

const AdminDashboard = () => {
    const { user } = useUser();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState({
        gender_counts: { male: 0, female: 0 },
        attendance_summary: {
            total_sessions: 0,
            status_counts: { present: 0, late: 0, absent: 0, special_case: 0 },
            status_percentages: { present: 0, late: 0, absent: 0, special_case: 0 }
        },
        grade_distribution: {},
        top_learning_tasks: [],
        total_students: 0,
    });
    const { updatePageTitle } = useNotifContext();
    useEffect(() => {
        updatePageTitle("Admin Dashboard");
    }, []);

    const [gradeData, setGradeData] = useState([]);
    const [genderData, setGenderData] = useState([
        { name: "Male", value: 0, color: "#4f46e5" },
        { name: "Female", value: 0, color: "#ec4899" },
    ]);
    const [cssVars, setCssVars] = useState({
        borderColor: "#e5e7eb",
        textSecondary: "#4b5563"
    });

    // Calculate total students: use backend value if available, otherwise sum of grade_distribution
    const totalStudents = dashboardData.total_students ||
        Object.values(dashboardData.grade_distribution || {}).reduce((sum, count) => sum + count, 0);

    // Calculate attendance average (present + late percentage)
    const attendanceAverage = (dashboardData.attendance_summary?.status_percentages?.present || 0) +
        (dashboardData.attendance_summary?.status_percentages?.late || 0);

    const specialCasePercentage = dashboardData.attendance_summary?.status_percentages?.special_case || 0;

    // Fetch all dashboard data
    useEffect(() => {
        if (user.isAuthenticated === null) return;
        if (!user.isAuthenticated) return;

        fetchDashboardData();

        const getCssVariable = (name) => {
            return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
        };

        setCssVars({
            borderColor: getCssVariable('--border-color') || "#e5e7eb",
            textSecondary: getCssVariable('--text-secondary') || "#4b5563"
        });
    }, [user]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const dashboardRes = await api.get("/api/management/dashboard/");
            const data = dashboardRes.data;

            setDashboardData({
                gender_counts: data.gender_counts || { male: 0, female: 0 },
                attendance_summary: data.attendance_summary || {
                    total_sessions: 0,
                    status_counts: { present: 0, late: 0, absent: 0, special_case: 0 },
                    status_percentages: { present: 0, late: 0, absent: 0, special_case: 0 }
                },
                grade_distribution: data.grade_distribution || {},
                top_learning_tasks: data.top_learning_tasks || [],
                total_students: data.total_students || 0,
            });

            const gradeChartData = Object.entries(data.grade_distribution || {}).map(([grade, count]) => ({
                grade: `Grade ${grade}`,
                students: count
            })).sort((a, b) => parseInt(a.grade.replace('Grade ', '')) - parseInt(b.grade.replace('Grade ', '')));
            setGradeData(gradeChartData);

            const maleCount = data.gender_counts?.male || 0;
            const femaleCount = data.gender_counts?.female || 0;
            const totalGender = maleCount + femaleCount;

            const malePercentage = totalGender > 0 ? (maleCount / totalGender) * 100 : 0;
            const femalePercentage = totalGender > 0 ? (femaleCount / totalGender) * 100 : 0;

            setGenderData([
                { name: "Male", value: Math.round(malePercentage), count: maleCount, color: "#4f46e5" },
                { name: "Female", value: Math.round(femalePercentage), count: femaleCount, color: "#ec4899" }
            ]);

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            neonToast.error("Failed to load dashboard data", "error");
        } finally {
            setLoading(false);
        }
    };

    const processedLearningTasks = dashboardData.top_learning_tasks.map(task => {
        let averageRating = 0;
        if (task.reviews && task.reviews.length > 0) {
            averageRating = task.reviews.reduce((sum, review) => sum + review.rating, 0) / task.reviews.length;
        }

        return {
            id: task.id,
            title: task.title || "Untitled Task",
            student: {
                fullName: task.user?.full_name || "Unknown Student",
                grade: task.profile?.grade || "N/A",
                profile_pic_url: task.user?.profile_pic_url || null,
            },
            rating: averageRating,
            likes_count: task.likes_count || 0,
            languages: task.languages || [],
            frameworks: task.frameworks || [],
            status: task.status || "rated"
        };
    });

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

    const handleImageError = (e) => {
        e.target.style.display = "none";
        const nextSibling = e.target.nextElementSibling;
        if (nextSibling) nextSibling.style.display = "flex";
    };

    const getAttendanceStatusBadge = (status) => {
        const badges = {
            present: { icon: <FaCheckCircle />, bgColor: "#10b98120", color: "#10b981", label: "Present" },
            late: { icon: <FaClock />, bgColor: "#f59e0b20", color: "#f59e0b", label: "Late" },
            absent: { icon: <FaTimesCircle />, bgColor: "#ef444420", color: "#ef4444", label: "Absent" },
            special_case: { icon: <FaUserCheck />, bgColor: "#8b5cf620", color: "#8b5cf6", label: "Special Case" }
        };
        const badge = badges[status] || badges.absent;
        return (
            <span className={styles.statusBadge} style={{ backgroundColor: badge.bgColor, color: badge.color }}>
                {badge.icon} {badge.label}
            </span>
        );
    };

    const getStatusDescription = (status) => {
        const descriptions = {
            present: "Students who attended on time",
            late: "Students who arrived late",
            absent: "Students who didn't attend",
            special_case: "Students with special attendance cases"
        };
        return descriptions[status] || "";
    };

    if (loading) {
        return (
            <div className={styles.AdminDashboardContainer}>
                <SideBar>
                    <div className={styles.dashboard}>
                        <div className={styles.loadingContainer}>
                            <FaSpinner className={styles.loadingSpinner} />
                            <p>Loading dashboard data...</p>
                        </div>
                    </div>
                </SideBar>
            </div>
        );
    }


    return (
        <div className={styles.AdminDashboardContainer}>
            <SideBar>
                <div className={styles.dashboard}>
                    <header className={styles.header}>
                        <h1>Admin Dashboard</h1>
                        <p className={styles.subtitle}>Welcome back! Here's what's happening today.</p>
                    </header>

                    {/* Stats Cards */}
                    <div className={styles.statsGrid}>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon} style={{ backgroundColor: "rgba(79, 70, 229, 0.1)" }}>
                                <FaUsers className={styles.statIconSvg} />
                            </div>
                            <div className={styles.statContent}>
                                <h3>Total Students</h3>
                                <p className={styles.statValue}>{dashboardData.total_students}</p>
                                <span className={styles.statTrend}>
                                    <FiTrendingUp /> {dashboardData.gender_counts?.male || 0} male, {dashboardData.gender_counts?.female || 0} female
                                </span>
                            </div>
                        </div>

                        <div className={styles.statCard}>
                            <div className={styles.statIcon} style={{ backgroundColor: "rgba(16, 185, 129, 0.1)" }}>
                                <FaChartBar className={styles.statIconSvg} />
                            </div>
                            <div className={styles.statContent}>
                                <h3>Attendance</h3>
                                <p className={styles.statValue}>{attendanceAverage.toFixed(2)}%</p>
                                <span className={styles.statTrend}>
                                    <FiTrendingUp /> {dashboardData.attendance_summary?.total_sessions || 0} sessions
                                </span>
                            </div>
                        </div>

                        <div className={styles.statCard}>
                            <div className={styles.statIcon} style={{ backgroundColor: "rgba(245, 158, 11, 0.1)" }}>
                                <FaTasks className={styles.statIconSvg} />
                            </div>
                            <div className={styles.statContent}>
                                <h3>Top Tasks</h3>
                                <p className={styles.statValue}>{processedLearningTasks.length}</p>
                                <span className={styles.statTrend}>
                                    <FiTrendingUp /> {Math.min(processedLearningTasks.length, 10)} rated
                                </span>
                            </div>
                        </div>

                        <div className={styles.statCard}>
                            <div className={styles.statIcon} style={{ backgroundColor: "rgba(236, 72, 153, 0.1)" }}>
                                <FaProjectDiagram className={styles.statIconSvg} />
                            </div>
                            <div className={styles.statContent}>
                                <h3>Special Cases</h3>
                                <p className={styles.statValue}>{specialCasePercentage.toFixed(1)}%</p>
                                <span className={styles.statTrend}>
                                    <FiTrendingUp /> {dashboardData.attendance_summary?.status_counts?.special_case || 0} students
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Charts Section */}
                    <div className={styles.chartsSection}>
                        <div className={styles.chartCard}>
                            <div className={styles.chartHeader}>
                                <h2>
                                    <FaGraduationCap className={styles.chartIcon} /> Grade Distribution
                                </h2>
                                <p className={styles.chartSubtitle}>Students per Grade Level</p>
                            </div>
                            <div className={styles.chartContainer}>
                                {gradeData.length === 0 ? (
                                    <div className={styles.noDataMessage}>
                                        <FaExclamationTriangle size={24} />
                                        <p>No grade data available</p>
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart
                                            data={gradeData}
                                            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                stroke={cssVars.borderColor}
                                            />
                                            <XAxis
                                                dataKey="grade"
                                                stroke={cssVars.textSecondary}
                                                tick={{ fill: cssVars.textSecondary }}
                                            />
                                            <YAxis
                                                stroke={cssVars.textSecondary}
                                                tick={{ fill: cssVars.textSecondary }}
                                            />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend />
                                            <Bar
                                                dataKey="students"
                                                name="Students"
                                                fill="#4f46e5"
                                                radius={[4, 4, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>

                        <div className={styles.chartCard}>
                            <div className={styles.chartHeader}>
                                <h2>
                                    <FaUsers className={styles.chartIcon} /> Gender Distribution
                                </h2>
                                <p className={styles.chartSubtitle}>Student Gender Ratio</p>
                            </div>
                            <div className={styles.chartContainer}>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={genderData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, value }) => `${name}: ${value}%`}
                                            outerRadius={100}
                                            innerRadius={60}
                                            fill="#8884d8"
                                            dataKey="value"
                                            paddingAngle={5}
                                        >
                                            {genderData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0].payload;
                                                    return (
                                                        <div className={styles.tooltip}>
                                                            <p className={styles.tooltipLabel}>{data.name}</p>
                                                            <p style={{ color: data.color }}>
                                                                Percentage: {data.value}%
                                                            </p>
                                                            {data.count !== undefined && (
                                                                <p style={{ color: data.color }}>
                                                                    Count: {data.count}
                                                                </p>
                                                            )}
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className={styles.genderLegend}>
                                    {genderData.map((item, index) => (
                                        <div key={item.name} className={styles.genderItem}>
                                            <div
                                                className={styles.genderColorBox}
                                                style={{ backgroundColor: item.color }}
                                            ></div>
                                            <span className={styles.genderLabel}>{item.name}</span>
                                            <span className={styles.genderPercentage}>{item.value}%</span>
                                            {item.count !== undefined && (
                                                <span className={styles.genderCount}>({item.count})</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tables Section - Full width for Learning Tasks */}
                    <div className={styles.tablesSection}>
                        {/* Top Learning Tasks Table - Full Width */}
                        <div className={`${styles.tableCard} ${styles.fullWidth}`}>
                            <div className={styles.tableHeader}>
                                <h2>
                                    <FaTasks className={styles.tableIcon} /> Top Rated Learning Tasks
                                </h2>
                                <span className={styles.badge}>
                                    {Math.min(processedLearningTasks.length, 10)} Tasks
                                </span>
                            </div>
                            <div className={styles.tableWrapper}>
                                <div className={styles.tableContainer}>
                                    {processedLearningTasks.length === 0 ? (
                                        <div className={styles.emptyState}>
                                            <FaExclamationTriangle size={24} />
                                            <p>No learning tasks available</p>
                                            <button
                                                onClick={fetchDashboardData}
                                                className={styles.retryButton}
                                            >
                                                Retry Loading Tasks
                                            </button>
                                        </div>
                                    ) : (
                                        <table className={styles.dataTable}>
                                            <thead>
                                                <tr>
                                                    <th>Task Name</th>
                                                    <th className={styles.hideOnMobile}>Student</th>
                                                    <th>Grade</th>
                                                    <th>Rating</th>
                                                    <th className={styles.hideOnMobile}>Likes</th>
                                                    <th className={styles.hideOnMobile}>Languages</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {processedLearningTasks.map((task) => {
                                                    const avatarClassName = task.student.profile_pic_url
                                                        ? `${styles.avatarPlaceholder} ${styles.fallbackAvatar}`
                                                        : styles.avatarPlaceholder;

                                                    return (
                                                        <tr key={task.id} className={styles.clickableRow} onClick={() => navigate(`/admin/learning-task/${task.id}`)}>
                                                            <td>
                                                                <div className={styles.taskCell}>
                                                                    <span className={styles.taskName}>{task.title}</span>
                                                                </div>
                                                            </td>
                                                            <td className={styles.hideOnMobile}>
                                                                <div className={styles.studentCell}>
                                                                    {task.student.profile_pic_url ? (
                                                                        <img
                                                                            src={task.student.profile_pic_url}
                                                                            alt={task.student.fullName}
                                                                            className={styles.profileImage}
                                                                            onError={handleImageError}
                                                                        />
                                                                    ) : null}
                                                                    <div className={avatarClassName}>
                                                                        {task.student.fullName.charAt(0)}
                                                                    </div>
                                                                    <span>{task.student.fullName}</span>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span className={styles.gradeBadge}>
                                                                    <FaGraduationCap className={styles.gradeIcon} /> {task.student.grade}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <div className={styles.rating}>
                                                                    <span className={styles.ratingValue}>{task.rating.toFixed(1)}</span>
                                                                    <div className={styles.stars}>
                                                                        {[...Array(5)].map((_, i) => (
                                                                            <FaStar
                                                                                key={i}
                                                                                className={`${styles.star} ${i < Math.floor(task.rating) ? styles.starFilled : ""}`}
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className={styles.hideOnMobile}>
                                                                <div className={styles.likesCount}>
                                                                    <span className={styles.likesBadge}>
                                                                        {task.likes_count || 0} <FaHeart className={styles.heartIcon} />
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className={styles.hideOnMobile}>
                                                                <div className={styles.languagesContainer}>
                                                                    {task.languages.slice(0, 3).map((lang, idx) => (
                                                                        <span
                                                                            key={lang.id || idx}
                                                                            className={styles.languageBadge}
                                                                            style={{ backgroundColor: lang.color || '#4f46e5' }}
                                                                            title={lang.name}
                                                                        >
                                                                            {lang.code || lang.name.substring(0, 2)}
                                                                        </span>
                                                                    ))}
                                                                    {task.languages.length > 3 && (
                                                                        <span className={styles.moreLanguages}>
                                                                            +{task.languages.length - 3}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Attendance Status Table - Full Width */}
                        <div className={`${styles.tableCard} ${styles.fullWidth}`}>
                            <div className={styles.tableHeader}>
                                <h2>
                                    <FaProjectDiagram className={styles.tableIcon} /> Attendance Status
                                </h2>
                                <span className={styles.badge}>
                                    {dashboardData.attendance_summary?.total_sessions || 0} Sessions
                                </span>
                            </div>
                            <div className={styles.tableWrapper}>
                                <div className={styles.tableContainer}>
                                    <table className={styles.dataTable}>
                                        <thead>
                                            <tr>
                                                <th>Status</th>
                                                <th>Percentage</th>
                                                <th>Count</th>
                                                <th>Description</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {['present', 'late', 'absent', 'special_case'].map((status) => {
                                                const percentage = dashboardData.attendance_summary?.status_percentages?.[status] || 0;
                                                const count = dashboardData.attendance_summary?.status_counts?.[status] || 0;

                                                return (
                                                    <tr key={status}>
                                                        <td>
                                                            {getAttendanceStatusBadge(status, percentage)}
                                                        </td>
                                                        <td>{percentage.toFixed(1)}%</td>
                                                        <td>{count}</td>
                                                        <td>{getStatusDescription(status)}</td>
                                                    </tr>
                                                );
                                            })}
                                            <tr>
                                                <td>
                                                    <span className={styles.statusBadge} style={{ backgroundColor: "#4f46e520", color: "#4f46e5" }}>
                                                        <FaChartBar /> Average Attendance
                                                    </span>
                                                </td>
                                                <td>{attendanceAverage.toFixed(2)}%</td>
                                                <td>
                                                    {Object.values(dashboardData.attendance_summary?.status_counts || {})
                                                        .reduce((sum, count) => sum + count, 0)}
                                                </td>
                                                <td>Overall attendance (Present + Late)</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </SideBar>
        </div>
    );
};

export default AdminDashboard;