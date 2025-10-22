// src/pages/operator/OperatorBookings.jsx
import { useEffect, useMemo, useState } from "react";
import usersApi from "../../api/usersApi";
import bookingsApi from "../../api/bookingsApi";
import toast from "react-hot-toast";

/* ---------------- Small UI bits ---------------- */
function Kpi({ title, primary = "—", secondary = "" }) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <p className="text-sm text-gray-500">{title}</p>
      <div className="mt-2 text-2xl font-semibold text-gray-900">{primary}</div>
      {secondary && <div className="text-xs text-gray-500 mt-0.5">{secondary}</div>}
    </div>
  );
}
function Th({ children, className = "" }) {
  return <th className={`text-left font-medium px-4 py-3 border-b ${className}`}>{children}</th>;
}
function Td({ children, className = "" }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}
function Badge({ children, color = "gray" }) {
  const map = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    gray: "bg-gray-100 text-gray-700 border-gray-200",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
  };
  return (
    <span className={`inline-flex items-center rounded-full text-xs px-2 py-1 border ${map[color] || map.gray}`}>
      {children}
    </span>
  );
}
function Detail({ label, value }) {
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-sm font-medium text-gray-900 break-words">{value ?? "—"}</div>
    </div>
  );
}

/* ---------------- Booking Details Modal ---------------- */
function BookingDetailsModal({ open, id, onClose }) {
  const [loading, setLoading] = useState(false);
  const [b, setB] = useState(null);

  useEffect(() => {
    if (!open || !id) return;
    (async () => {
      try {
        setLoading(true);
        let data;
        if (typeof bookingsApi.get === "function") data = await bookingsApi.get(id);
        else if (typeof bookingsApi.details === "function") data = await bookingsApi.details(id);
        else if (typeof bookingsApi.getById === "function") data = await bookingsApi.getById(id);
        if (!data) throw new Error("Booking details endpoint not available.");
        setB(data);
      } catch (e) {
        toast.error(e?.response?.data?.message || e?.message || "Failed to load booking");
      } finally {
        setLoading(false);
      }
    })();
  }, [open, id]);

  const fmt = (v) => {
    if (!v) return "—";
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString();
  };

  const ownerName =
    b?.ownerFullName ??
    b?.ownerName ??
    b?.owner?.fullName ??
    b?.ownerNic ?? // fallback to NIC if no name
    b?.nic ??
    "—";

  const ownerEmail =
    b?.ownerEmail ??
    b?.owner?.email ??
    b?.email ??
    b?.ownerEmailAddress ??
    "—";

  const stationLabel =
    b?.stationName ??
    b?.station?.name ??
    b?.stationCode ??
    b?.stationId ??
    "—";

  const slotLabel =
    b?.slotName ??
    b?.slotLabel ??
    b?.slot?.name ??
    b?.slot?.label ??
    b?.slotCode ??
    b?.connectorName ??
    b?.portName ??
    b?.slotNumber ??
    b?.slotNo ??
    b?.SlotNo ??
    b?.slotId ??
    b?.SlotId ??
    b?.slot ??
    "—";

  const vehicleLabel =
    b?.vehicle?.model ??
    b?.vehicle?.name ??
    b?.vehicleModel ??
    b?.vehicleNumber ??
    b?.licensePlate ??
    "—";

  const energyLabel = b?.energyKwh ?? b?.energy ?? b?.kwh ?? "—";
  const priceLabel =
    b?.price !== undefined
      ? `LKR ${b.price}`
      : b?.amount !== undefined
      ? `LKR ${b.amount}`
      : "—";
  const qrOrCode = b?.qrCode ?? b?.code ?? b?.verificationCode ?? "—";
  const notes = b?.notes ?? b?.remark ?? b?.remarks ?? "—";
  const status = b?.status ?? b?.Status ?? "—";
  const created =
    b?.createdAtUtc ?? b?.createdAt ?? b?.CreatedAtUtc ?? b?.CreatedAt ?? null;
  const start =
    b?.startTimeUtc ?? b?.startTime ?? b?.StartTimeUtc ?? b?.StartTime ?? null;
  const end =
    b?.endTimeUtc ?? b?.endTime ?? b?.EndTimeUtc ?? b?.EndTime ?? null;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">
            {/* Show EV owner’s name in header as requested */}
            Booking — {ownerName}
          </h3>
          <button
            className="text-xl leading-none text-gray-500 hover:text-gray-800"
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        <div className="p-6">
          {loading && <div className="text-sm text-gray-500">Loading…</div>}
          {!loading && (
            <div className="grid md:grid-cols-2 gap-4">
              <Detail label="Status" value={status} />
              <Detail label="Created" value={fmt(created)} />

              <Detail label="Owner Name" value={ownerName} />
              <Detail label="Owner Email" value={ownerEmail} />

              <Detail label="Station" value={stationLabel} />
              <Detail label="Slot" value={slotLabel} />

              <Detail label="Start" value={fmt(start)} />
              <Detail label="End" value={fmt(end)} />

              <Detail label="Vehicle" value={vehicleLabel} />
              <Detail label="Energy (kWh)" value={energyLabel} />
              <Detail label="Price" value={priceLabel} />
              <Detail label="QR / Code" value={qrOrCode} />
              <Detail label="Notes" value={notes} />
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t flex justify-end">
          <button className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------ Main Page ------------------------ */
export default function OperatorBookings() {
  const [stationId, setStationId] = useState("");
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // filters
  const [status, setStatus] = useState("All");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [slot, setSlot] = useState("");

  // paging
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // KPIs
  const [kpi, setKpi] = useState({ pending: 0, approved: 0, completed: 0 });

  // “today” helpers (UTC + Local) with fallback logic
  const todayUtcYmd = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const todayLocalYmd = useMemo(() => new Date().toLocaleDateString("en-CA"), []);
  const ymdUTC = (val) => {
    const d = new Date(val);
    return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
  };
  const ymdLocal = (val) => {
    const d = new Date(val);
    return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-CA");
  };

  // view modal state
  const [viewOpen, setViewOpen] = useState(false);
  const [viewId, setViewId] = useState("");

  useEffect(() => {
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 7);
    setFrom(start.toISOString().slice(0, 10));
    setTo(end.toISOString().slice(0, 10));
  }, []);

  // get my station
  useEffect(() => {
    (async () => {
      try {
        const meRaw = await usersApi.getMyProfile();
        const me = meRaw?.profile ?? meRaw;
        const ids = me?.stationIds || me?.StationIds || [];
        if (!ids.length) {
          toast.error("No station assigned to your account. Please contact Backoffice.");
          setLoading(false);
          return;
        }
        setStationId(ids[0]);
      } catch (e) {
        toast.error(e?.message || "Failed to load profile");
        setLoading(false);
      }
    })();
  }, []);

  const format = (v) => {
    if (!v) return "—";
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
  };

  // tolerant slot label for table
  const toSlotLabel = (b) => {
    const v =
      b.slotName ??
      b.slotLabel ??
      b.slot?.name ??
      b.slot?.label ??
      b.slotCode ??
      b.connectorName ??
      b.portName ??
      b.slotNumber ??
      b.slotNo ??
      b.SlotNo ??
      b.slotId ??
      b.SlotId ??
      b.slot ??
      "";
    return (v === 0 || v) ? String(v) : "";
  };

  async function load() {
    if (!stationId || !from || !to) return;
    try {
      setLoading(true);
      const data = await bookingsApi.list({
        status,
        from: `${from}T00:00:00Z`,
        to: `${to}T23:59:59Z`,
        page,
        pageSize,
      });

      const items = Array.isArray(data) ? data : data.items ?? [];
      const tot = Array.isArray(data) ? items.length : data.total ?? items.length;

      const normalized = items
        .map((b) => ({
          id: b.id ?? b.Id,
          stationId: b.stationId ?? b.StationId,
          status: b.status ?? b.Status,
          start: b.startTimeUtc ?? b.startTime ?? b.StartTimeUtc ?? b.StartTime,
          end: b.endTimeUtc ?? b.endTime ?? b.EndTimeUtc ?? b.EndTime,
          owner:
            b.ownerFullName ??
            b.owner?.fullName ??
            b.ownerName ??
            b.ownerNic ??
            b.nic ??
            "—",
          slot: toSlotLabel(b),
        }))
        .filter((r) => !r.stationId || r.stationId === stationId);

      const filtered = slot
        ? normalized.filter((r) => String(r.slot).toLowerCase().includes(slot.toLowerCase()))
        : normalized;

      setRows(filtered);
      setTotal(tot);

      // KPIs: try "today" (UTC or local); if empty, fall back to current results
      const todayList = normalized.filter(
        (r) => ymdUTC(r.start) === todayUtcYmd || ymdLocal(r.start) === todayLocalYmd
      );
      const base = todayList.length ? todayList : normalized;
      const lc = (s) => String(s || "").toLowerCase();
      setKpi({
        pending: base.filter((r) => lc(r.status) === "pending").length,
        approved: base.filter((r) => lc(r.status) === "approved").length,
        completed: base.filter((r) => lc(r.status) === "completed").length,
      });
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stationId, status, from, to, page]);

  async function approve(id) {
    try {
      await bookingsApi.approve(id);
      toast.success("Booking approved");
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Approve failed");
    }
  }

  async function complete(id) {
    try {
      await bookingsApi.finalize(id);
      toast.success("Session completed");
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Complete failed");
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const distinctSlots = Array.from(new Set(rows.map((r) => r.slot).filter(Boolean)));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Bookings</h1>
            <p className="text-xs text-gray-500">This station only.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={load} className="rounded-lg bg-gray-900 text-white px-3 py-2 text-sm hover:bg-black">
              Refresh
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <Kpi title="Today – Pending" primary={kpi.pending} secondary="Awaiting approval" />
          <Kpi title="Today – Approved" primary={kpi.approved} secondary="Ready to start" />
          <Kpi title="Today – Completed" primary={kpi.completed} secondary="Finished sessions" />
        </div>

        {/* Filters */}
        <div className="rounded-2xl border bg-white p-3 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Date from</label>
              <input
                type="date"
                className="w-full rounded-lg border px-3 py-2"
                value={from}
                onChange={(e) => { setPage(1); setFrom(e.target.value); }}
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Date to</label>
              <input
                type="date"
                className="w-full rounded-lg border px-3 py-2"
                value={to}
                onChange={(e) => { setPage(1); setTo(e.target.value); }}
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-2">Status</label>
              <select
                className="w-full rounded-lg border px-3 py-2"
                value={status}
                onChange={(e) => { setPage(1); setStatus(e.target.value); }}
              >
                {["All", "Pending", "Approved", "Completed", "Cancelled"].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-2">Slot</label>
              <input
                className="w-full rounded-lg border px-3 py-2"
                placeholder="Filter by slot…"
                value={slot}
                onChange={(e) => setSlot(e.target.value)}
                list="slotOptions"
              />
              <datalist id="slotOptions">
                {distinctSlots.map((s) => <option key={s} value={s} />)}
              </datalist>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border bg-white">
          <div className="p-5 border-b flex items-center justify-between">
            <h2 className="font-semibold">Results</h2>
            <div className="text-sm text-gray-500">
              {loading ? "Loading…" : `${rows.length} / ${total} shown`}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <Th>Owner</Th>
                  <Th>Slot</Th>
                  <Th>Start</Th>
                  <Th>End</Th>
                  <Th>Status</Th>
                  <Th className="text-right pr-4">Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-gray-400">
                      Loading…
                    </td>
                  </tr>
                )}

                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-gray-400">
                      No bookings in this range.
                    </td>
                  </tr>
                )}

                {!loading &&
                  rows.map((b) => {
                    const st = String(b.status || "").toLowerCase();
                    const color =
                      st === "pending" ? "amber" :
                      st === "approved" ? "blue" :
                      st === "completed" ? "green" : "gray";

                    return (
                      <tr key={b.id} className="bg-white/60">
                        <Td>{b.owner}</Td>
                        <Td>{b.slot || "—"}</Td>
                        <Td>{format(b.start)}</Td>
                        <Td>{format(b.end)}</Td>
                        <Td><Badge color={color}>{b.status}</Badge></Td>
                        <Td className="text-right pr-4 space-x-3">
                          {st === "pending" && (
                            <button onClick={() => approve(b.id)} className="text-blue-600 hover:underline">
                              Approve
                            </button>
                          )}
                          {st === "approved" && (
                            <button onClick={() => complete(b.id)} className="text-emerald-700 hover:underline">
                              Complete
                            </button>
                          )}
                          <button
                            onClick={() => { setViewId(b.id); setViewOpen(true); }}
                            className="text-gray-700 hover:underline"
                          >
                            View
                          </button>
                        </Td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-3 border-t text-sm">
            <div className="text-gray-500">Page {page} of {Math.max(1, Math.ceil(total / pageSize))}</div>
            <div className="space-x-2">
              <button
                className="rounded-lg border px-3 py-1.5 disabled:opacity-50"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Prev
              </button>
              <button
                className="rounded-lg border px-3 py-1.5 disabled:opacity-50"
                onClick={() => setPage((p) => Math.min(Math.max(1, Math.ceil(total / pageSize)), p + 1))}
                disabled={page >= Math.max(1, Math.ceil(total / pageSize))}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      <BookingDetailsModal
        open={viewOpen}
        id={viewId}
        onClose={() => setViewOpen(false)}
      />
    </div>
  );
}
