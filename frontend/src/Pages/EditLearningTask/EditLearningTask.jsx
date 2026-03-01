import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./EditLearningTask.module.css";
import SideBar from "../../Components/SideBar/SideBar";
import ConfirmAction from "../../Components/ConfirmAction/ConfirmAction";
import {
    FaArrowLeft,
    FaSave,
    FaTrash,
    FaPlus,
    FaTimes,
    FaExclamationTriangle
} from "react-icons/fa";
import { useNotifContext } from "../../Context/NotifContext";

const EditLearningTask = () => {
    const { taskId } = useParams();
    const navigate = useNavigate();
    const { updatePageTitle } = useNotifContext()
    useEffect(() => {
        updatePageTitle("Edit Learning Task")
    }, [])

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        fullDescription: "",
        languages: [],
        frameworks: [],
        difficulty: "beginner",
        estimatedHours: 10,
        tags: [],
        githubLink: ""
    });

    const [newLanguage, setNewLanguage] = useState("");
    const [newFramework, setNewFramework] = useState("");
    const [newTag, setNewTag] = useState("");
    const [errors, setErrors] = useState({});

    useEffect(() => {
        const fetchTask = async () => {
            setLoading(true);
            await new Promise(resolve => setTimeout(resolve, 300));

            // Mock data
            const mockTask = {
                id: 1,
                title: "Database Entity Creation",
                description: "Building a complete database system",
                fullDescription: "This learning task focuses on designing and implementing a robust database system from scratch.",
                languages: ["JavaScript", "SQL"],
                frameworks: ["Node.js", "Sequelize"],
                difficulty: "intermediate",
                estimatedHours: 20,
                tags: ["Database", "Backend"],
                githubLink: "https://github.com/john/project"
            };

            if (taskId) {
                setFormData(mockTask);
            }
            setLoading(false);
        };

        fetchTask();
    }, [taskId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ""
            }));
        }
    };

    const handleAddLanguage = (e) => {
        e.preventDefault();
        const trimmed = newLanguage.trim();
        if (trimmed && !formData.languages.includes(trimmed)) {
            setFormData(prev => ({
                ...prev,
                languages: [...prev.languages, trimmed]
            }));
            setNewLanguage("");
        }
    };

    const handleRemoveLanguage = (language) => {
        setFormData(prev => ({
            ...prev,
            languages: prev.languages.filter(lang => lang !== language)
        }));
    };

    const handleAddFramework = (e) => {
        e.preventDefault();
        const trimmed = newFramework.trim();
        if (trimmed && !formData.frameworks.includes(trimmed)) {
            setFormData(prev => ({
                ...prev,
                frameworks: [...prev.frameworks, trimmed]
            }));
            setNewFramework("");
        }
    };

    const handleRemoveFramework = (framework) => {
        setFormData(prev => ({
            ...prev,
            frameworks: prev.frameworks.filter(fw => fw !== framework)
        }));
    };

    const handleAddTag = (e) => {
        e.preventDefault();
        const trimmed = newTag.trim();
        if (trimmed && !formData.tags.includes(trimmed)) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, trimmed]
            }));
            setNewTag("");
        }
    };

    const handleRemoveTag = (tag) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(t => t !== tag)
        }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = "Title is required";
        }

        if (!formData.description.trim()) {
            newErrors.description = "Description is required";
        }

        if (!formData.fullDescription.trim()) {
            newErrors.fullDescription = "Full description is required";
        }

        if (formData.estimatedHours < 1 || formData.estimatedHours > 100) {
            newErrors.estimatedHours = "Must be between 1-100 hours";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setSaving(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSaving(false);
        navigate("/user/learning-tasks");
    };

    const handleDelete = async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        navigate("/user/learning-tasks");
        return true;
    };

    const handleCancel = () => {
        navigate("/user/my-learning-task");
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <SideBar>
                    <div className={styles.loadingContainer}>
                        <div className={styles.spinner}></div>
                        <p>Loading...</p>
                    </div>
                </SideBar>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <SideBar>
                {/* Main Content Container */}
                <div className={styles.mainContent}>
                    {/* Fixed Header at Top */}
                    <div className={styles.pageHeader}>
                        <div className={styles.headerTop}>
                            <button onClick={handleCancel} className={styles.backBtn}>
                                <FaArrowLeft /> Back
                            </button>

                            <h1 className={styles.pageTitle}>
                                {taskId ? "Edit Learning Task" : "Create Learning Task"}
                            </h1>

                            <div className={styles.headerActions}>
                                <button
                                    onClick={handleSubmit}
                                    disabled={saving}
                                    className={styles.saveBtn}
                                >
                                    <FaSave /> {saving ? "Saving..." : "Save"}
                                </button>

                                {taskId && (
                                    <ConfirmAction
                                        title="Delete Task"
                                        message="Are you sure you want to delete this task? This action cannot be undone."
                                        confirmText="Delete"
                                        cancelText="Cancel"
                                        onConfirm={handleDelete}
                                    >
                                        <button className={styles.deleteBtn}>
                                            <FaTrash /> Delete
                                        </button>
                                    </ConfirmAction>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Form Content */}
                    <div className={styles.formContent}>
                        <form onSubmit={handleSubmit} className={styles.form}>
                            {/* Basic Info */}
                            <div className={styles.formSection}>
                                <h2 className={styles.sectionTitle}>Basic Information</h2>

                                <div className={styles.formGroup}>
                                    <label>Task Title *</label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        placeholder="Enter task title"
                                        className={`${styles.input} ${errors.title ? styles.error : ''}`}
                                    />
                                    {errors.title && (
                                        <div className={styles.errorMessage}>
                                            <FaExclamationTriangle /> {errors.title}
                                        </div>
                                    )}
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Short Description *</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        placeholder="Brief description of the task"
                                        rows={3}
                                        className={`${styles.textarea} ${errors.description ? styles.error : ''}`}
                                    />
                                    {errors.description && (
                                        <div className={styles.errorMessage}>
                                            <FaExclamationTriangle /> {errors.description}
                                        </div>
                                    )}
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Full Description *</label>
                                    <textarea
                                        name="fullDescription"
                                        value={formData.fullDescription}
                                        onChange={handleChange}
                                        placeholder="Detailed description, requirements, and objectives"
                                        rows={5}
                                        className={`${styles.textarea} ${errors.fullDescription ? styles.error : ''}`}
                                    />
                                    {errors.fullDescription && (
                                        <div className={styles.errorMessage}>
                                            <FaExclamationTriangle /> {errors.fullDescription}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Technical Details */}
                            <div className={styles.formSection}>
                                <h2 className={styles.sectionTitle}>Technical Details</h2>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>Difficulty Level</label>
                                        <select
                                            name="difficulty"
                                            value={formData.difficulty}
                                            onChange={handleChange}
                                            className={styles.select}
                                        >
                                            <option value="beginner">Beginner</option>
                                            <option value="intermediate">Intermediate</option>
                                            <option value="advanced">Advanced</option>
                                        </select>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Estimated Hours *</label>
                                        <input
                                            type="number"
                                            name="estimatedHours"
                                            value={formData.estimatedHours}
                                            onChange={handleChange}
                                            min="1"
                                            max="100"
                                            className={`${styles.input} ${errors.estimatedHours ? styles.error : ''}`}
                                        />
                                        {errors.estimatedHours && (
                                            <div className={styles.errorMessage}>
                                                <FaExclamationTriangle /> {errors.estimatedHours}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Languages */}
                                <div className={styles.formGroup}>
                                    <label>Programming Languages</label>
                                    <form onSubmit={handleAddLanguage} className={styles.tagInputGroup}>
                                        <input
                                            type="text"
                                            value={newLanguage}
                                            onChange={(e) => setNewLanguage(e.target.value)}
                                            placeholder="Add a language"
                                            className={styles.tagInput}
                                        />
                                        <button
                                            type="submit"
                                            className={styles.addTagBtn}
                                        >
                                            <FaPlus />
                                        </button>
                                    </form>

                                    <div className={styles.tagsContainer}>
                                        {formData.languages.map((language, index) => (
                                            <div key={index} className={styles.tag}>
                                                {language}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveLanguage(language)}
                                                    className={styles.removeTagBtn}
                                                >
                                                    <FaTimes />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Frameworks */}
                                <div className={styles.formGroup}>
                                    <label>Frameworks & Libraries</label>
                                    <form onSubmit={handleAddFramework} className={styles.tagInputGroup}>
                                        <input
                                            type="text"
                                            value={newFramework}
                                            onChange={(e) => setNewFramework(e.target.value)}
                                            placeholder="Add a framework"
                                            className={styles.tagInput}
                                        />
                                        <button
                                            type="submit"
                                            className={styles.addTagBtn}
                                        >
                                            <FaPlus />
                                        </button>
                                    </form>

                                    <div className={styles.tagsContainer}>
                                        {formData.frameworks.map((framework, index) => (
                                            <div key={index} className={styles.tag}>
                                                {framework}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveFramework(framework)}
                                                    className={styles.removeTagBtn}
                                                >
                                                    <FaTimes />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Additional Info */}
                            <div className={styles.formSection}>
                                <h2 className={styles.sectionTitle}>Additional Information</h2>

                                <div className={styles.formGroup}>
                                    <label>GitHub Repository (Optional)</label>
                                    <input
                                        type="url"
                                        name="githubLink"
                                        value={formData.githubLink}
                                        onChange={handleChange}
                                        placeholder="https://github.com/username/repository"
                                        className={styles.input}
                                    />
                                </div>

                                {/* Tags */}
                                <div className={styles.formGroup}>
                                    <label>Tags</label>
                                    <form onSubmit={handleAddTag} className={styles.tagInputGroup}>
                                        <input
                                            type="text"
                                            value={newTag}
                                            onChange={(e) => setNewTag(e.target.value)}
                                            placeholder="Add tags"
                                            className={styles.tagInput}
                                        />
                                        <button
                                            type="submit"
                                            className={styles.addTagBtn}
                                        >
                                            <FaPlus />
                                        </button>
                                    </form>

                                    <div className={styles.tagsContainer}>
                                        {formData.tags.map((tag, index) => (
                                            <div key={index} className={styles.tag}>
                                                {tag}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveTag(tag)}
                                                    className={styles.removeTagBtn}
                                                >
                                                    <FaTimes />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </SideBar>
        </div>
    );
};

export default EditLearningTask;