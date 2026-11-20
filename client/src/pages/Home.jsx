import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Page from '../components/Page';

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const rise = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } }
};
const inView = { once: true, amount: 0.25 };

const rows = [
  { id: 'RES-2026-0007', category: 'Other', status: 'Awaiting agent', cls: 'status-awaiting_agent' },
  { id: 'RES-2026-0005', category: 'Damaged product', status: 'Awaiting agent', cls: 'status-awaiting_agent' },
  { id: 'RES-2026-0003', category: 'Refund not received', status: 'Under investigation', cls: 'status-under_investigation' }
];

const steps = [
  { n: '1', title: 'Customer submits', text: 'Describes the problem, enters the order ID and attaches photos or invoices.' },
  { n: '2', title: 'AI investigates', text: 'Classifies the complaint, reviews the evidence and finds the policy sections that apply.' },
  { n: '3', title: 'Agent reviews', text: 'Checks each citation against the policy, edits the draft reply and approves it.' },
  { n: '4', title: 'Customer receives the reply', text: 'The approved response appears on the ticket tracking page.' }
];

const guarantees = [
  'Never approves a refund or rejects a complaint on its own.',
  'Quotes only from the policy text it retrieved. Anything it cannot verify is removed.',
  'Sends nothing to a customer until a support agent approves the reply.'
];

const audiences = [
  { title: 'Customers', text: 'Submit a complaint with evidence and track it with a ticket number and email.' },
  { title: 'Support agents', text: 'Work through a prioritised queue with the AI’s findings, citations and missing information.' },
  { title: 'Administrators', text: 'Upload policy documents, invite agents and review how decisions were made.' }
];

const faqs = [
  {
    q: 'What does ResolveAI actually do?',
    a: 'It helps support teams investigate customer complaints. The system reads the complaint and any attached photos or invoices, finds the policy sections that apply, and drafts a reply with cited passages. A human agent reviews and approves the reply before anything is sent.'
  },
  {
    q: 'Does the AI decide refunds or reject complaints?',
    a: 'No. The AI only recommends an action, such as requesting more evidence or escalating to a person. It never approves a refund or rejects a complaint. Every final decision is made by a support agent.'
  },
  {
    q: 'How do you stop the AI from making up policy?',
    a: 'The AI can only cite passages that were retrieved from your policy documents. Each quoted sentence is checked against the source text. If a quote cannot be matched, it is removed, and the agent is told how many citations were rejected.'
  },
  {
    q: 'What kinds of evidence can customers attach?',
    a: 'Customers can attach up to three files: JPEG, PNG or WebP images, or PDF documents, each up to 5 MB. Files are checked by their actual content, not only by their file name, so renamed files are rejected.'
  },
  {
    q: 'How long does an investigation take?',
    a: 'Usually under half a minute. The agent sees each stage as it runs: classification, evidence analysis, policy retrieval, recommendation, then review.'
  },
  {
    q: 'Can a customer see the internal notes?',
    a: 'No. Customers see only their ticket status, the timeline of major steps, and the approved reply. AI findings, agent names and draft replies stay internal.'
  },
  {
    q: 'How do customers track their complaint?',
    a: 'After submitting, the customer receives a ticket number. They enter that number and the email they used on the tracking page to see the current status and any approved response.'
  },
  {
    q: 'Is the AI reply saved for audit?',
    a: 'Yes. The original AI draft and the approved reply are stored separately, along with who approved it, when, and whether the agent edited the draft.'
  }
];

export default function Home() {
  return (
    <Page>
      <div className="container">
        {/* Hero: one centred column */}
        <motion.section className="hero-center" variants={stagger} initial="hidden" animate="show">
          <motion.span className="eyebrow" variants={rise}>For customer support teams</motion.span>
          <motion.h1 className="display" variants={rise}>
            Investigate complaints faster, with every answer <span className="gradient-text">backed by policy</span>.
          </motion.h1>
          <motion.p className="lead" variants={rise}>
            ResolveAI reads each complaint and its photos, finds the policy that applies, and drafts
            a reply with cited sections. Your agent reviews and approves it before the customer hears back.
          </motion.p>
          <motion.div className="row gap wrap" variants={rise}>
            <Link className="btn btn-primary btn-lg" to="/submit">Submit a complaint</Link>
            <Link className="btn btn-lg" to="/agent/login">Agent sign-in</Link>
          </motion.div>
          <motion.p className="muted small-note" variants={rise}>
            Already submitted? <Link to="/track">Track your ticket</Link>.
          </motion.p>
        </motion.section>

        {/* Product preview: full width, below the hero */}
        <motion.div className="hero-mock"
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}>
          <div className="mock-head">
            <div className="row gap">
              <span className="dot" /><span className="dot" /><span className="dot" />
            </div>
            <span className="mono muted">Complaints · 7 open</span>
          </div>

          <div className="mock-table">
            <div className="mock-row mock-row-head">
              <span>Ticket</span><span>Category</span><span>Status</span>
            </div>
            {rows.map((r, i) => (
              <motion.div key={r.id} className="mock-row"
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}>
                <span className="mono">{r.id}</span>
                <span className="muted">{r.category}</span>
                <span><span className={`pill ${r.cls}`}>{r.status}</span></span>
              </motion.div>
            ))}
          </div>

          <div className="mock-detail">
            <div className="row between wrap">
              <strong className="mono">RES-2026-0005</strong>
              <span className="pill action">Request more evidence</span>
            </div>
            <div className="mock-cite">
              <span className="muted">Policy · Section 1.2</span>
              <p>"A replacement request must include a photo showing the damage and the order ID."</p>
            </div>
            <div className="mock-chips">
              <span className="chip">2 files analysed</span>
              <span className="chip">2 of 2 citations verified</span>
              <span className="chip">Missing: delivery date</span>
            </div>
          </div>
        </motion.div>

        {/* How it works */}
        <section className="section">
          <motion.div variants={rise} initial="hidden" whileInView="show" viewport={inView}>
            <span className="eyebrow">How it works</span>
            <h2 className="section-title">From complaint to approved reply in four steps</h2>
          </motion.div>
          <motion.div className="steps" variants={stagger} initial="hidden" whileInView="show" viewport={inView}>
            {steps.map(s => (
              <motion.div key={s.n} className="step-card" variants={rise}>
                <span className="step-num">{s.n}</span>
                <h3>{s.title}</h3>
                <p className="muted">{s.text}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Guardrails */}
        <section className="section">
          <motion.div className="guard" variants={rise} initial="hidden" whileInView="show" viewport={inView}>
            <div>
              <span className="eyebrow">Human in control</span>
              <h2 className="section-title">The AI assists. Your team decides.</h2>
              <p className="muted">ResolveAI is built around explicit limits, so every decision stays accountable.</p>
            </div>
            <ul className="guard-list">
              {guarantees.map(g => (
                <li key={g}><span className="check">✓</span>{g}</li>
              ))}
            </ul>
          </motion.div>
        </section>

        {/* Audiences */}
        <section className="section">
          <motion.div variants={rise} initial="hidden" whileInView="show" viewport={inView}>
            <span className="eyebrow">Who it is for</span>
            <h2 className="section-title">One workflow, three roles</h2>
          </motion.div>
          <motion.div className="feature-grid" variants={stagger} initial="hidden" whileInView="show" viewport={inView}>
            {audiences.map(a => (
              <motion.div key={a.title} className="feature-static" variants={rise}>
                <h3>{a.title}</h3>
                <p className="muted">{a.text}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* FAQ */}
        <section className="section faq">
          <motion.div className="center" variants={rise} initial="hidden" whileInView="show" viewport={inView}>
            <span className="eyebrow">FAQ</span>
            <h2 className="section-title">Questions teams ask before they start</h2>
          </motion.div>

          <motion.div className="faq-list" variants={stagger} initial="hidden" whileInView="show" viewport={inView}>
            {faqs.map(item => (
              <motion.details key={item.q} className="faq-item" variants={rise}>
                <summary>
                  <span>{item.q}</span>
                  <span className="faq-icon" aria-hidden="true">+</span>
                </summary>
                <p>{item.a}</p>
              </motion.details>
            ))}
          </motion.div>
        </section>

        {/* Closing CTA */}
        <motion.section className="cta-band"
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={inView} transition={{ duration: 0.5 }}>
          <div>
            <h2 className="section-title">Have a complaint to resolve?</h2>
            <p className="muted">Submit it now. You will get a ticket number to track its progress.</p>
          </div>
          <div className="row gap wrap">
            <Link className="btn btn-primary btn-lg" to="/submit">Submit a complaint</Link>
            <Link className="btn btn-lg" to="/track">Track a ticket</Link>
          </div>
        </motion.section>
      </div>
    </Page>
  );
}