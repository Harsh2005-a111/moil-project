# MOIL Smart Mining Intelligence — Delivery Guide

## What's in this folder
- backend/        FastAPI service: Module B (predictions), Module A (mock heatmap), Module C (recommendations)
- dashboard/      React dashboard: Module D (the judge-facing screen)

## Step-by-step to go from "trained model" to "working demo"

### 1. Export your trained model from Kaggle
Run backend/export_model.py's code as the LAST cell in your notebook, then
download the 3 .pkl files from Kaggle's Output panel into backend/app/model/

### 2. Run the backend
    cd backend
    pip install -r requirements.txt
    uvicorn app.main:app --reload --port 8000
Visit http://localhost:8000/docs to test it directly (Swagger UI) —
this alone is demo-able to judges even before the frontend is wired up.

### 3. Run the dashboard
    cd dashboard
    npx create-react-app . --template minimal   # if not already scaffolded
    npm install recharts
    # replace src/App.jsx with the one provided
    npm start
Visit http://localhost:3000

### 4. Deploy (matches your PPT's stated tech stack)
- Backend  -> Render or Railway (free tier is enough for a hackathon demo)
- Frontend -> Vercel or Netlify
- Update API_BASE in dashboard/src/App.jsx to your deployed backend URL before final deploy

### 5. What to show judges, in order
1. The Kaggle notebook — training, confusion matrix, SHAP plot (proves it's real ML, not mocked)
2. Swagger UI (/docs) — proves the API contract works end-to-end
3. The live dashboard — the actual expected-solution panels: reserves, trends, risk, corrective steps
4. One sentence on what's real vs demo-mode (Module A heatmap is currently a mock grid — say so
   upfront; judges respect the honesty and it matches your PPT's own framing)
