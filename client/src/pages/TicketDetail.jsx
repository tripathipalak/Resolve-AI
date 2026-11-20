import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Page from '../components/Page';
import Pipeline from '../components/Pipeline';
import { api, fetchAuthBlobUrl } from '../api';
import { CATEGORY_LABELS, STATUS_LABELS, ACTION_LABELS } from '../constants';

// Statuses in which the agent should write a reply.
const OPEN_STATUSES = ['submitted', 'under_investigation', 'awaiting_agent', 'awaiting_customer'];

export default function TicketDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  async function load() {
    const d = await api(`/tickets/${id}`, { auth: true });
    setData(d);
    const t = d.ticket;
    // While a reply is due, show the newest AI draft. Otherwise show what was sent last.
    const newestDraft = t.response?.generated || t.response?.final || '';
    const lastSent = t.response?.final || t.response?.generated || '';
    setDraft(OPEN_STATUSES.includes(t.status) ? newestDraft : lastSent);
  }

  useEffect(() => {
    load().catch(e => setError(e.message));
  }, [id]);

  async function investigate() {
    setBusy('investigate');
    setError('');
    try {
      await api(`/tickets/${id}/investigate`, { method: 'POST', auth: true });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  }

  // mode: 'wait' keeps the ticket open for the customer; 'resolve' closes it.
  async function approve(mode) {
    setBusy(mode);
    setError('');
    try {
      await api(`/tickets/${id}/response`, {
        method: 'PATCH',
        body: { final: draft, mode },
        auth: true
      });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  }

  if (!data && !error) return <Page><div className="container"><p className="muted">Loading…</p></div></Page>;
  if (!data) return <Page><div className="container"><div className="error">{error}</div></div></Page>;

  const { ticket, investigation: inv } = data;
  const rec = inv?.recommendation;
  const cls = inv?.classification;
  const canReply = OPEN_STATUSES.includes(ticket.status);
  const approved = !canReply && Boolean(ticket.response?.approvedAt);
  const waitingForCustomer = ticket.status === 'awaiting_customer';
  const updates = ticket.customerUpdates || [];

  // The customer added information after the last investigation: a re-run is needed.
  const needsRerun = Boolean(
    inv && ticket.lastCustomerUpdateAt &&
    new Date(ticket.lastCustomerUpdateAt) > new Date(inv.createdAt)
  );
  const cardMotion = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

  return (
    <Page>
      <div className="container wide">
        <Link to="/agent" className="link-btn">← Back to complaints</Link>
        <div className="row between wrap">
          <h1>{ticket.ticketNumber}</h1>
          <span className={`pill status-${ticket.status}`}>{STATUS_LABELS[ticket.status]}</span>
        </div>

        {error && <div className="error">{error}</div>}

        {waitingForCustomer && (
          <div className="banner-info">
            Waiting for the customer to reply with the information you asked for. When they add it, this ticket returns to your queue.
          </div>
        )}
        {needsRerun && (
          <div className="banner-info">
            The customer added new information after the last investigation. Re-run the investigation to include it.
          </div>
        )}

        <div className="split">
          <motion.div className="card" {...cardMotion}>
            <h3>Complaint</h3>
            <dl className="facts">
              <dt>Customer</dt><dd>{ticket.customer?.name} ({ticket.customer?.email})</dd>
              <dt>Order</dt><dd>{ticket.orderId}</dd>
              <dt>Category</dt><dd>{CATEGORY_LABELS[ticket.category]}</dd>
              <dt>Priority</dt><dd><span className={`pill priority-${ticket.priority}`}>{ticket.priority}</span></dd>
            </dl>
            <p className="description">{ticket.description}</p>

            {updates.length > 0 && (
              <>
                <h4>Customer added information</h4>
                <ul className="update-list">
                  {updates.map((u, i) => (
                    <li key={i}>
                      {u.message}
                      <small>{new Date(u.at).toLocaleString()}</small>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {ticket.evidence?.length > 0 && (
              <>
                <h4>Evidence</h4>
                <div className="evidence-grid">
                  {ticket.evidence.map((f, i) => (
                    <EvidenceItem key={i} ticketId={ticket._id} index={i} file={f} />
                  ))}
                </div>
              </>
            )}
          </motion.div>

          <motion.div className="card" {...cardMotion} transition={{ delay: 0.1 }}>
            <div className="row between">
              <h3>AI investigation</h3>
              {(!inv || inv.status === 'failed' || needsRerun) && (
                <button className="btn btn-primary" onClick={investigate} disabled={!!busy}>
                  {busy === 'investigate'
                    ? 'Investigating…'
                    : needsRerun ? 'Re-run with new info' : 'Run investigation'}
                </button>
              )}
            </div>

            <Pipeline status={busy === 'investigate' ? 'running' : inv?.status} />

            {busy === 'investigate' && (
              <div className="loading">
                <motion.div className="spinner" animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                <span className="muted">This can take up to 30 seconds while the AI reads the complaint and policy.</span>
              </div>
            )}

            {!inv && busy !== 'investigate' && <p className="muted">No investigation yet.</p>}
            {inv?.status === 'failed' && <div className="error">Investigation failed: {inv.error}</div>}

            {inv?.status === 'completed' && rec && (
              <>
                <div className="row gap wrap">
                  <span className="pill action">{ACTION_LABELS[rec.action]}</span>
                  <span className="muted">{cls?.summary}</span>
                </div>
                <p>{rec.reasoning}</p>

                {rec.policyCitations.length > 0 && (
                  <>
                    <h4>Policy citations</h4>
                    {rec.policyCitations.map((c, i) => (
                      <blockquote key={i}>
                        <strong>Section {c.section.replace(/^section\s*/i, '')}</strong>
                        <p>"{c.quote}"</p>
                      </blockquote>
                    ))}
                  </>
                )}

                {rec.assumptions.length > 0 && (
                  <>
                    <h4>Assumptions (unverified)</h4>
                    <ul>{rec.assumptions.map((a, i) => <li key={i}>{a}</li>)}</ul>
                  </>
                )}

                {rec.missingInformation.length > 0 && (
                  <>
                    <h4>Missing information</h4>
                    <ul>{rec.missingInformation.map((m, i) => <li key={i}>{m}</li>)}</ul>
                  </>
                )}
              </>
            )}
          </motion.div>
        </div>

        <motion.div className="card" {...cardMotion} transition={{ delay: 0.2 }}>
          <div className="row between wrap">
            <h3>Response to customer</h3>
            {approved && (
              <span className="pill status-resolved">
                {waitingForCustomer ? 'Sent' : 'Approved'} {new Date(ticket.response.approvedAt).toLocaleString()}
              </span>
            )}
          </div>
          <p className="muted">
            The AI draft is below. Edit it, then choose how to send it. The original draft is kept for the audit trail.
          </p>
          <textarea rows={6} value={draft} onChange={e => setDraft(e.target.value)} disabled={!canReply} />

          {canReply && (
            <div className="row gap wrap" style={{ marginTop: 12 }}>
              <button className="btn" onClick={() => approve('wait')}
                disabled={!!busy || draft.trim().length < 20}>
                {busy === 'wait' ? 'Sending…' : 'Send and wait for customer'}
              </button>
              <button className="btn btn-primary" onClick={() => approve('resolve')}
                disabled={!!busy || draft.trim().length < 20}>
                {busy === 'resolve' ? 'Sending…' : 'Send and resolve'}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </Page>
  );
}

// One evidence file: thumbnail (or PDF link), plus who uploaded it and when.
function EvidenceItem({ ticketId, index, file }) {
  const isCustomer = file.source === 'customer_followup';
  const when = file.uploadedAt || file._uploadedAt;

  return (
    <div className="evidence-item">
      <EvidenceThumb ticketId={ticketId} index={index} file={file} />
      <div className="evidence-meta">
        <span className={`pill ${isCustomer ? 'source-customer' : 'source-submitted'}`}>
          {isCustomer ? 'Added by customer' : 'Submitted'}
        </span>
        {when && <small className="muted">{new Date(when).toLocaleString()}</small>}
      </div>
    </div>
  );
}

// Loads an evidence file with the auth header, since <img> tags can't send it.
function EvidenceThumb({ ticketId, index, file }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    let objectUrl;
    fetchAuthBlobUrl(`/tickets/${ticketId}/evidence/${index}`)
      .then(u => { objectUrl = u; setUrl(u); })
      .catch(() => {});
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [ticketId, index]);

  if (file.mimeType === 'application/pdf') {
    return <a className="chip" href={url} target="_blank" rel="noreferrer">{file.fileName}</a>;
  }
  return url
    ? <img className="evidence-img" src={url} alt={file.fileName} />
    : <div className="evidence-img placeholder" />;
}