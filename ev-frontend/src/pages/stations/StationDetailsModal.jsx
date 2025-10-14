import { useMemo } from "react";

/** Station details pop-up (button-free, sleek UI) */
export default function StationDetailsModal({ station, onClose }) {
  // Build a 7-day schedule preview
  const today = new Date();
  const next7 = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const iso = d.toISOString().slice(0, 10);
        return { iso, label: d.toLocaleDateString() };
      }),
    []
  );

  // schedule may be on either property
  const schedule = Array.isArray(station?.schedule)
    ? station.schedule
    : Array.isArray(station?.availability)
    ? station.availability
    : [];

  const totalSlots = numOrNull(station?.totalSlots ?? station?.capacity);
  const active = trueBool(station?.isActive ?? station?.active ?? station?.IsActive ?? true);

  // ——— robust reader: normalizes date + checks several field names
  const readAvail = (iso) => {
    if (!Array.isArray(schedule)) return null;

    const sameDay = (v) => {
      if (!v) return undefined;
      if (v instanceof Date) return v.toISOString().slice(0, 10);
      if (typeof v === "string") return v.slice(0, 10); // supports 'YYYY-MM-DDTHH:mm:ss'
      return undefined;
    };

    const row =
      schedule.find((x) => sameDay(x.date ?? x.day) === iso) ??
      schedule.find((x) => sameDay(x.date ?? x.day)?.startsWith?.(iso));

    if (!row) return null;

    // try common keys
    const raw =
      row.available ??
      row.availableSlots ??
      row.remaining ??
      row.capacity ??
      row.slots ??
      row.value ??
      row.count;

    let n = numOrNull(raw);

    // Derive from total - booked if provided
    if (!Number.isFinite(n)) {
      const booked =
        numOrNull(row.booked) ??
        numOrNull(row.reserved) ??
        numOrNull(row.approved) ??
        null;
      if (Number.isFinite(totalSlots) && Number.isFinite(booked)) {
        n = Math.max(0, totalSlots - booked);
      }
    }
    return Number.isFinite(n) ? n : null;
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4">
      <div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/10">
        {/* Header */}
        <div className="relative border-b">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 via-white to-slate-50" />
          <div className="relative flex items-start justify-between px-6 py-5">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-emerald-600">🔋</span>
                <h3 className="truncate text-lg font-semibold text-gray-900">
                  {station?.name ?? "Station"}
                </h3>
                <span className="truncate text-sm text-gray-500">({station?.type ?? "—"})</span>
              </div>
              <p className="mt-1 line-clamp-1 text-sm text-gray-500">
                {station?.location ?? station?.city ?? station?.town ?? "—"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Pill color={active ? "emerald" : "slate"}>{active ? "Active" : "Inactive"}</Pill>
              <button
                onClick={onClose}
                className="rounded-lg px-2 py-1 text-gray-500 hover:bg-gray-100"
                aria-label="Close"
                title="Close"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Body with subtle gradient */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white via-emerald-50/[0.12] to-white" />
          <div className="relative px-6 py-5">
            {/* Info cards grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoCard label="TOTAL SLOTS" value={fmtNum(totalSlots)} />
              <InfoCard label="CREATED" value={fmtDate(station?.createdAtUtc || station?.createdAt)} />
              <InfoCard label="UPDATED" value={fmtDate(station?.updatedAtUtc || station?.updatedAt)} />
              <InfoCard label="LATITUDE" value={station?.lat ?? station?.latitude ?? "—"} />
              <InfoCard label="LONGITUDE" value={station?.lng ?? station?.longitude ?? "—"} />
            </div>

            {/* Schedule preview */}
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="font-medium text-gray-900">Availability (next 7 days)</h4>
                {Number.isFinite(totalSlots) && (
                  <span className="text-xs text-gray-500">
                    Total slots: <strong className="text-gray-700">{totalSlots}</strong>
                  </span>
                )}
              </div>

              <div className="overflow-hidden rounded-xl border">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50/90 backdrop-blur text-gray-600">
                    <tr>
                      <Th>Date</Th>
                      <Th>Available</Th>
                      <Th>Total</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {next7.map(({ iso, label }, idx) => {
                      const a = readAvail(iso);
                      const zebra = idx % 2 === 1 ? "bg-gray-50/60" : "bg-white";
                      return (
                        <tr key={iso} className={`${zebra} border-t last:border-b`}>
                          <Td>{label}</Td>
                          <Td>
                            {Number.isFinite(a) ? (
                              <span className="inline-flex min-w-[3ch] items-center justify-center rounded-md bg-emerald-50 px-2 py-0.5 text-emerald-700 ring-1 ring-emerald-100">
                                {a}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </Td>
                          <Td>{fmtNum(totalSlots)}</Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <p className="mt-2 text-xs text-gray-500">
                Values come from the station’s saved schedule. If a day isn’t configured, availability shows as “—”.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------- small UI/format helpers --------------------- */

function InfoCard({ label, value }) {
  return (
    <div className="rounded-xl border bg-white/80 px-4 py-3 shadow-sm ring-1 ring-black/5">
      <div className="text-[10px] font-medium tracking-wider text-gray-500">{label}</div>
      <div className="mt-1 text-sm font-medium text-gray-900">{value ?? "—"}</div>
    </div>
  );
}

function Pill({ children, color = "slate" }) {
  const map = {
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs ring-1 ${map[color] || map.slate}`}>
      {children}
    </span>
  );
}

function Th({ children }) {
  return <th className="px-4 py-2 text-left text-xs font-medium">{children}</th>;
}
function Td({ children, className = "" }) {
  return <td className={`px-4 py-2 text-sm text-gray-800 ${className}`}>{children}</td>;
}

function trueBool(v) { return v === true || v === "true" || v === 1 || v === "1"; }
function numOrNull(v) {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function fmtNum(v) {
  return Number.isFinite(v) ? v : "—";
}
function fmtDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d) ? "—" : d.toLocaleString();
}
