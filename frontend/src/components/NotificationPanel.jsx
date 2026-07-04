import { useEffect, useState } from 'react';
import { normalizeList } from "@/lib/normalizeList";
export default function NotificationPanel() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/v1/notifications')
      .then(res => {
        if (!res.ok) throw new Error('Network error');
        return res.json();
      })
      .then(data => {
        setNotifications(data.data || []);
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
      <h2>Notification Panel</h2>
      {normalizeList(notifications).length > 0 ? (
        <ul>{normalizeList(notifications).map(n => <li key={n.id}>{n.title || `Notificação ${n.id}`}</li>)}</ul>
      ) : (
        <p>Nenhuma notificação.</p>
      )}
    </div>
  );
}
