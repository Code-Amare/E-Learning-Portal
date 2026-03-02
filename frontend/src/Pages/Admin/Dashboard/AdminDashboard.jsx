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
        total_students: 0,
        gender_counts: { male: 0, female: 0 },
        grade_distribution: {},
        average_progress_percentage: 0,
        progress_by_grade: {},
    });
    const { updatePageTitle } = useNotifContext();
    useEffect(() => {
        updatePageTitle("Admin Dashboard");
    }, []);

    const [gradeCountData, setGradeCountData] = useState([]);
    const [progressByGradeData, setProgressByGradeData] = useState([]);
    const [genderData, setGenderData] = useState([
        { name: "Male", value: 0, color: "#4f46e5" },
        { name: "Female", value: 0, color: "#ec4899" },
    ]);
    const [cssVars, setCssVars] = useState({
        borderColor: "#e5e7eb",
        textSecondary: "#4b5563"
    });

    // Fetch dashboard data
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
            console.log(data);

            setDashboardData({
                total_students: data.total_students || 0,
                gender_counts: data.gender_counts || { male: 0, female: 0 },
                grade_distribution: data.grade_distribution || {},
                average_progress_percentage: data.average_progress_percentage || 0,
                progress_by_grade: data.progress_by_grade || {},
            });

            // Prepare grade count chart data
            const gradeCountChart = Object.entries(data.grade_distribution || {})
                .map(([grade, count]) => ({
                    grade: `Grade ${grade}`,
                    students: count,
                }))
                .sort((a, b) => parseInt(a.grade.replace('Grade ', '')) - parseInt(b.grade.replace('Grade ', '')));
            setGradeCountData(gradeCountChart);

            // Prepare progress by grade chart data
            const progressChart = Object.entries(data.progress_by_grade || {})
                .map(([grade, avg]) => ({
                    grade: `Grade ${grade}`,
                    progress: Number(avg).toFixed(1),
                }))
                .sort((a, b) => parseInt(a.grade.replace('Grade ', '')) - parseInt(b.grade.replace('Grade ', '')));
            setProgressByGradeData(progressChart);

            // Gender pie data (percentage)
            const maleCount = data.gender_counts?.male || 0;
            const femaleCount = data.gender_counts?.female || 0;
            const totalGender = maleCount + femaleCount;
            const malePercentage = totalGender > 0 ? (maleCount / totalGender) * 100 : 0;
            const femalePercentage = totalGender > 0 ? (femaleCount / totalGender) * 100 : 0;

            setGenderData([
                { name: "Male", value: Math.round(malePercentage), count: maleCount, color: "#4f46e5" },
                { name: "Female", value: Math.round(femalePercentage), count: femaleCount, color: "#ec4899" },
            ]);

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            neonToast.error("Failed to load dashboard data", "error");
        } finally {
            setLoading(false);
        }
    };

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
                                <h3>Avg Progress</h3>
                                <p className={styles.statValue}>{dashboardData.average_progress_percentage.toFixed(1)}%</p>
                                <span className={styles.statTrend}>
                                    <FiTrendingUp /> across all students
                                </span>
                            </div>
                        </div>

                        <div className={styles.statCard}>
                            <div className={styles.statIcon} style={{ backgroundColor: "rgba(245, 158, 11, 0.1)" }}>
                                <FaGraduationCap className={styles.statIconSvg} />
                            </div>
                            <div className={styles.statContent}>
                                <h3>Grade Levels</h3>
                                <p className={styles.statValue}>{Object.keys(dashboardData.grade_distribution).length}</p>
                                <span className={styles.statTrend}>
                                    <FiTrendingUp /> {dashboardData.total_students} students
                                </span>
                            </div>
                        </div>

                        <div className={styles.statCard}>
                            <div className={styles.statIcon} style={{ backgroundColor: "rgba(236, 72, 153, 0.1)" }}>
                                <FaProjectDiagram className={styles.statIconSvg} />
                            </div>
                            <div className={styles.statContent}>
                                <h3>Gender Split</h3>
                                <p className={styles.statValue}>
                                    {dashboardData.gender_counts?.male || 0} / {dashboardData.gender_counts?.female || 0}
                                </p>
                                <span className={styles.statTrend}>
                                    <FiTrendingUp /> M/F
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Charts Section */}
                    <div className={styles.chartsSection}>
                        {/* Grade Distribution (Count) */}
                        <div className={styles.chartCard}>
                            <div className={styles.chartHeader}>
                                <h2>
                                    <FaGraduationCap className={styles.chartIcon} /> Grade Distribution
                                </h2>
                                <p className={styles.chartSubtitle}>Students per Grade Level</p>
                            </div>
                            <div className={styles.chartContainer}>
                                {gradeCountData.length === 0 ? (
                                    <div className={styles.noDataMessage}>
                                        <FaExclamationTriangle size={24} />
                                        <p>No grade data available</p>
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart
                                            data={gradeCountData}
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

                        {/* Gender Distribution Pie */}
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

                    {/* Optional: Average Progress by Grade Chart */}
                    <div className={styles.chartsSection}>
                        <div className={styles.chartCard} style={{ width: "100%" }}>
                            <div className={styles.chartHeader}>
                                <h2>
                                    <FaChartBar className={styles.chartIcon} /> Average Progress by Grade
                                </h2>
                                <p className={styles.chartSubtitle}>Progress percentage per grade level</p>
                            </div>
                            <div className={styles.chartContainer}>
                                {progressByGradeData.length === 0 ? (
                                    <div className={styles.noDataMessage}>
                                        <FaExclamationTriangle size={24} />
                                        <p>No progress data available</p>
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart
                                            data={progressByGradeData}
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
                                                domain={[0, 100]}
                                            />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend />
                                            <Bar
                                                dataKey="progress"
                                                name="Avg Progress %"
                                                fill="#10b981"
                                                radius={[4, 4, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </SideBar>
        </div>
    );
};

export default AdminDashboard;