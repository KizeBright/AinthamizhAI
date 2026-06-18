import { Link } from "react-router-dom";

export function Icon({ name, className = "h-5 w-5" }) {
  const paths = {
    dashboard: "M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6v-9h-6v9Zm0-16v5h6V4h-6Z",
    translate: "M4 5h9M9 3v2m1.5 0C9.6 8.2 7.5 10.7 4 12.2M6.5 8.5c1 1.6 2.5 3 4.5 4M13 21l1.2-3m0 0L17 11l3 10m-5.8-3h5.6",
    sentence: "M5 5h14M5 10h14M5 15h8M5 20h10",
    mic: "M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm6-3a6 6 0 0 1-12 0m6 6v4m-4 0h8",
    scan: "M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M7 12h10",
    entity: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0M18 8h3m-1.5-1.5v3",
    home: "M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9Z",
    arrow: "M5 12h14m-6-6 6 6-6 6",
    copy: "M8 8h10v12H8V8Zm-4 8V4h10",
    clear: "M6 6l12 12M18 6 6 18",
    swap: "M7 7h11m0 0-3-3m3 3-3 3M17 17H6m0 0 3 3m-3-3 3-3",
    upload: "M12 16V4m0 0-4 4m4-4 4 4M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3",
    user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0",
    play: "m8 5 11 7-11 7V5Z",
    stop: "M7 7h10v10H7z",
    spark: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Zm6 12 .9 2.1L21 18l-2.1.9L18 21l-.9-2.1L15 18l2.1-.9L18 15Z",
    eye: "M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Zm9.5 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
    eyeOff: "M3 3l18 18M10.6 5.3A10.7 10.7 0 0 1 12 5c6 0 9.5 7 9.5 7a16 16 0 0 1-2.2 3.1M6.2 6.8A16 16 0 0 0 2.5 12s3.5 7 9.5 7c1.7 0 3.2-.5 4.5-1.2",
    progress: "M4 19V5m5 14V9m5 10V3m5 16v-7",
    menu: "M4 7h16M4 12h16M4 17h16",
    sun: "M12 3v1m0 16v1m9-9h-1M4 12H3m15.36-6.36-.71.71M6.34 17.66l-.7.7M17.66 17.66l.7.7M6.34 6.34l-.7-.7M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z",
    moon: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z",
    check: "m5 13 4 4L19 7",
    alert: "M12 9v4m0 4h.01M10.3 4.3 2.1-1.2a2 2 0 0 1 3.4 0l8.5 14.7a2 2 0 0 1-1.7 3H3.4a2 2 0 0 1-1.7-3L10.3 4.3Z",
    clock: "M12 6v6l4 2m5-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d={paths[name] || paths.spark} />
    </svg>
  );
}

export function Button({ as: Component = "button", variant = "primary", className = "", children, ...props }) {
  const variants = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    ghost: "btn-ghost",
    accent: "btn-accent",
  };

  return (
    <Component className={`btn ${variants[variant]} ${className}`} {...props}>
      {children}
    </Component>
  );
}

export function Card({ children, className = "" }) {
  return <div className={`soft-card ${className}`}>{children}</div>;
}

export function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
      <div className="max-w-3xl">
        {eyebrow && (
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">
            {eyebrow}
          </p>
        )}
        <h1 className="page-title">{title}</h1>
        {description && <p className="mt-3 text-base leading-7 text-gray-500 dark:text-gray-400">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800 ${className}`} />;
}

export function ToolSkeleton({ variant = "twoColumn" }) {
  if (variant === "dashboard") {
    return (
      <section className="page-shell fade-in">
        <Skeleton className="mb-3 h-4 w-28" />
        <Skeleton className="mb-3 h-10 w-full max-w-xl" />
        <Skeleton className="mb-8 h-5 w-full max-w-2xl" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <Card key={item}>
              <Skeleton className="h-12 w-12" />
              <Skeleton className="mt-6 h-9 w-24" />
              <Skeleton className="mt-3 h-4 w-36" />
            </Card>
          ))}
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card>
            <Skeleton className="h-7 w-48" />
            <div className="mt-6 space-y-4">
              {[0, 1, 2, 3].map((item) => (
                <Skeleton key={item} className="h-12 w-full" />
              ))}
            </div>
          </Card>
          <Card>
            <Skeleton className="h-7 w-40" />
            <Skeleton className="mt-6 h-32 w-full" />
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="page-shell fade-in">
      <Skeleton className="mb-3 h-4 w-28" />
      <Skeleton className="mb-3 h-10 w-full max-w-xl" />
      <Skeleton className="mb-8 h-5 w-full max-w-2xl" />
      <div className={`grid gap-5 ${variant === "narrow" ? "lg:grid-cols-[440px_1fr]" : "lg:grid-cols-2"}`}>
        {[0, 1].map((item) => (
          <Card key={item}>
            <Skeleton className="h-7 w-40" />
            <Skeleton className="mt-5 h-72 w-full" />
            <div className="mt-4 flex gap-3">
              <Skeleton className="h-11 w-32" />
              <Skeleton className="h-11 w-24" />
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function Alert({ type = "error", title, description, actionLabel, onAction, className = "" }) {
  const isSuccess = type === "success";

  return (
    <div
      className={`rounded-2xl border px-4 py-3 ${
        isSuccess
          ? "border-emerald-100 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300"
          : "border-red-100 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/60 dark:text-red-400"
      } ${className}`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl ${
            isSuccess ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" : "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400"
          }`}
        >
          <Icon name={isSuccess ? "check" : "alert"} className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{title}</p>
          {description && <p className="mt-1 text-sm leading-6 opacity-85">{description}</p>}
          {actionLabel && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="mt-3 rounded-xl bg-white/80 px-3 py-2 text-sm font-semibold transition hover:bg-white"
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ErrorAlert(props) {
  return <Alert type="error" {...props} />;
}

export function SuccessAlert(props) {
  return <Alert type="success" {...props} />;
}

export function ToolWorkspace({
  eyebrow,
  title,
  description,
  action,
  error,
  onRetry,
  input,
  result,
  inputClassName = "",
  resultClassName = "",
  gridClassName = "lg:grid-cols-2",
}) {
  return (
    <section className="page-shell fade-in">
      <PageHeader eyebrow={eyebrow} title={title} description={description} action={action} />
      {error && (
        <ErrorAlert
          className="mb-5"
          title="Something went wrong"
          description={error}
          actionLabel={onRetry ? "Retry" : undefined}
          onAction={onRetry}
        />
      )}
      <div className={`grid gap-5 ${gridClassName}`}>
        <div className={inputClassName}>{input}</div>
        <div className={resultClassName}>{result}</div>
      </div>
    </section>
  );
}

export function StatCard({ title, value, icon, trend, iconAccent = "indigo" }) {
  const iconClasses =
    iconAccent === "gold"
      ? "icon-gold"
      : "grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400";

  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <span className={iconClasses}>
          <Icon name={icon} />
        </span>
        {trend && <span className="badge border-gray-200 bg-gray-50 text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">{trend}</span>}
      </div>
      <p className="mt-6 text-4xl font-bold text-gray-950 dark:text-gray-50">{value}</p>
      <p className="mt-2 text-sm font-semibold text-gray-500 dark:text-gray-400">{title}</p>
    </Card>
  );
}

export function SegmentedControl({ options, value, onChange, className = "" }) {
  return (
    <div className={`grid rounded-2xl bg-gray-100 dark:bg-gray-800 p-1 ${className}`} style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((option) => {
        const optionValue = typeof option === "string" ? option : option.value;
        const label = typeof option === "string" ? option : option.label;

        return (
          <button
            key={optionValue}
            type="button"
            onClick={() => onChange(optionValue)}
            className={`rounded-xl px-3 py-2 text-sm font-semibold capitalize transition ${
              value === optionValue
                ? "bg-white text-indigo-700 shadow-sm dark:bg-gray-700 dark:text-indigo-300"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function ExamplePanel({ title = "Examples", examples, onSelect, className = "" }) {
  return (
    <Card className={className}>
      <h3 className="card-title">{title}</h3>
      <div className="mt-4 grid gap-2">
        {examples.map((example) => (
          <button
            key={example.id || example.title}
            type="button"
            onClick={() => onSelect(example)}
            className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-left transition hover:border-indigo-200 hover:bg-indigo-50 dark:border-gray-700 dark:bg-gray-800/60 dark:hover:border-indigo-700 dark:hover:bg-indigo-900/30"
          >
            <span className="block text-sm font-semibold text-gray-900 dark:text-gray-100">{example.title}</span>
            {example.description && (
              <span className="mt-1 block text-sm leading-6 text-gray-500 dark:text-gray-400">
                {example.description}
              </span>
            )}
          </button>
        ))}
      </div>
    </Card>
  );
}

export function HistoryPanel({ title = "Recent History", items, onReuse, onClear, renderItem }) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h3 className="card-title">{title}</h3>
        <Button type="button" variant="ghost" onClick={onClear} disabled={items.length === 0} className="px-3 py-2">
          Clear
        </Button>
      </div>
      <div className="mt-4 grid gap-2">
        {items.length === 0 ? (
          <p className="rounded-2xl bg-gray-50 dark:bg-gray-800/60 px-4 py-5 text-sm text-gray-500 dark:text-gray-400">
            Recent entries will appear here.
          </p>
        ) : (
          items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onReuse(item)}
              className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-left transition hover:border-indigo-200 hover:bg-indigo-50 dark:border-gray-700 dark:bg-gray-800/60 dark:hover:border-indigo-700 dark:hover:bg-indigo-900/30"
            >
              {renderItem ? renderItem(item) : (
                <>
                  <span className="block truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {item.title || item.input || item.output}
                  </span>
                  <span className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Icon name="clock" className="h-3 w-3" />
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                </>
              )}
            </button>
          ))
        )}
      </div>
    </Card>
  );
}

export function Field({ label, children, helper }) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      {children}
      {helper && <span className="mt-2 block helper-text">{helper}</span>}
    </label>
  );
}

export function EmptyState({ icon = "spark", title, description }) {
  return (
    <div className="grid min-h-80 place-items-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/40 p-6 text-center">
      <div>
        <span className="mx-auto icon-gold">
          <Icon name={icon} className="h-6 w-6" />
        </span>
        <p className="mt-4 font-semibold text-gray-900 dark:text-gray-100">{title}</p>
        {description && <p className="mt-2 helper-text">{description}</p>}
      </div>
    </div>
  );
}

export function LoginRequired({ message }) {
  return (
    <section className="page-shell fade-in">
      <Card className="mx-auto max-w-2xl text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400">
          <Icon name="user" />
        </span>
        <h1 className="mt-5 page-title">Login required</h1>
        <p className="mt-3 text-gray-500 dark:text-gray-400">
          {message || "Sign in to save your Tamil learning progress and analytics."}
        </p>
        <Button as={Link} to="/login" className="mt-6">
          Continue to login
          <Icon name="arrow" className="h-4 w-4" />
        </Button>
      </Card>
    </section>
  );
}
