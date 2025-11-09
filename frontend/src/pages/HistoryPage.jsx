import React, { useEffect, useState } from 'react';
import './HistoryPage.css';

function HistoryPage() {
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchAuditLogs() {
            try {
                setIsLoading(true);
                const response = await fetch('/api/audit-logs', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch audit logs');
                }

                const data = await response.json();
                setLogs(data);
                setError(null);
            } catch (err) {
                setError('Failed to fetch audit logs');
                console.error('Fetch error:', err);
            } finally {
                setIsLoading(false);
            }
        }

        fetchAuditLogs();
    }, []);

    const formatChanges = (details) => {
        if (!details) return 'No details available';

        if (details.changes) {
            const { before, after } = details.changes;
            return (
                <div>
                    <strong>Application:</strong> {details.applicationName}<br />
                    <strong>Changes:</strong>
                    <pre>
                        {JSON.stringify(
                            Object.keys(after).reduce((acc, key) => {
                                if (before[key] !== after[key]) {
                                    acc[key] = {
                                        from: before[key],
                                        to: after[key]
                                    };
                                }
                                return acc;
                            }, {}),
                            null,
                            2
                        )}
                    </pre>
                </div>
            );
        }

        if (details.deletedApplication) {
            return (
                <div>
                    <strong>Deleted Application:</strong> {details.applicationName}
                </div>
            );
        }

        return JSON.stringify(details, null, 2);
    };

    return (
        <div className="history-page">
            <h2>Audit History & Logs</h2>
            {isLoading ? (
                <div className="loading">Loading audit logs...</div>
            ) : error ? (
                <div className="error">{error}</div>
            ) : (
                <table className="audit-table">
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>Action</th>
                            <th>User</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map((log) => (
                            <tr key={log._id}>
                                <td>{new Date(log.timestamp).toLocaleString()}</td>
                                <td>{log.action}</td>
                                <td>{log.userEmail}</td>
                                <td>{formatChanges(log.details)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default HistoryPage;