const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

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
  const SUBDOMAIN = await askQuestion('Enter your support platform subdomain: ');
  const EMAIL = await askQuestion('Enter your agent email: ');
  const API_TOKEN = await askQuestion('Enter your API token: ');

  const OAUTH_TOKEN = ""; // Leave empty if using API token

  const runId = `nodegen-${Date.now()}`;

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
    return `https://${SUBDOMAIN}.zendesk.com${path}`;
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

  async function createOrganization(name, tag) {
    const body = JSON.stringify({
      organization: {
        name,
        tags: [tag]
      }
    });

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

  async function createUser(name, email, orgId, altEmail, tag) {
    const user = {
      name,
      email,
      organization_id: orgId,
      tags: [tag]
    };

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

    const addEmailRes = await fetch(getApiUrl(`/api/v2/users/${data.user.id}/identities.json`), {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({
        identity: { type: "email", value: altEmail }
      })
    });

    if (!addEmailRes.ok) {
      const err = await addEmailRes.json();
      console.log(`⚠️ Warning: Could not add alt email for ${email}`, err);
    }

    console.log(`👤 User: ${data.user.name} (${email}, alt: ${altEmail}) [ID: ${data.user.id}]`);
    return data.user;
  }

  async function createTicket(subject, requesterId, ccEmail) {
    const ticket = {
      subject,
      comment: { body: "Created by node generator" },
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

    for (let i = 1; i <= 10; i++) {
      const orgName = `Demo Org ${i} (${runId})`;
      const orgTag = `node-org-${runId}`;
      orgs.push(await createOrganization(orgName, orgTag));
    }

    for (let i = 1; i <= 10; i++) {
      const userName = `Node User ${i} - ${runId}`;
      const email = `nodeuser${i}-${runId}@example.com`;
      const altEmail = `nodeuser${i}-alt-${runId}@example.com`;
      const userTag = `node-user-${runId}`;
      users.push(await createUser(userName, email, orgs[i - 1].id, altEmail, userTag));
    }

    for (let i = 0; i < 10; i++) {
      const requester = users[i];
      const cc = users[(i + 1) % users.length];
      const subject = `Node Issue ${i + 1} (${runId})`;
      tickets.push(await createTicket(subject, requester.id, cc.email));
    }

    console.log(`✅ Done! Created with run ID: ${runId}`);
  }

  await main();
}

run().catch(err => {
  console.error("❌ Error occurred:", err);
});
