import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import bookingsApi from "../../api/bookingsApi";
import ownersApi from "../../api/ownersApi";
import stationsApi from "../../api/stationsApi";
import { useRole } from "../../auth/useRole";

/* ─── Table Helpers ─────────────────────────────── */
function Th({ children, className = "" }) {
  return (
    <th
      className={`text-left font-semibold px-5 py-3 border-b text-gray-700 ${className}`}
    >
      {children}
    </th>
  );
}
function Td({ children, className = "" }) {
  return <td className={`px-5 py-3 ${className}`}>{children}</td>;
}
function Badge({ children, color = "gray" }) {
  const map = {
    green: "bg-emerald-100/80 text-emerald-800 border-emerald-200",
    blue: "bg-blue-100/80 text-blue-800 border-blue-200",
    gray: "bg-gray-100 text-gray-700 border-gray-200",
    red: "bg-red-100/80 text-red-800 border-red-200",
    amber: "bg-amber-100/80 text-amber-800 border-amber-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full text-xs font-medium px-2.5 py-1 border transition-all duration-150 ${
        map[color] || map.gray
      }`}
    >
      {children}
    </span>
  );
}

/* ─── Main Component ─────────────────────────────── */
export default function BookingsList() {
  const role = useRole();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fmt = (iso) => {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      if (isNaN(d)) return "—";
      return d.toLocaleString();
    } catch {
      return "—";
    }
  };

  const statusBadge = (s) => {
    const x = String(s || "").toLowerCase();
    if (x === "pending") return <Badge color="amber">Pending</Badge>;
    if (x === "approved") return <Badge color="blue">Approved</Badge>;
    if (x === "completed") return <Badge color="green">Completed</Badge>;
    if (x === "cancelled") return <Badge color="red">Cancelled</Badge>;
    return <Badge>—</Badge>;
  };

  /* ─── Fetch Bookings with Owners and Stations ─── */
  const fetchData = async () => {
    try {
      setLoading(true);

      const [bookRes, ownersRes, stationsRes] = await Promise.all([
        bookingsApi.list({ pageSize: 1000 }),
        ownersApi.list({ pageSize: 1000 }),
        stationsApi.list({ pageSize: 1000 }),
      ]);

      const bookings = (Array.isArray(bookRes) ? bookRes : bookRes.items ?? []).map((b) => ({
        id: b._id || b.id,
        nic: b.Nic || b.nic,
        stationId: String(b.StationId || b.stationId || "").trim(),
        startTime: b.StartTimeUtc || b.startTimeUtc || b.startTime,
        endTime: b.EndTimeUtc || b.endTimeUtc || b.endTime,
        status: b.Status || b.status,
      }));

      // normalize owners
      const owners = Array.isArray(ownersRes.items) ? ownersRes.items : ownersRes;
      const ownerMap = {};
      owners.forEach((o) => {
        const nic = String(o.Nic || o.nic || "").trim();
        ownerMap[nic] = o.FullName || o.fullName || "—";
      });

      // normalize stations
      const stations = Array.isArray(stationsRes.items)
        ? stationsRes.items
        : stationsRes;
      const stationMap = {};
      stations.forEach((s) => {
        const id = String(s._id || s.id || "").trim();
        stationMap[id] = s.Name || s.name || "—";
      });

      const enriched = bookings.map((b) => ({
        ...b,
        ownerName: ownerMap[b.nic] || "—",
        ownerNic: b.nic || "—",
        stationName: stationMap[b.stationId] || "—",
      }));

      setRows(enriched);
      setTotal(enriched.length);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      toast.error(err.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ─── Filters ───────────────────────────────────── */
  const filtered = rows.filter((b) => {
    const qLower = q.toLowerCase();
    const matchesQuery =
      !q ||
      b.id?.toLowerCase().includes(qLower) ||
      b.ownerNic?.toLowerCase().includes(qLower) ||
      b.ownerName?.toLowerCase().includes(qLower) ||
      b.stationName?.toLowerCase().includes(qLower);

    const matchesStatus =
      status === "All" || String(b.status).toLowerCase() === status.toLowerCase();

    const matchesDate =
      (!from || new Date(b.startTime) >= new Date(from)) &&
      (!to || new Date(b.endTime) <= new Date(to));

    return matchesQuery && matchesStatus && matchesDate;
  });

  /* ─── Render ────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100">
      <Toaster />
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
              Bookings
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              View, filter, and search all bookings easily.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-2xl bg-white/80 backdrop-blur-sm p-5 shadow-sm border border-gray-200 mb-6">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by Booking ID / NIC / Station / Owner"
              className="rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option>All</option>
              <option>Pending</option>
              <option>Approved</option>
              <option>Completed</option>
              <option>Cancelled</option>
            </select>
            <div className="flex flex-wrap gap-3">
              <input
                type="datetime-local"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none w-[190px]"
              />
              <input
                type="datetime-local"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none w-[190px]"
              />
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-500">
            {loading ? "Loading…" : `${filtered.length} of ${total} shown`}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-md border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <Th>Owner</Th>
                <Th>Owner NIC</Th>
                <Th>Station</Th>
                <Th>Start Time</Th>
                <Th>End Time</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-400">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-400">
                    No bookings found
                  </td>
                </tr>
              )}
              {!loading &&
                filtered.map((b, i) => {
                  const bg = i % 2 === 0 ? "bg-white" : "bg-gray-50/80";
                  return (
                    <tr
                      key={b.id}
                      className={`transition-colors ${bg} hover:bg-emerald-50/40`}
                    >
                      <Td className="font-medium text-gray-800">{b.ownerName}</Td>
                      <Td>{b.ownerNic}</Td>
                      <Td>{b.stationName}</Td>
                      <Td>{fmt(b.startTime)}</Td>
                      <Td>{fmt(b.endTime)}</Td>
                      <Td>{statusBadge(b.status)}</Td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
