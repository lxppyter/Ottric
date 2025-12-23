# Ottric - Software Supply Chain Security Platform

Ottric is an automated platform for managing Software Bill of Materials (SBOM) and Vulnerability Exploitability Exchange (VEX). It helps organizations track vulnerabilities in their software supply chain, correlate them with specific releases, and provide cryptographic proof of "Not Affected" status to customers.

## 🚀 Key Features

-   **Automated SBOM Ingestion:** Parse and store CycloneDX/SPDX files per release.
-   **Release Lineage:** Track `Commit -> Build -> Artifact` to know exactly which version is deployed.
-   **Vulnerability Correlation:** Automatically detect CVEs using OSV.dev database.
-   **Continuous Monitoring:** Nightly cron jobs scan old releases for newly discovered vulnerabilities.
-   **VEX Workflow:** Manage vulnerability status (`Affected`, `Not Affected`, `Fixed`, `Under Investigation`) with mandatory justification.
-   **Customer Portal:** Securely share SBOMs and Security Reports with customers.
-   **Enterprise Security:** API Rate Limiting, Versioning, and Security Headers enabled by default.

## 🛠 Tech Stack

-   **Backend:** NestJS (Node.js), TypeORM, PostgreSQL
-   **Frontend:** Next.js (React), TailwindCSS, ShadcnUI
-   **Security:** Helmet, Throttling, JWT, Bcrypt
-   **Integrations:** OSV.dev (Vulnerability DB)

## 📦 Installation & Setup

### Prerequisites
-   Node.js v18+
-   PostgreSQL v14+

### 1. Database Setup
```bash
# Create a searchable database
createdb ottric
```

### 2. Backend Setup
```bash
cd ottric
npm install

# Configure Environment
cp .env.example .env 
# (Update DB_HOST, DB_USER, DB_PASSWORD in .env)

# Run Migrations / Seed DB
npx prisma db push 
# OR use TypeORM sync (enabled by default in dev)

# Start Backend
npm run start:dev
```
*Backend runs on `http://localhost:3001` (API) and Swagger Docs at `http://localhost:3001/api`.*

### 3. Frontend Setup
```bash
cd client
npm install
npm run dev
```
*Frontend runs on `http://localhost:3000`.*

## 🔒 Security Architecture

Ottric is designed with "Secure by Default" principles:

1.  **API Versioning:** All endpoints are prefixed with `/v1/` (e.g., `/v1/ingestion/sbom`) to ensure backward compatibility.
2.  **Rate Limiting (Throttling):** Global limit of **100 requests per minute** to prevent brute-force and DoS attacks.
3.  **Security Headers:** `Helmet` is active to set secure HTTP headers (XSS Filter, HSTS, No-Sniff, etc.).
4.  **Input Validation:** Strict DTO validation with `class-validator` (whitelist enabled) prevents Mass Assignment and Injection attacks.
5.  **Authentication:** JWT (JSON Web Token) based stateless authentication.

## 📚 API Documentation

The Monitor API is a RESTful service used by:
1.  **Internal Frontend:** To dashboard data.
2.  **CI/CD Pipelines:** To ingest SBOMs automatically during build.
3.  **External Customers:** To fetch VEX status (future plan).

**Full Swagger Documentation:** [`http://localhost:3001/api`](http://localhost:3001/api)

### Core Endpoints

#### Ingestion
-   `POST /v1/ingestion/sbom`: Upload a CycloneDX JSON. Requires API Key.

#### VEX
-   `GET /v1/vex/product/:id`: List vulnerabilities for a product.
-   `PATCH /v1/vex/:id/status`: Update status (e.g., set to `Not Affected`).

#### Portal
-   `GET /v1/portal/:product/audit-pack`: Download full compliance package (SBOM + VEX + Crypto Signatures).

## 🧪 Testing

```bash
# Unit Tests
npm run test

# E2E Tests
npm run test:e2e
```

---
*Built by Ottric Security Team.*
