// src/pages/Admin/Students/StudentsBulk.js
import React, { useState, useRef, useEffect } from 'react';
import styles from './StudentsBulk.module.css';
import SideBar from '../../../Components/SideBar/SideBar';
import api from '../../../Utils/api';
import { neonToast } from '../../../Components/NeonToast/NeonToast';
import {
    FaUpload,
    FaDownload,
    FaFileExcel,
    FaCheckCircle,
    FaExclamationTriangle,
    FaSpinner,
    FaTimes,
    FaEnvelope
} from 'react-icons/fa';
import { FiAlertCircle, FiInfo } from 'react-icons/fi';
import { useNotifContext } from '../../../Context/NotifContext';

const StudentsBulk = () => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadResults, setUploadResults] = useState(null);
    const [validationErrors, setValidationErrors] = useState([]);
    const [createdStudents, setCreatedStudents] = useState([]);
    const [activeTab, setActiveTab] = useState('upload');
    const [showTemplateInfo, setShowTemplateInfo] = useState(false);
    const fileInputRef = useRef(null);
    const resultsRef = useRef(null);
    const { updatePageTitle } = useNotifContext();

    useEffect(() => {
        updatePageTitle("Student Bulk Upload");
    }, [updatePageTitle]);

    const requiredColumns = [
        "full_name",
        "email",
        "grade",
        "section",
        "field",
        "phone_number",
        "gender"
    ];

    const optionalColumns = ["account"];
    const fieldOptions = ["frontend", "backend", "ai", "embedded", "cyber", "other"];

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
        const allowedExtensions = ['xlsx', 'xls'];

        if (!allowedExtensions.includes(fileExtension)) {
            neonToast.error('Invalid file format. Please upload Excel files (.xlsx or .xls).', 'error');
            e.target.value = '';
            return;
        }

        if (selectedFile.size > 5 * 1024 * 1024) {
            neonToast.error('File size too large. Maximum size is 5MB.', 'error');
            e.target.value = '';
            return;
        }

        setFile(selectedFile);
        setUploadResults(null);
        setValidationErrors([]);
        setCreatedStudents([]);
    };

    const handleUpload = async () => {
        if (!file) {
            neonToast.error('Please select a file to upload', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            const response = await api.post('/api/management/students/bulk-upload/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const { data } = response;

            if (data.errors && data.errors.length > 0) {
                setValidationErrors(data.errors);
                if (data.created_students && data.created_students.length > 0) {
                    setCreatedStudents(data.created_students);
                }
                neonToast.warning(`Upload completed with ${data.error_count} errors`, 'warning');
            } else {
                setCreatedStudents(data.created_students || []);
                neonToast.success(`Successfully uploaded ${data.created_count} students`, 'success');
            }

            setUploadResults(data);

            setTimeout(() => {
                if (resultsRef.current) {
                    resultsRef.current.scrollIntoView({ behavior: 'smooth' });
                }
            }, 100);

        } catch (error) {
            console.error('Upload error:', error);
            let errorMessage = 'Failed to upload file';

            if (error.response?.data) {
                const { error: apiError, errors, detail } = error.response.data;
                if (apiError) errorMessage = apiError;
                if (errors) setValidationErrors(Array.isArray(errors) ? errors : [errors]);
                if (detail) errorMessage += `: ${detail}`;
            }

            neonToast.error(errorMessage, 'error');
        } finally {
            setUploading(false);
        }
    };

    const downloadTemplate = async () => {
        try {
            const response = await api.get('/api/management/students/template/', {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'student_template.xlsx');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            neonToast.info('Excel template downloaded', 'info');
        } catch (error) {
            console.error('Error downloading template:', error);
            neonToast.error('Failed to download template', 'error');
        }
    };

    const formatError = (errorObj) => {
        if (typeof errorObj === 'string') return errorObj;
        if (Array.isArray(errorObj)) return errorObj.join(', ');
        if (typeof errorObj === 'object') {
            return Object.entries(errorObj).map(([key, value]) =>
                `${key}: ${Array.isArray(value) ? value.join(', ') : value}`
            ).join('; ');
        }
        return String(errorObj);
    };

    const clearAll = () => {
        setFile(null);
        setUploadResults(null);
        setValidationErrors([]);
        setCreatedStudents([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className={styles.StudentsBulkUploadContainer}>
            <SideBar>
                <div className={styles.StudentsBulkUpload}>
                    {/* Header */}
                    <header className={styles.header}>
                        <div className={styles.headerContent}>
                            <h1>
                                <FaUpload className={styles.headerIcon} />
                                Bulk Student Upload
                            </h1>
                            <p className={styles.subtitle}>
                                Upload Excel files to create multiple student accounts at once
                            </p>
                        </div>

                        <div className={styles.headerActions}>
                            <button
                                className={`${styles.actionButton} ${styles.infoButton}`}
                                onClick={() => setShowTemplateInfo(!showTemplateInfo)}
                            >
                                <FiInfo />
                                Template Info
                            </button>

                            <button
                                className={`${styles.actionButton} ${styles.templateButton}`}
                                onClick={downloadTemplate}
                            >
                                <FaDownload />
                                Download Excel Template
                            </button>
                        </div>
                    </header>

                    {/* Template Info Modal */}
                    {showTemplateInfo && (
                        <div
                            className={styles.modalOverlay}
                            onClick={() => setShowTemplateInfo(false)}
                        >
                            <div
                                className={styles.templateInfoModal}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className={styles.modalContent}>
                                    <div className={styles.modalHeader}>
                                        <h3>File Template Requirements</h3>
                                        <button
                                            className={styles.closeButton}
                                            onClick={() => setShowTemplateInfo(false)}
                                        >
                                            <FaTimes />
                                        </button>
                                    </div>

                                    <div className={styles.modalBody}>
                                        <div className={styles.infoSection}>
                                            <h4>Required Columns:</h4>
                                            <div className={styles.columnsGrid}>
                                                {requiredColumns.map((col, index) => (
                                                    <div key={index} className={styles.columnItem}>
                                                        <span className={styles.columnName}>{col}</span>
                                                        <span className={styles.columnDescription}>
                                                            {col === 'grade' ? 'Number between 1-12' :
                                                                col === 'section' ? 'Single letter (A-Z)' :
                                                                    col === 'field' ? `One of: ${fieldOptions.join(', ')}` :
                                                                        col === 'email' ? 'Valid email address' :
                                                                            col === 'gender' ? 'Must be "male" or "female"' :
                                                                                col === 'phone_number' ? 'Valid phone number (with country code recommended)' :
                                                                                    'Required field'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className={styles.infoSection}>
                                            <h4>Optional Columns:</h4>
                                            <div className={styles.columnsGrid}>
                                                {optionalColumns.map((col, index) => (
                                                    <div key={index} className={styles.columnItem}>
                                                        <span className={styles.columnName}>{col}</span>
                                                        <span className={styles.columnDescription}>
                                                            Optional student account identifier
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className={styles.infoSection}>
                                            <div className={styles.note}>
                                                <FiAlertCircle className={styles.noteIcon} />
                                                <div className={styles.noteContent}>
                                                    <strong>Important Notes:</strong>
                                                    <ul>
                                                        <li>Emails must be unique across the system</li>
                                                        <li>Grade must be a number between 1 and 12</li>
                                                        <li>Section must be a single uppercase letter</li>
                                                        <li>Field must be one of the specified values</li>
                                                        <li>Gender must be exactly "male" or "female"</li>
                                                        <li>Duplicate emails in the file will be rejected</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Upload Section */}
                    <div className={styles.uploadSection}>
                        <div className={styles.uploadCard}>
                            <div className={styles.uploadHeader}>
                                <h2>Upload Student Data</h2>
                                <p className={styles.uploadSubtitle}>
                                    Select an Excel file (.xlsx or .xls) containing student information
                                </p>
                            </div>

                            <div className={styles.dropZone}
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.classList.add(styles.dragOver);
                                }}
                                onDragLeave={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.classList.remove(styles.dragOver);
                                }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.classList.remove(styles.dragOver);
                                    if (e.dataTransfer.files.length > 0) {
                                        handleFileSelect({ target: { files: e.dataTransfer.files } });
                                    }
                                }}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    accept=".xlsx,.xls"
                                    className={styles.fileInput}
                                />

                                {!file ? (
                                    <div className={styles.dropZoneContent}>
                                        <FaUpload className={styles.dropZoneIcon} />
                                        <p className={styles.dropZoneText}>
                                            Drag & drop your Excel file here or click to browse
                                        </p>
                                        <p className={styles.dropZoneHint}>
                                            Supports XLSX, XLS (Max 5MB)
                                        </p>
                                    </div>
                                ) : (
                                    <div className={styles.fileSelected}>
                                        <div className={styles.fileInfo}>
                                            <FaFileExcel className={styles.fileIcon} />
                                            <div className={styles.fileDetails}>
                                                <h4>{file.name}</h4>
                                                <p>{(file.size / 1024).toFixed(2)} KB</p>
                                            </div>
                                        </div>
                                        <button
                                            className={styles.removeFileButton}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setFile(null);
                                                if (fileInputRef.current) {
                                                    fileInputRef.current.value = '';
                                                }
                                            }}
                                        >
                                            <FaTimes />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className={styles.uploadActions}>
                                <button
                                    className={`${styles.uploadButton} ${!file || uploading ? styles.disabled : ''}`}
                                    onClick={handleUpload}
                                    disabled={!file || uploading}
                                >
                                    {uploading ? (
                                        <>
                                            <FaSpinner className={styles.spinner} />
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <FaUpload />
                                            Upload Students
                                        </>
                                    )}
                                </button>

                                {file && (
                                    <button
                                        className={styles.clearButton}
                                        onClick={clearAll}
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Results Section */}
                    {(uploadResults || validationErrors.length > 0) && (
                        <div ref={resultsRef} className={styles.resultsSection}>
                            {/* Tabs */}
                            <div className={styles.resultsTabs}>
                                <button
                                    className={`${styles.tabButton} ${activeTab === 'upload' ? styles.active : ''}`}
                                    onClick={() => setActiveTab('upload')}
                                >
                                    Upload Results
                                </button>
                                {validationErrors.length > 0 && (
                                    <button
                                        className={`${styles.tabButton} ${activeTab === 'errors' ? styles.active : ''}`}
                                        onClick={() => setActiveTab('errors')}
                                    >
                                        <FaExclamationTriangle />
                                        Errors ({validationErrors.length})
                                    </button>
                                )}
                                {createdStudents.length > 0 && (
                                    <button
                                        className={`${styles.tabButton} ${activeTab === 'students' ? styles.active : ''}`}
                                        onClick={() => setActiveTab('students')}
                                    >
                                        <FaCheckCircle />
                                        Created Students ({createdStudents.length})
                                    </button>
                                )}
                            </div>

                            {/* Tab Content */}
                            <div className={styles.tabContent}>
                                {activeTab === 'upload' && uploadResults && (
                                    <div className={styles.summaryCard}>
                                        <div className={styles.summaryHeader}>
                                            <h3>Upload Summary</h3>
                                            <div className={styles.summaryStats}>
                                                <div className={styles.statItem}>
                                                    <span className={styles.statLabel}>Total Processed:</span>
                                                    <span className={styles.statValue}>
                                                        {uploadResults.created_count + (uploadResults.error_count || 0)}
                                                    </span>
                                                </div>
                                                <div className={styles.statItem}>
                                                    <span className={styles.statLabel}>Successfully Created:</span>
                                                    <span className={styles.statValue}>
                                                        {uploadResults.created_count}
                                                    </span>
                                                </div>
                                                <div className={styles.statItem}>
                                                    <span className={styles.statLabel}>Errors:</span>
                                                    <span className={styles.statValue}>
                                                        {uploadResults.error_count || 0}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {uploadResults.learning_task_limit_default && (
                                            <div className={styles.noteCard}>
                                                <FiInfo className={styles.noteIcon} />
                                                <p>
                                                    All created students have been assigned a default learning task limit of{' '}
                                                    <strong>{uploadResults.learning_task_limit_default}</strong> tasks.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'errors' && validationErrors.length > 0 && (
                                    <div className={styles.errorsCard}>
                                        <div className={styles.errorsHeader}>
                                            <h3>
                                                <FaExclamationTriangle />
                                                Validation Errors
                                            </h3>
                                            <p className={styles.errorsSubtitle}>
                                                Please fix these errors and try uploading again
                                            </p>
                                        </div>

                                        <div className={styles.errorsList}>
                                            {validationErrors.map((error, index) => (
                                                <div key={index} className={styles.errorItem}>
                                                    <div className={styles.errorHeader}>
                                                        <span className={styles.errorRow}>Row {error.row}</span>
                                                        <span className={styles.errorEmail}>{error.email}</span>
                                                    </div>
                                                    <div className={styles.errorDetails}>
                                                        {error.errors ? (
                                                            Object.entries(error.errors).map(([field, fieldErrors]) => (
                                                                <div key={field} className={styles.fieldError}>
                                                                    <strong>{field}:</strong>{' '}
                                                                    {Array.isArray(fieldErrors) ? fieldErrors.join(', ') : fieldErrors}
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className={styles.fieldError}>
                                                                {formatError(error.error || error)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'students' && createdStudents.length > 0 && (
                                    <div className={styles.studentsCard}>
                                        <div className={styles.studentsHeader}>
                                            <h3>
                                                <FaCheckCircle />
                                                Successfully Created Students
                                            </h3>
                                        </div>

                                        <div className={styles.studentsTableContainer}>
                                            <table className={styles.studentsTable}>
                                                <thead>
                                                    <tr>
                                                        <th>Name</th>
                                                        <th>Email</th>
                                                        <th>Grade & Section</th>
                                                        <th>Field</th>
                                                        <th>Phone</th>
                                                        <th>Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {createdStudents.map((student) => (
                                                        <tr key={student.id}>
                                                            <td>
                                                                <div className={styles.studentName}>
                                                                    {student.full_name}
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div className={styles.studentEmail}>
                                                                    {student.email}
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span className={styles.gradeSectionBadge}>
                                                                    Grade {student.grade} - {student.section}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className={styles.fieldBadge}>
                                                                    {student.field}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                {student.phone_number}
                                                            </td>
                                                            <td>
                                                                <span className={styles.messageBadge}>
                                                                    <FaEnvelope /> Activation email sent
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </SideBar>
        </div>
    );
};

export default StudentsBulk;