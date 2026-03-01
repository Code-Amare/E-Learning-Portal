import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useUser } from "../../../Context/UserContext";
import api from "../../../Utils/api";
import { neonToast } from "../../../Components/NeonToast/NeonToast";
import SideBar from "../../../Components/SideBar/SideBar";
import LearningTaskCard from "../../../Components/LearningTaskCard/LearningTaskCard";
import {
    FaArrowLeft,
    FaTasks,
} from "react-icons/fa";
import styles from "./StudentLearningTasks.module.css";
import { useNotifContext } from "../../../Context/NotifContext";


const normalizeTask = (task) => ({
    ...task,

    languages: Array.isArray(task.languages)
        ? task.languages.map(lang =>
            typeof lang === "string" ? lang : lang.name
        )
        : [],

    frameworks: Array.isArray(task.frameworks)
        ? task.frameworks.map(fw =>
            typeof fw === "string" ? fw : fw.name
        )
        : [],

    grade: task.grade ?? task.reviews?.[0]?.rating ?? null,
});

const normalizeTasks = (tasks = []) => tasks.map(normalizeTask);


export default function StudentLearningTasks() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useUser();
    const { updatePageTitle } = useNotifContext()
    useEffect(() => {
        updatePageTitle("Student Learning Tasks")
    }, [])

    const [student, setStudent] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingTasks, setLoadingTasks] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortBy, setSortBy] = useState("created_at");
    const [sortOrder, setSortOrder] = useState("desc");

    useEffect(() => {
        if (!user?.isAuthenticated) {
            navigate("/login");
            return;
        }

        if (user.role !== "admin") {
            navigate("/dashboard");
            return;
        }

        let mounted = true;

        const fetchData = async () => {
            setLoading(true);
            try {
                const studentResponse = await api.get(`/api/management/student/${id}/`);
                if (!mounted) return;

                const studentData = studentResponse.data.student || studentResponse.data;
                setStudent(studentData || null);

                await fetchLearningTasks();
            } catch (error) {
                console.error(error);
                neonToast.error("Failed to load student information");
                navigate("/admin/students");
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchData();
        return () => { mounted = false; };
    }, [id, user, navigate]);

    const fetchLearningTasks = async () => {
        setLoadingTasks(true);
        try {
            const response = await api.get(`/api/learning-task/student/${id}/`);
            const rawTasks = response.data?.tasks || [];
            setTasks(normalizeTasks(rawTasks));
        } catch (error) {
            const errMsg =
                error.response?.data?.error ||
                error.response?.data?.detail ||
                "Something went wrong";

            neonToast.error(errMsg);
            setTasks([]);
        } finally {
            setLoadingTasks(false);
        }
    };


    const getFilteredAndSortedTasks = () => {
        let filtered = tasks;

        if (searchTerm) {
            filtered = filtered.filter(task =>
                task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                task.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (statusFilter !== "all") {
            filtered = filtered.filter(task => task.status === statusFilter);
        }

        filtered = [...filtered].sort((a, b) => {
            let aValue, bValue;

            switch (sortBy) {
                case "title":
                    aValue = a.title.toLowerCase();
                    bValue = b.title.toLowerCase();
                    break;
                case "updated_at":
                    aValue = new Date(a.updated_at);
                    bValue = new Date(b.updated_at);
                    break;
                case "rating":
                    aValue = a.grade || 0;
                    bValue = b.grade || 0;
                    break;
                default:
                    aValue = new Date(a.created_at);
                    bValue = new Date(b.created_at);
            }

            return sortOrder === "asc"
                ? aValue > bValue ? 1 : -1
                : aValue < bValue ? 1 : -1;
        });

        return filtered;
    };

    const handleViewTask = (task) => {
        navigate(`/admin/learning-task/${task.id}`);
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <SideBar>
                    <p>Loading student information...</p>
                </SideBar>
            </div>
        );
    }

    const filteredTasks = getFilteredAndSortedTasks();

    return (
        <div className={styles.container}>
            <SideBar>
                <Link to={`/admin/student/${id}`} className={styles.backLink}>
                    <FaArrowLeft /> Student detail
                </Link>

                <h2 className={styles.pageTitle}>
                    <FaTasks /> Learning Tasks
                </h2>

                <div className={styles.tasksSection}>
                    {loadingTasks ? (
                        <p>Loading tasks...</p>
                    ) : filteredTasks.length === 0 ? (
                        <p>No learning tasks found.</p>
                    ) : (
                        <div className={styles.tasksGrid}>
                            {filteredTasks.map(task => (
                                <LearningTaskCard
                                    key={task.id}
                                    task={task}
                                    onView={() => handleViewTask(task)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </SideBar>
        </div>
    );
}
