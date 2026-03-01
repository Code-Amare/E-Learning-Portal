import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../../../Context/UserContext";
import api from "../../../Utils/api";
import SideBar from "../../../Components/SideBar/SideBar";
import AttendanceSessionCard from "../../../Components/AttendanceSessionCard/AttendanceSessionCard";
import {
    FaCalendarPlus,
    FaSync,
    FaCalendarAlt,
    FaChartBar,
} from "react-icons/fa";
import styles from "./AttendanceList.module.css";
import { useNotifContext } from "../../../Context/NotifContext";

export default function AttendanceList() {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [stats, setStats] = useState({
        total: 0,
        open: 0,
        closed: 0
    });
    const { updatePageTitle } = useNotifContext()
    useEffect(() => {
        updatePageTitle("Attendances")
    }, [])


    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            const res = await api.get("/api/attendance/sessions/all/");
            const sessionsData = res.data.sessions || [];
            setSessions(sessionsData);

            const openSessions = sessionsData.filter(s => !s.is_ended);
            const closedSessions = sessionsData.filter(s => s.is_ended);

            setStats({
                total: sessionsData.length,
                open: openSessions.length,
                closed: closedSessions.length
            });
        } catch (error) {
            console.error("Error fetching sessions:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredSessions = sessions.filter(session => {
        if (filter === "open" && session.is_ended) return false;
        if (filter === "closed" && !session.is_ended) return false;

        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            return (
                session.title.toLowerCase().includes(searchLower) ||
                (session.id && session.id.toString().includes(searchTerm))
            );
        }

        return true;
    });

    const getSortedSessions = () => {
        return [...filteredSessions].sort((a, b) => {
            if (a.is_ended !== b.is_ended) {
                return a.is_ended ? 1 : -1;
            }
            return new Date(b.created_at) - new Date(a.created_at);
        });
    };

    const calculateAvgParticipants = () => {
        if (sessions.length === 0) return 0;
        const totalParticipants = sessions.reduce((acc, s) => {
            return acc + (s.users?.length || s.targets?.length || 0);
        }, 0);
        return Math.round(totalParticipants / sessions.length);
    };

    return (
        <div className={styles.container}>
            <SideBar>
                <div className={styles.header}>
                    <div className={styles.headerContent}>
                        <div className={styles.titleSection}>
                            <h1>
                                <FaCalendarAlt /> Attendance Sessions
                            </h1>
                            <p>Manage and monitor attendance sessions</p>
                        </div>

                        <div className={styles.actions}>
                            <button
                                onClick={fetchSessions}
                                className={styles.refreshBtn}
                                disabled={loading}
                            >
                                <FaSync className={loading ? styles.spin : ""} />
                                Refresh
                            </button>

                            <Link to="/admin/attendance/create/" className={styles.createBtn}>
                                <FaCalendarPlus />
                                New Session
                            </Link>
                        </div>
                    </div>
                </div>

                <div className={styles.stats}>
                    <div className={styles.stat}>
                        <div className={styles.statIcon}>
                            <FaCalendarAlt />
                        </div>
                        <div>
                            <span className={styles.statNumber}>{stats.total}</span>
                            <span className={styles.statLabel}>Total Sessions</span>
                        </div>
                    </div>

                    <div className={`${styles.stat} ${styles.statOpen}`}>
                        <div className={styles.statIcon}>
                            <div className={styles.statusDot} />
                        </div>
                        <div>
                            <span className={styles.statNumber}>{stats.open}</span>
                            <span className={styles.statLabel}>Open</span>
                        </div>
                    </div>

                    <div className={`${styles.stat} ${styles.statClosed}`}>
                        <div className={styles.statIcon}>
                            <div className={styles.statusDot} />
                        </div>
                        <div>
                            <span className={styles.statNumber}>{stats.closed}</span>
                            <span className={styles.statLabel}>Closed</span>
                        </div>
                    </div>

                    <div className={styles.stat}>
                        <div className={styles.statIcon}>
                            <FaChartBar />
                        </div>
                        <div>
                            <span className={styles.statNumber}>{calculateAvgParticipants()}</span>
                            <span className={styles.statLabel}>Avg. Participants</span>
                        </div>
                    </div>
                </div>

                <div className={styles.filters}>
                    <div className={styles.search}>
                        <input
                            type="text"
                            placeholder="Search sessions..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={styles.searchInput}
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm("")} className={styles.clearBtn}>
                                ×
                            </button>
                        )}
                    </div>

                    <div className={styles.filterTabs}>
                        <button
                            className={`${styles.tab} ${filter === "all" ? styles.active : ""}`}
                            onClick={() => setFilter("all")}
                        >
                            All ({stats.total})
                        </button>
                        <button
                            className={`${styles.tab} ${filter === "open" ? styles.active : ""}`}
                            onClick={() => setFilter("open")}
                        >
                            Open ({stats.open})
                        </button>
                        <button
                            className={`${styles.tab} ${filter === "closed" ? styles.active : ""}`}
                            onClick={() => setFilter("closed")}
                        >
                            Closed ({stats.closed})
                        </button>
                    </div>
                </div>

                <div className={styles.sessions}>
                    <div className={styles.sessionsHeader}>
                        <h2>Sessions ({filteredSessions.length})</h2>
                        {searchTerm && (
                            <span className={styles.searchInfo}>Search: "{searchTerm}"</span>
                        )}
                    </div>

                    {loading ? (
                        <div className={styles.loading}>
                            <div className={styles.spinner}></div>
                            <p>Loading sessions...</p>
                        </div>
                    ) : filteredSessions.length === 0 ? (
                        <div className={styles.empty}>
                            <FaCalendarAlt />
                            <h3>No sessions found</h3>
                            <p>
                                {searchTerm || filter !== "all"
                                    ? "Try adjusting your search or filter"
                                    : "Create your first attendance session to get started"}
                            </p>
                            {!searchTerm && filter === "all" && (
                                <Link to="/admin/attendance/create/" className={styles.createBtn}>
                                    <FaCalendarPlus />
                                    Create Session
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className={styles.grid}>
                            {getSortedSessions().map((session) => (
                                <AttendanceSessionCard
                                    key={session.id}
                                    session={session}
                                    onUpdate={fetchSessions}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </SideBar>
        </div>
    );
}