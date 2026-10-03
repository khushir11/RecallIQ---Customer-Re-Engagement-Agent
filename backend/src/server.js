import "dotenv/config";
import express from "express";
import cors from "cors";
import {
  addCampaign,
  addCustomer,
  clearCampaigns,
  clearCustomers,
  initStore,
  listCampaigns,
  listCustomers,
  replaceCustomers,
  storageMode,
} from "./store.js";

const app = express();
const PORT = Number(process.env.PORT || 4000);
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) =>
  res.json({
    ok: true,
    service: "recalliq-backend",
    storage: storageMode(),
    mlService: ML_SERVICE_URL,
  })
);

app.get("/api/customers", async (_req, res, next) => {
  try { res.json(await listCustomers()); } catch (error) { next(error); }
});

app.post("/api/customers", async (req, res, next) => {
  try { res.status(201).json(await addCustomer(req.body)); } catch (error) { next(error); }
});

app.put("/api/customers", async (req, res, next) => {
  try {
    res.json(await replaceCustomers(Array.isArray(req.body) ? req.body : []));
  } catch (error) { next(error); }
});

app.delete("/api/customers", async (_req, res, next) => {
  try { res.json(await clearCustomers()); } catch (error) { next(error); }
});

app.get("/api/campaigns", async (_req, res, next) => {
  try { res.json(await listCampaigns()); } catch (error) { next(error); }
});

app.post("/api/campaigns", async (req, res, next) => {
  try { res.status(201).json(await addCampaign(req.body)); } catch (error) { next(error); }
});

app.delete("/api/campaigns", async (_req, res, next) => {
  try { res.json(await clearCampaigns()); } catch (error) { next(error); }
});

app.get("/api/analytics", async (_req, res, next) => {
  try {
    const [customers, campaigns] = await Promise.all([listCustomers(), listCampaigns()]);
    const consenting = customers.filter((c) => c.consent).length;
    const highValue = customers.filter((c) => Number(c.totalSpent) >= 50000).length;
    const totalSpent = customers.reduce((sum, c) => sum + Number(c.totalSpent || 0), 0);
    const conversions = campaigns.reduce((sum, c) => sum + Number(c.conversions || 0), 0);
    res.json({
      customers: customers.length,
      consenting,
      highValue,
      totalSpent,
      campaigns: campaigns.length,
      conversions,
    });
  } catch (error) { next(error); }
});

app.post("/api/risk/predict", async (req, res) => {
  try {
    const { customerId, features } = req.body || {};
    if (!features) return res.status(400).json({ error: "features are required" });

    const response = await fetch(`${ML_SERVICE_URL}/predict`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(features),
    });

    const payload = await response.json();
    if (!response.ok) return res.status(response.status).json(payload);
    res.json({ customerId, prediction: payload });
  } catch (error) {
    res.status(503).json({
      error: "ML service unavailable",
      detail: error.message,
      hint: "Start the FastAPI service on port 8000.",
    });
  }
});

app.post("/api/ai/campaign-draft", async (req, res, next) => {
  try {
    res.status(201).json(await addCampaign({
      ...req.body,
      status: "draft",
      source: "AI recommendation",
    }));
  } catch (error) { next(error); }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: "Internal server error", detail: error.message });
});

initStore()
  .then((mode) => {
    app.listen(PORT, () => {
      console.log(`RecallIQ API running at http://localhost:${PORT} (${mode} storage)`);
      console.log(`ML service configured at ${ML_SERVICE_URL}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize storage", error);
    process.exit(1);
  });
