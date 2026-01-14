'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api, AuditLog } from '@/lib/api';
import styles from '../page.module.css';
import auditStyles from './page.module.css';

export default function AuditLogPage() {
    const params = useParams();
    const guildId = params.guildId as string;
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

    useEffect(() => {
        loadLogs(1);
    }, [guildId]);

    async function loadLogs(page: number) {
        setLoading(true);
        const result = await api.guilds.getAuditLogs(guildId, page);
        if (result.data) {
            setLogs(result.data.logs);
            setPagination({
                page: result.data.pagination.page,
                pages: result.data.pagination.pages,
                total: result.data.pagination.total,
            });
        }
        setLoading(false);
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString();
    };

    const getActionBadgeClass = (action: string) => {
        if (action.includes('TOGGLE')) return auditStyles.badgeWarning;
        if (action.includes('UPDATE')) return auditStyles.badgeInfo;
        return auditStyles.badgeDefault;
    };

    if (loading && logs.length === 0) {
        return (
            <div className={styles.loader}>
                <div className={styles.spinner}></div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1>Audit Log</h1>
                <p className={styles.subtitle}>
                    View all dashboard configuration changes ({pagination.total} entries)
                </p>
            </div>

            {logs.length === 0 ? (
                <div className={auditStyles.empty}>
                    <p>No audit log entries found.</p>
                    <p className={auditStyles.emptyHint}>
                        Changes made via the dashboard will appear here.
                    </p>
                </div>
            ) : (
                <>
                    <div className={auditStyles.logList}>
                        {logs.map((log) => (
                            <div key={log._id} className={auditStyles.logEntry}>
                                <div className={auditStyles.logHeader}>
                                    <span className={`${auditStyles.badge} ${getActionBadgeClass(log.action)}`}>
                                        {log.action.replace(/_/g, ' ')}
                                    </span>
                                    <span className={auditStyles.logTime}>{formatDate(log.createdAt)}</span>
                                </div>
                                <div className={auditStyles.logBody}>
                                    <div className={auditStyles.logUser}>
                                        <span className={auditStyles.userLabel}>By:</span>
                                        <span>{log.userTag}</span>
                                    </div>
                                    <div className={auditStyles.logTarget}>
                                        <span className={auditStyles.targetLabel}>Target:</span>
                                        <span>{log.target}</span>
                                    </div>
                                    {log.changes.length > 0 && (
                                        <div className={auditStyles.logChanges}>
                                            {log.changes.map((change, idx) => (
                                                <div key={idx} className={auditStyles.change}>
                                                    <span className={auditStyles.changeField}>{change.field}:</span>
                                                    <span className={auditStyles.changeOld}>
                                                        {JSON.stringify(change.oldValue)}
                                                    </span>
                                                    <span className={auditStyles.changeArrow}>→</span>
                                                    <span className={auditStyles.changeNew}>
                                                        {JSON.stringify(change.newValue)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {pagination.pages > 1 && (
                        <div className={auditStyles.pagination}>
                            <button
                                className={auditStyles.pageBtn}
                                onClick={() => loadLogs(pagination.page - 1)}
                                disabled={pagination.page <= 1 || loading}
                            >
                                Previous
                            </button>
                            <span className={auditStyles.pageInfo}>
                                Page {pagination.page} of {pagination.pages}
                            </span>
                            <button
                                className={auditStyles.pageBtn}
                                onClick={() => loadLogs(pagination.page + 1)}
                                disabled={pagination.page >= pagination.pages || loading}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
