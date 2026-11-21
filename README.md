# ResolveAI — AI-Powered Customer Complaint Investigation & Resolution

<p align="center">
  **Investigate Smarter. Resolve Faster. Build Customer Trust.**

  An AI-powered complaint investigation platform that analyzes customer complaints, examines supporting evidence, retrieves relevant company policies using RAG, and generates evidence-backed resolution recommendations with human approval.
</p>

<p align="center">
  ![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)
  ![React](https://img.shields.io/badge/React-Frontend-61DAFB?logo=react&logoColor=black)
  ![Express](https://img.shields.io/badge/Express.js-Backend-000000?logo=express)
  ![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)
  ![Gemini](https://img.shields.io/badge/Google-Gemini-4285F4?logo=google)
  ![Firebase](https://img.shields.io/badge/Firebase-Authentication-FFCA28?logo=firebase&logoColor=black)
</p>

---

## Overview

ResolveAI is a full-stack GenAI application that helps support teams investigate and resolve customer complaints.

Support teams usually check each complaint manually: read the description, examine photos or documents, find the relevant company policy, and write a response. ResolveAI streamlines this process using AI while keeping the final decision under human control.

Customers submit complaints with photos or PDFs and track their cases using a unique ticket number.

The system uses Google Gemini to classify complaints, analyze supporting evidence, retrieve relevant policy sections through Retrieval-Augmented Generation (RAG), and generate structured investigation reports with cited policy passages.

An authorized support agent reviews the findings, edits the suggested response if necessary, and approves the final resolution.

**The core principle: AI assists the decision; a human makes it.**

The AI never independently approves refunds, rejects complaints, or contacts customers.

## The Problem

- Agents manually read every complaint and its attachments.
- Checking customer eligibility requires searching lengthy policy documents.
- Responses written from memory can be inconsistent.
- Customers often experience delays due to repeated requests for missing information.
- Investigation decisions can be difficult to trace and justify.

## Our Solution

ResolveAI follows a structured investigation workflow instead of behaving like a generic chatbot.

1. **Submission:** Customers submit complaints with order details and supporting evidence.
2. **Classification:** Gemini assigns a category, priority, and summary, with output validated against a schema.
3. **Evidence Analysis:** Gemini analyzes uploaded photos and PDFs and describes only what is supported by the provided evidence.
4. **Policy Retrieval:** The complaint is embedded and compared against policy chunks. Only passages above a configurable similarity threshold are retained.
5. **Recommendation:** Gemini suggests an action, cites retrieved passages, identifies missing information, and drafts a customer reply.
6. **Citation Verification:** Every generated quotation is checked against its original source passage. Unsupported quotations are removed.
7. **Human Review:** An authorized agent reviews, edits, and approves the response or requests additional information.

---

## Key Features

### 1. Complaint Management
- Submit complaints with order ID, category, description, and up to three evidence files.
- Generate unique, unguessable ticket numbers.
- Track complaint status and complete case timelines.
- Track complaints using ticket number and email.
- Submit additional information and photos when requested by support.

### 2. AI Classification & Evidence Analysis
- Structured complaint classification using Google Gemini.
- Automatic category, priority, and summary generation.
- Multimodal analysis of images and PDF documents.
- Zod validation of AI-generated structured outputs before saving.

### 3. RAG-Based Policy Retrieval
- Upload and manage company policy documents.
- Split policy documents into meaningful sections.
- Generate embeddings using Gemini.
- Retrieve relevant policy passages using cosine similarity.
- Apply a configurable similarity threshold.
- Ground recommendations in retrieved policy content.
- Return a no-applicable-policy result when no sufficiently relevant passage is found, rather than asking the model to guess.

### 4. Grounded AI Recommendations
- Combine complaint details, evidence findings, and retrieved policies.
- Generate structured investigation reports.
- Attach supporting policy citations to recommendations.
- Verify generated quotations against their original passages.
- Identify missing information and generate follow-up questions.
- Calculate confidence using investigation checks rather than relying on the model's self-reported confidence.

### 5. Agent Workspace
- Dashboard with complaint counts, status filters, and search.
- Detailed ticket investigation workspace.
- Evidence viewer and AI-generated findings.
- Retrieved policy passages and citations.
- Re-run investigations when customers provide additional information.
- Send follow-up requests or approve and resolve complaints.
- Store AI-generated drafts and approved responses separately.
- Track whether an approved response was edited.

### 6. Admin Management
- Invite agents and administrators.
- Assign and update user roles.
- Remove user access.
- Upload policy documents in PDF, TXT, and Markdown formats.
- Enable, disable, and delete policy documents.

### 7. Security & Reliability
- Firebase Authentication with Google and email/password sign-in.
- Firebase ID token verification on protected backend requests.
- Server-side role-based authorization.
- File-content verification rather than trusting file extensions.
- Rate limiting on complaint submission, tracking, and follow-up.
- Generic not-found responses to prevent ticket number enumeration.
- Zod validation for API requests and AI-generated outputs.

---

## How ResolveAI Works

```mermaid
flowchart TD
    A[Customer Submits Complaint] --> B[Complaint Classification]
    B --> C[Evidence Upload & Analysis]
    C --> D[Generate Complaint Embedding]
    D --> E[Retrieve Relevant Policy Chunks]
    E --> F{Relevant Policy Found?}

    F -->|Yes| G[Build Investigation Context]
    F -->|No| H[No Applicable Policy Context]

    G --> I[Gemini Investigation]
    H --> I

    I --> J[Generate Findings & Recommendation]
    J --> K[Verify Policy Citations]
    K --> L[Calculate Investigation Confidence]
    L --> M[Generate Customer Reply]
    M --> N[Agent Review]

    N --> O{Agent Decision}
    O -->|Approve| P[Send Approved Reply]
    O -->|Request Information| Q[Ask Customer for Details]
    O -->|Edit| R[Edit AI Draft]
    R --> N

    Q --> S[Customer Provides More Evidence]
    S --> C

    P --> T[Update Ticket Status & Timeline]
```

## System Architecture

ResolveAI follows a modular client-server architecture, separating the frontend, backend APIs, authentication, AI pipeline, policy retrieval, and data persistence.

```mermaid
flowchart TB
    U[Customer / Support Agent / Admin]

    U --> FE[React + Vite Frontend]

    FE --> AUTH[Firebase Authentication]
    FE --> API[Express REST API]

    API --> VERIFY[Firebase Admin SDK]
    VERIFY --> ROLE[Role-Based Access Control]

    ROLE --> DB[(MongoDB Atlas)]
    ROLE --> FILES[Evidence File Storage]

    ROLE --> AI[AI Investigation Pipeline]

    AI --> CLASS[Complaint Classification]
    AI --> EVIDENCE[Multimodal Evidence Analysis]
    AI --> RET[Policy Retrieval]

    CLASS --> GEMINI[Google Gemini API]
    EVIDENCE --> GEMINI

    RET --> EMB[Gemini Embeddings]
    EMB --> COS[Cosine Similarity Retrieval]
    COS --> POLICY[(Policy Chunks)]

    POLICY --> GEMINI

    GEMINI --> VALIDATE[Zod Output Validation]
    VALIDATE --> CITATION[Citation Verification]
    CITATION --> REPORT[Investigation Report]

    REPORT --> DB
    REPORT --> REVIEW[Human Review & Approval]
    REVIEW --> EMAIL[Nodemailer SMTP]
```

---

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, React Router |
| UI & Styling | Tailwind CSS, Framer Motion |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas, Mongoose |
| Authentication | Firebase Authentication, Firebase Admin SDK |
| AI / LLM | Google Gemini API (`@google/genai`) |
| Embeddings | Gemini Embedding Model |
| RAG | Document Chunking, Cosine Similarity, Similarity Threshold |
| Validation | Zod |
| Email | Nodemailer, SMTP |
| File Uploads | Multer, File Signature Verification |

## Project Structure

```text
resolve-ai/
│
├── client/                         
│   └── src/
│       ├── pages/
│       │   ├── landing
│       │   ├── submit
│       │   ├── track
│       │   ├── login
│       │   ├── agent
│       │   └── admin
│       │
│       ├── components/
│       │   ├── layout
│       │   ├── page
│       │   ├── pipeline
│       │   └── footer
│       │
│       ├── api.js
│       └── auth.jsx
│
├── server/
│   ├── policies/
│   │   └── sample policy document
│   │
│   ├── scripts/
│   │   ├── seed
│   │   ├── ingest
│   │   ├── create-agent
│   │   └── sample data
│   │
│   └── src/
│       ├── config/
│       ├── models/
│       │   ├── User.js
│       │   ├── Ticket.js
│       │   ├── Investigation.js
│       │   └── Policy.js
│       │
│       ├── routes/
│       │   ├── auth
│       │   ├── tickets
│       │   ├── policies
│       │   └── admin
│       │
│       ├── services/
│       │   ├── AI pipeline
│       │   ├── retrieval
│       │   └── email
│       │
│       ├── middleware/
│       ├── validators/
│       └── utils/
│
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 20 or newer
- MongoDB Atlas cluster
- Google AI Studio API key
- Firebase project with Google and Email/Password sign-in enabled
- Gmail account with an App Password (optional, for email replies)

### 1. Clone the Repository

```bash
git clone https://github.com/tripathipalak/Resolve-AI.git

cd Resolve-AI
```

### 2. Backend Setup

```bash
cd server

npm install

cp .env.example .env
```

Configure the environment variables in `server/.env`:

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

Place your Firebase service account JSON file at:

```text
server/firebase-service-account.json
```

**Important:** Never commit your Firebase service account file or environment secrets to GitHub.

### 3. Configure Firebase

1. Create a project in Firebase Console.
2. Enable Google Authentication.
3. Enable Email/Password Authentication.
4. Register your frontend application.
5. Generate a Firebase Admin SDK service account.
6. Configure the frontend and backend credentials.

### 4. Ingest Sample Policies

From the `server` directory:

```bash
npm run ingest
```

This loads the sample policy documents into the policy knowledge base.

### 5. Create the First Admin

```bash
node scripts/create-agent.js admin@example.com "Admin" admin YourPassword
```

Replace the example details with your desired administrator credentials.

### 6. Start the Backend

```bash
npm run dev
```

The backend runs on:

```text
http://localhost:5000
```

### 7. Frontend Setup

Open a new terminal:

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

Start the frontend:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

### 8. Generate Sample Tickets

From the `server` directory:

```bash
node scripts/sample-tickets.js
```

Sign in using the administrator account, open a ticket, run the investigation, review the findings, and approve the response.

---

## Security & Reliability

ResolveAI includes multiple safeguards to make AI-assisted investigations more reliable:

- Firebase ID tokens are verified on protected backend requests.
- Role-based authorization protects agent and admin routes.
- Zod validates API inputs and AI-generated structured outputs.
- File signatures are checked instead of trusting filenames or extensions.
- Individual evidence files are limited to 5 MB.
- Rate limits protect complaint submission, tracking, and follow-up endpoints.
- Unique ticket numbers reduce the risk of accidental exposure.
- AI-generated drafts and approved replies are stored separately for traceability.
- Generated policy quotations are checked against their source passages.

## Design Principles

**Evidence-Driven Decisions**

Recommendations should be supported by the complaint, available evidence, and retrieved policy text.

**Policy-Grounded AI**

The model receives relevant retrieved policy passages, and generated quotations are verified against their original sources.

**Human Oversight**

No refund, rejection, or customer communication is finalized without authorized human approval.

**Modular Architecture**

The AI pipeline, policy retrieval, email services, authentication, and API routes are organized into separate modules.

---

## Known Limitations

Transparency about current implementation is important.

| Area | Current Implementation | Planned Improvement |
|---|---|---|
| Policy Retrieval | In-memory cosine similarity | MongoDB Atlas Vector Search |
| Evidence Storage | MongoDB, up to 5 MB per file | Dedicated cloud storage |
| Investigation Execution | Sequential AI calls, up to approximately 30 seconds | Background jobs |
| AI Reliability | Citation verification and structured validation | Evaluation datasets and improved reasoning checks |
| Sample Data | Fictional policies and test complaints | Real-world evaluation datasets |

**Important considerations:**

- Current retrieval works well for a small policy knowledge base but is not optimized for large-scale production workloads.
- Evidence storage is limited and can be moved to dedicated cloud storage as the application scales.
- Investigations can take up to approximately 30 seconds because multiple AI calls run sequentially.
- Citation verification helps detect unsupported quotations, but it cannot guarantee that every AI conclusion is logically correct.
- Human review remains essential before any final decision.

## Roadmap

- [ ] Background investigation jobs with status polling.
- [ ] MongoDB Atlas Vector Search integration.
- [ ] Dedicated cloud storage for evidence files.
- [ ] Evaluation dataset with accuracy metrics across labeled complaints.
- [ ] Real-time investigation status updates.
- [ ] Improved AI investigation explainability.

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
