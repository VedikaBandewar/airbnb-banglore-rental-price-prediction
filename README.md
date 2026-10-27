# StayWise — Airbnb Rental Price Prediction

A lab-ready full-stack regression project using **React + Tailwind CSS** for the frontend and **FastAPI + Pandas + scikit-learn** for the backend.

> The bundled dataset is synthetic demo data generated for development and presentations. It is not scraped Airbnb data and should not be used to make real pricing decisions. The scraper demo targets Books to Scrape (a practice site), and a CSV import endpoint supports datasets you are permitted to access, such as public Inside Airbnb downloads.

## Features

- Airbnb nightly-price prediction form
- Compare Linear Regression, Ridge, Lasso, Decision Tree, and Random Forest
- Model metrics: MAE, RMSE, and R² on a held-out test set
- Dataset overview, missing values, descriptive statistics, and correlation
- Sampling distribution / CLT demonstration
- Pearson and Spearman correlation analysis
- Min-max normalization preview
- Web scraping demo with Requests + BeautifulSoup on `books.toscrape.com`
- CSV import endpoint for an Airbnb listings dataset you have permission to use
- Responsive warm-and-cool UI palette

## Folder structure

```text
airbnb-rental-price-prediction/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── data.py
│   │   ├── ml.py
│   │   └── scraper.py
│   ├── data/
│   │   └── airbnb_listings.csv
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── index.css
│   │   └── components/
│   │       ├── Sidebar.jsx
│   │       ├── StatCard.jsx
│   │       └── Panel.jsx
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
├── docs/
│   └── practical-mapping.md
├── .gitignore
└── README.md
```

## Requirements

- Python 3.10+
- Node.js 18+
- npm

## Run the backend

Open a terminal in the project root:

```bash
cd backend
python -m venv .venv
```

Windows PowerShell:
```powershell
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

macOS/Linux:
```bash
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend API: `http://127.0.0.1:8000`  
Interactive API docs: `http://127.0.0.1:8000/docs`

## Run the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

## Using a real public dataset

Download an appropriate listings CSV from a source that permits reuse (for example, Inside Airbnb), then call:

```bash
curl -X POST "http://127.0.0.1:8000/api/dataset/upload-csv" \
  -F "file=@listings.csv"
```

The loader maps common column names where possible. For best results, use a dataset with columns such as `price`, `room_type`, `accommodates`, `bedrooms`, `bathrooms`, `beds`, `minimum_nights`, `availability_365`, `number_of_reviews`, `reviews_per_month`, `host_listings_count`, and `neighbourhood`. The app expects nightly prices as a numeric target. The endpoint validates the file and retrains the models.

## Web scraping note

The scraper demo uses the practice website Books to Scrape. Do not scrape Airbnb or other services in violation of their terms, access controls, or applicable law. Use an official API or a permitted public dataset instead. Scraped prices can be stale, incomplete, and location-dependent.

## Project limitations

- Bundled demo records are synthetic and intended to demonstrate the complete pipeline.
- R² and error metrics depend on the dataset and train/test split.
- Predicted prices are estimates, not guarantees or financial advice.
