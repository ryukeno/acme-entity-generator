<img width="300" height="300" alt="image" src="https://github.com/user-attachments/assets/bc6c46b6-9334-4f96-bc2e-375e608660f2" />


# Acme Co API Entity Generator Tool

This is a **modular, sandbox-safe simulation tool** created to showcase how we can through different ways manage a support platform through API requests — from **Postman collections** to **backend Node.js scripts**, while respecting **CORS policy limitations**.

It demonstrates how to **programmatically manage support platform entities**, including organizations, users, and tickets, using best-practice API integration flows.

---

## 🧩 Project Architecture

This system consists of three modular components:

| Component         | Description                                                                                   |
|------------------|-----------------------------------------------------------------------------------------------|
| 🔵 Frontend UI    | OAuth2 (PKCE)–based CodePen web interface for simulation and configuration (no real API calls) |
| 🟢 Backend Script | Node.js CLI tool for real entity generation and cleanup using API token or OAuth token         |
| 🟠 Postman Runner | Prebuilt collection + CSV files for API generation with manual or scripted flows               |

### 🔗 Live Frontend Demo

👉 [**Launch CodePen UI**](https://codepen.io/Kyrian-Bourgi/pen/empBQbe)

---

## ⚙️ Key Features

### Entity Creation (`create_entities.js`)
- Creates **10 organizations** (timestamped names using runId)
- Creates **10 users**, each with:
  - Two emails (primary + alias)
  - Assigned to an org
- Creates **10 tickets**:
  - Each ticket has a unique requester and CC user
- Real-time logging with full JSON outputs

### Entity Cleanup (`bulk_delete_entities.js`)
- Finds the latest runId from org naming
- Deletes:
  - Tickets titled `Issue #X`
  - Users with `userX@example.com`
  - Orgs with matching runId
- Resolves constraints (users with tickets)
- Idempotent and re-runnable safely

---

## 🔐 Authentication & Security

| Auth Method      | Purpose                   | Used In          |
|------------------|---------------------------|------------------|
| 🔑 API Token     | CLI testing               | Node backend     |
| 🔐 OAuth2 + PKCE | Frontend config/demo only | CodePen frontend |

- API tokens **never** used in the UI
- OAuth2 PKCE is for frontend config only — no real requests
- Postman uses secure variables or local environment secrets

---

## 🌐 CORS Considerations (Frontend Reality)

**You cannot create/delete real data from the CodePen frontend!**  
All real API requests are blocked by CORS, even if authenticated.  
**Only the backend scripts or Postman collection perform operations.**  
The UI is a **simulator**, not a real-time execution layer.

---

## 📂 Generation Methods Explained

| Method         | Description                                                   | Tags Applied                     | Ideal Use Case                             |
|----------------|---------------------------------------------------------------|----------------------------------|--------------------------------------------|
| 🟢 Node.js      | CLI-based automation with real API requests using tokens      | `node-user-*`, `node-org-*`      | Automation, backend workflows, integration |
| 🟠 Postman      | Collection runner using CSV input (manual or scripted flow)   | `postman-demo`                   | QA, onboarding, client-facing generation   |
| 🔵 UI Simulator | OAuth2 CodePen UI for visual simulation & pre-configuration   | _No tags, no API calls_          | Demos, configurator interface              |

### Tagging Logic

- **Node.js** adds: `node-user-nodegen-[timestamp]`, etc.
- **Postman** adds: `postman-demo`
- **Frontend UI** applies no tagging (not connected to backend)

---

## 🧪 Simulated Client Scenario

This project simulates how a real-world **client dashboard** might function.  
For example, a client could:

- Use the **CodePen UI** to configure a scenario
- Click **Generate** → which in production would trigger:
  - A secure backend Node.js function
  - A webhook triggering the Postman runner
  - A call to a containerized microservice (e.g., cronjob)

In this version:
- Frontend is **demo-only**
- Postman is **manual**
- Backend is **autonomous via CLI**

---

## 📦 Postman Collection (Overview)

The `/postman/` folder includes:

- ✅ Collection: `Acme Support Platform API Demo.postman_collection.json`
- ✅ CSV files:
  - `orgs.csv`
  - `users.csv`
  - `addSecondaryEmail.csv`
  - `TicketCreation.csv`
  - `deleteorg.csv`, `deleteusers.csv`, `deletetickets.csv`
---
---

## 📁 Project Folder Structure
The following is the full folder structure of this project, with inline comments to clarify each component:

```bash
acme-api-entity-generator/
├── create_entities.js               # Node.js script to create orgs, users, tickets
├── bulk_delete_entities.js         # Cleanup script (idempotent)
├── package.json                    # Node.js dependencies
├── /postman/                       # Postman collection + CSVs
│   ├── Acme Support Platform API Demo.postman_collection.json
│   ├── orgs.csv
│   ├── users.csv
│   ├── addSecondaryEmail.csv
│   ├── TicketCreation.csv
│   ├── deleteorg.csv
│   ├── deleteusers.csv
│   └── deletetickets.csv
├── /docs/                          # (Optional) Markdown docs, screenshots
│   └── README.md
└── /frontend/                      # CodePen or OAuth setup references (optional)
    └── README_OAuth_Flow.md


### Collection Request Flow

| Method  | Name                         | CSV or Note |
|---------|------------------------------|-------------|
| POST    | Create Acme Organization     | `orgs.csv`  |
| GET     | Export All Organization IDs  | —           |
| DEL     | Delete Orgs by File          | `deleteorg.csv` |
| POST    | Create Users                 | `users.csv` (orgs must exist) |
| POST    | Add Secondary Email          | `addSecondaryEmail.csv` (separate call only) |
| GET     | Export Users ID              | —           |
| DEL     | Delete Users                 | `deleteusers.csv` |
| POST    | Create Tickets               | `TicketCreation.csv` |
| GET     | Get Tickets ID               | —           |
| DEL     | Delete Tickets               | `deletetickets.csv` |

> 🧠 Secondary email **must** be handled separately: it's a new identity under the API rules, not a sub-field of the main user creation.
```
---

## 🛠 Backend Setup Instructions

### Prerequisites

- Install Node.js → [https://nodejs.org](https://nodejs.org)

### Install dependencies & run scripts

```bash
npm install node-fetch

# Create demo entities
node create_entities.js

# Clean up all demo entities
node bulk_delete_entities.js
```

---

## 🧠 Architect Notes

- 🔄 **Fully modular and idempotent**
- 🏷️ Method-specific tagging for traceability
- ✅ **No sensitive tokens in UI/frontend code**
- ✅ **Error handling built-in in backend scripts**
- 🔁 Postman-compatible for non-dev users
- 🎯 **CORS-compliant:** only backend does real API actions
- ⚠️ Not intended for production use without security adaptation

---

## 👤 Author

Prepared by **Kyrian Bourgi**  
[LinkedIn](https://www.linkedin.com/in/kyrian-bourgi-715200b3/)  
[Entity Generator UI (CodePen)](https://codepen.io/Kyrian-Bourgi/pen/empBQbe)
