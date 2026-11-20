import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../auth';
import Footer from './Footer';

const spring = { type: 'spring', stiffness: 500, damping: 40 };

const adminLinks = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/agents', label: 'Team' },
  { to: '/admin/policies', label: 'Policies' }
];

function SideLink({ to, label, end }) {
  return (
    <NavLink to={to} end={end}>
      {({ isActive }) => (
        <>
          {isActive && <motion.span layoutId="side-pill" className="nav-pill" transition={spring} />}
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const inStaffArea = (pathname.startsWith('/agent') || pathname.startsWith('/admin')) && user;

  if (pathname === '/agent/login') {
    return <div className="app">{children}</div>;
  }

  if (inStaffArea) {
    const initials = user.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'AG';
    const isAdmin = user.role === 'admin';

    return (
      <div className="shell">
        <aside className="sidebar">
          <Link to="/" className="brand"><span className="logo">R</span> ResolveAI</Link>

          <div>
            <div className="nav-label">Workspace</div>
            <nav className="nav">
              <SideLink to="/agent" label="Complaints" />
            </nav>
          </div>

          {isAdmin && (
            <div>
              <div className="nav-label">Administration</div>
              <nav className="nav">
                {adminLinks.map(l => <SideLink key={l.to} {...l} />)}
              </nav>
            </div>
          )}

          <div className="side-foot">
            <div className="avatar">{initials}</div>
            <div className="who">
              <strong>{user.name}</strong>
              <span className="muted" style={{ fontSize: '0.78rem' }}>{user.role}</span>
            </div>
            <button className="ghost" onClick={async () => { await logout(); navigate('/'); }}>Out</button>
          </div>
        </aside>
        <div className="shell-main">{children}</div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand"><span className="logo">R</span> ResolveAI</Link>
        <nav>
          <a href="/#how-it-works">How it works</a>
          <NavLink to="/track">Track ticket</NavLink>
          <NavLink to="/agent/login">Agent login</NavLink>
        </nav>
        <div className="row gap">
          <Link to="/submit" className="btn btn-primary btn-sm">Submit a complaint</Link>
        </div>
      </header>
      {children}
      <Footer />
    </div>
  );
}