export default function StatCard({ label, value, note, icon: Icon, tint = "teal" }) {
  const tintClasses = {
    teal: "bg-mist text-ocean",
    coral: "bg-orange-50 text-orange-600",
    blue: "bg-sky-50 text-sky-700",
    gold: "bg-amber-50 text-amber-700",
  };
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-extrabold tracking-tight text-ink">{value}</p>
          {note && <p className="mt-2 text-xs text-slate-400">{note}</p>}
        </div>
        {Icon && (
          <span className={`grid h-11 w-11 place-items-center rounded-2xl ${tintClasses[tint]}`}>
            <Icon size={20} />
          </span>
        )}
      </div>
    </div>
  );
}
