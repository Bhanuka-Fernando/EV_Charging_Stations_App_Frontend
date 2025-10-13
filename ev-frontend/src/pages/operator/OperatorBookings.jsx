import { useEffect, useMemo, useState } from "react";
import usersApi from "../../api/usersApi";
import bookingsApi from "../../api/bookingsApi";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

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

  // KPIs (today only)
  const [kpi, setKpi] = useState({ pending: 0, approved: 0, completed: 0 });

  const todayYmd = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

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

  const isSameDay = (iso) => {
    if (!iso) return false;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return false;
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${m}-${dd}` === todayYmd;
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

      const normalized = items.map((b) => ({
        id: b.id ?? b.Id,
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
        slot: b.slotName ?? b.slot ?? b.slotId ?? "",
      }));

      const filtered = slot
        ? normalized.filter((r) => String(r.slot).toLowerCase().includes(slot.toLowerCase()))
        : normalized;

      setRows(filtered);
      setTotal(tot);

      const todayList = normalized.filter((r) => isSameDay(r.start));
      const lc = (s) => String(s || "").toLowerCase();
      setKpi({
        pending: todayList.filter((r) => lc(r.status) === "pending").length,
        approved: todayList.filter((r) => lc(r.status) === "approved").length,
        completed: todayList.filter((r) => lc(r.status) === "completed").length,
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
            <Link to="/operator/scan" className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">
              Scan / Verify QR
            </Link>
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
                          <Link to={`/bookings/${b.id}`} className="text-gray-700 hover:underline">
                            View
                          </Link>
                          <Link to="/operator/scan" className="text-gray-700 hover:underline">
                            Scan
                          </Link>
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
    </div>
  );
}
