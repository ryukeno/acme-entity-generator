# Acme Co — API Entity Generator Tool

This is a **modular, sandbox-safe simulation tool** created for technical assessment purposes.  
It demonstrates how to **programmatically manage support platform entities** — including organizations, users, and tickets — using best-practice API integration flows.

---

## 🧩 Project Architecture

This system consists of two decoupled components:

| Component         | Description                                                                                   |
|-------------------|-----------------------------------------------------------------------------------------------|
| 🔵 Frontend UI    | OAuth2 (PKCE)–based CodePen web interface for simulation and configuration (no real API calls) |
| 🟢 Backend Script | Node.js CLI tool for real entity generation and cleanup using API token or OAuth token         |

### 🔗 Live Frontend Demo

👉 [**Launch CodePen UI**](https://codepen.io/Kyrian-Bourgi/pen/empBQbe)

---

## ⚙️ Key Features

### Entity Creation (`create_entities.js`)
- Creates **10 organizations** (unique timestamped name)
- Creates **10 users**, each with:
  - Two emails (primary + alias)
  - Linked to an organization
- Creates **10 tickets**:
  - Each ticket has a unique requester and a separate CC user
- Real-time logging in console

### Entity Cleanup (`bulk_delete_entities.js`)
- Finds latest runId from organization names
- Deletes:
  - Tickets titled `"Issue #X"`
  - Users with `userX@example.com`
  - Orgs with current `runId`
- Handles forced user deletion if linked to tickets
- Idempotent: safe to re-run

---

## 🔐 Authentication & Security

| Auth Method      | Purpose                   | Used In          |
|------------------|--------------------------|------------------|
| 🔑 API Token     | CLI testing               | Node backend     |
| 🔐 OAuth2 + PKCE | Frontend config/demo only | CodePen frontend |

- API tokens **never** used in browser, only in your local scripts
- OAuth2 + PKCE is for frontend config demo — real API calls are always server-side

---

## 🌐 CORS Considerations (Frontend Reality)

**You cannot create/delete real data from the CodePen frontend!**  
All API requests are blocked by CORS, even with OAuth2.  
**Only the backend scripts actually perform operations**.  
UI is a config simulator and demo — not a real data manager.

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
- ✅ **No sensitive tokens in UI/frontend code**
- ✅ **Error handling built-in in backend scripts**
- 🎯 **CORS-compliant:** only backend does real API actions
- ⚠️ **No production use without adaptation**

---

## 👤 Author

Prepared by **Kyrian Bourgi**  
[LinkedIn](https://www.linkedin.com/in/kyrian-bourgi-715200b3/)  
[Entity Generator UI (CodePen)](https://codepen.io/Kyrian-Bourgi/pen/empBQbe)
