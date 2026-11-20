import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Page from '../components/Page';
import { api } from '../api';
import { CATEGORY_LABELS } from '../constants';

const MAX_FILES = 3;
const MAX_MB = 5;
const EMPTY = { name: '', email: '', orderId: '', category: 'damaged_product', description: '' };

export default function SubmitComplaint() {
  const [form, setForm] = useState(EMPTY);
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const set = key => e => setForm({ ...form, [key]: e.target.value });

  function onFiles(e) {
    const picked = [...e.target.files];
    const tooBig = picked.find(f => f.size > MAX_MB * 1024 * 1024);
    if (tooBig) {
      setError(`${tooBig.name} is larger than ${MAX_MB} MB`);
      e.target.value = '';
      return;
    }
    setError('');
    setFiles(picked.slice(0, MAX_FILES));
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      files.forEach(f => fd.append('evidence', f));
      const data = await api('/tickets', { method: 'POST', form: fd });
      setResult(data);
      setForm(EMPTY);
      setFiles([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(result.ticketNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (result) {
    return (
      <Page>
        <div className="container narrow">
          <motion.div className="card center"
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}>
            <motion.svg className="success-icon" viewBox="0 0 52 52">
              <motion.circle cx="26" cy="26" r="24" fill="none"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6 }} />
              <motion.path d="M15 27 l8 8 l14 -16" fill="none"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.5 }} />
            </motion.svg>
            <h2>Complaint received</h2>
            <p className="muted">Save this ticket number. You'll need it with your email to track the case.</p>
            <div className="ticket-number">{result.ticketNumber}</div>
            <div className="row gap">
              <button className="btn" onClick={copy}>{copied ? 'Copied' : 'Copy number'}</button>
              <Link className="btn btn-primary" to="/track">Track this ticket</Link>
            </div>
            <button className="link-btn" onClick={() => setResult(null)}>Submit another complaint</button>
          </motion.div>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <div className="container">
        <div className="hero">
          <h1>Tell us what went wrong</h1>
          <p className="muted">We'll review your complaint quickly. Attach photos or invoices to speed things up.</p>
        </div>

        <motion.form className="card" onSubmit={submit}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="grid2">
            <label className="field">
              <span>Full name</span>
              <input required minLength={2} value={form.name} onChange={set('name')} />
            </label>
            <label className="field">
              <span>Email</span>
              <input type="email" required value={form.email} onChange={set('email')} />
            </label>
            <label className="field">
              <span>Order ID</span>
              <input required minLength={3} placeholder="ORD-12345" value={form.orderId} onChange={set('orderId')} />
            </label>
            <label className="field">
              <span>Category</span>
              <select value={form.category} onChange={set('category')}>
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="field">
            <span>Describe the problem</span>
            <textarea required minLength={20} maxLength={2000} rows={5} value={form.description}
              onChange={set('description')} placeholder="What happened? Include dates and details." />
            <small className="muted">{form.description.length}/2000 · at least 20 characters</small>
          </label>

          <label className="dropzone">
            <input type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={onFiles} hidden />
            <strong>Attach evidence</strong>
            <span className="muted">Up to {MAX_FILES} files · images or PDF · {MAX_MB} MB each</span>
          </label>

          {files.length > 0 && (
            <div className="chips">
              {files.map(f => <span className="chip" key={f.name}>{f.name}</span>)}
            </div>
          )}

          {error && <div className="error">{error}</div>}

          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? 'Submitting…' : 'Submit complaint'}
          </button>
        </motion.form>
      </div>
    </Page>
  );
}
