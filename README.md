# RecallIQ — AI Customer Re-Engagement Platform

RecallIQ is a customer-retention platform that combines customer segmentation, churn-risk scoring, explainable recommendations, campaign planning, and analytics in one workflow.

> **Portfolio note:** the included live prediction service uses a deterministic behavioral demo model so the app runs without a private dataset. A separate reproducible ML training/evaluation pipeline is included for the IBM Telco Customer Churn sample dataset. Do not claim production model performance until you run the evaluation pipeline on an appropriate dataset.

## What RecallIQ does

1. Imports/manages customer records.
2. Segments customers using lifecycle and value signals.
3. Sends behavioral features to a Python ML service.
4. Returns a churn probability and risk level.
5. Explains the main risk signals.
6. Recommends a re-engagement action, channel, and offer.
7. Saves an AI-generated campaign draft through the backend.
8. Tracks campaign and customer analytics.

## Architecture

```text
┌───────────────────────┐
│  RecallIQ Frontend    │
│  HTML / CSS / JS      │
└───────────┬───────────┘
            │ REST
┌───────────▼───────────┐
│ Node.js + Express API │
│ Customers / Campaigns │
│ Analytics / AI Proxy  │
└───────┬────────┬──────┘
        │        │
        │        └─────────────────┐
        │                          │
┌───────▼──────────┐       ┌───────▼──────────┐
│ JSON / MongoDB   │       │ Python FastAPI   │
│ Persistence      │       │ ML Risk Service  │
└──────────────────┘       └──────────────────┘
```

## Tech stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express
- **Database:** local JSON fallback / MongoDB Atlas
- **ML API:** Python, FastAPI, scikit-learn
- **Model:** Logistic Regression
- **Deployment-ready:** Vercel/Netlify frontend + Render/Railway backend and ML service

## Run locally

### 1. Start the ML service

Windows:

```bash
cd ml-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

Check:

```text
http://127.0.0.1:8000/health
```

### 2. Start the backend

Open a second terminal:

```bash
cd backend
npm install
npm start
```

The API runs at:

```text
http://localhost:4000
```

Check:

```text
http://localhost:4000/api/health
```

### 3. Start the frontend

From the project root:

```bash
npm start
```

Open the URL printed by the static server.

## Optional MongoDB

The backend works without MongoDB by storing data in `backend/data/*.json`.

For MongoDB Atlas:

1. Copy `backend/.env.example` to `backend/.env`.
2. Set `MONGODB_URI`.
3. Restart the backend.

## ML evaluation

The `ml-service/train.py` script trains and evaluates a Logistic Regression model using the public IBM Telco Customer Churn sample dataset.

Expected CSV:

```text
ml-service/data/WA_Fn-UseC_-Telco-Customer-Churn.csv
```

Run:

```bash
cd ml-service
python train.py --data data/WA_Fn-UseC_-Telco-Customer-Churn.csv
```

It produces:

```text
model_artifacts/
├── churn_model.joblib
└── metrics.json
```

Metrics include:

- Accuracy
- Precision
- Recall
- F1
- ROC-AUC
- Confusion matrix

The raw dataset is intentionally not committed to this repository.

## Important modeling limitation

The IBM Telco sample is a cross-sectional sample dataset. It is useful for demonstrating a reproducible churn-classification workflow, but it is not a sequence of monthly customer snapshots. Therefore, the evaluation should not be described as proof of future-month forecasting or causal impact of retention campaigns.

The current dashboard's six-feature behavioral model is a local demo model. To publish a performance number for the actual RecallIQ scoring workflow, train and evaluate a model using the same six-feature schema on an appropriate, licensed dataset.

## API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Backend health |
| GET | `/api/customers` | List customers |
| POST | `/api/customers` | Add customer |
| PUT | `/api/customers` | Replace customer collection |
| DELETE | `/api/customers` | Clear customers |
| GET | `/api/campaigns` | List campaigns |
| POST | `/api/campaigns` | Create campaign |
| DELETE | `/api/campaigns` | Clear campaigns |
| GET | `/api/analytics` | Dashboard analytics |
| POST | `/api/risk/predict` | ML risk prediction |
| POST | `/api/ai/campaign-draft` | Save AI campaign draft |

## Project structure

```text
RecallIQ/
├── index.html
├── script.js
├── styles.css
├── ai-integration.js
├── package.json
├── backend/
│   ├── src/
│   │   ├── server.js
│   │   └── store.js
│   ├── data/
│   ├── package.json
│   └── .env.example
├── ml-service/
│   ├── app.py
│   ├── train.py
│   ├── requirements.txt
│   ├── EVALUATION.md
│   ├── RUN.md
│   └── model_artifacts/
└── README.md
```

## Resume-ready description

**RecallIQ — AI Customer Re-Engagement Platform**

Built a full-stack customer-retention platform using JavaScript, Node.js/Express, MongoDB-ready persistence, Python/FastAPI and scikit-learn to score customer churn risk, explain risk signals, recommend re-engagement actions, and create campaign drafts through REST APIs.

## Data source

The ML evaluation workflow uses the IBM Telco Customer Churn sample dataset. The raw dataset is not included in this repository; download it separately and review the source terms before reuse.
