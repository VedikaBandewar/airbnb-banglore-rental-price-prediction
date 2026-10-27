import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowDownRight, ArrowUpRight, BarChart3, BedDouble,
  ChevronDown, CircleHelp, Database, Home,
  Menu, RefreshCw, Search, Sparkles, TrendingUp, Users, Waves, Wifi,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import Sidebar from "./components/Sidebar";
import StatCard from "./components/StatCard";
import Panel from "./components/Panel";
import Scraper from "./components/Scraper";

const API = "http://127.0.0.1:8000";
const currency = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value || 0));
const number = (value) => new Intl.NumberFormat("en-US").format(Number(value || 0));
const navTitles = {
  overview: ["Good evening", "Your rental market, at a glance"],
  predict: ["Price predictor", "Estimate a nightly rate from property details"],
  models: ["Model lab", "Compare regression algorithms on the same test split"],
  statistics: ["Statistics lab", "Explore correlation, sampling and statistical tests"],
  scraper: ["India listings studio", "Import and explore Indian Airbnb rental data"],
  dataset: ["Dataset explorer", "Inspect the data powering your model"],
};

function MetricPill({ children }) {
  return <span className="rounded-full bg-mist px-3 py-1 text-xs font-semibold text-ocean">{children}</span>;
}

function Loading({ error }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
      {error ? <><strong className="text-rose-600">API connection issue.</strong> {error} Start the backend and refresh.</> : "Connecting to the StayWise API…"}
    </div>
  );
}

function Overview({ summary, models, analysis, goTo }) {
  if (!summary || !models || !analysis) return <Loading />;
  const chartData = Object.entries(summary.statistics?.price || {}).filter(([key, value]) => ["min", "25%", "50%", "75%", "max"].includes(key) && value != null).map(([name, value]) => ({ name, price: Number(value) }));
  const typeData = summary.preview.reduce((acc, row) => {
    const current = acc.find((item) => item.name === row.room_type);
    if (current) current.value += 1;
    else acc.push({ name: row.room_type, value: 1 });
    return acc;
  }, []);
  const best = models.metrics.find((item) => item.model === models.best_model);
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[2rem] bg-ink p-7 text-white shadow-soft sm:p-9">
        <div className="soft-grid absolute inset-0 opacity-40" />
        <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full bg-ocean/50 blur-3xl" />
        <div className="absolute -bottom-20 right-36 h-48 w-48 rounded-full bg-coral/30 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1.35fr_0.65fr] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-teal-100"><Sparkles size={14} /> Smart pricing workspace</div>
            <h2 className="max-w-xl text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">Find the sweet spot for your next stay.</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">Predict nightly rental prices with machine learning, understand the data, and compare models in one place.</p>
            <button onClick={() => goTo("predict")} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-coral px-5 py-3 text-sm font-bold text-ink transition hover:bg-orange-300">Predict a price <ArrowUpRight size={17} /></button>
          </div>
          <div className="relative rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur">
            <div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-200">Average nightly price</span><TrendingUp size={18} className="text-teal-200" /></div>
            <p className="mt-3 text-4xl font-extrabold">{currency(summary.mean_price)}</p>
            <p className="mt-2 text-xs text-slate-300">Median {currency(summary.median_price)} · current dataset</p>
            <div className="mt-6 h-24">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs><linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#F28B65" stopOpacity={0.55} /><stop offset="100%" stopColor="#F28B65" stopOpacity={0} /></linearGradient></defs>
                  <Area type="monotone" dataKey="price" stroke="#F28B65" strokeWidth={2.5} fill="url(#priceFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">Price distribution checkpoints</p>
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Listings analysed" value={number(summary.rows)} note={summary.dataset_note} icon={Home} tint="teal" />
        <StatCard label="Average nightly rate" value={currency(summary.mean_price)} note={`Range ${currency(summary.min_price)}–${currency(summary.max_price)}`} icon={TrendingUp} tint="coral" />
        <StatCard label="Best model" value={models.best_model.replace(" Regression", "")} note={`R² score ${best?.r2 ?? "—"}`} icon={Activity} tint="blue" />
        <StatCard label="Missing values" value={number(summary.missing_values)} note={`${summary.duplicates} duplicate rows`} icon={Database} tint="gold" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel title="Price checkpoints" subtitle="A quick look at the nightly price spread">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8EEF0" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#81909D", fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "#81909D", fontSize: 11 }} />
                <Tooltip formatter={(value) => currency(value)} />
                <Bar dataKey="price" fill="#246B72" radius={[7, 7, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Room mix in preview" subtitle="Distribution of room types in the first eight records">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={typeData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={83} paddingAngle={3}>
                  {typeData.map((item, index) => <Cell key={item.name} fill={["#246B72", "#F28B65", "#82B8B0", "#F5C66B"][index % 4]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2">{typeData.map((item) => <MetricPill key={item.name}>{item.name}</MetricPill>)}</div>
        </Panel>
      </div>
      <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm leading-6 text-orange-900">
        <strong>Dataset note:</strong> The bundled records are synthetic demo data for a lab presentation. Replace them with a permitted public listings dataset before drawing conclusions about a real market.
      </div>
    </div>
  );
}

function Predictor({ models }) {
  const [form, setForm] = useState({
    neighbourhood: "Downtown", room_type: "Entire home/apt", accommodates: 4, bedrooms: 2,
    bathrooms: 1.5, beds: 2, minimum_nights: 2, availability_365: 180,
    number_of_reviews: 24, reviews_per_month: 1.4, host_listings_count: 2,
  });
  const [model, setModel] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const change = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  async function submit(event) {
    event.preventDefault();
    setBusy(true); setError(""); setResult(null);
    try {
      const response = await fetch(`${API}/api/predict`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, model: model || models?.best_model }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Prediction failed");
      setResult(data);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  const fields = [
    { key: "neighbourhood", label: "Neighbourhood", type: "select", options: ["Downtown", "Riverside", "Old Town", "Arts District", "University", "Coastal"] },
    { key: "room_type", label: "Room type", type: "select", options: ["Entire home/apt", "Private room", "Shared room", "Hotel room"] },
    { key: "accommodates", label: "Guests", type: "number", min: 1, max: 16 },
    { key: "bedrooms", label: "Bedrooms", type: "number", min: 0, max: 12, step: 1 },
    { key: "bathrooms", label: "Bathrooms", type: "number", min: 0.5, max: 10, step: 0.5 },
    { key: "beds", label: "Beds", type: "number", min: 1, max: 16 },
    { key: "minimum_nights", label: "Minimum nights", type: "number", min: 1, max: 365 },
    { key: "availability_365", label: "Available days / year", type: "number", min: 0, max: 365 },
    { key: "number_of_reviews", label: "Number of reviews", type: "number", min: 0, max: 10000 },
    { key: "reviews_per_month", label: "Reviews per month", type: "number", min: 0, max: 100 },
    { key: "host_listings_count", label: "Host listings", type: "number", min: 1, max: 1000 },
  ];
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.75fr]">
      <Panel title="Property details" subtitle="Adjust the property profile, then run a model prediction">
        <form onSubmit={submit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <label key={field.key} className="block">
                <span className="mb-2 block text-xs font-bold text-slate-600">{field.label}</span>
                {field.type === "select" ? (
                  <select value={form[field.key]} onChange={(e) => change(field.key, e.target.value)} className="w-full rounded-xl border border-slate-200 bg-sand px-3 py-3 text-sm outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/10">
                    {field.options.map((option) => <option key={option}>{option}</option>)}
                  </select>
                ) : (
                  <input type="number" min={field.min} max={field.max} step={field.step || 1} value={form[field.key]} onChange={(e) => change(field.key, Number(e.target.value))} className="w-full rounded-xl border border-slate-200 bg-sand px-3 py-3 text-sm outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/10" />
                )}
              </label>
            ))}
          </div>
          <label className="block">
            <span className="mb-2 block text-xs font-bold text-slate-600">Regression model</span>
            <select value={model || models?.best_model || ""} onChange={(e) => setModel(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-ocean">
              {(models?.metrics || []).map((item) => <option key={item.model} value={item.model}>{item.model}</option>)}
            </select>
          </label>
          <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-ocean px-5 py-3.5 text-sm font-bold text-white transition hover:bg-ink disabled:opacity-60">{busy ? <RefreshCw className="animate-spin" size={17} /> : <Sparkles size={17} />} {busy ? "Predicting…" : "Estimate nightly price"}</button>
        </form>
        {error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      </Panel>
      <div className="space-y-5">
        <div className="relative overflow-hidden rounded-3xl bg-ink p-6 text-white shadow-soft">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-coral/25 blur-2xl" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-teal-100"><Activity size={14} /> Prediction result</span>
            <p className="mt-6 text-sm text-slate-300">Estimated nightly rate</p>
            <p className="mt-2 text-5xl font-extrabold tracking-tight">{result ? currency(result.predicted_price) : "—"}</p>
            <p className="mt-3 text-sm text-slate-300">{result ? `Calculated with ${result.model}` : "Your estimate will appear here."}</p>
            {result && <div className="mt-6 rounded-2xl border border-white/15 bg-white/10 p-4 text-sm leading-6 text-slate-200">This is a model estimate based on the training data. Actual rates vary with dates, location, events, taxes and listing quality.</div>}
          </div>
        </div>
        <Panel title="What influences the estimate?" subtitle="Features included in the model">
          <div className="space-y-4">
            {[
              [BedDouble, "Capacity and layout", "Guests, bedrooms, bathrooms and beds"],
              [Home, "Location and room type", "Neighbourhood and property category"],
              [Users, "Listing activity", "Review counts and host portfolio size"],
              [Activity, "Availability", "Available days and minimum stay"],
            ].map(([Icon, title, description]) => <div key={title} className="flex gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-mist text-ocean"><Icon size={18} /></span><div><p className="text-sm font-bold">{title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{description}</p></div></div>)}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function ModelLab({ models }) {
  if (!models) return <Loading />;
  return (
    <div className="space-y-6">
      <Panel title="Model leaderboard" subtitle="Held-out test data · lower MAE/RMSE is better, higher R² is better">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse text-left text-sm">
            <thead><tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400"><th className="py-3 pr-4">Model</th><th className="py-3 pr-4">MAE</th><th className="py-3 pr-4">RMSE</th><th className="py-3 pr-4">R²</th><th className="py-3">Status</th></tr></thead>
            <tbody>{models.metrics.map((item, index) => <tr key={item.model} className="border-b border-slate-50 last:border-0"><td className="py-4 pr-4 font-semibold text-ink">{item.model}</td><td className="py-4 pr-4 text-slate-600">{currency(item.mae)}</td><td className="py-4 pr-4 text-slate-600">{currency(item.rmse)}</td><td className="py-4 pr-4 font-bold text-ocean">{item.r2.toFixed(3)}</td><td className="py-4">{index === 0 ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">Top R²</span> : <span className="text-xs text-slate-400">Compared</span>}</td></tr>)}</tbody>
          </table>
        </div>
      </Panel>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="R² comparison" subtitle="How much target variance is explained on the test split">
          <div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={models.metrics} layout="vertical" margin={{ left: 25, right: 20 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E8EEF0" /><XAxis type="number" domain={[0, 1]} tick={{ fontSize: 11, fill: "#81909D" }} /><YAxis dataKey="model" type="category" width={130} tick={{ fontSize: 10, fill: "#64748B" }} /><Tooltip /><Bar dataKey="r2" fill="#246B72" radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer></div>
        </Panel>
        <Panel title="How to read the metrics" subtitle="Useful talking points for your lab viva">
          <div className="space-y-4">
            {[["MAE", "Mean Absolute Error", "Average absolute difference between predicted and actual nightly prices. Lower is better."], ["RMSE", "Root Mean Squared Error", "Penalises larger errors more strongly than MAE. Lower is better."], ["R²", "Coefficient of determination", "Measures the proportion of target variance explained by the model. Closer to 1 is generally better."]].map(([symbol, title, body]) => <div key={symbol} className="flex gap-3 rounded-2xl bg-sand p-4"><span className="grid h-10 w-12 shrink-0 place-items-center rounded-xl bg-white text-sm font-extrabold text-ocean">{symbol}</span><div><p className="text-sm font-bold">{title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{body}</p></div></div>)}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function StatisticsLab({ analysis, summary }) {
  if (!analysis || !summary) return <Loading />;
  const clt = analysis.clt;
  const sampleData = clt.sample_means.map((mean, index) => ({ sample: index + 1, mean }));
  const correlation = analysis.correlation;
  const test = analysis.group_test;
  const normalization = analysis.normalization;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pearson correlation" value={correlation.pearson_r} note={`p-value ${correlation.pearson_p}`} icon={Activity} tint="teal" />
        <StatCard label="Spearman correlation" value={correlation.spearman_r} note={`p-value ${correlation.spearman_p}`} icon={TrendingUp} tint="coral" />
        <StatCard label="CLT sample size" value={clt.sample_size} note={`${clt.repetitions} repeated samples`} icon={BarChart3} tint="blue" />
        <StatCard label="Standard error" value={currency(clt.standard_error)} note="SD / √n" icon={Waves} tint="gold" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Central Limit Theorem" subtitle="Distribution of repeated sample means from nightly prices">
          <div className="h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={sampleData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8EEF0" /><XAxis dataKey="sample" tick={false} axisLine={false} /><YAxis tick={{ fontSize: 10, fill: "#81909D" }} /><Tooltip labelFormatter={(label) => `Sample ${label}`} /><Area dataKey="mean" stroke="#246B72" fill="#B9D9D3" fillOpacity={0.65} /></AreaChart></ResponsiveContainer></div>
          <div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-sand p-4"><p className="text-xs text-slate-500">Population mean</p><p className="mt-1 text-xl font-extrabold">{currency(clt.population_mean)}</p></div><div className="rounded-2xl bg-mist p-4"><p className="text-xs text-slate-500">Mean of sample means</p><p className="mt-1 text-xl font-extrabold text-ocean">{currency(clt.sample_means_mean)}</p></div></div>
        </Panel>
        <Panel title="Correlation analysis" subtitle={`Relationship between ${correlation.feature} and nightly price`}>
          <div className="space-y-4">
            {[["Pearson r", correlation.pearson_r, correlation.pearson_p], ["Spearman ρ", correlation.spearman_r, correlation.spearman_p]].map(([label, value, p]) => <div key={label} className="rounded-2xl border border-slate-100 p-4"><div className="flex items-center justify-between"><span className="text-sm font-bold">{label}</span><span className="text-lg font-extrabold text-ocean">{value}</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-ocean" style={{ width: `${Math.min(100, Math.abs(value) * 100)}%` }} /></div><p className="mt-2 text-xs text-slate-500">p-value: {p} · {p < 0.05 ? "statistically significant at α = 0.05" : "not significant at α = 0.05"}</p></div>)}
          </div>
        </Panel>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Two-group test" subtitle="Welch’s independent t-test: entire home/apt vs private room">
          <div className="grid grid-cols-2 gap-3"><div className="rounded-2xl bg-sand p-4"><p className="text-xs text-slate-500">Entire home mean</p><p className="mt-2 text-2xl font-extrabold">{currency(test.mean_entire_home)}</p></div><div className="rounded-2xl bg-mist p-4"><p className="text-xs text-slate-500">Private room mean</p><p className="mt-2 text-2xl font-extrabold text-ocean">{currency(test.mean_private_room)}</p></div></div>
          <div className="mt-4 rounded-2xl border border-slate-100 p-4"><p className="text-sm font-bold">p-value: {test.p_value}</p><p className="mt-1 text-sm text-slate-500">{test.significant ? "Reject the null hypothesis at α = 0.05; the sample provides evidence of a difference in group means." : "Fail to reject the null hypothesis at α = 0.05; evidence is insufficient to establish a difference."}</p></div>
        </Panel>
        <Panel title="Min-max normalization" subtitle="Scale price values to the range [0, 1]">
          <div className="space-y-3">{normalization.map((item, index) => <div key={index} className="grid grid-cols-[60px_1fr_44px] items-center gap-3 text-sm"><span className="text-slate-500">{currency(item.value)}</span><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-coral" style={{ width: `${item.scaled * 100}%` }} /></div><span className="text-right font-bold text-ink">{item.scaled}</span></div>)}</div>
          <p className="mt-4 text-xs leading-5 text-slate-500">Min-max scaling maps the minimum to 0 and maximum to 1. The model pipeline also standardizes numeric features for training.</p>
        </Panel>
      </div>
    </div>
  );
}

function Dataset({ summary }) {
  const [query, setQuery] = useState("");
  if (!summary) return <Loading />;
  const rows = summary.preview.filter((row) => Object.values(row).some((value) => String(value).toLowerCase().includes(query.toLowerCase())));
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3"><StatCard label="Rows" value={number(summary.rows)} icon={Database} /><StatCard label="Features" value={summary.columns - 1} note="excluding target price" icon={Activity} tint="coral" /><StatCard label="Duplicate rows" value={summary.duplicates} icon={RefreshCw} tint="blue" /></div>
      <Panel title="Dataset preview" subtitle={`Showing the first records · ${summary.dataset_note}`} action={<div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter preview…" className="w-44 rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs outline-none focus:border-ocean" /></div>}>
        <div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left text-xs"><thead><tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400">{summary.columns_list.map((column) => <th key={column} className="py-3 pr-4">{column.replaceAll("_", " ")}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index} className="border-b border-slate-50 last:border-0">{summary.columns_list.map((column) => <td key={column} className="py-3 pr-4 text-slate-600">{row[column] ?? "—"}</td>)}</tr>)}</tbody></table></div>
      </Panel>
      <Panel title="Missing values by feature" subtitle="Useful first step before preprocessing">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Object.entries(summary.missing_by_column).map(([column, value]) => <div key={column} className="flex items-center justify-between rounded-xl bg-sand px-4 py-3"><span className="text-xs font-medium text-slate-600">{column.replaceAll("_", " ")}</span><span className={`text-sm font-extrabold ${value ? "text-orange-600" : "text-ocean"}`}>{value}</span></div>)}</div>
      </Panel>
    </div>
  );
}

export default function App() {
  const [active, setActive] = useState("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [summary, setSummary] = useState(null);
  const [models, setModels] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const loadData = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [summaryResponse, modelsResponse, analysisResponse] = await Promise.all([
        fetch(`${API}/api/summary`), fetch(`${API}/api/models`), fetch(`${API}/api/analysis`),
      ]);
      for (const response of [summaryResponse, modelsResponse, analysisResponse]) {
        if (!response.ok) throw new Error(`Backend returned ${response.status}`);
      }
      const [summaryData, modelData, analysisData] = await Promise.all([
        summaryResponse.json(), modelsResponse.json(), analysisResponse.json(),
      ]);
      setSummary(summaryData); setModels(modelData); setAnalysis(analysisData);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { loadData(); }, [loadData]);
  const title = navTitles[active];
  const page = useMemo(() => {
    if (loading && !summary) return <Loading />;
    if (error && !summary) return <Loading error={error} />;
    if (active === "overview") return <Overview summary={summary} models={models} analysis={analysis} goTo={setActive} />;
    if (active === "predict") return <Predictor models={models} />;
    if (active === "models") return <ModelLab models={models} />;
    if (active === "statistics") return <StatisticsLab analysis={analysis} summary={summary} />;
    if (active === "scraper") return <Scraper onImported={loadData} />;
    return <Dataset summary={summary} />;
  }, [active, analysis, error, loadData, loading, models, summary]);
  return (
    <div className="min-h-screen bg-sand">
      <Sidebar active={active} onChange={setActive} open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="min-h-screen lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-sand/90 px-4 py-4 backdrop-blur-xl sm:px-7 lg:px-9">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileOpen(true)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white lg:hidden" aria-label="Open navigation"><Menu size={18} /></button>
              <div><p className="text-xs font-semibold text-slate-400">StayWise / <span className="text-ocean">{title[0]}</span></p><h1 className="mt-1 text-xl font-extrabold tracking-tight text-ink sm:text-2xl">{title[1]}</h1></div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500 sm:inline-flex"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Local workspace</span>
              <button onClick={loadData} title="Refresh data" className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:text-ocean"><RefreshCw size={16} className={loading ? "animate-spin" : ""} /></button>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-[1500px] space-y-6 px-4 py-6 sm:px-7 sm:py-8 lg:px-9">
          {error && summary && <div className="rounded-xl bg-orange-50 p-3 text-xs text-orange-800">Refresh warning: {error}</div>}
          {page}
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 pt-5 text-xs text-slate-400"><p>StayWise · Regression: Airbnb Rental Price Prediction</p><p>React · Tailwind CSS · FastAPI · scikit-learn</p></footer>
        </main>
      </div>
    </div>
  );
}