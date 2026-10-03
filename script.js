const campaignStorageKey = "recalliq.campaigns.v3";
const customerStorageKey = "recalliq.customers.v1";
const API_BASE = window.RECALLIQ_API_BASE || "http://localhost:5000/api";

async function apiRequest(path, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options,
    });
    if (!response.ok) throw new Error(`API ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn("RecallIQ API unavailable; using local fallback.", error.message);
    return null;
  }
}

async function syncFromApi() {
  const [serverCustomers, serverCampaigns] = await Promise.all([
    apiRequest("/customers"),
    apiRequest("/campaigns"),
  ]);

  if (Array.isArray(serverCustomers)) {
    if (serverCustomers.length || !customers.length) {
      customers = serverCustomers.map(normalizeCustomer);
      writeJson(customerStorageKey, customers);
    } else if (customers.length) {
      await apiRequest("/customers", { method: "PUT", body: JSON.stringify(customers) });
    }
  }

  if (Array.isArray(serverCampaigns)) {
    if (serverCampaigns.length || !campaigns.length) {
      campaigns = serverCampaigns;
      writeJson(campaignStorageKey, campaigns);
    } else if (campaigns.length) {
      for (const campaign of campaigns) {
        await apiRequest("/campaigns", { method: "POST", body: JSON.stringify(campaign) });
      }
    }
  }
}

const fallbackSegments = {
  sleeping: {
    title: "Sleeping loyalists",
    channel: "WhatsApp",
    reason:
      "These customers used to buy every month but have missed two cycles. A low-friction WhatsApp reminder with loyalty points is likely to recover intent fastest.",
    audience: "684 customers",
    audienceCount: 684,
    value: "Rs. 3.1L predicted recovery",
    action: "Send loyalty win-back offer",
    urgency: "Launch before Friday evening",
    campaign: "Loyalty Wake-Up",
    message:
      "We saved your loyalty perks. Come back this week and get 15% off your next order.",
    opens: "61%",
    conversions: "9.8%",
    cost: "Rs. 38K",
    customers: [],
  },
  cart: {
    title: "Cart abandoners",
    channel: "Email",
    reason:
      "Cart value is high and intent is still fresh. Email can show the saved items, while SMS is held back for customers who ignore the first reminder.",
    audience: "1,142 customers",
    audienceCount: 1142,
    value: "Rs. 4.6L predicted recovery",
    action: "Send saved-cart reminder",
    urgency: "Launch within 3 hours",
    campaign: "Cart Rescue",
    message:
      "Your picks are still waiting. Complete your order today and unlock free delivery.",
    opens: "48%",
    conversions: "7.4%",
    cost: "Rs. 22K",
    customers: [],
  },
  birthday: {
    title: "Birthday window",
    channel: "Email + WhatsApp",
    reason:
      "The date gives the message natural relevance. A personalized email with a WhatsApp follow-up balances delight, cost, and conversion probability.",
    audience: "312 customers",
    audienceCount: 312,
    value: "Rs. 1.2L predicted recovery",
    action: "Send birthday reward journey",
    urgency: "Launch tomorrow morning",
    campaign: "Birthday Spark",
    message:
      "Your birthday reward is ready. Celebrate with a special offer picked for you.",
    opens: "66%",
    conversions: "11.3%",
    cost: "Rs. 14K",
    customers: [],
  },
  vip: {
    title: "VIP churn watch",
    channel: "WhatsApp + Human handoff",
    reason:
      "Premium buyers are showing declining frequency, so the safest route is a concierge-style WhatsApp message with a higher-value offer and human handoff.",
    audience: "280 customers",
    audienceCount: 280,
    value: "Rs. 5.8L predicted recovery",
    action: "Send VIP concierge offer",
    urgency: "Launch after manager approval",
    campaign: "VIP Save Desk",
    message:
      "We noticed you have been away. Your private preview and premium reward are ready.",
    opens: "72%",
    conversions: "13.1%",
    cost: "Rs. 64K",
    customers: [],
  },
};

const sampleCsv = `name,email,phone,lastOrderDate,totalSpent,orderCount,cartValue,birthday,preferredChannel,consent
Aarav Mehta,aarav@example.com,+919900000001,2026-03-01,18400,8,0,1998-06-20,WhatsApp,true
Mira Shah,mira@example.com,+919900000002,2026-06-04,6200,3,2600,1999-11-12,Email,true
Kabir Rao,kabir@example.com,+919900000003,2026-02-18,58200,19,0,1995-07-02,WhatsApp,true
Naina Kapoor,naina@example.com,+919900000004,2026-05-21,9200,4,1800,2000-06-18,SMS,true
Dev Iyer,dev@example.com,+919900000005,2026-04-08,21600,7,0,1997-09-05,Email,false
Isha Menon,isha@example.com,+919900000006,2026-06-10,12800,5,3400,1998-06-17,WhatsApp,true
Rohan Das,rohan@example.com,+919900000007,2026-01-12,74400,22,0,1994-12-01,WhatsApp,true
Tara Singh,tara@example.com,+919900000008,2026-05-30,4800,2,0,2001-06-16,Email,true`;

let campaigns = [];
let customers = [];
let segmentData = { ...fallbackSegments };
let lifecycleEvents = [
  {
    id: "life-1",
    customer: "Aarav",
    channel: "WhatsApp",
    campaign: "Loyalty Wake-Up",
    status: "Sent",
    timestamp: "Today 10:02 AM",
  },
  {
    id: "life-2",
    customer: "Priya",
    channel: "Email",
    campaign: "VIP Recovery",
    status: "Delivered",
    timestamp: "Today 10:05 AM",
  },
  {
    id: "life-3",
    customer: "Rahul",
    channel: "SMS",
    campaign: "Cart Reminder",
    status: "Opened",
    timestamp: "Today 10:11 AM",
  },
  {
    id: "life-4",
    customer: "Neha",
    channel: "WhatsApp",
    campaign: "Loyalty Wake-Up",
    status: "Clicked",
    timestamp: "Today 10:18 AM",
  },
  {
    id: "life-5",
    customer: "Riya",
    channel: "Email",
    campaign: "VIP Recovery",
    status: "Purchased",
    timestamp: "Today 10:26 AM",
  },
];
let lifecycleMetrics = {
  Sent: 248,
  Delivered: 231,
  Opened: 187,
  Read: 156,
  Clicked: 96,
  Purchased: 31,
};

const fields = {
  title: document.querySelector("#segmentTitle"),
  reason: document.querySelector("#agentReason"),
  audience: document.querySelector("#audienceSize"),
  value: document.querySelector("#audienceValue"),
  action: document.querySelector("#nextAction"),
  urgency: document.querySelector("#urgency"),
  campaign: document.querySelector("#campaignName"),
  message: document.querySelector("#messageText"),
  opens: document.querySelector("#expectedOpens"),
  conversions: document.querySelector("#expectedConversions"),
  cost: document.querySelector("#offerCost"),
  budget: document.querySelector("#budgetValue"),
  compactAudienceTitle: document.querySelector("#compactAudienceTitle"),
  compactAudience: document.querySelector("#compactAudience"),
  compactChannel: document.querySelector("#compactChannel"),
  compactRecovery: document.querySelector("#compactRecovery"),
  modalAudienceCount: document.querySelector("#modalAudienceCount"),
  modalChannel: document.querySelector("#modalChannel"),
  forecastRecovery: document.querySelector("#forecastRecovery"),
  forecastConversions: document.querySelector("#forecastConversions"),
  forecastLift: document.querySelector("#forecastLift"),
  forecastAudienceSize: document.querySelector("#forecastAudienceSize"),
  forecastConfidence: document.querySelector("#forecastConfidence"),
  confidenceValue: document.querySelector("#confidenceValue"),
  confidenceFill: document.querySelector("#confidenceFill"),
  reasoningSummary: document.querySelector("#reasoningSummary"),
  draftStatus: document.querySelector("#draftStatus"),
};

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function saveCustomers() {
  writeJson(customerStorageKey, customers);
  return apiRequest("/customers", { method: "PUT", body: JSON.stringify(customers) });
}

function saveCampaigns() {
  writeJson(campaignStorageKey, campaigns);
  return apiRequest("/campaigns", { method: "DELETE" }).then(async () => {
    for (const campaign of campaigns) {
      await apiRequest("/campaigns", { method: "POST", body: JSON.stringify(campaign) });
    }
  });
}

function newId() {
  return crypto.randomUUID?.() || String(Date.now() + Math.random());
}

function launchCampaignLocally(payload) {
  const audienceIds = new Set(payload.audienceIds || []);
  const audience = customers.filter((customer) => audienceIds.has(customer.id) && customer.consent);
  const campaign = {
    id: newId(),
    name: payload.name || "Untitled campaign",
    segment: payload.segment || "Custom audience",
    channel: payload.channel || "AI recommended",
    message: payload.message || "",
    sendWindow: payload.sendWindow || "Now",
    budget: payload.budget || "Not set",
    audienceCount: audience.length,
    conversionRate: Number(payload.conversionRate) || 0.08,
    progress: 8,
    delivered: Math.round(audience.length * 0.08),
    conversions: 0,
    senderMode: "simulation",
    providerStatus: "simulated",
    createdAt: new Date().toISOString(),
  };

  campaigns.unshift(campaign);
  campaigns = campaigns.slice(0, 25);
  saveCampaigns();

  return {
    campaign,
    sendResult: {
      status: "simulated",
      message: `${audience.length} recipients queued locally in simulation mode.`,
    },
  };
}

function tickCampaignsLocally() {
  campaigns = campaigns.map((campaign) => {
    if (campaign.progress >= 100) return campaign;
    const progress = Math.min(100, campaign.progress + Math.ceil(Math.random() * 16));
    const delivered = Math.min(
      campaign.audienceCount,
      Math.round((campaign.audienceCount * progress) / 100),
    );
    return {
      ...campaign,
      progress,
      delivered,
      conversions: Math.round(delivered * campaign.conversionRate),
    };
  });
  saveCampaigns();
}

function rupees(value) {
  const number = Number(value) || 0;
  if (number >= 100000) return `Rs. ${(number / 100000).toFixed(1)}L`;
  if (number >= 1000) return `Rs. ${Math.round(number / 1000)}K`;
  return `Rs. ${number}`;
}

function daysSince(dateString) {
  if (!dateString) return 999;
  const ms = Date.now() - new Date(dateString).getTime();
  return Math.max(0, Math.floor(ms / 86400000));
}

function isBirthdaySoon(dateString) {
  if (!dateString) return false;
  const today = new Date();
  const birthday = new Date(dateString);
  const thisYear = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
  const diff = Math.floor((thisYear - today) / 86400000);
  return diff >= 0 && diff <= 14;
}

function normalizeCustomer(raw) {
  return {
    id: raw.id || crypto.randomUUID?.() || String(Date.now() + Math.random()),
    name: raw.name?.trim() || "Unnamed customer",
    email: raw.email?.trim() || "",
    phone: raw.phone?.trim() || "",
    lastOrderDate: raw.lastOrderDate || "",
    totalSpent: Number(raw.totalSpent) || 0,
    orderCount: Number(raw.orderCount) || 0,
    cartValue: Number(raw.cartValue) || 0,
    birthday: raw.birthday || "",
    preferredChannel: raw.preferredChannel || "WhatsApp",
    consent: raw.consent === true || String(raw.consent).toLowerCase() === "true",
  };
}

function parseCsv(text) {
  const lines = text
    .trim()
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]).map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });
    return normalizeCustomer(row);
  });
}

function splitCsvLine(line) {
  const values = [];
  let current = "";
  let quoted = false;

  for (const char of line) {
    if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

function csvFromCustomers() {
  const headers = [
    "name",
    "email",
    "phone",
    "lastOrderDate",
    "totalSpent",
    "orderCount",
    "cartValue",
    "birthday",
    "preferredChannel",
    "consent",
  ];

  return [
    headers.join(","),
    ...customers.map((customer) =>
      headers
        .map((header) => {
          const value = String(customer[header] ?? "");
          return value.includes(",") ? `"${value}"` : value;
        })
        .join(","),
    ),
  ].join("\n");
}

function bestChannelFor(list, fallback = "WhatsApp") {
  const counts = list.reduce((acc, customer) => {
    if (!customer.consent) return acc;
    acc[customer.preferredChannel] = (acc[customer.preferredChannel] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || fallback;
}

function buildSegmentData() {
  if (!customers.length) {
    segmentData = { ...fallbackSegments };
    return;
  }

  const consenting = customers.filter((customer) => customer.consent);
  const sleeping = consenting.filter(
    (customer) => daysSince(customer.lastOrderDate) >= 60 && customer.totalSpent >= 10000,
  );
  const cart = consenting.filter((customer) => customer.cartValue >= 1000);
  const birthday = consenting.filter((customer) => isBirthdaySoon(customer.birthday));
  const vip = consenting.filter(
    (customer) => customer.totalSpent >= 50000 || (customer.orderCount >= 10 && daysSince(customer.lastOrderDate) >= 45),
  );

  segmentData = {
    sleeping: makeSegment({
      key: "sleeping",
      title: "Sleeping loyalists",
      customers: sleeping,
      fallback: fallbackSegments.sleeping,
      campaign: "Loyalty Wake-Up",
      action: "Send loyalty win-back offer",
      message:
        "We saved your loyalty perks. Come back this week and get 15% off your next order.",
    }),
    cart: makeSegment({
      key: "cart",
      title: "Cart abandoners",
      customers: cart,
      fallback: fallbackSegments.cart,
      campaign: "Cart Rescue",
      action: "Send saved-cart reminder",
      message:
        "Your picks are still waiting. Complete your order today and unlock free delivery.",
    }),
    birthday: makeSegment({
      key: "birthday",
      title: "Birthday window",
      customers: birthday,
      fallback: fallbackSegments.birthday,
      campaign: "Birthday Spark",
      action: "Send birthday reward journey",
      message:
        "Your birthday reward is ready. Celebrate with a special offer picked for you.",
    }),
    vip: makeSegment({
      key: "vip",
      title: "VIP churn watch",
      customers: vip,
      fallback: fallbackSegments.vip,
      campaign: "VIP Save Desk",
      action: "Send VIP concierge offer",
      message:
        "We noticed you have been away. Your private preview and premium reward are ready.",
    }),
  };
}

function makeSegment({ title, customers: list, fallback, campaign, action, message }) {
  const audienceCount = list.length;
  const predictedRevenue = list.reduce((sum, customer) => {
    const base = customer.cartValue || Math.max(customer.totalSpent / Math.max(customer.orderCount, 1), 800);
    return sum + base * 0.42;
  }, 0);
  const channel = bestChannelFor(list, fallback.channel);
  const conversion = Math.min(18, Math.max(4.2, 6 + audienceCount * 0.45));
  const opens = channel.includes("WhatsApp") ? 68 : channel.includes("Email") ? 52 : 46;

  return {
    title,
    channel,
    customers: list,
    audienceCount,
    audience: `${audienceCount} customers`,
    value: `${rupees(predictedRevenue)} predicted recovery`,
    reason: audienceCount
      ? `${audienceCount} consenting customers match this pattern. ${channel} has the strongest reachable audience based on their saved channel preference.`
      : "No consenting customers currently match this segment. Add or import customer data to activate it.",
    action,
    urgency: audienceCount ? "Launch in the selected send window" : "Needs matching customer data",
    campaign,
    message,
    opens: `${opens}%`,
    conversions: `${conversion.toFixed(1)}%`,
    cost: rupees(Math.max(500, audienceCount * 55)),
  };
}

function updateSignals() {
  const uniqueFlagged = new Set(
    Object.values(segmentData).flatMap((segment) => segment.customers.map((customer) => customer.id)),
  );
  const flagged = customers.length ? uniqueFlagged.size : 0;
  const recovery = Object.values(segmentData).reduce((sum, segment) => {
    const value = segment.customers.reduce((inner, customer) => inner + (customer.cartValue || customer.totalSpent * 0.08), 0);
    return sum + value;
  }, 0);

  document.querySelector("#flaggedCount").textContent = String(flagged);
  document.querySelector("#totalRecovery").textContent = customers.length ? rupees(recovery) : "Rs. 8.4L";
  document.querySelector("#bestChannel").textContent = customers.length ? bestChannelFor(customers) : "WhatsApp";
  document.querySelector("#predictedLift").textContent = customers.length ? `${Math.min(31, 12 + flagged * 1.4).toFixed(1)}%` : "18.7%";
}

function renderCustomerTable() {
  document.querySelector("#customerSummary").textContent = `${customers.length} customers loaded`;
  document.querySelector("#dataHealth").textContent = customers.length ? "Data active" : "Awaiting data";

  const table = document.querySelector("#customerTable");
  if (!customers.length) {
    table.innerHTML = '<div class="empty-state">Import CSV, load sample data, or add a customer manually.</div>';
    return;
  }

  table.innerHTML = `
    <div class="customer-head">
      <span>Name</span>
      <span>Last order</span>
      <span>Spent</span>
      <span>Cart</span>
      <span>Channel</span>
      <span>Consent</span>
    </div>
    ${customers
      .slice(0, 10)
      .map(
        (customer) => `
          <div class="customer-row">
            <strong>${customer.name}</strong>
            <span>${customer.lastOrderDate || "Missing"}</span>
            <span>${rupees(customer.totalSpent)}</span>
            <span>${rupees(customer.cartValue)}</span>
            <span>${customer.preferredChannel}</span>
            <span class="state-pill">${customer.consent ? "Yes" : "No"}</span>
          </div>
        `,
      )
      .join("")}
  `;
}

function activeSegmentKey() {
  return document.querySelector(".customer-card.active").dataset.segment;
}

function matchesAudienceSearch(card) {
  const query = document.querySelector("#audienceSearch").value.trim().toLowerCase();
  return !query || card.textContent.toLowerCase().includes(query);
}

function updatePulse(title, text) {
  const toast = document.querySelector("#toast");
  toast.textContent = `${title}. ${text}`;
}

function renderSegment(segmentKey) {
  const data = segmentData[segmentKey];
  fields.title.textContent = data.title;
  fields.reason.textContent = data.reason;
  fields.audience.textContent = data.audience;
  fields.value.textContent = data.value;
  fields.action.textContent = data.action;
  fields.urgency.textContent = data.urgency;
  fields.campaign.textContent = data.campaign;
  fields.message.textContent = data.message;
  fields.opens.textContent = data.opens;
  fields.conversions.textContent = data.conversions;
  fields.cost.textContent = data.cost;
  fields.draftStatus.textContent = data.audienceCount ? "Ready for approval" : "Needs data";
  document.querySelector("#launchCampaign").disabled = customers.length > 0 && data.audienceCount === 0;
  renderAIReasoning(data);

  document.querySelectorAll(".customer-card").forEach((card) => {
    const segment = segmentData[card.dataset.segment];
    card.querySelector("small").textContent = customers.length
      ? `${segment.audienceCount} matched · ${segment.channel}`
      : card.querySelector("small").textContent;
    card.hidden = !matchesAudienceSearch(card);
    card.classList.toggle("active", card.dataset.segment === segmentKey);
  });

}

function renderAIReasoning(data) {
  const recovery = data.value.replace(" predicted recovery", "");
  const conversions = Math.max(1, Math.round(data.audienceCount * (Number.parseFloat(data.conversions) / 100)));
  const lift = customers.length ? Math.min(31, 18 + Math.round(data.audienceCount / 20)) : 31;
  const confidence = customers.length
    ? Math.min(94, Math.max(72, 87 + Math.round((data.audienceCount - 248) / 100)))
    : 87;
  const channel = data.channel.split(" + ")[0].replace(" first", "");

  fields.compactAudienceTitle.textContent = data.title;
  fields.compactAudience.textContent = data.title;
  fields.compactChannel.textContent = channel;
  fields.compactRecovery.textContent = customers.length ? recovery : "Rs. 5.9L";
  fields.modalAudienceCount.textContent = data.audience;
  fields.modalChannel.textContent = channel;
  fields.forecastRecovery.textContent = customers.length ? recovery : "Rs. 5.9L";
  fields.forecastConversions.textContent = `${customers.length ? conversions : 31} customers`;
  fields.forecastLift.textContent = `${lift}%`;
  fields.forecastAudienceSize.textContent = data.audience;
  fields.forecastConfidence.textContent = `${confidence}%`;
  fields.confidenceValue.textContent = `${confidence}%`;
  fields.confidenceFill.style.setProperty("--confidence", `${confidence}%`);
  fields.reasoningSummary.textContent = `Launch ${articleFor(channel)} ${channel} loyalty win-back campaign during today's 6:00 PM send window. This audience has high recovery potential and strong channel reach.`;
  document.querySelectorAll("[data-channel-chip]").forEach((chip) => {
    chip.classList.toggle("selected", chip.dataset.channelChip === channel);
  });
}

function articleFor(value) {
  return /^[aeiou]/i.test(value) ? "an" : "a";
}

function recalculate() {
  buildSegmentData();
  updateSignals();
  renderCustomerTable();
  renderSegment(activeSegmentKey());
}

function formatBudget(value) {
  return `Rs. ${Math.round(Number(value) / 1000)}K`;
}

function campaignState(campaign) {
  if (campaign.progress >= 100) return "Completed";
  if (campaign.progress >= 58) return "Optimizing";
  if (campaign.progress >= 25) return "Sending";
  return "Queued";
}

function renderCampaignTable() {
  const table = document.querySelector("#campaignTable");
  if (!campaigns.length) {
    table.innerHTML =
      '<div class="empty-state">No campaigns launched yet. Approve one from the campaign draft.</div>';
    return;
  }

  const rows = campaigns
    .map((campaign) => {
      const state = campaignState(campaign);
      return `
        <div class="campaign-row">
          <strong>${campaign.name}</strong>
          <span>${campaign.segment}</span>
          <span>${campaign.channel}</span>
          <span class="state-pill">${state}</span>
          <div>
            <div class="mini-progress" aria-label="${campaign.progress}% delivery progress">
              <span style="--progress: ${campaign.progress}%"></span>
            </div>
            <small>${campaign.delivered} delivered - ${campaign.conversions} conversions</small>
          </div>
        </div>
      `;
    })
    .join("");

  table.innerHTML = `
    <div class="campaign-head">
      <span>Campaign</span>
      <span>Audience</span>
      <span>Channel</span>
      <span>Status</span>
      <span>Progress</span>
    </div>
    ${rows}
  `;
}

function renderLifecycle(changedIds = [], changedMetric = "") {
  const metricHost = document.querySelector("#lifecycleMetrics");
  const table = document.querySelector("#lifecycleTable");
  const metricOrder = ["Sent", "Delivered", "Opened", "Read", "Clicked", "Purchased"];

  metricHost.innerHTML = metricOrder
    .map(
      (metric) => `
        <article class="lifecycle-kpi ${metric === changedMetric ? "changed" : ""}">
          <span>${metric}</span>
          <strong>${lifecycleMetrics[metric]}</strong>
        </article>
      `,
    )
    .join("");

  table.innerHTML = `
    <div class="lifecycle-head">
      <span>Customer</span>
      <span>Channel</span>
      <span>Campaign</span>
      <span>Status</span>
      <span>Timestamp</span>
    </div>
    ${lifecycleEvents
      .map(
        (event) => `
          <div class="lifecycle-row ${changedIds.includes(event.id) ? "changed" : ""}">
            <strong>${event.customer}</strong>
            <span>${event.channel}</span>
            <span>${event.campaign}</span>
            <span class="status-badge ${statusClass(event.status)}">${event.status}</span>
            <span>${event.timestamp}</span>
          </div>
        `,
      )
      .join("")}
  `;

  window.setTimeout(() => {
    document.querySelectorAll(".lifecycle-kpi.changed, .lifecycle-row.changed").forEach((node) => {
      node.classList.remove("changed");
    });
  }, 650);
}

function statusClass(status) {
  return `status-${status.toLowerCase()}`;
}

function nowLabel() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function simulateLifecycle(targetStatus) {
  const progression = {
    Delivered: ["Sent", "Failed"],
    Opened: ["Sent", "Delivered"],
    Clicked: ["Delivered", "Opened", "Read"],
    Purchased: ["Opened", "Read", "Clicked"],
  };
  const candidates = lifecycleEvents.filter((event) =>
    progression[targetStatus].includes(event.status),
  );
  const pool = candidates.length ? candidates : lifecycleEvents;
  const updateCount = Math.max(1, Math.ceil(pool.length * 0.4));
  const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, updateCount);
  const changedIds = shuffled.map((event) => event.id);

  lifecycleEvents = lifecycleEvents.map((event) =>
    changedIds.includes(event.id)
      ? { ...event, status: targetStatus, timestamp: `Today ${nowLabel()}` }
      : event,
  );

  lifecycleMetrics[targetStatus] += changedIds.length;
  if (targetStatus === "Delivered") lifecycleMetrics.Sent += Math.ceil(changedIds.length / 2);
  if (targetStatus === "Opened") lifecycleMetrics.Read += Math.max(1, changedIds.length - 1);
  if (targetStatus === "Purchased") lifecycleMetrics.Clicked += Math.max(1, changedIds.length);

  renderLifecycle(changedIds, targetStatus);
  updatePulse("Lifecycle updated", `${changedIds.length} communication events moved to ${targetStatus}.`);
}

function tickCampaigns() {
  if (!campaigns.length) return;
  tickCampaignsLocally();
  renderCampaignTable();
}

function launchCampaign() {
  const data = segmentData[activeSegmentKey()];
  if (customers.length > 0 && data.audienceCount === 0) {
    updatePulse("No audience found", "This segment has no consenting matching customers yet.");
    return;
  }

  const route = document.querySelector("#routeSelect").value;
  const sendWindow = document.querySelector("#windowSelect").value;
  const budget = formatBudget(document.querySelector("#budgetRange").value);
  const channel = route === "AI recommended" ? data.channel : route;
  const audienceCount = data.audienceCount;

  fields.draftStatus.textContent = "Queued";
  updatePulse("Campaign launched", `${data.campaign} is scheduled for ${sendWindow} with ${budget} cap.`);

  const launchButton = document.querySelector("#launchCampaign");
  launchButton.disabled = true;
  launchButton.textContent = "Launching...";

  window.setTimeout(() => {
    const result = launchCampaignLocally({
      name: data.campaign,
      segment: data.title,
      channel,
      message: data.message,
      sendWindow,
      budget,
      audienceIds: data.customers.map((customer) => customer.id),
      conversionRate: Number.parseFloat(data.conversions) / 100,
    });

    renderCampaignTable();
    launchButton.disabled = false;
    launchButton.textContent = "Launch";
    fields.draftStatus.textContent = "Live monitoring";

    const toast = document.querySelector("#toast");
    toast.textContent = `${data.campaign} launched to ${audienceCount} customers through ${channel}. ${result.sendResult.message}`;
    toast.classList.add("visible");
    window.setTimeout(() => toast.classList.remove("visible"), 4200);
  }, 350);
}

document.querySelectorAll(".customer-card").forEach((card) => {
  card.addEventListener("click", () => renderSegment(card.dataset.segment));
});

document.querySelector("#rerunAgent").addEventListener("click", () => {
  const keys = Object.keys(segmentData);
  const nextIndex = (keys.indexOf(activeSegmentKey()) + 1) % keys.length;
  renderSegment(keys[nextIndex]);
});

document.querySelector("#loadSampleData").addEventListener("click", () => {
  document.querySelector("#csvInput").value = sampleCsv;
});

document.querySelector("#importCsv").addEventListener("click", () => {
  importCsv();
});

function importCsv() {
  const imported = parseCsv(document.querySelector("#csvInput").value);
  customers = imported;
  saveCustomers();
  recalculate();
  updatePulse("Customer data imported", `${customers.length} customers are now powering the agent.`);
}

document.querySelector("#exportCsv").addEventListener("click", async () => {
  const csv = csvFromCustomers();
  document.querySelector("#csvInput").value = csv;
  try {
    await navigator.clipboard.writeText(csv);
    updatePulse("CSV copied", "The current customer table was copied to your clipboard.");
  } catch {
    updatePulse("CSV ready", "The current customer table is in the import box.");
  }
});

document.querySelector("#clearCustomers").addEventListener("click", () => {
  clearCustomers();
});

function clearCustomers() {
  customers = [];
  saveCustomers();
  recalculate();
  updatePulse("Customer data cleared", "The agent is back to demo mode until you import real data.");
}

document.querySelector("#customerForm").addEventListener("submit", (event) => {
  addCustomer(event);
});

function addCustomer(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const customer = normalizeCustomer(Object.fromEntries(formData.entries()));
  customer.consent = formData.get("consent") === "on";
  customers.unshift(customer);
  saveCustomers();
  event.currentTarget.reset();
  recalculate();
  updatePulse("Customer added", `${customer.name} is now included in segment scoring.`);
}

document.querySelector("#launchCampaign").addEventListener("click", launchCampaign);

document.querySelector("#budgetRange").addEventListener("input", (event) => {
  fields.budget.textContent = formatBudget(event.target.value);
});

document.querySelector("#audienceSearch").addEventListener("input", () => {
  const visibleCards = Array.from(document.querySelectorAll(".customer-card")).filter((card) => {
    const match = matchesAudienceSearch(card);
    card.hidden = !match;
    return match;
  });
  if (visibleCards.length && document.querySelector(".customer-card.active")?.hidden) {
    renderSegment(visibleCards[0].dataset.segment);
  }
});

document.querySelector("#goalSelect").addEventListener("change", (event) => {
  updatePulse("Goal updated", `The agent is optimizing for ${event.target.value.toLowerCase()}.`);
});

document.querySelector("#routeSelect").addEventListener("change", (event) => {
  updatePulse("Route override saved", `${event.target.value} will be used for the next launch.`);
});

document.querySelector("#windowSelect").addEventListener("change", (event) => {
  updatePulse("Send window locked", `Next campaign will send at ${event.target.value}.`);
});

document.querySelector("#clearCampaigns").addEventListener("click", () => {
  clearCampaigns();
});

function clearCampaigns() {
  campaigns = [];
  saveCampaigns();
  renderCampaignTable();
  updatePulse("Queue cleared", "The campaign operations table is ready for a fresh run.");
}

document.querySelectorAll("[data-simulate-status]").forEach((button) => {
  button.addEventListener("click", () => simulateLifecycle(button.dataset.simulateStatus));
});

function openModal(modalId) {
  const backdrop = document.querySelector("#modalBackdrop");
  const modal = document.querySelector(`#${modalId}`);
  backdrop.hidden = false;
  modal.hidden = false;
  requestAnimationFrame(() => {
    backdrop.classList.add("open");
    modal.classList.add("open");
  });
}

function closeModals() {
  const backdrop = document.querySelector("#modalBackdrop");
  const modals = document.querySelectorAll(".modal-panel");
  backdrop.classList.remove("open");
  modals.forEach((modal) => modal.classList.remove("open"));
  window.setTimeout(() => {
    backdrop.hidden = true;
    modals.forEach((modal) => {
      modal.hidden = true;
    });
  }, 220);
}

document.querySelector("#viewReasoning").addEventListener("click", () => openModal("reasoningModal"));
document.querySelector("#viewForecast").addEventListener("click", () => openModal("forecastModal"));
document.querySelector("#modalBackdrop").addEventListener("click", closeModals);
document.addEventListener("click", (event) => {
  const openModal = document.querySelector(".modal-panel.open");
  if (!openModal) return;
  const clickedInsideModal = event.target.closest?.(".modal-panel");
  const clickedModalButton = event.target.closest?.("#viewReasoning, #viewForecast");
  if (!clickedInsideModal && !clickedModalButton) closeModals();
});
document.querySelectorAll("[data-close-modal]").forEach((button) => {
  button.addEventListener("click", closeModals);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeModals();
});

async function initializeApp() {
  const hasStoredCustomers = localStorage.getItem(customerStorageKey) !== null;
  const hasStoredCampaigns = localStorage.getItem(campaignStorageKey) !== null;

  if (hasStoredCustomers) {
    customers = readJson(customerStorageKey, []);
  } else {
    customers = parseCsv(sampleCsv);
    saveCustomers();
  }

  if (hasStoredCampaigns) {
    campaigns = readJson(campaignStorageKey, []);
  } else {
    campaigns = [];
    saveCampaigns();
  }

  updatePulse(
    "Connecting to RecallIQ API",
    `${customers.length} customers loaded locally while the backend is checked.`,
  );

  recalculate();
  renderCampaignTable();
  renderLifecycle();

  await syncFromApi();
  recalculate();
  renderCampaignTable();
  updatePulse(
    "RecallIQ ready",
    `${customers.length} customers and ${campaigns.length} campaigns are synchronized with the backend when available.`,
  );
  window.setInterval(tickCampaigns, 4500);
}

initializeApp();
