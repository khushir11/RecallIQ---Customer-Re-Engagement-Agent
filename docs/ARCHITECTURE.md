# RecallIQ Architecture

## Request flow

1. The browser loads the dashboard.
2. Customer data is read from the backend when available, with the existing browser experience retained for the static UI.
3. Selecting a customer calls `POST /api/risk/predict`.
4. Express forwards the behavioral features to FastAPI.
5. FastAPI returns probability, risk level, reasons and recommended action.
6. The frontend displays the result.
7. "Use Recommendation for Campaign" saves a campaign draft through Express.
8. Analytics are exposed through `/api/analytics`.

## Storage

The backend supports two modes:

- JSON files for zero-configuration local development.
- MongoDB Atlas when `MONGODB_URI` is configured.

## ML

The runtime service intentionally has a deterministic local fallback model so the demo remains runnable. `train.py` is the reproducible evaluation path for a real sample dataset.

For a production deployment, the runtime model should be replaced with an artifact trained on the same feature schema used by the API and versioned with its evaluation metrics.
