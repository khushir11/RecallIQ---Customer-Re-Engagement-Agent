# RecallIQ AI Risk Engine

### ML service
```bash
cd ml-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

### Backend
In another terminal:
```bash
cd backend
npm install
npm start
```

The backend exposes `POST /api/risk/predict` and proxies predictions to the Python service.

The current model is a deterministic synthetic-data demo scaffold. For production claims, retrain/evaluate it on an appropriate real or licensed dataset.
