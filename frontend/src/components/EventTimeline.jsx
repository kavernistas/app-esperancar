import { useEffect, useState } from 'react';

export default function EventTimeline() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/v1/events/timeline')
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        setEvents(data.data || []);
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
      <h2>Event Timeline</h2>
      {events.length > 0 ? (
        <ul>
          {events.map(e => (
            <li key={e.id}>
              {e.title || e.event_name} – {new Date(e.occurred_at).toLocaleString()}
            </li>
          ))}
        </ul>
      ) : (
        <p>Nenhum evento.</p>
      )}
    </div>
  );
}