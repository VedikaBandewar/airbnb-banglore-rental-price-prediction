from typing import Any

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.linear_model import Lasso, LinearRegression, Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.tree import DecisionTreeRegressor

from .data import CATEGORICAL_FEATURES, NUMERIC_FEATURES, TARGET


def build_models() -> dict[str, Any]:
    return {
        "Linear Regression": LinearRegression(),
        "Ridge Regression": Ridge(alpha=1.0),
        "Lasso Regression": Lasso(alpha=0.08, max_iter=10000),
        "Decision Tree": DecisionTreeRegressor(max_depth=12, min_samples_leaf=3, random_state=42),
        "Random Forest": RandomForestRegressor(
            n_estimators=140, max_depth=16, min_samples_leaf=2, random_state=42, n_jobs=-1
        ),
    }


def build_pipeline(model: Any) -> Pipeline:
    numeric = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )
    categorical = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("encoder", OneHotEncoder(handle_unknown="ignore")),
        ]
    )
    preprocessor = ColumnTransformer(
        transformers=[
            ("numeric", numeric, NUMERIC_FEATURES),
            ("categorical", categorical, CATEGORICAL_FEATURES),
        ]
    )
    return Pipeline([("preprocessor", preprocessor), ("model", model)])


def train_models(df: pd.DataFrame) -> tuple[dict[str, Any], list[dict[str, Any]], str]:
    x = df[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
    y = df[TARGET]
    x_train, x_test, y_train, y_test = train_test_split(
        x, y, test_size=0.2, random_state=42
    )
    fitted = {}
    metrics = []

    for name, model in build_models().items():
        pipeline = build_pipeline(model)
        pipeline.fit(x_train, y_train)
        prediction = pipeline.predict(x_test)
        fitted[name] = pipeline
        metrics.append(
            {
                "model": name,
                "mae": round(float(mean_absolute_error(y_test, prediction)), 2),
                "rmse": round(float(np.sqrt(mean_squared_error(y_test, prediction))), 2),
                "r2": round(float(r2_score(y_test, prediction)), 3),
            }
        )

    best = max(metrics, key=lambda item: item["r2"])["model"]
    return fitted, sorted(metrics, key=lambda item: item["r2"], reverse=True), best


def predict_price(
    model: Any, payload: dict[str, Any]
) -> float:
    row = pd.DataFrame([payload])
    return round(float(model.predict(row)[0]), 2)
