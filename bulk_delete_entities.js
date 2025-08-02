const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const readline = require('readline');

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans.trim());
  }));
}

async function main() {
  const SUBDOMAIN = await askQuestion("Enter your support platform subdomain: ");
  const EMAIL = await askQuestion("Enter your agent email: ");
  const API_TOKEN = await askQuestion("Enter your API token: ");

  function getApiHeaders() {
    const auth = Buffer.from(`${EMAIL}/token:${API_TOKEN}`).toString('base64');
    return {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/json"
    };
  }

  function getApiUrl(path) {
    return `https://${SUBDOMAIN}.zendesk.com${path}`;
  }

  async function getAll(path) {
    const res = await fetch(getApiUrl(path), {
      method: "GET",
      headers: getApiHeaders()
    });
    return await res.json();
  }

  async function deleteById(path, id, label, force = false) {
    const url = getApiUrl(`${path}/${id}.json${force ? '?force=true' : ''}`);
    const res = await fetch(url, {
      method: "DELETE",
      headers: getApiHeaders()
    });
    if (res.ok) {
      console.log(`🗑️ Deleted ${label} (ID: ${id})`);
    } else {
      const err = await res.json().catch(() => ({}));
      console.log(`⚠️ Failed to delete ${label} (ID: ${id}):`, err.error || res.statusText);
    }
  }

  async function runBulkDelete() {
    console.log(`🚨 Starting bulk cleanup (tickets → users → orgs)`);

    // 1. Delete tickets like "Node Issue 1 (nodegen-...)""
    try {
      const ticketData = await getAll("/api/v2/tickets.json");
      for (const t of ticketData.tickets) {
        if (t.subject && t.subject.startsWith("Node Issue") && t.subject.includes("nodegen-")) {
          await deleteById("/api/v2/tickets", t.id, `Ticket "${t.subject}"`);
        }
      }
    } catch (e) {
      console.log("⚠️ Could not fetch or delete tickets:", e.message);
    }

    // 2. Delete users like "nodeuserX-nodegen-...@example.com"
    try {
      const userData = await getAll("/api/v2/users.json");
      for (const u of userData.users) {
        if (u.email && u.email.match(/^nodeuser\d+-nodegen-\d+@example\.com$/)) {
          await deleteById("/api/v2/users", u.id, `User "${u.email}"`, true);
        }
      }
    } catch (e) {
      console.log("⚠️ Could not fetch or delete users:", e.message);
    }

    // 3. Delete orgs like "Demo Org X (nodegen-...)""
    try {
      const orgData = await getAll("/api/v2/organizations.json");
      for (const o of orgData.organizations) {
        if (o.name && o.name.match(/^Demo Org \d+ \(nodegen-\d+\)$/)) {
          await deleteById("/api/v2/organizations", o.id, `Organization "${o.name}"`);
        }
      }
    } catch (e) {
      console.log("⚠️ Could not fetch or delete organizations:", e.message);
    }

    console.log("✅ Bulk delete script finished.");
  }

  await runBulkDelete();
}

main().catch(err => {
  console.error("❌ Unexpected error during cleanup:", err);
});
