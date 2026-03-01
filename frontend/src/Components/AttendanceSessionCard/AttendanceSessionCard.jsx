import React from "react";
import { Link } from "react-router-dom";
import { FaUsers, FaCalendarAlt, FaLock, FaUnlock, FaChevronRight } from "react-icons/fa";
import styles from "./AttendanceSessionCard.module.css";

export default function AttendanceSessionCard({ session }) {
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Link
            to={`/admin/session/${session.id}`}
            className={`${styles.sessionCard} ${session.is_ended ? styles.closed : styles.open}`}
        >
            <div className={styles.cardHeader}>
                <div className={styles.statusIndicator}>
                    {session.is_ended ? (
                        <>
                            <FaLock />
                            <span>Closed</span>
                        </>
                    ) : (
                        <>
                            <FaUnlock />
                            <span>Open</span>
                        </>
                    )}
                </div>
                <div className={styles.arrowIcon}>
                    <FaChevronRight />
                </div>
            </div>

            <div className={styles.cardBody}>
                <h3 className={styles.sessionTitle}>{session.title}</h3>

                <div className={styles.sessionMeta}>
                    <div className={styles.metaItem}>
                        <FaCalendarAlt />
                        <span>Created: {formatDate(session.created_at)}</span>
                    </div>

                    <div className={styles.metaItem}>
                        <FaUsers />
                        <span>{session.targets?.length || 0} participants</span>
                    </div>
                </div>

                {session.last_updated && (
                    <div className={styles.lastUpdated}>
                        Last updated: {formatDate(session.last_updated)}
                    </div>
                )}
            </div>

            <div className={styles.cardFooter}>
                <div className={styles.sessionId}>
                    ID: {session.id}
                </div>
                {session.is_ended ? (
                    <div className={styles.closedBadge}>
                        Session Closed
                    </div>
                ) : (
                    <div className={styles.openBadge}>
                        Active
                    </div>
                )}
            </div>
        </Link>
    );
}