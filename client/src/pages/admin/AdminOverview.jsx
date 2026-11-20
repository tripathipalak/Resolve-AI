import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Page from '../../components/Page';
import { api } from '../../api';
import { STATUS_LABELS } from '../../constants';

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const rise = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/admin/stats', { auth: true }).then(setStats).catch(e => setError(e.message));
  }, []);

  if (error) return <Page><div className="container wide"><div className="error">{error}</div></div></Page>;
  if (!stats) return <Page><div className="container wide"><p className="muted">Loading…</p></div></Page>;

  const s = stats.byStatus;
  const cards = [
    { label: 'Total complaints', value: stats.total },
    { label: 'Awaiting agent', value: s.awaiting_agent || 0 },
    { label: 'Under investigation', value: s.under_investigation || 0 },
    { label: 'Resolved', value: s.resolved || 0 },
    { label: 'Team members', value: stats.agents },
    { label: 'Active policies', value: stats.activePolicies }
  ];

  const completed = stats.investigations.completed || 0;
  const failed = stats.investigations.failed || 0;

  return (
    <Page>
      <div className="container wide">
        <span className="eyebrow">Administration</span>
        <h1>Overview</h1>
        <p className="muted">How complaints, the team and the policy library are doing right now.</p>

        <motion.div className="kpi-strip" variants={stagger} initial="hidden" animate="show" style={{ marginTop: 24 }}>
          {cards.map(c => (
            <motion.div key={c.label} className="kpi" variants={rise}>
              <div className="label">{c.label}</div>
              <div className="value">{c.value}</div>
            </motion.div>
          ))}
        </motion.div>

        <div className="split">
          <div className="card">
            <h3>Complaints by status</h3>
            <motion.div variants={stagger} initial="hidden" animate="show" style={{ marginTop: 14 }}>
              {Object.entries(STATUS_LABELS).map(([key, label]) => {
                const count = s[key] || 0;
                const pct = stats.total ? Math.round((count / stats.total) * 100) : 0;
                return (
                  <motion.div key={key} variants={rise} style={{ marginBottom: 14 }}>
                    <div className="row between" style={{ fontSize: '0.9rem', marginBottom: 6 }}>
                      <span>{label}</span>
                      <span className="mono">{count}</span>
                    </div>
                    <div className="bar">
                      <motion.i initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7 }} />
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          <div className="card">
            <h3>AI investigations</h3>
            <p className="muted" style={{ fontSize: '0.9rem' }}>
              Runs that finished, and runs that failed and need manual review.
            </p>
            <div className="kpi-strip" style={{ gridTemplateColumns: '1fr 1fr', marginTop: 14, marginBottom: 0 }}>
              <div className="kpi">
                <div className="label">Completed</div>
                <div className="value">{completed}</div>
              </div>
              <div className="kpi">
                <div className="label">Failed</div>
                <div className="value" style={{ color: failed ? 'var(--danger)' : undefined }}>{failed}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}