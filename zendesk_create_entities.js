const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// ==== CONFIGURATION ====
// Using your credentials
const SUBDOMAIN = "ryukeno";
const EMAIL = "bourgikyrian@gmail.com";
const API_TOKEN = "tBQ6A1fTXcl7ew43yO6E0LfbOxcyGPlRdoDjAs23";

// If you want to use OAuth instead of API token, paste your OAuth access token here:
const OAUTH_TOKEN = ""; // Leave blank to use API token

function getZendeskHeaders() {
  if (OAUTH_TOKEN) {
    return {
      "Authorization": `Bearer ${OAUTH_TOKEN}`,
      "Content-Type": "application/json"
    };
  } else {
    const auth = Buffer.from(`${EMAIL}/token:${API_TOKEN}`).toString('base64');
    return {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/json"
    };
  }
}

function getZendeskUrl(path) {
  return `https://${SUBDOMAIN}.zendesk.com${path}`;
}

// ==== ENTITY GENERATION ====

// Improved error log for Zendesk API
function printZendeskError(res, data, context) {
  console.error(`❌ Zendesk API error during ${context}:`, {
    status: res.status,
    statusText: res.statusText,
    error: data.error,
    description: data.description,
    details: data
  });
}

async function createOrganization(name) {
  const body = JSON.stringify({ organization: { name } });
  const res = await fetch(getZendeskUrl("/api/v2/organizations.json"), {
    method: "POST",
    headers: getZendeskHeaders(),
    body
  });
  const data = await res.json();
  if (!res.ok) {
    printZendeskError(res, data, "organization creation");
    throw new Error(data.error || data.description || JSON.stringify(data));
  }
  console.log(`🏢 Org: ${data.organization.name} (ID: ${data.organization.id})`);
  return data.organization;
}

async function createUser(name, email, orgId, altEmail) {
  // Create user
  const user = { name, email, organization_id: orgId };
  const res = await fetch(getZendeskUrl("/api/v2/users.json"), {
    method: "POST",
    headers: getZendeskHeaders(),
    body: JSON.stringify({ user })
  });
  const data = await res.json();
  if (!res.ok) {
    printZendeskError(res, data, "user creation");
    throw new Error(data.error || data.description || JSON.stringify(data));
  }

  // Add secondary email
  const addEmailRes = await fetch(getZendeskUrl(`/api/v2/users/${data.user.id}/identities.json`), {
    method: "POST",
    headers: getZendeskHeaders(),
    body: JSON.stringify({
      identity: { type: "email", value: altEmail }
    })
  });
  if (!addEmailRes.ok) {
    const err = await addEmailRes.json();
    console.log(`Warning: Could not add alt email for ${email}`, err);
  }

  console.log(`👤 User: ${data.user.name} (${email}, alt: ${altEmail}) [ID: ${data.user.id}]`);
  return data.user;
}

// ✅ CORRECTION : On remplace email_cc_ids par collaborators pour rendre le CC visible
async function createTicket(subject, requesterId, ccEmail) {
  const ticket = {
    subject,
    comment: { body: "Created by Acme Generator" },
    priority: "normal",
    requester_id: requesterId,
    collaborators: [ccEmail] // ✅ Correction ici : le CC est maintenant bien visible dans Zendesk
  };
  const res = await fetch(getZendeskUrl("/api/v2/tickets.json"), {
    method: "POST",
    headers: getZendeskHeaders(),
    body: JSON.stringify({ ticket })
  });
  const data = await res.json();
  if (!res.ok) {
    printZendeskError(res, data, "ticket creation");
    throw new Error(data.error || data.description || JSON.stringify(data));
  }
  console.log(`🎟️ Ticket: "${data.ticket.subject}" | requester: #${requesterId}, cc: ${ccEmail} (ID: ${data.ticket.id})`);
  return data.ticket;
}

// ==== MAIN LOGIC ====
async function main() {
  const orgs = [];
  const users = [];
  const tickets = [];

  // Use a unique runId to avoid org duplicates
  const runId = Date.now();

  // 1. Create 10 organizations with unique names
  for (let i = 1; i <= 10; i++) {
    orgs.push(await createOrganization(`Acme Org ${i} - ${runId}`));
  }

  // 2. Create 10 users, each in their own org, each with 2 emails
  for (let i = 1; i <= 10; i++) {
    const org = orgs[i - 1];
    const email = `user${i}@example.com`;
    const altEmail = `user${i}+alt@example.com`;
    users.push(await createUser(`User ${i}`, email, org.id, altEmail));
  }

  // 3. Create 10 tickets, each user is requester, next user is CC (wrap around)
  for (let i = 0; i < 10; i++) {
    const requester = users[i];
    const cc = users[(i + 1) % users.length];
    tickets.push(await createTicket(`Issue #${i + 1}`, requester.id, cc.email)); // ✅ use cc.email
  }

  console.log("✅ Done! 10 orgs, 10 users (with 2 emails each), 10 tickets created.");
}

// ==== Start! ====
main().catch(err => {
  console.error("❌ Error occurred:", err);
});
