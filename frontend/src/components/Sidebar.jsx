import {
  Activity, BarChart3, BookOpen, Building2, ChartNoAxesCombined,
  Database, Home, Layers3, Sparkles, Waves,
} from "lucide-react";

const items = [
  { id: "overview", label: "Overview", icon: Home, group: "Workspace" },
  { id: "predict", label: "Price predictor", icon: Sparkles, group: "Workspace" },
  { id: "models", label: "Model lab", icon: ChartNoAxesCombined, group: "Intelligence" },
  { id: "statistics", label: "Statistics lab", icon: BarChart3, group: "Intelligence" },
  { id: "scraper", label: "Web scraping", icon: Waves, group: "Data tools" },
  { id: "dataset", label: "Dataset explorer", icon: Database, group: "Data tools" },
];

export default function Sidebar({ active, onChange, open, onClose }) {
  return (
    <>
      {open && <button className="fixed inset-0 z-30 bg-ink/35 lg:hidden" onClick={onClose} aria-label="Close navigation" />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white px-4 py-5 transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-3 px-3 pb-8">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-ocean text-white">
            <Building2 size={22} />
          </div>
          <div>
            <p className="text-lg font-extrabold tracking-tight text-ink">staywise<span className="text-coral">.</span></p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Rental intelligence</p>
          </div>
        </div>
        {["Workspace", "Intelligence", "Data tools"].map((group) => (
          <div key={group} className="mb-5">
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{group}</p>
            <nav className="space-y-1">
              {items.filter((item) => item.group === group).map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => { onChange(id); onClose(); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${active === id ? "bg-ocean text-white shadow-md shadow-ocean/20" : "text-slate-500 hover:bg-sand hover:text-ink"}`}>
                  <Icon size={18} strokeWidth={1.9} />
                  {label}
                </button>
              ))}
            </nav>
          </div>
        ))}
        <div className="mt-auto rounded-2xl bg-sand p-4">
          <div className="mb-2 flex items-center gap-2 text-coral"><Layers3 size={17} /><span className="text-xs font-bold">Lab project</span></div>
          <p className="text-xs leading-5 text-slate-600">Regression · Web scraping · Statistical analysis</p>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400"><BookOpen size={13} /> SI Practical 1–8</div>
        </div>
      </aside>
    </>
  );
}
