import { Link } from 'react-router-dom';

const SUPPORT_EMAIL = 'support@example.com'; // replace with your real address

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <Link to="/" className="brand">
            <span className="logo">R</span> ResolveAI
          </Link>
          <p className="muted" style={{ marginTop: 12 }}>
            AI-assisted complaint investigation. Support agents make every final decision.
          </p>
        </div>

        <div>
          <h4>About ResolveAI</h4>
          <ul>
            <li>Policy-grounded AI</li>
            <li>Human-in-the-loop review</li>
            <li>Evidence-aware analysis</li>
          </ul>
        </div>

        <div>
          <h4>How it works</h4>
          <ul>
            <li><Link to="/submit">Submit a complaint</Link></li>
            <li><Link to="/track">Track your ticket</Link></li>
            <li><Link to="/agent/login">Agent sign-in</Link></li>
          </ul>
        </div>

        <div>
          <h4>Customer support</h4>
          <ul>
            <li><a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></li>
            <li className="muted">Replies within one business day</li>
          </ul>
        </div>

        <div>
          <h4>Privacy</h4>
          <ul>
            <li className="muted">Evidence is used only to investigate your complaint.</li>
            <li><a href="#privacy">Privacy policy</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} ResolveAI. Built as a portfolio project.</span>
      </div>
    </footer>
  );
}