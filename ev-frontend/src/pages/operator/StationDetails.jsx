import { useEffect, useMemo, useState } from "react";
import usersApi from "../../api/usersApi";
import stationsApi from "../../api/stationsApi";
import bookingsApi from "../../api/bookingsApi";
import toast from "react-hot-toast";

function Card({ title, children, right }) {
  return (
    <div className="rounded-2xl border bg-white">
      <div className="px-5 py-4 border-b flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        {right}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({ label, value, action }) {
  return (
    <div className="grid grid-cols-3 gap-4 py-1 items-center">
      <div className="text-gray-500 text-sm">{label}</div>
      <div className="col-span-2 flex items-center gap-2">
        <div className="text-sm text-gray-900">{value ?? "—"}</div>
        {action}
      </div>
    </div>
  );
}

function Badge({ children, color = "gray" }) {
  const map = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    gray: "bg-gray-100 text-gray-700 border-gray-200",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    red: "bg-rose-50 text-rose-700 border-rose-100",
  };
  return (
    <span className={`inline-flex items-center rounded-full text-xs px-2 py-1 border ${map[color] || map.gray}`}>
      {children}
    </span>
  );
}

function CopyBtn({ text, label = "Copy" }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try { await navigator.clipboard.writeText(String(text)); setOk(true); setTimeout(() => setOk(false), 1200); }
        catch { /* ignore */ }
      }}
      className="text-xs rounded border px-2 py-1 hover:bg-gray-50"
      title="Copy to clipboard"
    >
      {ok ? "Copied" : label}
    </button>
  );
}

export default function StationDetails() {
  const [stationId, setStationId] = useState("");
  const [station, setStation] = useState(null);
  const [loading, setLoading] = useState(true);

  // for slot overview
  const [activeNow, setActiveNow] = useState(0);

  const today = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  useEffect(() => {
    (async () => {
      try {
        // Determine operator's assigned station (first one)
        const meRaw = await usersApi.getMyProfile();
        const me = meRaw?.profile ?? meRaw;
        const ids = me?.stationIds || me?.StationIds || [];
        if (!ids.length) {
          toast.error("No station assigned to your account. Please contact Backoffice.");
          setLoading(false);
          return;
        }
        const sid = ids[0];
        setStationId(sid);

        // Load station
        const st = await stationsApi.get(sid);
        setStation(st);

        // For slot overview, count APPROVED bookings active *now*
        const from = `${today}T00:00:00Z`;
        const to = `${today}T23:59:59Z`;
        const res = await bookingsApi.list({ status: "Approved", from, to, page: 1, pageSize: 200 });
        const items = Array.isArray(res) ? res : res.items ?? [];
        const now = Date.now();
        const active = items
          .filter(b => (b.stationId ?? b.StationId) === sid)
          .filter(b => {
            const s = new Date(b.startTimeUtc ?? b.startTime ?? b.StartTimeUtc ?? b.StartTime).getTime();
            const e = new Date(b.endTimeUtc ?? b.endTime ?? b.EndTimeUtc ?? b.EndTime).getTime();
            return Number.isFinite(s) && Number.isFinite(e) && s <= now && now < e;
          }).length;
        setActiveNow(active);
      } catch (e) {
        toast.error(e?.message || "Failed to load station details");
      } finally {
        setLoading(false);
      }
    })();
  }, [today]);

  // Derived
  const totalSlots = station?.totalSlots ?? station?.TotalSlots ?? 0;
  const schedule = station?.schedule ?? station?.Schedule ?? [];
  const todaySched = schedule.find((d) => (d.date ?? d.Date) === today);
  const todayAvail = todaySched?.availableSlots ?? todaySched?.AvailableSlots ?? totalSlots;

  const lat = station?.lat ?? station?.Lat;
  const lng = station?.lng ?? station?.Lng;
  const mapSrc =
    typeof lat === "number" && typeof lng === "number"
      ? `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`
      : null;

  // Build a synthetic per-slot status list (no server-side slot IDs available)
  // Slots 1..N -> mark first "activeNow" as Occupied, rest as Open; if todayAvail === 0 then Closed.
  const slots = Array.from({ length: Math.max(0, totalSlots) }, (_, i) => {
    if (todaySched && Number(todayAvail) === 0) return { name: `Slot ${i + 1}`, status: "Closed", color: "red" };
    if (i < activeNow) return { name: `Slot ${i + 1}`, status: "Occupied", color: "amber" };
    return { name: `Slot ${i + 1}`, status: "Open", color: "green" };
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Station Details
              {station ? <span className="text-gray-400"> — {station.name ?? station.Name}</span> : ""}
            </h1>
            <p className="text-xs text-gray-500">Read-only overview for operators.</p>
          </div>
        </div>

        {loading && (
          <div className="rounded-2xl border bg-white p-6 text-sm text-gray-500">Loading…</div>
        )}

        {!loading && (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left column (2) */}
            <div className="lg:col-span-2 grid gap-6 md:grid-cols-2">
              <Card
                title="Station Information"
                right={
                  (station?.isActive ?? station?.IsActive)
                    ? <Badge color="green">Active</Badge>
                    : <Badge>Inactive</Badge>
                }
              >
                <div className="space-y-1">
                  <Field label="Name" value={station?.name ?? station?.Name ?? "—"} />
                  <Field label="Type" value={station?.type ?? station?.Type ?? "—"} />
                  <Field label="Location" value={station?.location ?? station?.Location ?? "—"} />
                  <Field
                    label="Lat/Lng"
                    value={`${lat ?? "—"}, ${lng ?? "—"}`}
                    action={(typeof lat === "number" && typeof lng === "number") && (
                      <CopyBtn text={`${lat}, ${lng}`} />
                    )}
                  />
                  <Field label="Total Slots" value={totalSlots} />
                  <Field label="Capacity (today)" value={`${todayAvail} / ${totalSlots}`} />
                </div>
              </Card>

              <Card title="Map">
                {mapSrc ? (
                  <div className="rounded-xl overflow-hidden border">
                    <iframe
                      title="Station map"
                      src={mapSrc}
                      width="100%"
                      height="320"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No coordinates available.</div>
                )}
              </Card>

              <Card
                title="Slots Overview"
                right={<div className="text-xs text-gray-500">{activeNow} in use • {totalSlots - activeNow} free</div>}
              >
                {totalSlots === 0 ? (
                  <div className="text-sm text-gray-500">No slots configured.</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {slots.map((s) => (
                      <div key={s.name} className="flex items-center gap-2 rounded-lg border px-2 py-1">
                        <span className="text-xs text-gray-700">{s.name}</span>
                        <Badge color={s.color}>{s.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Right column (1) */}
            <div className="space-y-6">
              <Card title="Notices / Maintenance">
                <div className="text-sm text-gray-500">No notices.</div>
              </Card>

              <Card title="Contact Backoffice">
                <div className="text-sm text-gray-700 space-y-1">
                  <div><span className="text-gray-500">Email:</span> <a className="text-blue-600 hover:underline" href="mailto:admin@ev.local">admin@ev.local</a></div>
                  <div><span className="text-gray-500">Phone:</span> <a className="text-blue-600 hover:underline" href="tel:+94771234567">+94 77 123 4567</a></div>
                  <p className="text-gray-500 mt-2">For station data changes (name, AC/DC, slots) please contact Backoffice.</p>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
