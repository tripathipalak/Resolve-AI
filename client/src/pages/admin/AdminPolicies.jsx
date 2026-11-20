import { useEffect, useState } from 'react';
import Page from '../../components/Page';
import { api } from '../../api';

export default function AdminPolicies() {
  const [policies, setPolicies] = useState([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('returns');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function load() {
    try {
      setPolicies(await api('/policies', { auth: true }));
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => { load(); }, []);

  async function run(action, success) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await action();
      if (success) setNotice(success);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  function upload(e) {
    e.preventDefault();
    if (!file) return setError('Choose a PDF, TXT or MD file.');
    const fd = new FormData();
    fd.append('title', title);
    fd.append('category', category);
    fd.append('file', file);
    run(async () => {
      await api('/policies', { method: 'POST', form: fd, auth: true });
      setTitle('');
      setFile(null);
      e.target.reset();
    }, 'Policy uploaded and indexed.');
  }

  function toggle(p) {
    run(
      () => api(`/policies/${p._id}`, { method: 'PATCH', body: { isActive: !p.isActive }, auth: true }),
      `${p.title} is now ${p.isActive ? 'inactive' : 'active'}.`
    );
  }

  function remove(p) {
    if (!window.confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    run(() => api(`/policies/${p._id}`, { method: 'DELETE', auth: true }), `${p.title} was deleted.`);
  }

  return (
    <Page>
      <div className="container wide">
        <span className="eyebrow">Administration</span>
        <h1>Policies</h1>
        <p className="muted">
          The AI only quotes from active policies. Upload a document, then switch it off to test without it.
        </p>

        {error && <div className="error">{error}</div>}
        {notice && <div className="response-box">{notice}</div>}

        <form className="card" onSubmit={upload}>
          <h3>Upload a policy</h3>
          <div className="grid2" style={{ marginTop: 12 }}>
            <label className="field">
              <span>Title</span>
              <input required minLength={3} value={title} onChange={e => setTitle(e.target.value)}
                placeholder="Return and Replacement Policy" />
            </label>
            <label className="field">
              <span>Category</span>
              <input required value={category} onChange={e => setCategory(e.target.value)} />
            </label>
          </div>
          <label className="field">
            <span>Document</span>
            <input type="file" accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
              onChange={e => setFile(e.target.files[0] || null)} />
          </label>
          <button className="btn btn-primary" disabled={busy}>
            {busy ? 'Indexing…' : 'Upload and index'}
          </button>
        </form>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th><th>Category</th><th>Passages</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {policies.map(p => (
                <tr key={p._id} style={{ cursor: 'default' }}>
                  <td>
                    {p.title}
                    <div className="sub">{p.source}</div>
                  </td>
                  <td className="muted">{p.category}</td>
                  <td className="mono">{p.chunkCount}</td>
                  <td>
                    <span className={`pill ${p.isActive ? 'status-resolved' : 'status-submitted'}`}>
                      {p.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button className="btn btn-sm" disabled={busy} onClick={() => toggle(p)}>
                      {p.isActive ? 'Turn off' : 'Turn on'}
                    </button>{' '}
                    <button className="btn btn-danger-sm" disabled={busy} onClick={() => remove(p)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {policies.length === 0 && <div className="empty">No policies uploaded yet.</div>}
        </div>
      </div>
    </Page>
  );
}