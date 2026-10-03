const RECALLIQ_API = window.RECALLIQ_API || "http://localhost:4000/api";

function customerToFeatures(customer) {
  const lastOrder = customer.lastOrderDate ? new Date(customer.lastOrderDate) : null;
  const daysSinceLastOrder = Number(
    customer.daysSinceLastOrder ??
    customer.days_since_last_order ??
    customer.recencyDays ??
    (lastOrder && !Number.isNaN(lastOrder.getTime())
      ? Math.max(0, Math.floor((Date.now() - lastOrder.getTime()) / 86400000))
      : 0)
  );

  return {
    days_since_last_order: daysSinceLastOrder,
    order_count: Number(customer.orderCount ?? customer.order_count ?? customer.orders ?? 0),
    total_spent: Number(customer.totalSpent ?? customer.total_spent ?? customer.spent ?? customer.lifetimeValue ?? 0),
    engagement_score: Number(customer.engagementScore ?? customer.engagement_score ?? customer.engagement ?? 50),
    support_tickets: Number(customer.supportTickets ?? customer.support_tickets ?? customer.tickets ?? 0),
    cart_value: Number(customer.cartValue ?? customer.cart_value ?? customer.cartTotal ?? 0),
  };
}

async function predictCustomerRisk(customer) {
  const response = await fetch(`${RECALLIQ_API}/risk/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customerId: customer.id ?? customer._id,
      features: customerToFeatures(customer),
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.error || `Risk prediction failed (${response.status})`);
  }
  return response.json();
}

async function saveAICampaignDraft(draft) {
  const response = await fetch(`${RECALLIQ_API}/ai/campaign-draft`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(draft),
  });
  if (!response.ok) throw new Error("Could not save campaign draft");
  return response.json();
}

window.RecallIQAI = {
  predictCustomerRisk,
  saveAICampaignDraft,
  customerToFeatures,
  refreshCustomerSelector: () => window.dispatchEvent(new Event("recalliq:customers-updated")),
};
