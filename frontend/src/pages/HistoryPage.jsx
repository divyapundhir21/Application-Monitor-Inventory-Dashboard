import React, { useEffect, useState } from 'react';

function HistoryPage({ applications }) {
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch all history logs for all applications
    useEffect(() => {
        async function fetchAllHistory() {
            try {
                setIsLoading(true);
                let allLogs = [];
                for (const app of applications) {
                    if (!app._id) continue;
                    const res = await fetch(`/api/applications/${app._id}/history`);
                    if (res.ok) {
                        const appLogs = await res.json();
                        // Attach app name/id for context
                        appLogs.forEach(log => log.appName = app.name || app.applicationID);
                        allLogs = allLogs.concat(appLogs);
                    }
                }
                // Sort logs by timestamp descending
                allLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                setLogs(allLogs);
            } catch (err) {
                setError('Failed to fetch history logs.');
            } finally {
                setIsLoading(false);
            }
        }
        if (applications && applications.length > 0) {
            fetchAllHistory();
        }
    }, [applications]);

    return (
        <div className="history-page-container">
            <h2>Audit History & Logs</h2>
            {isLoading ? (
                <div>Loading history...</div>
            ) : error ? (
                <div style={{ color: 'red' }}>{error}</div>
            ) : logs.length === 0 ? (
                <div>No history logs found.</div>
            ) : (
                <table className="history-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Action</th>
                            <th>User</th>
                            <th>Application</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map((log, idx) => (
                            <tr key={idx}>
                                <td>{new Date(log.timestamp).toLocaleString()}</td>
                                <td>{log.action}</td>
                                <td>{log.user}</td>
                                <td>{log.appName}</td>
                                <td>
                                    <pre style={{ fontSize: '0.95em', whiteSpace: 'pre-wrap', margin: 0 }}>
                                        {JSON.stringify(log.changes, null, 2)}
                                    </pre>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default HistoryPage;