from __future__ import annotations

from pathlib import Path

import joblib
import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel, Field

from .train import MODEL_PATH, train


class PredictionRequest(BaseModel):
    merchant: str = Field(min_length=1)
    rawText: str | None = None
    amount: float = Field(ge=0)


class PredictionResponse(BaseModel):
    category: str
    confidence: float


app = FastAPI(title="SmartExpense AI ML Service")


def load_model():
    if not Path(MODEL_PATH).exists():
        return train()
    return joblib.load(MODEL_PATH)


model = load_model()


@app.get("/health")
def health():
    return {"ok": True, "service": "SmartExpense AI ML"}


@app.post("/predict", response_model=PredictionResponse)
def predict(payload: PredictionRequest):
    frame = pd.DataFrame({
        "merchant": [payload.merchant.upper()],
        "text": [payload.rawText or payload.merchant],
        "amount": [payload.amount],
    })
    category = model.predict(frame)[0]
    confidence = 0.72
    if hasattr(model, "predict_proba"):
        probabilities = model.predict_proba(frame)[0]
        confidence = float(max(probabilities))
    return PredictionResponse(category=category, confidence=confidence)
