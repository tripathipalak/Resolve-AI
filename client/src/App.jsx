import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Layout from './components/Layout';
import Page from './components/Page';
import Home from './pages/Home';
import SubmitComplaint from './pages/SubmitComplaint';
import TrackTicket from './pages/TrackTicket';
import AgentLogin from './pages/AgentLogin';
import AgentDashboard from './pages/AgentDashboard';
import TicketDetail from './pages/TicketDetail';
import AdminOverview from './pages/admin/AdminOverview';
import AdminAgents from './pages/admin/AdminAgents';
import AdminPolicies from './pages/admin/AdminPolicies';
import { useAuth } from './auth';

// Blocks the page unless the user is signed in (and an admin, when role="admin").
function Guard({ role, children }) {
  const { user, isAuthed, loading } = useAuth();
  if (loading) return <Page><p className="muted">Loading…</p></Page>;
  if (!isAuthed) return <Navigate to="/agent/login" replace />;
  if (role === 'admin' && user.role !== 'admin') return <Navigate to="/agent" replace />;
  return children;
}

export default function App() {
  const location = useLocation();
  return (
    <Layout>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/submit" element={<SubmitComplaint />} />
          <Route path="/track" element={<TrackTicket />} />
          <Route path="/agent/login" element={<AgentLogin />} />

          <Route path="/agent" element={<Guard><AgentDashboard /></Guard>} />
          <Route path="/agent/tickets/:id" element={<Guard><TicketDetail /></Guard>} />

          <Route path="/admin" element={<Guard role="admin"><AdminOverview /></Guard>} />
          <Route path="/admin/agents" element={<Guard role="admin"><AdminAgents /></Guard>} />
          <Route path="/admin/policies" element={<Guard role="admin"><AdminPolicies /></Guard>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </Layout>
  );
}