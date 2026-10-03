from pathlib import Path
import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel, Field
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

BASE = Path(__file__).resolve().parent
MODEL_PATH = BASE / "model_artifacts" / "behavioral_demo_model.joblib"

app = FastAPI(title="RecallIQ ML Service", version="2.0.0")

FEATURES = [
    "days_since_last_order",
    "order_count",
    "total_spent",
    "engagement_score",
    "support_tickets",
    "cart_value",
]

class CustomerFeatures(BaseModel):
    days_since_last_order: float = Field(ge=0)
    order_count: float = Field(ge=0)
    total_spent: float = Field(ge=0)
    engagement_score: float = Field(ge=0, le=100)
    support_tickets: float = Field(ge=0)
    cart_value: float = Field(ge=0)

def build_demo_model():
    """Deterministic fallback model for local development."""
    rng = np.random.default_rng(42)
    n = 2400
    days = rng.integers(0, 181, n)
    orders = rng.integers(0, 16, n)
    spend = np.clip(rng.gamma(2.2, 550, n), 0, 10000)
    engagement = rng.integers(5, 101, n)
    tickets = rng.poisson(1.5, n)
    cart = np.clip(rng.gamma(1.5, 120, n), 0, 1500)

    signal = (
        0.045 * days
        - 0.11 * orders
        - 0.00008 * spend
        - 0.035 * engagement
        + 0.18 * tickets
        - 0.00015 * cart
    )
    p = 1 / (1 + np.exp(-(signal - np.median(signal))))
    y = (rng.random(n) < p).astype(int)
    X = np.column_stack([days, orders, spend, engagement, tickets, cart])

    model = Pipeline([
        ("scale", StandardScaler()),
        ("classifier", LogisticRegression(max_iter=1000, random_state=42)),
    ])
    model.fit(X, y)
    return model

MODEL = build_demo_model()

def explain(f: CustomerFeatures):
    reasons = []
    if f.days_since_last_order >= 60:
        reasons.append("Long time since last order")
    elif f.days_since_last_order >= 30:
        reasons.append("Purchase recency is declining")
    if f.engagement_score < 35:
        reasons.append("Low recent engagement")
    elif f.engagement_score < 55:
        reasons.append("Moderate engagement")
    if f.order_count <= 2:
        reasons.append("Limited purchase history")
    if f.support_tickets >= 3:
        reasons.append("Higher support-ticket activity")
    if f.cart_value > 300:
        reasons.append("Active cart value indicates purchase intent")
    return reasons or ["No major risk signal detected"]

def recommendation(probability, f: CustomerFeatures):
    if probability >= 0.70:
        action, channel, offer = (
            "Win-back campaign",
            "Email + WhatsApp",
            "10–15% personalized loyalty offer",
        )
    elif probability >= 0.40:
        action, channel, offer = (
            "Engagement campaign",
            "Email",
            "Personalized product/content recommendation",
        )
    else:
        action, channel, offer = (
            "Nurture campaign",
            "Email",
            "Relevant content or loyalty reminder",
        )
    if f.cart_value > 300 and probability >= 0.40:
        action, channel = "Cart recovery campaign", "Email + WhatsApp"
    return action, channel, offer

@app.get("/health")
def health():
    return {
        "status": "ok",
        "model": "behavioral-demo-logistic-regression",
        "evaluated_model_available": (BASE / "model_artifacts" / "metrics.json").exists()
        and (BASE / "model_artifacts" / "churn_model.joblib").exists(),
    }

@app.post("/predict")
def predict(f: CustomerFeatures):
    X = np.array([[getattr(f, name) for name in FEATURES]])
    probability = float(MODEL.predict_proba(X)[0][1])
    action, channel, offer = recommendation(probability, f)
    risk = "HIGH" if probability >= 0.70 else ("MEDIUM" if probability >= 0.40 else "LOW")

    return {
        "churn_probability": round(probability, 4),
        "churn_percentage": round(probability * 100, 1),
        "risk": risk,
        "reasons": explain(f),
        "recommended_action": action,
        "recommended_channel": channel,
        "recommended_offer": offer,
        "model_note": "Local behavioral demo model. Train/evaluate the production model with ml-service/train.py before publishing performance claims.",
    }
