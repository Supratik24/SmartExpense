# SmartExpense AI

Production-oriented monorepo for an Android and Web expense tracker that imports transaction SMS alerts, extracts structured transaction data, categorizes expenses, and produces analytics plus spending forecasts.

## Apps

- `backend/` - Node.js, Express, PostgreSQL API with JWT auth, refresh tokens, SMS parsers, categorization, transactions, and analytics.
- `web/` - React + TypeScript dashboard using Chart.js.
- `mobile/` - Flutter Android app skeleton with SMS permission/import flow.
- `ml/` - Python + scikit-learn Random Forest training and prediction utilities.

## Quick Start

```bash
docker compose up --build
```

Services:

- API: `http://localhost:4000`
- Web dashboard: `http://localhost:5173`
- PostgreSQL: `localhost:5432`

## Environment

Copy `.env.example` to `.env` and tune secrets before production use.

## Core Capabilities

- Email/password auth with access and refresh JWTs.
- Email verification and password reset token tables.
- Modular SMS parser architecture for HDFC, ICICI, SBI, Axis, Kotak, CBI, and UPI alerts.
- Rule-based merchant categorization with ML fallback.
- CRUD transactions and SMS import endpoint.
- Analytics for daily, weekly, monthly spending, category split, income vs expense, savings rate, top merchants, averages, and forecast.
- Docker and GitHub Actions for CI.

## Android SMS Policy Note

Reading SMS is sensitive on Android. For Play Store release, the app must clearly qualify for SMS permissions, disclose usage, request runtime permission, and avoid uploading non-transaction SMS content. The mobile skeleton keeps parsing local-first and submits only detected transaction payloads.
