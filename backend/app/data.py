from pathlib import Path

import numpy as np
import pandas as pd

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_PATH = BASE_DIR / "data" / "airbnb_listings.csv"

NUMERIC_FEATURES = [
    "accommodates",
    "bedrooms",
    "bathrooms",
    "beds",
    "minimum_nights",
    "availability_365",
    
    "number_of_reviews",
    "reviews_per_month",
    "host_listings_count",
]
CATEGORICAL_FEATURES = ["neighbourhood", "room_type"]
TARGET = "price"
REQUIRED_COLUMNS = CATEGORICAL_FEATURES + NUMERIC_FEATURES + [TARGET]


def load_dataset() -> pd.DataFrame:
    df = pd.read_csv(DATA_PATH)
    return normalize_columns(df)


def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    aliases = {
        "neighbourhood_cleansed": "neighbourhood",
        "neighborhood": "neighbourhood",
        "property_type": "room_type",
        "accommodates": "accommodates",
        "bedroom": "bedrooms",
        "bathroom": "bathrooms",
        "number_of_beds": "beds",
        "minimum_nights": "minimum_nights",
        "availability_365": "availability_365",
        "number_of_reviews": "number_of_reviews",
        "reviews_per_month": "reviews_per_month",
        "calculated_host_listings_count": "host_listings_count",
        "host_listings_count": "host_listings_count",
        "price": "price",
    }
    cleaned = df.copy()
    cleaned.columns = [str(col).strip().lower().replace(" ", "_") for col in cleaned.columns]
    rename_map = {col: aliases[col] for col in cleaned.columns if col in aliases}
    cleaned = cleaned.rename(columns=rename_map)

    if "price" not in cleaned.columns:
        raise ValueError("CSV must include a price column.")
    if "neighbourhood" not in cleaned.columns:
        cleaned["neighbourhood"] = "Unknown"
    if "room_type" not in cleaned.columns:
        cleaned["room_type"] = "Entire home/apt"
    for column in NUMERIC_FEATURES:
        if column not in cleaned.columns:
            cleaned[column] = np.nan

    cleaned["price"] = (
        cleaned["price"].astype(str).str.replace(r"[$,]", "", regex=True).str.strip()
    )
    for column in NUMERIC_FEATURES + ["price"]:
        cleaned[column] = pd.to_numeric(cleaned[column], errors="coerce")

    cleaned = cleaned[REQUIRED_COLUMNS].dropna(subset=["price"])
    cleaned = cleaned[cleaned["price"] > 0].copy()
    for column in CATEGORICAL_FEATURES:
        cleaned[column] = cleaned[column].fillna("Unknown").astype(str)
    return cleaned.reset_index(drop=True)
