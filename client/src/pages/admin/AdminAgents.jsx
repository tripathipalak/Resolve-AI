import { useEffect, useState } from 'react';
import Page from '../../components/Page';
import { api } from '../../api';
import { useAuth } from '../../auth';

const EMPTY = { name: '', email: '', role: 'agent' };

export default function AdminAgents() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function load() {
    try {
      setUsers(await api('/admin/users', { auth: true }));
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

  function invite(e) {
    e.preventDefault();
    run(async () => {
      await api('/admin/users', { method: 'POST', body: form, auth: true });
      setForm(EMPTY);
    }, 'Invitation saved. The person can now sign in with Google using that email.');
  }

  function changeRole(u, role) {
    run(
      () => api(`/admin/users/${u._id}`, { method: 'PATCH', body: { role }, auth: true }),
      `${u.email} is now ${role}.`
    );
  }

  function remove(u) {
    if (!window.confirm(`Remove ${u.email} from the workspace?`)) return;
    run(
      () => api(`/admin/users/${u._id}`, { method: 'DELETE', auth: true }),
      `${u.email} was removed.`
    );
  }

  return (
    <Page>
      <div className="container wide">
        <span className="eyebrow">Administration</span>
        <h1>Team</h1>
        <p className="muted">Invite agents and admins, change roles, and remove access.</p>

        {error && <div className="error">{error}</div>}
        {notice && <div className="response-box">{notice}</div>}

        <form className="card" onSubmit={invite}>
          <h3>Invite a team member</h3>
          <div className="grid2" style={{ marginTop: 12 }}>
            <label className="field">
              <span>Name</span>
              <input required minLength={2} value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} />
            </label>
            <label className="field">
              <span>Google email</span>
              <input type="email" required value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} />
            </label>
          </div>
          <div className="row gap wrap" style={{ alignItems: 'flex-end' }}>
            <label className="field" style={{ minWidth: 180 }}>
              <span>Role</span>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="agent">Agent</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <button className="btn btn-primary" disabled={busy}>
              {busy ? 'Saving…' : 'Send invite'}
            </button>
          </div>
        </form>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Role</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const isMe = u._id === me?.id;
                return (
                  <tr key={u._id} style={{ cursor: 'default' }}>
                    <td>{u.name}{isMe && <span className="muted"> (you)</span>}</td>
                    <td className="muted">{u.email}</td>
                    <td>
                      <select className="inline-select" value={u.role} disabled={busy || isMe}
                        onChange={e => changeRole(u, e.target.value)}>
                        <option value="agent">Agent</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      <span className={`pill ${u.linked ? 'status-resolved' : 'status-submitted'}`}>
                        {u.linked ? 'Active' : 'Invited'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-danger-sm" disabled={busy || isMe} onClick={() => remove(u)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {users.length === 0 && <div className="empty">No team members yet.</div>}
        </div>
      </div>
    </Page>
  );
}