import { useState } from 'react';
import { motion } from 'framer-motion';
import Page from '../components/Page';
import { api } from '../api';
import { STATUS_LABELS } from '../constants';

const MAX_FILES = 3;
const MAX_MB = 5;

export default function TrackTicket() {
  const [ticketNumber, setTicketNumber] = useState('');
  const [email, setEmail] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState([]);
  const [sending, setSending] = useState(false);

  function fetchStatus(tn, em) {
    const qs = new URLSearchParams({ ticketNumber: tn, email: em });
    return api(`/tickets/track?${qs}`);
  }

  async function lookup(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setNotice('');
    setData(null);
    try {
      setData(await fetchStatus(ticketNumber, email));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

    function onFiles(e) {
    const picked = [...e.target.files];
    const tooBig = picked.find(f => f.size > MAX_MB * 1024 * 1024);
    if (tooBig) {
      setError(`${tooBig.name} is larger than ${MAX_MB} MB`);
      e.target.value = '';
      return;
    }

    // Add to the files already chosen, skipping duplicates, up to the limit.
    setFiles(prev => {
      const merged = [...prev];
      for (const f of picked) {
        const duplicate = merged.some(m => m.name === f.name && m.size === f.size);
        if (!duplicate && merged.length < MAX_FILES) merged.push(f);
      }
      if (picked.length && merged.length === prev.length) {
        setError(`You can attach up to ${MAX_FILES} files`);
      } else {
        setError('');
      }
      return merged;
    });

    // Clear the input so the same file can be picked again after removing it.
    e.target.value = '';
  }

  async function sendUpdate(e) {
    e.preventDefault();
    setSending(true);
    setError('');
    setNotice('');
    try {
      const fd = new FormData();
      fd.append('ticketNumber', ticketNumber);
      fd.append('email', email);
      fd.append('message', message);
      files.forEach(f => fd.append('evidence', f));

      await api('/tickets/track/followup', { method: 'POST', form: fd });
      setMessage('');
      setFiles([]);
      setNotice('Thanks. Your information was sent to the support agent.');
      setData(await fetchStatus(ticketNumber, email));
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  const canAddInfo = data && data.status !== 'resolved';
  const askingForInfo = data && data.status === 'awaiting_customer';

  return (
    <Page>
      <div className="container narrow">
        <div className="hero">
          <h1>Track your complaint</h1>
          <p className="muted">Enter the ticket number and the email you used when you submitted.</p>
        </div>

        <form className="card" onSubmit={lookup}>
          <label className="field">
            <span>Ticket number</span>
            <input required placeholder="RES-2026-XXXXXXXXXXXX" value={ticketNumber}
              onChange={e => setTicketNumber(e.target.value)} />
          </label>
          <label className="field">
            <span>Email</span>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} />
          </label>
          {error && <div className="error">{error}</div>}
          <button className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Looking up…' : 'Check status'}
          </button>
        </form>

        {data && (
          <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="row between">
              <h3>{data.ticketNumber}</h3>
              <span className={`pill status-${data.status}`}>{STATUS_LABELS[data.status]}</span>
            </div>

            {askingForInfo && (
              <div className="banner-info">
                Support needs a bit more information from you. Please add it below.
              </div>
            )}
            {notice && <div className="response-box">{notice}</div>}

            <motion.ol className="timeline" initial="hidden" animate="show"
              variants={{ show: { transition: { staggerChildren: 0.08 } } }}>
              {data.timeline.map((t, i) => (
                <motion.li key={i} variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}>
                  <strong>{STATUS_LABELS[t.status] || t.status}</strong>
                  <span className="muted">{t.note}</span>
                  <small className="muted">{new Date(t.at).toLocaleString()}</small>
                </motion.li>
              ))}
            </motion.ol>

            {data.updates?.length > 0 && (
              <>
                <h4>Information you added</h4>
                <ul className="update-list">
                  {data.updates.map((u, i) => (
                    <li key={i}>
                      {u.message}
                      <small>{new Date(u.at).toLocaleString()}</small>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {data.finalResponse && (
              <div className="response-box">
                <h4>Response from support</h4>
                <p>{data.finalResponse}</p>
              </div>
            )}

            {canAddInfo && (
              <form className="followup-box" onSubmit={sendUpdate}>
                <h4>{askingForInfo ? 'Send the information requested' : 'Add more information'}</h4>
                <p className="muted" style={{ fontSize: '0.9rem' }}>
                  Describe what you need to add. If the support team asked for a photo, attach the correct one below.
                  Your earlier files stay on record.
                </p>

                <label className="field">
                  <textarea required minLength={5} maxLength={1000} rows={3} value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="The item was delivered on 15 November 2026. Attached is a photo of the blue wallet." />
                </label>

                <label className="dropzone">
                  <input type="file" multiple hidden
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={onFiles} />
                  <strong>Attach a photo or document</strong>
                  <span className="muted">Up to {MAX_FILES} files · images or PDF · {MAX_MB} MB each</span>
                </label>

                                {files.length > 0 && (
                  <div className="chips">
                    {files.map((f, i) => (
                      <span className="chip" key={`${f.name}-${i}`}>
                        {f.name}
                        <button type="button" className="chip-remove"
                          aria-label={`Remove ${f.name}`}
                          onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}>
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <button className="btn btn-primary" disabled={sending || message.trim().length < 5}>
                  {sending ? 'Sending…' : 'Send information'}
                </button>
              </form>
            )}
          </motion.div>
        )}
      </div>
    </Page>
  );
}