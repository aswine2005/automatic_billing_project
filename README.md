## Automated Billing System (Fullstack + AWS Serverless Style)

This is a production-style **Automated Billing System** built with:

- **Frontend**: React (Vite), Tailwind CSS, React Router, Axios
- **Backend**: Node.js, Express-like architecture designed to be **Lambda-ready**
- **Infra Simulations**: DynamoDB-style data modeling (in-memory) and S3-style invoice PDF storage (local simulation)

Features:

- User authentication (JWT-based, stored in `localStorage`)
- Customers management (CRUD subset: create + list)
- Invoices creation and listing with status tracking
- Payments recording with invoice status updates
- Dashboard analytics & reports (revenue, pending, monthly stats)
- Simulated invoice PDF generation with URL-like links

### Project Structure

- `frontend/` – React SPA (Vite) with Tailwind and React Router
- `backend/` – Node.js API, Lambda-friendly structure

### Quick Start

#### Backend

```bash
cd backend
npm install
npm run dev   # starts API on http://localhost:4000
```

#### Frontend

```bash
cd frontend
npm install
npm run dev   # starts UI on http://localhost:5173 (default Vite)
```

Configure the frontend to talk to the backend via `VITE_API_BASE_URL` (defaults to `http://localhost:4000`).

> This project is structured to be easily portable to AWS Lambda + API Gateway + DynamoDB + S3 with minimal refactoring.

