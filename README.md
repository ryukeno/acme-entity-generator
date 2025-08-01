# Acme Co — API Entity Generator Tool

This is a **modular, sandbox-safe simulation tool** created for technical assessment purposes.
It demonstrates how to **programmatically manage support platform entities** — including organizations, users, and tickets — using best-practice API integration flows.

---

## 🧩 Project Architecture

This system consists of two decoupled components:

| Component         | Description                                                        |
| ----------------- | ------------------------------------------------------------------ |
| 🔵 Frontend UI    | OAuth2 (PKCE)–based CodePen web interface for interactive demo     |
| 🟢 Backend Script | Node.js CLI tool for entity generation and cleanup using API token |

### 🔗 Live Frontend Demo

👉 [Launch CodePen UI](https://codepen.io/Kyrian-Bourgi/pen/empBQbe)

---

## ⚙️ Key Features

### ✅ Entity Creation (`create_entities.js`)

* 10 **organizations**, uniquely named via timestamp-based `runId`
* 10 **users**, each with:

  * Two emails (primary + alias)
  * Organization assignment
* 10 **tickets**, each with:

  * A unique requester
  * A separate user as CC
* Real-time logging of all operations with entity IDs

### 🧹 Entity Cleanup (`bulk_delete_entities.js`)

* Automatically identifies latest `runId` from org names
* Deletes:

  * Tickets titled `"Issue #X"`
  * Users with `userX@example.com` patterns
  * Organizations containing the `runId`
* Includes:

  * Forced user deletion (handles ticket linkage)
  * Idempotent logic for safe re-runs

---

## 🔐 Authentication & Security

| Auth Method      | Purpose                   | Used In          |
| ---------------- | ------------------------- | ---------------- |
| 🔑 API Token     | Server-side CLI testing   | Node backend     |
| 🔐 OAuth2 + PKCE | Frontend-safe interaction | CodePen frontend |

* API tokens are **never exposed client-side**
* OAuth2 + PKCE ensures **secure delegated access** via browser

---

## 🌐 CORS Considerations (Frontend API Access)

Modern support platforms enforce strict **CORS policies** to block frontend requests using API tokens.

This is solved by:

* ❌ Never using API tokens in frontend code
* ✅ Using **OAuth2 with PKCE**, which allows secure frontend-only API access via delegated user authorization

> The frontend uses a **public OAuth client** with PKCE, allowing **direct browser-to-API access** — no server proxy needed.

---

## 🛠 Backend Setup Instructions

### Prerequisites

* Install Node.js → [https://nodejs.org](https://nodejs.org)

### Install dependencies & run scripts

```bash
npm install node-fetch

# Create demo entities
node create_entities.js

# Clean up all demo entities
node bulk_delete_entities.js
```

## 📁 Files & Structure

| FileDescription           |                                         |
| ------------------------- | --------------------------------------- |
| `create_entities.js`      | Script to generate orgs, users, tickets |
| `bulk_delete_entities.js` | Cleanup script by latest runId          |
| `README.md`               | This documentation                      |

---

## 🧠 Architect Notes

* 🔄 Fully modular and **idempotent**
* ✅ CORS-compliant frontend (PKCE)
* ✅ Error handling built-in
* 🎯 Follows secure design principles for API-first platforms and OAuth-based integrations

> Built for demo and technical assessment purposes — not intended for production use without modification.

---

## 👤 Author

Prepared by **Kyrian Bourgi**
➡️ [LinkedIn](https://www.linkedin.com/in/kyrian-bourgi-715200b3/)
🎯 CodePen: [Entity Generator UI](https://codepen.io/Kyrian-Bourgi/pen/empBQbe)
