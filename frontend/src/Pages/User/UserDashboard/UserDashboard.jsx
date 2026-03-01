import styles from "./UserDashboard.module.css";
import SideBar from "../../../Components/SideBar/SideBar";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import {
    FaTasks,
    FaCheckCircle,
    FaClock,
    FaCalendarCheck,
    FaUserGraduate,
    FaStar,
    FaArrowRight,
    FaChartLine,
    FaPercentage,
    FaRegCalendarCheck,
    FaRegClock,
    FaRegTimesCircle,
    FaUserMd,
    FaPencilAlt,
    FaRedo,
    FaSearch,
    FaThumbsUp,
} from "react-icons/fa";
import { FiTrendingUp, FiUser, FiCalendar } from "react-icons/fi";
import { useUser } from "../../../Context/UserContext";
import { useNotifContext } from "../../../Context/NotifContext";
import api from "../../../Utils/api";

const UserDashboard = () => {
    const navigate = useNavigate();
    const { user } = useUser()
    const { updatePageTitle } = useNotifContext()

    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        updatePageTitle("User Dashboard");
    }, []);

    useEffect(() => {
        const userData = async () => {
            try {
                setLoading(true);
                const res = await api.get("api/users/data/");
                setDashboardData(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        userData();
    }, []);

    // Map backend stats to frontend format
    const userStats = dashboardData?.stats ? {
        attendanceRate: dashboardData.stats.attendance_rate,
        attendanceDistribution: dashboardData.stats.attendance_distribution,
        totalLearningTasks: dashboardData.stats.total_learning_tasks,
        totalGrade: dashboardData.stats.total_grade,        // <-- directly use total_grade
        taskCompletion: dashboardData.stats.task_completion_percent,
        totalBonus: dashboardData.stats.total_bonus,
        taskScore: dashboardData.stats.task_score
    } : null;

    // Calculate completed tasks and pending review from task_status_distribution
    const completedTasks = dashboardData?.task_status_distribution?.rated || 0;
    const pendingReview = dashboardData?.task_status_distribution?.under_review || 0;

    // Prepare attendance distribution data for pie chart
    const attendanceDistributionData = userStats?.attendanceDistribution ? [
        { name: "Present", value: userStats.attendanceDistribution.present, color: "#10b981", icon: <FaRegCalendarCheck /> },
        { name: "Late", value: userStats.attendanceDistribution.late, color: "#f59e0b", icon: <FaRegClock /> },
        { name: "Absent", value: userStats.attendanceDistribution.absent, color: "#ef4444", icon: <FaRegTimesCircle /> },
        { name: "Special Case", value: userStats.attendanceDistribution.special_case, color: "#8b5cf6", icon: <FaUserMd /> }
    ].filter(item => item.value > 0) : [];

    // Calculate total attendance sessions
    const totalAttendanceSessions = userStats?.attendanceDistribution ?
        Object.values(userStats.attendanceDistribution).reduce((sum, value) => sum + value, 0) : 0;

    // Prepare task status data with colors (from the object structure)
    const taskStatusData = dashboardData?.task_status_distribution ? [
        { name: "Draft", value: dashboardData.task_status_distribution.draft || 0, color: "#6b7280", icon: <FaPencilAlt /> },
        { name: "Redo", value: dashboardData.task_status_distribution.redo || 0, color: "#ef4444", icon: <FaRedo /> },
        { name: "Under Review", value: dashboardData.task_status_distribution.under_review || 0, color: "#f59e0b", icon: <FaSearch /> },
        { name: "Rated", value: dashboardData.task_status_distribution.rated || 0, color: "#10b981", icon: <FaThumbsUp /> }
    ].filter(item => item.value > 0) : [];

    // Calculate attendance trend (placeholder - you might want real calculation)
    const calculateAttendanceTrend = () => {
        if (!userStats?.attendanceRate) return "+0.0%";
        return userStats.attendanceRate > 80 ? "+5.2%" : userStats.attendanceRate < 70 ? "-2.1%" : "+0.0%";
    };

    // Custom tooltip for pie charts
    const CustomPieTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const percentage = totalAttendanceSessions > 0
                ? ((data.value / totalAttendanceSessions) * 100).toFixed(1)
                : 0;

            return (
                <div className={styles.tooltip}>
                    <div className={styles.tooltipHeader}>
                        <span className={styles.tooltipIcon} style={{ color: data.color }}>
                            {data.icon}
                        </span>
                        <span className={styles.tooltipLabel}>{data.name}</span>
                    </div>
                    <div className={styles.tooltipContent}>
                        <p className={styles.tooltipValue}>{data.value} sessions</p>
                        <p className={styles.tooltipPercentage}>{percentage}% of total</p>
                    </div>
                </div>
            );
        }
        return null;
    };

    // Custom tooltip for task status chart
    const CustomTaskTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const totalTasks = taskStatusData.reduce((sum, item) => sum + item.value, 0);
            const percentage = totalTasks > 0
                ? ((data.value / totalTasks) * 100).toFixed(1)
                : 0;

            return (
                <div className={styles.tooltip}>
                    <div className={styles.tooltipHeader}>
                        <span className={styles.tooltipIcon} style={{ color: data.color }}>
                            {data.icon}
                        </span>
                        <span className={styles.tooltipLabel}>{data.name}</span>
                    </div>
                    <div className={styles.tooltipContent}>
                        <p className={styles.tooltipValue}>{data.value} tasks</p>
                        <p className={styles.tooltipPercentage}>{percentage}% of total</p>
                    </div>
                </div>
            );
        }
        return null;
    };

    // Handle image error
    const handleImageError = (e) => {
        e.target.style.display = "none";
        const nextSibling = e.target.nextElementSibling;
        if (nextSibling) {
            nextSibling.style.display = "flex";
        }
    };

    // Handle navigation to tasks
    const handleViewAllTasks = () => {
        navigate("/user/my-learning-task");
    };

    // Handle navigation to create task
    const handleCreateTask = () => {
        navigate("/user/learning-task/create");
    };

    if (loading) {
        return (
            <div className={styles.UserDashboardContainer}>
                <SideBar>
                    <div className={styles.loadingContainer}>
                        <div className={styles.spinner}></div>
                        <p>Loading dashboard data...</p>
                    </div>
                </SideBar>
            </div>
        );
    }

    if (!dashboardData) {
        return (
            <div className={styles.UserDashboardContainer}>
                <SideBar>
                    <div className={styles.errorContainer}>
                        <p>Failed to load dashboard data. Please try again.</p>
                    </div>
                </SideBar>
            </div>
        );
    }

    return (
        <div className={styles.UserDashboardContainer}>
            <SideBar>
                <div className={styles.UserDashboard}>
                    {/* Header with User Info */}
                    <header className={styles.header}>
                        <div className={styles.userInfo}>
                            <div className={styles.userAvatar}>
                                {user.profilePicURL ? (
                                    <img
                                        src={user.profilePicURL}
                                        alt={user.fullName}
                                        className={styles.profileImage}
                                        onError={handleImageError}
                                    />
                                ) : <div className={styles.avatarPlaceholder}>
                                    <FiUser />
                                </div>}

                            </div>
                            <div className={styles.userDetails}>
                                <h1>Welcome back, {user.fullName}!</h1>
                                <p className={styles.subtitle}>
                                    <FaUserGraduate /> Grade {user.grade} •
                                    <FiCalendar /> Member since {`${new Date(user.dateJoined).getFullYear()}-${String(new Date(user.dateJoined).getMonth() + 1).padStart(2, "0")}-${String(new Date(user.dateJoined).getDate()).padStart(2, "0")}`}
                                    •
                                    <span className={styles.memberId}>ID: {user.id}</span>
                                </p>
                            </div>
                        </div>
                        <button className={styles.createTaskBtn} onClick={handleCreateTask}>
                            <FaTasks /> Create New Task
                        </button>
                    </header>

                    {/* Stats Cards */}
                    <div className={styles.statsGrid}>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon} style={{ backgroundColor: "rgba(79, 70, 229, 0.1)" }}>
                                <FaCalendarCheck className={styles.statIconSvg} />
                            </div>
                            <div className={styles.statContent}>
                                <h3>Attendance Rate</h3>
                                <p className={styles.statValue}>{userStats?.attendanceRate || 0}%</p>
                                <span className={styles.statTrend}>
                                    <FiTrendingUp /> {calculateAttendanceTrend()} this period
                                </span>
                                <div className={styles.attendanceBreakdown}>
                                    <div className={styles.breakdownItem}>
                                        <span className={styles.breakdownLabel}>Total Sessions:</span>
                                        <span className={styles.breakdownValue}>{totalAttendanceSessions}</span>
                                    </div>
                                    {userStats?.attendanceDistribution && (
                                        <>
                                            {userStats.attendanceDistribution.present > 0 && (
                                                <div className={styles.breakdownItem}>
                                                    <span className={styles.breakdownLabel}>Present:</span>
                                                    <span className={styles.breakdownValue} style={{ color: "#10b981" }}>
                                                        {userStats.attendanceDistribution.present}
                                                    </span>
                                                </div>
                                            )}
                                            {userStats.attendanceDistribution.late > 0 && (
                                                <div className={styles.breakdownItem}>
                                                    <span className={styles.breakdownLabel}>Late:</span>
                                                    <span className={styles.breakdownValue} style={{ color: "#f59e0b" }}>
                                                        {userStats.attendanceDistribution.late}
                                                    </span>
                                                </div>
                                            )}
                                            {userStats.attendanceDistribution.absent > 0 && (
                                                <div className={styles.breakdownItem}>
                                                    <span className={styles.breakdownLabel}>Absent:</span>
                                                    <span className={styles.breakdownValue} style={{ color: "#ef4444" }}>
                                                        {userStats.attendanceDistribution.absent}
                                                    </span>
                                                </div>
                                            )}
                                            {userStats.attendanceDistribution.special_case > 0 && (
                                                <div className={styles.breakdownItem}>
                                                    <span className={styles.breakdownLabel}>Special:</span>
                                                    <span className={styles.breakdownValue} style={{ color: "#8b5cf6" }}>
                                                        {userStats.attendanceDistribution.special_case}
                                                    </span>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className={styles.statCard}>
                            <div className={styles.statIcon} style={{ backgroundColor: "rgba(16, 185, 129, 0.1)" }}>
                                <FaTasks className={styles.statIconSvg} />
                            </div>
                            <div className={styles.statContent}>
                                <h3>Learning Tasks</h3>
                                <p className={styles.statValue}>{userStats?.totalLearningTasks || 0}</p>
                                <span className={styles.statTrend}>
                                    {completedTasks} rated • {userStats?.taskCompletion || 0}% done
                                </span>
                                <div className={styles.taskBreakdown}>
                                    <div className={styles.breakdownItem}>
                                        <span className={styles.breakdownLabel}>Score:</span>
                                        <span className={styles.breakdownValue}>{userStats?.taskScore || 0} points</span>
                                    </div>
                                    {userStats?.totalBonus > 0 && (
                                        <div className={styles.breakdownItem}>
                                            <span className={styles.breakdownLabel}>Bonus:</span>
                                            <span className={styles.breakdownValue} style={{ color: "#10b981" }}>
                                                +{userStats.totalBonus} points
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Third stat card: Total Grade (instead of Average Grade) */}
                        <div className={styles.statCard}>
                            <div className={styles.statIcon} style={{ backgroundColor: "rgba(245, 158, 11, 0.1)" }}>
                                <FaStar className={styles.statIconSvg} />
                            </div>
                            <div className={styles.statContent}>
                                <h3>Total Grade</h3>              {/* changed title */}
                                <p className={styles.statValue}>{userStats?.totalGrade || 0}</p>  {/* display total grade */}
                                <span className={styles.statTrend}>
                                    <FaChartLine /> Sum of all grades
                                </span>                               {/* updated description */}
                                <div className={styles.gradeBreakdown}>
                                    <div className={styles.breakdownItem}>
                                        <span className={styles.breakdownLabel}>Task Score:</span>
                                        <span className={styles.breakdownValue}>{userStats?.taskScore || 0}</span>
                                    </div>
                                    <div className={styles.breakdownItem}>
                                        <span className={styles.breakdownLabel}>Bonus:</span>
                                        <span className={styles.breakdownValue}>+{userStats?.totalBonus || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={styles.statCard}>
                            <div className={styles.statIcon} style={{ backgroundColor: "rgba(236, 72, 153, 0.1)" }}>
                                <FaClock className={styles.statIconSvg} />
                            </div>
                            <div className={styles.statContent}>
                                <h3>Under Review</h3>
                                <p className={styles.statValue}>{pendingReview}</p>
                                <span className={styles.statTrend}>
                                    Awaiting admin evaluation
                                </span>
                                <div className={styles.reviewBreakdown}>
                                    <div className={styles.breakdownItem}>
                                        <span className={styles.breakdownLabel}>Total Tasks:</span>
                                        <span className={styles.breakdownValue}>{userStats?.totalLearningTasks || 0}</span>
                                    </div>
                                    <div className={styles.breakdownItem}>
                                        <span className={styles.breakdownLabel}>Rated:</span>
                                        <span className={styles.breakdownValue}>
                                            {completedTasks}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Charts Section */}
                    <div className={styles.chartsSection}>
                        {/* Attendance Distribution Chart */}
                        <div className={styles.chartCard}>
                            <div className={styles.chartHeader}>
                                <h2>
                                    <FaCalendarCheck className={styles.chartIcon} /> Attendance Distribution
                                </h2>
                                <p className={styles.chartSubtitle}>Breakdown of your attendance status</p>
                            </div>
                            <div className={styles.chartContainer}>
                                {attendanceDistributionData.length > 0 ? (
                                    <>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <PieChart>
                                                <Pie
                                                    data={attendanceDistributionData}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                    outerRadius={100}
                                                    innerRadius={60}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                    paddingAngle={5}
                                                >
                                                    {attendanceDistributionData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={<CustomPieTooltip />} />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className={styles.chartLegend}>
                                            {attendanceDistributionData.map((item, index) => (
                                                <div key={item.name} className={styles.legendItem}>
                                                    <div className={styles.legendIcon}>
                                                        {item.icon}
                                                    </div>
                                                    <div
                                                        className={styles.legendColorBox}
                                                        style={{ backgroundColor: item.color }}
                                                    ></div>
                                                    <span className={styles.legendLabel}>{item.name}</span>
                                                    <span className={styles.legendValue}>{item.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className={styles.noDataMessage}>
                                        <FaCalendarCheck className={styles.noDataIcon} />
                                        <p>No attendance data available</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Task Status Chart */}
                        <div className={styles.chartCard}>
                            <div className={styles.chartHeader}>
                                <h2>
                                    <FaPercentage className={styles.chartIcon} /> Task Status Distribution
                                </h2>
                                <p className={styles.chartSubtitle}>Overview of your learning tasks status</p>
                            </div>
                            <div className={styles.chartContainer}>
                                {taskStatusData.length > 0 ? (
                                    <>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <PieChart>
                                                <Pie
                                                    data={taskStatusData}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                    outerRadius={100}
                                                    innerRadius={60}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                    paddingAngle={5}
                                                >
                                                    {taskStatusData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={<CustomTaskTooltip />} />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className={styles.chartLegend}>
                                            {taskStatusData.map((item, index) => (
                                                <div key={item.name} className={styles.legendItem}>
                                                    <div className={styles.legendIcon}>
                                                        {item.icon}
                                                    </div>
                                                    <div
                                                        className={styles.legendColorBox}
                                                        style={{ backgroundColor: item.color }}
                                                    ></div>
                                                    <span className={styles.legendLabel}>{item.name}</span>
                                                    <span className={styles.legendValue}>{item.value} tasks</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className={styles.noDataMessage}>
                                        <FaTasks className={styles.noDataIcon} />
                                        <p>No task data available</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Recently Reviewed Tasks */}
                    <div className={styles.tablesSection}>
                        <div className={styles.tableCard}>
                            <div className={styles.tableHeader}>
                                <h2>
                                    <FaCheckCircle className={styles.tableIcon} /> Recently Reviewed Tasks
                                </h2>
                                <span className={styles.badge}>Last {dashboardData.recently_reviewed_tasks.length}</span>
                            </div>
                            <div className={styles.tableWrapper}>
                                <div className={styles.tableContainer}>
                                    <table className={styles.dataTable}>
                                        <thead>
                                            <tr>
                                                <th>Task Name</th>
                                                <th className={styles.hideOnMobile}>Technologies</th>
                                                <th>Grade</th>
                                                <th>Reviewed</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {dashboardData.recently_reviewed_tasks.map((task) => {
                                                // If grade is out of 5, multiply by 20 to get percentage
                                                const gradeValue = Number(task.grade);
                                                // If grade is on a 5-point scale, uncomment next line:
                                                // const gradePercentage = gradeValue * 20;
                                                // For now, treat grade as percentage (as in sample: 5 and 4 are small, maybe it's out of 5)
                                                // We'll keep gradeValue as is for display, but stars need scaling
                                                const starRating = gradeValue; // if grade is out of 5, this works
                                                // If grade is percentage, starRating should be gradeValue/20.

                                                return (
                                                    <tr key={task.id}>
                                                        <td>
                                                            <div className={styles.taskCell}>
                                                                <span className={styles.taskName}>{task.title}</span>
                                                                <div className={styles.taskDescription}>
                                                                    {task.description.substring(0, 50)}...
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className={styles.hideOnMobile}>
                                                            <div className={styles.techCell}>
                                                                <div className={styles.techTags}>
                                                                    {[...task.languages, ...task.frameworks].slice(0, 2).map((tech, idx) => (
                                                                        <span key={idx} className={styles.techTag}>
                                                                            {tech}
                                                                        </span>
                                                                    ))}
                                                                    {[...task.languages, ...task.frameworks].length > 2 && (
                                                                        <span className={styles.moreTag}>
                                                                            +{[...task.languages, ...task.frameworks].length - 2}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className={styles.gradeCell}>
                                                                <div className={styles.gradeValue}>
                                                                    {gradeValue} / 5
                                                                </div>
                                                                <div className={styles.stars}>
                                                                    {[...Array(5)].map((_, i) => (
                                                                        <FaStar
                                                                            key={i}
                                                                            className={`${styles.star} ${i < Math.floor(gradeValue) ? styles.starFilled : ""}`}
                                                                        />
                                                                    ))}
                                                                    <span className={styles.gradePercentage}>
                                                                        ({gradeValue}/5)
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className={styles.dateCell}>
                                                                <div className={styles.reviewDate}>
                                                                    {task.reviewed_date}
                                                                </div>
                                                                <div className={styles.reviewer}>
                                                                    {task.reviewer}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <button
                                                                className={styles.viewButton}
                                                                onClick={() => navigate(`/user/learning-task/${task.id}`)}
                                                            >
                                                                View Details
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className={styles.tableFooter}>
                                <button className={styles.viewAllBtn} onClick={handleViewAllTasks}>
                                    View All Tasks <FaArrowRight />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </SideBar>
        </div>
    );
};

export default UserDashboard;