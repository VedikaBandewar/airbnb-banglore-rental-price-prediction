export default function Panel({ title, subtitle, action, children, className = "" }) {
  return (
    <section className={`rounded-3xl border border-slate-200/80 bg-white p-5 shadow-soft sm:p-6 ${className}`}>
      {(title || action) && (
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-lg font-bold tracking-tight text-ink">{title}</h2>}
            {subtitle && <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
