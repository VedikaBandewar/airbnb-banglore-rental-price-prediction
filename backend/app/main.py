
from typing import Any

import numpy as np
import pandas as pd


from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from scipy.stats import pearsonr, spearmanr, ttest_ind

from .data import (
    CATEGORICAL_FEATURES,
    DATA_PATH,
    NUMERIC_FEATURES,
    TARGET,
    load_dataset,
    normalize_columns,
)
from .ml import predict_price, train_models
from .scraper import (
    get_india_preview,
    load_india_csv,
    normalize_india_csv,
    save_india_csv,
)

app = FastAPI(
    title="StayWise API",
    description="India Airbnb rental-price prediction and SI practical demonstrations.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

dataset = load_dataset()
models, model_metrics, best_model_name = train_models(dataset)


def refresh_models() -> None:
    global dataset, models, model_metrics, best_model_name
    dataset = load_dataset()
    models, model_metrics, best_model_name = train_models(dataset)


@app.get("/")
def root() -> dict[str, str]:
    return {
        "name": "StayWise API",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/api/summary")
def summary() -> dict[str, Any]:
    numeric = dataset.select_dtypes(include=np.number)
    correlations = numeric.corr(numeric_only=True).round(2).reset_index()
    correlations = correlations.rename(columns={"index": "feature"})

    return {
        "rows": int(len(dataset)),
        "columns": int(len(dataset.columns)),
        "missing_values": int(dataset.isna().sum().sum()),
        "duplicates": int(dataset.duplicated().sum()),
        "mean_price": round(float(dataset[TARGET].mean()), 2),
        "median_price": round(float(dataset[TARGET].median()), 2),
        "min_price": round(float(dataset[TARGET].min()), 2),
        "max_price": round(float(dataset[TARGET].max()), 2),
        "columns_list": dataset.columns.tolist(),
        "missing_by_column": dataset.isna().sum().to_dict(),
        "statistics": dataset.describe(include="all").replace(
            {np.nan: None}
        ).to_dict(),
        "correlations": correlations.to_dict(orient="records"),
        "preview": dataset.head(8).replace(
            {np.nan: None}
        ).to_dict(orient="records"),
        "dataset_note": (
            "Synthetic demo dataset"
            if len(dataset) == 520
            else "Imported dataset"
        ),
    }


@app.get("/api/models")
def get_models() -> dict[str, Any]:
    return {
        "best_model": best_model_name,
        "metrics": model_metrics,
    }


@app.post("/api/predict")
def predict(payload: dict[str, Any]) -> dict[str, Any]:
    payload = payload.copy()
    model_name = payload.pop("model", best_model_name)

    required = set(NUMERIC_FEATURES + CATEGORICAL_FEATURES)
    missing = required - set(payload)

    if missing:
        raise HTTPException(
            status_code=422,
            detail=f"Missing features: {', '.join(sorted(missing))}",
        )

    if model_name not in models:
        raise HTTPException(
            status_code=400,
            detail="Unknown model selected.",
        )

    try:
        price = predict_price(models[model_name], payload)
    except Exception as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Prediction failed: {exc}",
        ) from exc

    return {
        "predicted_price": price,
        "currency": "INR",
        "model": model_name,
    }


@app.get("/api/analysis")
def analysis() -> dict[str, Any]:
    price = dataset[TARGET].dropna().to_numpy()

    if len(price) == 0:
        raise HTTPException(
            status_code=400,
            detail="Dataset contains no valid prices.",
        )

    rng = np.random.default_rng(42)
    sample_size = min(30, len(price))

    sample_means = [
        float(np.mean(rng.choice(price, size=sample_size, replace=True)))
        for _ in range(1000)
    ]

    left = dataset.loc[
        dataset["room_type"] == "Entire home/apt", TARGET
    ].dropna()

    right = dataset.loc[
        dataset["room_type"] == "Private room", TARGET
    ].dropna()

    if len(left) and len(right):
        t_stat, p_value = ttest_ind(
            left,
            right,
            equal_var=False,
        )
    else:
        t_stat, p_value = 0.0, 1.0

    x = dataset["accommodates"]
    y = dataset[TARGET]
    valid = x.notna() & y.notna()
    x = x[valid]
    y = y[valid]

    if len(x) >= 2 and x.nunique() > 1 and y.nunique() > 1:
        pearson = pearsonr(x, y)
        spearman = spearmanr(x, y)
        pearson_r = float(pearson.statistic)
        pearson_p = float(pearson.pvalue)
        spearman_r = float(spearman.statistic)
        spearman_p = float(spearman.pvalue)
    else:
        pearson_r = pearson_p = spearman_r = spearman_p = 0.0

    price_range = float(price.max() - price.min())

    normalization = []
    for value in np.quantile(price, [0, 0.25, 0.5, 0.75, 1]):
        scaled = (
            float((value - price.min()) / price_range)
            if price_range > 0
            else 0.0
        )
        normalization.append({
            "value": float(value),
            "scaled": round(scaled, 3),
        })

    return {
        "clt": {
            "sample_size": sample_size,
            "repetitions": len(sample_means),
            "population_mean": round(float(np.mean(price)), 2),
            "sample_means_mean": round(float(np.mean(sample_means)), 2),
            "standard_error": round(
                float(np.std(price, ddof=1) / np.sqrt(sample_size)), 2
            ) if len(price) > 1 else 0.0,
            "sample_means": [
                round(value, 2) for value in sample_means[:120]
            ],
        },
        "correlation": {
            "feature": "accommodates",
            "target": "price",
            "pearson_r": round(pearson_r, 3),
            "pearson_p": round(pearson_p, 5),
            "spearman_r": round(spearman_r, 3),
            "spearman_p": round(spearman_p, 5),
        },
        "group_test": {
            "groups": ["Entire home/apt", "Private room"],
            "mean_entire_home": (
                round(float(left.mean()), 2) if len(left) else None
            ),
            "mean_private_room": (
                round(float(right.mean()), 2) if len(right) else None
            ),
            "t_statistic": round(float(t_stat), 3),
            "p_value": round(float(p_value), 5),
            "alpha": 0.05,
            "significant": bool(p_value < 0.05),
        },
        "normalization": normalization,
    }


@app.get("/api/scrape/india")
def get_india_listings(limit: int = 100) -> dict[str, Any]:
    df = load_india_csv()

    cities = (
        sorted(df["city"].dropna().astype(str).unique().tolist())
        if not df.empty and "city" in df.columns
        else []
    )

    return {
        "count": int(len(df)),
        "cities": cities,
        "items": get_india_preview(max(1, min(limit, 500))),
    }


@app.post("/api/scrape/india/import-csv")
async def import_india_csv(
    file: UploadFile = File(...),
) -> dict[str, Any]:
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Upload a CSV file.",
        )

    content = await file.read()

    try:
        df = normalize_india_csv(content)
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Could not read CSV: {exc}",
        ) from exc
    finally:
        await file.close()

    if len(df) < 30:
        raise HTTPException(
            status_code=400,
            detail="The CSV must contain at least 30 valid listings with prices.",
        )

    try:
        save_india_csv(df)
        normalized = normalize_columns(df)
        normalized.to_csv(DATA_PATH, index=False)
        refresh_models()
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Could not save data or train models: {exc}",
        ) from exc

    return {
        "message": "India listings imported and models retrained.",
        "count": int(len(df)),
        "file": "data/india_airbnb_listings.csv",
        "best_model": best_model_name,
        "items": get_india_preview(20),
    }


@app.post("/api/dataset/upload-csv")
async def upload_csv(
    file: UploadFile = File(...),
) -> dict[str, Any]:
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a CSV file.",
        )

    content = await file.read()

    try:
        incoming = pd.read_csv(pd.io.common.BytesIO(content))
        normalized = normalize_columns(incoming)

        if len(normalized) < 30:
            raise ValueError("Please upload at least 30 usable rows.")

        normalized.to_csv(DATA_PATH, index=False)
        refresh_models()

        return {
            "message": "Dataset imported and models retrained.",
            "rows": int(len(dataset)),
            "columns": int(len(dataset.columns)),
            "best_model": best_model_name,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Could not import dataset: {exc}",
        ) from exc
    finally:
        await file.close()

        
@app.get("/api/bengaluru/models")
def bengaluru_models() -> dict[str, Any]:
    try:
        return get_bengaluru_models()
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Bengaluru model training failed: {exc}",
        ) from exc


@app.get("/api/bengaluru/options")
def bengaluru_options() -> dict[str, Any]:
    try:
        return get_bengaluru_options()
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Could not load Bengaluru options: {exc}",
        ) from exc



