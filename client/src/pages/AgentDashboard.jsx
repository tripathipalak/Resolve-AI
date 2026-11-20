import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Page from '../components/Page';
import { api } from '../api';
import { CATEGORY_LABELS, STATUS_LABELS } from '../constants';

const FILTERS = ['all', ...Object.keys(STATUS_LABELS)];

export default function AgentDashboard() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      setTickets(await api('/tickets', { auth: true }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const counts = useMemo(() => {
    const c = { all: tickets.length };
    for (const k of Object.keys(STATUS_LABELS)) c[k] = tickets.filter(t => t.status === k).length;
    return c;
  }, [tickets]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tickets.filter(t =>
      (filter === 'all' || t.status === filter) &&
      (!q || [t.ticketNumber, t.customer?.name, t.customer?.email, t.orderId]
        .some(v => v?.toLowerCase().includes(q)))
    );
  }, [tickets, filter, query]);

  const kpis = [
    { label: 'Total complaints', value: counts.all, bar: 100, color: 'var(--accent)' },
    { label: 'Awaiting your review', value: counts.awaiting_agent || 0, bar: pct(counts.awaiting_agent, counts.all), color: 'var(--warn)' },
    { label: 'Under investigation', value: counts.under_investigation || 0, bar: pct(counts.under_investigation, counts.all), color: 'var(--accent-2)' },
    { label: 'Resolved', value: counts.resolved || 0, bar: pct(counts.resolved, counts.all), color: 'var(--ok)' }
  ];

  return (
    <Page>
      <div className="container wide">
        <div className="header-row">
          <div>
            <span className="eyebrow">Agent workspace</span>
            <h1>Complaints</h1>
            <p className="muted">Review AI investigations, check citations, and approve replies.</p>
          </div>
          <div className="row gap">
            <span className="live">Live</span>
            <button className="btn" onClick={load} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</button>
          </div>
        </div>

        <div className="kpis">
          {kpis.map((k, i) => (
            <motion.div key={k.label} className="kpi" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}>
              <div className="label">{k.label}</div>
              <div className="value">{k.value}</div>
              <div className="bar"><motion.i style={{ background: k.color }} initial={{ width: 0 }}
                animate={{ width: `${k.bar}%` }} transition={{ duration: 0.8, delay: 0.2 + i * 0.07 }} /></div>
            </motion.div>
          ))}
        </div>

        <div className="toolbar">
          <div className="filters">
            {FILTERS.map(f => (
              <button key={f} className={`filter ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f === 'all' ? 'All' : STATUS_LABELS[f]}<span>{counts[f] ?? 0}</span>
              </button>
            ))}
          </div>
          <div className="search">
            <input placeholder="Search ticket, name, email, order…" value={query} onChange={e => setQuery(e.target.value)} />
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Ticket</th><th>Customer</th><th>Category</th><th>Priority</th><th>Status</th><th>Created</th>
              </tr>
            </thead>
            <tbody>
              {loading && [0, 1, 2].map(i => (
                <tr key={i}><td colSpan={6}><div className="skeleton" /></td></tr>
              ))}
              {!loading && visible.map((t, i) => (
                <motion.tr key={t._id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }} onClick={() => navigate(`/agent/tickets/${t._id}`)}>
                  <td><div className="ticket-id">{t.ticketNumber}</div><div className="sub">{t.orderId}</div></td>
                  <td>{t.customer?.name}<div className="sub">{t.customer?.email}</div></td>
                  <td>{CATEGORY_LABELS[t.category]}</td>
                  <td><span className={`pill priority-${t.priority}`}>{t.priority}</span></td>
                  <td><span className={`pill status-${t.status}`}>{STATUS_LABELS[t.status]}</span></td>
                  <td className="muted">{new Date(t.createdAt).toLocaleDateString()}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {!loading && visible.length === 0 && <div className="empty">No complaints match this view.</div>}
        </div>
      </div>
    </Page>
  );
}

function pct(part = 0, total = 0) {
  return total ? Math.round((part / total) * 100) : 0;
}