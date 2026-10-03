# RecallIQ ML Service

Small FastAPI service that exposes a churn-risk prediction endpoint.

> The included model is a reproducible demo model trained on synthetic behavioral patterns. For production use, train it on historical customer outcomes and validate it with held-out data.

## Run

```bash
python -m venv .venv
.venv\\Scripts\\activate   # Windows
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

Endpoint: `POST http://localhost:8000/predict`
