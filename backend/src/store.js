import fs from "node:fs/promises";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../data");
const customersFile = path.join(dataDir, "customers.json");
const campaignsFile = path.join(dataDir, "campaigns.json");

const customerSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  lastOrderDate: String,
  totalSpent: Number,
  orderCount: Number,
  cartValue: Number,
  birthday: String,
  preferredChannel: String,
  consent: Boolean,
}, { timestamps: true });

const campaignSchema = new mongoose.Schema({
  name: String,
  segment: String,
  channel: String,
  message: String,
  sendWindow: String,
  budget: String,
  audienceCount: Number,
  audienceIds: [String],
  conversionRate: Number,
  progress: Number,
  delivered: Number,
  conversions: Number,
  senderMode: String,
  providerStatus: String,
}, { timestamps: true });

let Customer;
let Campaign;
let mongoEnabled = false;

async function ensureFiles() {
  await fs.mkdir(dataDir, { recursive: true });
  for (const file of [customersFile, campaignsFile]) {
    try { await fs.access(file); } catch { await fs.writeFile(file, "[]"); }
  }
}

async function readFile(file) {
  await ensureFiles();
  return JSON.parse(await fs.readFile(file, "utf8"));
}

async function writeFile(file, data) {
  await ensureFiles();
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

export async function initStore() {
  if (process.env.MONGODB_URI) {
    await mongoose.connect(process.env.MONGODB_URI);
    Customer = mongoose.model("Customer", customerSchema);
    Campaign = mongoose.model("Campaign", campaignSchema);
    mongoEnabled = true;
    return "mongodb";
  }
  await ensureFiles();
  return "json";
}

export function storageMode() { return mongoEnabled ? "mongodb" : "json"; }

export async function listCustomers() {
  if (mongoEnabled) return (await Customer.find().sort({ createdAt: -1 }).lean()).map(({ _id, ...customer }) => ({ ...customer, id: String(_id) }));
  return readFile(customersFile);
}

export async function replaceCustomers(customers) {
  if (mongoEnabled) {
    await Customer.deleteMany({});
    if (customers.length) await Customer.insertMany(customers);
    return listCustomers();
  }
  await writeFile(customersFile, customers);
  return customers;
}

export async function addCustomer(customer) {
  if (mongoEnabled) return Customer.create(customer);
  const customers = await listCustomers();
  const saved = { ...customer, id: customer.id || crypto.randomUUID() };
  customers.unshift(saved);
  await writeFile(customersFile, customers);
  return saved;
}

export async function clearCustomers() {
  if (mongoEnabled) { await Customer.deleteMany({}); return []; }
  await writeFile(customersFile, []);
  return [];
}

export async function listCampaigns() {
  if (mongoEnabled) return (await Campaign.find().sort({ createdAt: -1 }).limit(100).lean()).map(({ _id, ...campaign }) => ({ ...campaign, id: String(_id) }));
  return readFile(campaignsFile);
}

export async function addCampaign(campaign) {
  if (mongoEnabled) return Campaign.create(campaign);
  const campaigns = await listCampaigns();
  const saved = { ...campaign, id: campaign.id || crypto.randomUUID(), createdAt: new Date().toISOString() };
  campaigns.unshift(saved);
  await writeFile(campaignsFile, campaigns.slice(0, 100));
  return saved;
}

export async function clearCampaigns() {
  if (mongoEnabled) { await Campaign.deleteMany({}); return []; }
  await writeFile(campaignsFile, []);
  return [];
}
