import { useEffect, useState } from 'react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/audit-logs')
      .then(res => {
        if (!res.ok) throw new Error('Network error');
        return res.json();
      })
      .then(data => {
        setLogs(data.data || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error}</div>;

  return (
    <div>
      <h2>Audit Logs</h2>
      {logs.length > 0 ? (
        <ul>{logs.map(l => <li key={l.id}>[{new Date(l.created_at).toLocaleString()}] {l.action}</li>)}</ul>
      ) : (
        <p>Nenhum registro de auditoria.</p>
      )}
    </div>
  );
}