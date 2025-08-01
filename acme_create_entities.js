const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Simple function to read a line from console without external package
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
  // Interactive prompts for support platform credentials
  const SUBDOMAIN = await askQuestion('Enter your support platform subdomain: ');
  const EMAIL = await askQuestion('Enter your agent email: ');
  const API_TOKEN = await askQuestion('Enter your API token: ');

  const OAUTH_TOKEN = ""; // Leave empty to use API token

  function getApiHeaders() {
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

  function getApiUrl(path) {
    return `https://${SUBDOMAIN}.zendesk.com${path}`; // Endpoint must remain for real API
  }

  function printApiError(res, data, context) {
    console.error(`❌ API error during ${context}:`, {
      status: res.status,
      statusText: res.statusText,
      error: data.error,
      description: data.description,
      details: data
    });
  }

  async function createOrganization(name) {
    const body = JSON.stringify({ organization: { name } });
    const res = await fetch(getApiUrl("/api/v2/organizations.json"), {
      method: "POST",
      headers: getApiHeaders(),
      body
    });
    const data = await res.json();
    if (!res.ok) {
      printApiError(res, data, "organization creation");
      throw new Error(data.error || data.description || JSON.stringify(data));
    }
    console.log(`🏢 Organization: ${data.organization.name} (ID: ${data.organization.id})`);
    return data.organization;
  }

  async function createUser(name, email, orgId, altEmail) {
    const user = { name, email, organization_id: orgId };
    const res = await fetch(getApiUrl("/api/v2/users.json"), {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({ user })
    });
    const data = await res.json();
    if (!res.ok) {
      printApiError(res, data, "user creation");
      throw new Error(data.error || data.description || JSON.stringify(data));
    }

    // Add alternate email
    const addEmailRes = await fetch(getApiUrl(`/api/v2/users/${data.user.id}/identities.json`), {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({
        identity: { type: "email", value: altEmail }
      })
    });
    if (!addEmailRes.ok) {
      const err = await addEmailRes.json();
      console.log(`Warning: Could not add alternate email for ${email}`, err);
    }

    console.log(`👤 User: ${data.user.name} (${email}, alt: ${altEmail}) [ID: ${data.user.id}]`);
    return data.user;
  }

  async function createTicket(subject, requesterId, ccEmail) {
    const ticket = {
      subject,
      comment: { body: "Created by demo generator" },
      priority: "normal",
      requester_id: requesterId,
      collaborators: [ccEmail]
    };
    const res = await fetch(getApiUrl("/api/v2/tickets.json"), {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({ ticket })
    });
    const data = await res.json();
    if (!res.ok) {
      printApiError(res, data, "ticket creation");
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
      orgs.push(await createOrganization(`Demo Org ${i} - ${runId}`));
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

    console.log("✅ Done! 10 organizations, 10 users (with 2 emails each), 10 tickets created.");
  }

  await main();
}

run().catch(err => {
  console.error("❌ Error occurred:", err);
});
