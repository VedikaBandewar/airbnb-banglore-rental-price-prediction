
import io
from pathlib import Path
from typing import Any

import pandas as pd

DATA_DIR = Path(__file__).resolve().parents[1] / "data"
CSV_PATH = DATA_DIR / "india_airbnb_listings.csv"

COLUMN_ALIASES = {
    "city": ["city", "city_name", "market"],
    "state": ["state", "province", "region"],
    "neighbourhood": [
        "neighbourhood",
        "neighborhood",
        "neighbourhood_cleansed",
        "neighborhood_cleansed",
        "area",
        "district",
    ],
    "room_type": ["room_type", "roomtype"],
    "property_type": ["property_type", "property"],
    "accommodates": ["accommodates", "guests", "capacity"],
    "bedrooms": ["bedrooms", "bedroom"],
    "bathrooms": ["bathrooms", "bathroom"],
    "beds": ["beds", "bed_count"],
    "minimum_nights": ["minimum_nights", "min_nights"],
    "availability_365": ["availability_365", "availability"],
    "number_of_reviews": ["number_of_reviews", "review_count", "reviews"],
    "reviews_per_month": ["reviews_per_month"],
    "host_listings_count": ["host_listings_count", "host_listings"],
    "price": [
        "price",
        "price_inr",
        "price_in_rupees",
        "price_per_night",
        "price_per_night_inr",
        "nightly_price",
        "nightly_rate",
        "average_price",
        "avg_price",
        "listing_price",
    ],
}

NUMERIC_COLUMNS = [
    "accommodates",
    "bedrooms",
    "bathrooms",
    "beds",
    "minimum_nights",
    "availability_365",
    "number_of_reviews",
    "reviews_per_month",
    "host_listings_count",
    "price",
]


def clean_column_names(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df.columns = (
        df.columns.astype(str)
        .str.strip()
        .str.lower()
        .str.replace(r"[^a-z0-9]+", "_", regex=True)
        .str.strip("_")
    )
    return df


def read_csv_bytes(content: bytes) -> pd.DataFrame:
    try:
        return pd.read_csv(io.BytesIO(content))
    except UnicodeDecodeError:
        return pd.read_csv(io.BytesIO(content), encoding="latin-1")


def normalize_india_csv(content: bytes) -> pd.DataFrame:
    df = clean_column_names(read_csv_bytes(content))

    if df.empty:
        raise ValueError("The uploaded CSV contains no data rows.")

    normalized = pd.DataFrame(index=df.index)

    for target, aliases in COLUMN_ALIASES.items():
        source = next(
            (column for column in aliases if column in df.columns),
            None,
        )
        if source is not None:
            normalized[target] = df[source]

    if "price" not in normalized:
        raise ValueError(
            "Price column not found. Expected price, price_inr, "
            "or price_per_night_inr."
        )

    if "property_type" in normalized and "room_type" not in normalized:
        normalized["room_type"] = normalized["property_type"]

    for column in ["city", "state", "neighbourhood", "room_type"]:
        if column not in normalized:
            normalized[column] = "Unknown"

    for column in NUMERIC_COLUMNS:
        if column not in normalized:
            normalized[column] = pd.NA

        if column == "price":
            values = (
                normalized[column]
                .astype(str)
                .str.replace(",", "", regex=False)
                .str.replace("₹", "", regex=False)
                .str.replace("$", "", regex=False)
                .str.replace("INR", "", case=False, regex=False)
                .str.strip()
            )
            normalized[column] = pd.to_numeric(values, errors="coerce")
        else:
            normalized[column] = pd.to_numeric(
                normalized[column], errors="coerce"
            )

    normalized = normalized.dropna(subset=["price"])
    normalized = normalized[normalized["price"] > 0]

    if normalized.empty:
        raise ValueError(
            "No valid positive prices found in the uploaded CSV."
        )

    if "latitude" in df.columns and "longitude" in df.columns:
        latitude = pd.to_numeric(
            df.loc[normalized.index, "latitude"], errors="coerce"
        )
        longitude = pd.to_numeric(
            df.loc[normalized.index, "longitude"], errors="coerce"
        )

        is_bengaluru = (
            latitude.between(12.0, 13.5)
            & longitude.between(77.0, 78.0)
        )

        if normalized["city"].eq("Unknown").all() and is_bengaluru.mean() > 0.5:
            normalized["city"] = "Bengaluru"
            normalized["state"] = "Karnataka"

    if normalized["city"].eq("Unknown").all():
        areas = normalized["neighbourhood"].fillna("").astype(str).str.lower()
        bengaluru_areas = [
            "whitefield",
            "indiranagar",
            "koramangala",
            "marathahalli",
            "hebbal",
            "jayanagar",
            "electronic city",
            "hsr layout",
            "btm",
            "yelahanka",
            "sarjapur",
            "rajajinagar",
        ]

        if areas.apply(
            lambda value: any(area in value for area in bengaluru_areas)
        ).mean() > 0.5:
            normalized["city"] = "Bengaluru"
            normalized["state"] = "Karnataka"

    normalized = normalized.fillna({
        "city": "Unknown",
        "state": "Unknown",
        "neighbourhood": "Unknown",
        "room_type": "Unknown",
    })

    return normalized.reset_index(drop=True)


def save_india_csv(df: pd.DataFrame) -> Path:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    df.to_csv(CSV_PATH, index=False)
    return CSV_PATH


def load_india_csv() -> pd.DataFrame:
    if not CSV_PATH.exists():
        return pd.DataFrame()

    return pd.read_csv(CSV_PATH)


def get_india_preview(limit: int = 100) -> list[dict[str, Any]]:
    df = load_india_csv()

    if df.empty:
        return []

    preview = df.head(max(1, min(limit, 500)))
    preview = preview.astype(object).where(pd.notna(preview), None)

    return preview.to_dict(orient="records")


def read_uploaded_csv(content: bytes) -> pd.DataFrame:
    return read_csv_bytes(content)