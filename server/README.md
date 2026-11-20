# ResolveAI — Backend

Express + MongoDB + Gemini backend for AI-assisted complaint investigation.
Agents review and approve every AI recommendation. The AI never approves refunds or rejects complaints.

## Setup (about 15 minutes)

1. Install dependencies
   ```bash
   npm install
   ```
2. Create `.env` from `.env.example` and fill in:
   - `MONGO_URI` from your MongoDB Atlas cluster (allow your IP or 0.0.0.0/0 for testing)
   - `GEMINI_API_KEY` from Google AI Studio
   - `JWT_SECRET` as a long random string
3. Seed the agent and admin accounts:
   ```bash
   npm run seed
   ```
   Default logins: `agent@resolveai.com / Agent@12345` and `admin@resolveai.com / Admin@12345`. Change them before deploying.
4. Load the sample policy into the knowledge base (admin-only uploads are also available via the API):
   ```bash
   npm run ingest
   ```
5. Start the server:
   ```bash
   npm run dev
   ```

## Request flow

1. **Customer submits** `POST /api/tickets` (multipart: fields + up to 3 evidence files). The backend assigns `RES-2026-0001` and saves the ticket.
2. **Agent logs in** `POST /api/auth/login` and receives a JWT.
3. **Agent runs investigation** `POST /api/tickets/:id/investigate`:
   - `classification.service.js`: Gemini returns category, priority and summary as JSON.
   - `evidence.service.js`: Gemini looks at images and PDFs and describes only what is visible.
   - `retrieval.service.js`: the complaint is embedded and compared to every policy chunk; the top 5 are returned.
   - `investigation.service.js`: Gemini recommends an action with citations. Then the backend checks each citation: the passage ID must exist and the quote must appear in that passage. Failed citations are dropped, and a case with no valid citation is escalated to a human.
   - Results are saved in `Investigation`, separate from the ticket.
4. **Agent approves** `PATCH /api/tickets/:id/response` with the final text. The AI draft stays in `response.generated`, and the approved text goes in `response.final`.
5. **Customer tracks** `GET /api/tickets/track?ticketNumber=...&email=...`. The response includes the final reply only after approval.

## API

| Method | Endpoint | Who | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | public | Agent/admin login |
| POST | `/api/tickets` | public | Submit complaint + evidence |
| GET | `/api/tickets/track` | public (ticket number + email) | Customer tracking |
| GET | `/api/tickets` | agent | List tickets (`?status=`) |
| GET | `/api/tickets/:id` | agent | Ticket + latest investigation |
| GET | `/api/tickets/:id/evidence/:index` | agent | View an evidence file |
| PATCH | `/api/tickets/:id/status` | agent | Set status manually |
| POST | `/api/tickets/:id/investigate` | agent | Run AI investigation (idempotent) |
| PATCH | `/api/tickets/:id/response` | agent | Approve final response |
| GET | `/api/policies` | agent | List policies |
| POST | `/api/policies` | admin | Upload policy (PDF/TXT/MD or text) |

## Quick test (curl)

```bash
# 1. login
curl -X POST localhost:5000/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"agent@resolveai.com","password":"Agent@12345"}'

# 2. submit a complaint (no files)
curl -X POST localhost:5000/api/tickets -H "Content-Type: application/json" \
  -d '{"name":"Rahul","email":"rahul@example.com","orderId":"ORD-12345","category":"damaged_product","description":"Laptop arrived with a scratched screen and a cracked corner."}'

# 3. investigate (use the token and ticket _id from the list endpoint)
curl -X POST localhost:5000/api/tickets/<id>/investigate -H "Authorization: Bearer <token>"
```

## Known limits (honest notes for interviews)

- Retrieval is brute-force cosine similarity in Node. It's fine for a small policy set. Atlas `$vectorSearch` is the production path.
- Evidence files are stored in MongoDB (5 MB each). Move them to Cloudinary or S3 before real use.
- Citation checks are exact-substring matches, so they catch invented quotes but not wrong reasoning. Human review covers that.
- Model names change often. Update `GEMINI_MODEL` and `GEMINI_EMBED_MODEL` if Google retires them.
