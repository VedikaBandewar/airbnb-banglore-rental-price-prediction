
import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

export default function Scraper({ onImported }) {
  const [file, setFile] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadListings() {
    try {
      const response = await fetch(`${API}/api/scrape/india?limit=500`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to load listings.");
      }

      setItems(data.items || []);
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    loadListings();
  }, []);

  async function importCSV(event) {
    event.preventDefault();

    if (!file) {
      setMessage("Please select a CSV file.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API}/api/scrape/india/import-csv`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "CSV import failed.");
      }

      setMessage(
        `${data.message} Rows: ${data.count}. Best model: ${data.best_model}`
      );

      setFile(null);
      event.target.reset();

      await loadListings();

      if (onImported) {
        await onImported();
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="space-y-6">
      <section className="rounded-2xl border bg-white p-6">
        <h2 className="text-2xl font-bold">India Airbnb Data Studio</h2>

        <p className="mt-2 text-sm text-gray-600">
          Upload your Indian Airbnb CSV, save the listings, and retrain
          the rental price prediction models.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href="https://www.kaggle.com/datasets?search=Airbnb+India"
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border px-4 py-2 text-sm"
          >
            Find India datasets on Kaggle
          </a>

          <a
            href="https://www.kaggle.com/datasets?search=Airbnb+Bangalore"
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border px-4 py-2 text-sm"
          >
            Find Bengaluru datasets
          </a>
        </div>

        <form onSubmit={importCSV} className="mt-6 space-y-4">
          <input
            type="file"
            accept=".csv"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
            className="block w-full rounded-lg border p-3 text-sm"
          />

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-black px-5 py-3 text-white disabled:opacity-50"
          >
            {loading ? "Importing..." : "Import CSV and Train Models"}
          </button>
        </form>

        {message && (
          <p className="mt-4 rounded-lg bg-gray-50 p-3 text-sm">
            {message}
          </p>
        )}
      </section>

      <section className="rounded-2xl border bg-white p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Saved Listings</h2>
          <button
            type="button"
            onClick={loadListings}
            className="rounded-lg border px-4 py-2 text-sm"
          >
            Refresh
          </button>
        </div>

        <p className="mt-2 text-sm text-gray-500">
          {items.length} listings loaded
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                {["City", "Neighbourhood", "Room Type", "Guests", "Price (INR)"].map(
                  (heading) => (
                    <th key={heading} className="px-4 py-3">
                      {heading}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {items.map((item, index) => (
                <tr key={index} className="border-t">
                  <td className="px-4 py-3">{item.city || "Unknown"}</td>
                  <td className="px-4 py-3">
                    {item.neighbourhood || "Unknown"}
                  </td>
                  <td className="px-4 py-3">{item.room_type || "Unknown"}</td>
                  <td className="px-4 py-3">{item.accommodates ?? "N/A"}</td>
                  <td className="px-4 py-3">
                    {Number(item.price || 0).toLocaleString("en-IN", {
                      style: "currency",
                      currency: "INR",
                      maximumFractionDigits: 0,
                    })}
                  </td>
                </tr>
              ))}

              {!items.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                    No saved listings yet. Upload a CSV to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}