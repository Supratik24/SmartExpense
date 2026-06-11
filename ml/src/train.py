from __future__ import annotations

from pathlib import Path

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler


MODEL_PATH = Path(__file__).resolve().parents[1] / "models" / "category_model.joblib"


def sample_training_data() -> pd.DataFrame:
    rows = [
        ("SWIGGY", "Rs 450 debited at SWIGGY", 450, "Food"),
        ("ZOMATO", "Paid INR 620 to ZOMATO via UPI", 620, "Food"),
        ("UBER", "INR 310 debited to UBER TRIP", 310, "Travel"),
        ("OLA", "Rs 220 paid to OLA CABS", 220, "Travel"),
        ("AMAZON", "Rs 1499 debited at AMAZON", 1499, "Shopping"),
        ("FLIPKART", "INR 2399 paid to FLIPKART", 2399, "Shopping"),
        ("BESCOM", "Electricity bill paid", 1800, "Bills"),
        ("NETFLIX", "Card debited at NETFLIX", 649, "Entertainment"),
        ("APOLLO PHARMACY", "UPI paid to APOLLO PHARMACY", 870, "Health"),
        ("COURSERA", "Paid to COURSERA", 3200, "Education"),
        ("ZERODHA", "Funds transferred to ZERODHA", 5000, "Investment"),
    ]
    return pd.DataFrame(rows, columns=["merchant", "text", "amount", "category"])


def build_pipeline() -> Pipeline:
    features = ColumnTransformer(
        transformers=[
            ("merchant_text", TfidfVectorizer(ngram_range=(1, 2)), "merchant"),
            ("sms_text", TfidfVectorizer(ngram_range=(1, 2), min_df=1), "text"),
            ("amount", StandardScaler(), ["amount"]),
        ]
    )
    return Pipeline(
        steps=[
            ("features", features),
            ("classifier", RandomForestClassifier(n_estimators=200, random_state=42, class_weight="balanced")),
        ]
    )


def train(data: pd.DataFrame | None = None) -> Pipeline:
    data = data if data is not None else sample_training_data()
    pipeline = build_pipeline()
    if len(data) >= 20:
        x_train, x_test, y_train, y_test = train_test_split(
            data[["merchant", "text", "amount"]], data["category"], test_size=0.2, random_state=42, stratify=data["category"]
        )
        pipeline.fit(x_train, y_train)
        print(classification_report(y_test, pipeline.predict(x_test)))
    else:
        pipeline.fit(data[["merchant", "text", "amount"]], data["category"])
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, MODEL_PATH)
    return pipeline


if __name__ == "__main__":
    train()
    print(f"Saved model to {MODEL_PATH}")
