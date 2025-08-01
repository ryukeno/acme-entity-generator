const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Fonction simple pour lire une ligne dans la console sans package externe
function askQuestion(query) {
  return new Promise(resolve => {
    process.stdout.write(query);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.once('data', data => {
      process.stdin.pause();
      resolve(data.trim());
    });
  });
}

async function run() {
  // Demande interactive
  const SUBDOMAIN = await askQuestion('Enter your Zendesk subdomain: ');
  const EMAIL = await askQuestion('Enter your Zendesk agent email: ');
  const API_TOKEN = await askQuestion('Enter your Zendesk API token: ');

  const OAUTH_TOKEN = ""; // On laisse vide pour utiliser API token

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

  async function createTicket(subject, requesterId, ccEmail) {
    const ticket = {
      subject,
      comment: { body: "Created by Acme Generator" },
      priority: "normal",
      requester_id: requesterId,
      collaborators: [ccEmail]
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

  async function main() {
    const orgs = [];
    const users = [];
    const tickets = [];

    const runId = Date.now();

    for (let i = 1; i <= 10; i++) {
      orgs.push(await createOrganization(`Acme Org ${i} - ${runId}`));
    }

    for (let i = 1; i <= 10; i++) {
      const org = orgs[i - 1];
      const email = `user${i}@example.com`;
      const altEmail = `user${i}+alt@example.com`;
      users.push(await createUser(`User ${i}`, email, org.id, altEmail));
    }

    for (let i = 0; i < 10; i++) {
      const requester = users[i];
      const cc = users[(i + 1) % users.length];
      tickets.push(await createTicket(`Issue #${i + 1}`, requester.id, cc.email));
    }

    console.log("✅ Done! 10 orgs, 10 users (with 2 emails each), 10 tickets created.");
  }

  await main();
}

run().catch(err => {
  console.error("❌ Error occurred:", err);
});
