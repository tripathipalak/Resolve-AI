<p align="center">

  # ResolveAI — AI-Powered Customer Complaint Investigation & Resolution

  **Investigate Smarter. Resolve Faster. Build Customer Trust.**

  An AI-powered complaint investigation platform that analyzes customer complaints, examines supporting evidence, retrieves relevant company policies using RAG, and generates evidence-backed resolution recommendations with human approval.

</p>

<p align="center">

  ![Node.js](https://img.shields.io/badge/Node.js-20%2B-green?logo=node.js)
  ![React](https://img.shields.io/badge/React-Vite-blue?logo=react)
  ![Express](https://img.shields.io/badge/Express.js-Framework-black?logo=express)
  ![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?logo=mongodb)
  ![Gemini](https://img.shields.io/badge/Google_Gemini-AI-blue?logo=google)
  ![Firebase](https://img.shields.io/badge/Firebase-Auth-orange?logo=firebase)

</p>

---

## Overview

ResolveAI is a full-stack GenAI application that helps support teams investigate and resolve customer complaints.

Support teams usually check each complaint by hand: read the description, look at the photos, find the right policy, and write a reply. ResolveAI does the first part with AI, then leaves the decision to a person.

Customers submit complaints with photos or PDFs and track their case with a ticket number. Gemini classifies the complaint, analyses the evidence, retrieves matching policy sections with RAG, and drafts a recommendation with cited passages. An agent reviews it, edits the reply if needed, and approves it.

**The key principle: the AI assists the decision, and a human makes it.** The AI never approves refunds, rejects complaints, or contacts a customer on its own.

## The Problem

- Agents read every complaint and its attachments by hand.
- Checking eligibility means searching long policy documents.
- Replies are written from memory, so they are not always consistent.
- Customers wait for back-and-forth emails to provide missing details.

## Our Solution

ResolveAI follows a structured investigation process instead of a generic chatbot:

1. **Submission:** the customer submits a complaint with order details and evidence.
2. **Classification:** Gemini assigns a category, priority and summary, with output validated by a schema.
3. **Evidence analysis:** Gemini reads each photo or PDF and describes only what is visible.
4. **Policy retrieval:** the complaint is embedded and compared against policy chunks, and only passages above a similarity threshold are kept.
5. **Recommendation:** Gemini suggests an action, cites retrieved passages, lists missing information, and drafts a reply.
6. **Citation check:** every quote must appear in its source passage. Any quote that does not is removed.
7. **Human review:** the agent edits and approves the reply, or asks the customer for more information.

---

## Key Features

### 1. Complaint Management
- Submit complaints with order ID, category, description and up to three evidence files.
- Unique, unguessable ticket numbers.
- Track status and the full timeline with ticket number and email.
- Follow up with new information and new photos when support asks for them.

### 2. AI Classification and Evidence Analysis
- Structured classification (category, priority, summary) with Gemini.
- Multimodal analysis of images and PDFs.
- Every model output is validated with Zod before it is saved.

### 3. RAG-Based Policy Retrieval
- Policy documents are split into sections and embedded with Gemini.
- Retrieval uses cosine similarity with a configurable threshold.
- Recommendations are grounded in the retrieved passages.
- When no passage is relevant, the system returns "no policy applies" without asking the model to guess.

### 4. Grounded Recommendations
- Each citation is checked against its source passage.
- Missing information is listed, and the draft reply asks the customer for it.
- Confidence is calculated from the checks, not from the model's own rating.

### 5. Agent Workspace
- Dashboard with status filters, search and counts.
- Ticket review with evidence viewer, AI findings, citations and assumptions.
- Re-run the investigation after the customer adds information.
- Send and wait for the customer, or send and resolve.
- The AI draft and the approved reply are stored separately, with an edit flag.

### 6. Admin
- Invite agents and admins, change roles, and remove access.
- Upload policy documents (PDF, TXT or MD), turn them on or off, and delete them.

### 7. Security
- Firebase Authentication with Google and email/password sign-in.
- Firebase ID token verified on every protected request.
- Server-side role checks for agent and admin routes.
- Uploads checked by file content, not filename.
- Rate limits on submission, tracking and follow-up.
- Generic "not found" response on tracking, so ticket numbers cannot be probed.

---

## How ResolveAI Works

```mermaid
flowchart TD
    A[Customer submits complaint + evidence] --> B[Classify - Gemini]
    B --> C[Analyse evidence - Gemini multimodal]
    B --> D[Embed complaint]
    D --> E[Retrieve policy passages above threshold]
    C --> F[Recommendation - Gemini with retrieved passages only]
    E --> F
    F --> G[Citation check + Zod validation]
    G --> H[Agent review]
    H -->|Send and wait| I[Customer adds info]
    I --> J[Re-run investigation]
    J --> H
    H -->|Send and resolve| K[Customer gets email and reply]
```

## System Architecture

```mermaid
flowchart TB
    U[Customer / Agent / Admin] --> FE[React + Vite frontend]
    FE -->|Firebase ID token| API[Express API]
    API --> AUTH[Token check + role check]
    AUTH --> DB[(MongoDB Atlas)]
    API --> AI[AI services]
    AI --> GEMINI[Google Gemini]
    AI --> RET[Policy retrieval]
    RET --> DB
    API --> MAIL[SMTP email]
```

---

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, React Router, Framer Motion, Tailwind CSS |
| Backend | Node.js, Express, Mongoose |
| Database | MongoDB Atlas |
| Auth | Firebase Authentication, Firebase Admin SDK |
| AI | Google Gemini API (`@google/genai`), embeddings |
| RAG | Chunking by section, cosine similarity, similarity threshold |
| Validation | Zod |
| Email | Nodemailer (SMTP) |
| Uploads | Multer, file-signature checks |

## Project Structure

```text
resolve-ai/
├── client/                      React app (Vite)
│   └── src/
│       ├── pages/               landing, submit, track, login, agent, admin
│       ├── components/          layout, page, pipeline, footer
│       ├── api.js               API helper with Firebase token
│       └── auth.jsx             sign-in context and role loading
│
└── server/                      Express API
    ├── policies/                sample policy document
    ├── scripts/                 seed, ingest, create-agent, sample data
    └── src/
        ├── routes/              auth, tickets, policies, admin
        ├── services/            AI pipeline, retrieval, email
        ├── models/              User, Ticket, Investigation, Policy
        ├── middleware/          auth and role checks
        ├── validators/          Zod schemas for AI output
        └── utils/               ticket numbers, file checks, errors
```

---

## Getting Started

### Prerequisites

- Node.js 20 or newer
- MongoDB Atlas cluster
- Google AI Studio API key (Gemini)
- Firebase project with Google and Email/Password sign-in enabled
- Gmail account with an App Password (for reply emails, optional)

### 1. Clone the repository

```bash
git clone https://github.com/tripathipalak/Resolve-AI.git
cd Resolve-AI
```

### 2. Backend

```bash
cd server
npm install
cp .env.example .env
```

Fill in `server/.env`:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb+srv://USER:PASSWORD@cluster.mongodb.net/resolveai
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-2.5-flash
GEMINI_EMBED_MODEL=gemini-embedding-001
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=you@gmail.com
SMTP_PASS=your_app_password
MAIL_FROM="ResolveAI Support <you@gmail.com>"
```

Place your Firebase service account JSON at `server/firebase-service-account.json`. Never commit it.

Load the sample policy, create the first admin, and start the API:

```bash
npm run ingest
node scripts/create-agent.js admin@example.com "Admin" admin YourPassword
npm run dev
```

### 3. Frontend

```bash
cd client
npm install
```

Create `client/.env`:

```env
VITE_FIREBASE_API_KEY=your_web_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_APP_ID=your_app_id
```

```bash
npm run dev
```

Open http://localhost:5173.

### 4. Try it

```bash
cd server
node scripts/sample-tickets.js
```

Sign in as the admin, open a ticket, run the investigation, and approve the reply.

---

## Security & Reliability

- Firebase token verified on every protected request.
- Role-based authorization on agent and admin routes.
- Zod validation on requests and on every AI output.
- File-content checks on uploads, and a 5 MB limit per file.
- Rate limits on submission, tracking and follow-up.
- Unique ticket numbers.
- Stored AI drafts and approved replies, kept separately for traceability.

## Design Principles

**Evidence-driven:** recommendations must be supported by the complaint, the evidence, and retrieved policy text.

**Policy-grounded AI:** the model sees only retrieved passages, and every quote is checked against its source.

**Human oversight:** no refund, rejection or customer message is sent without an agent's approval.

**Modular code:** the AI pipeline, retrieval, email and routes live in separate modules.

---

## Known Limits

- **Retrieval** is in-memory cosine similarity. Fine for a small policy set. Atlas `$vectorSearch` is the planned production path.
- **Evidence** is stored in MongoDB, limited to 5 MB per file. Cloud storage is planned.
- **Investigations** take up to 30 seconds because they make several sequential AI calls. Background jobs are planned.
- **Grounding checks** catch invented quotes, not flawed reasoning. A human must review each recommendation.
- **Sample data only.** The policy is fictional, and the complaints are test data.

## Roadmap

- Background investigation jobs with status polling
- Atlas Vector Search for retrieval
- Cloud storage for evidence files
- Evaluation set with accuracy metrics across labelled complaints
- Real-time status updates

---

## Author

**Palak Mani Tripathi**

Full-Stack Developer | GenAI Builder

- GitHub: [@tripathipalak](https://github.com/tripathipalak)
- LinkedIn: [Palak Mani Tripathi](https://www.linkedin.com/in/palak-mani-tripathi/)
- Email: tripathipalakk25@gmail.com

---

<p align="center">

  **ResolveAI — Making Customer Complaint Resolution Smarter, Faster, and More Transparent.**

  If you find this project interesting, consider giving it a ⭐.

</p>
