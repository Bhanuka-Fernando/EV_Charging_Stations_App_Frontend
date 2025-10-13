import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import stationsApi from "../../api/stationsApi";

export default function StationsList() {
  const [q, setQ] = useState("");
  const [activeFilter, setActiveFilter] = useState("all"); // all|active|inactive
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const isActiveParam = useMemo(() => {
    if (activeFilter === "active") return true;
    if (activeFilter === "inactive") return false;
    return undefined;
  }, [activeFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await stationsApi.list({ q, isActive: isActiveParam, page, pageSize });
      const items = Array.isArray(data) ? data : data.items ?? [];
      const t = Array.isArray(data) ? items.length : (data.total ?? items.length);
      setRows(items);
      setTotal(t);
    } catch (e) {
      toast.error(e.message || "Failed to load stations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, [q, activeFilter, page]);

  const activate = async (r) => {
    try {
      if (!confirm(`Activate "${r.name}"?`)) return;
      await stationsApi.activate(r.id);
      toast.success("Station activated");
      fetchData();
    } catch (e) {
      toast.error(e.message || "Activation failed");
    }
  };

  const deactivate = async (r) => {
    try {
      if (!confirm(`Deactivate "${r.name}"?\nNote: denied if active bookings exist.`)) return;
      await stationsApi.deactivate(r.id);
      toast.success("Station deactivated");
      fetchData();
    } catch (e) {
      toast.error(e.message || "Deactivation failed (might have active bookings)");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Charging Stations</h1>
            <p className="text-xs text-gray-500">Create, edit, schedule, and manage availability.</p>
          </div>
          <Link to="/stations/new" className="rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2 text-sm">
            + New Station
          </Link>
        </div>

        {/* Filters */}
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 mb-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <input
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(1); }}
                placeholder="Search name, location"
                className="w-72 rounded-lg border px-3 py-2"
              />
              <select
                value={activeFilter}
                onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}
                className="rounded-lg border px-3 py-2"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="text-sm text-gray-500">
              {loading ? "Loading…" : `${rows.length} of ${total} shown`}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <Th>Name</Th>
                <Th>Type</Th>
                <Th>Total Slots</Th>
                <Th>Location</Th>
                <Th>Status</Th>
                <Th className="text-right pr-4">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading && <tr><td colSpan={6} className="p-6 text-center text-gray-400">Loading…</td></tr>}
              {!loading && rows.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-gray-400">No stations</td></tr>}
              {!loading && rows.map((r) => {
                const active = typeof r.isActive === "boolean" ? r.isActive : !!r.active;
                return (
                  <tr key={r.id} className="bg-white/60">
                    <Td className="font-medium">{r.name}</Td>
                    <Td>{r.type}</Td>
                    <Td>{r.totalSlots}</Td>
                    <Td>{r.location || "—"}</Td>
                    <Td><Badge color={active ? "green" : "gray"}>{active ? "Active" : "Inactive"}</Badge></Td>
                    <Td className="text-right pr-4 space-x-2">
                      <Link to={`/stations/${encodeURIComponent(r.id)}`} className="text-blue-600 hover:underline">Edit</Link>
                      <Link to={`/stations/${encodeURIComponent(r.id)}/schedule`} className="text-emerald-700 hover:underline">Schedule</Link>
                      {active
                        ? <button onClick={() => deactivate(r)} className="text-red-600 hover:underline">Deactivate</button>
                        : <button onClick={() => activate(r)} className="text-emerald-700 hover:underline">Activate</button>
                      }
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 text-sm">
          <div className="text-gray-500">Page {page}</div>
          <div className="flex gap-2">
            <button className="rounded-lg border px-3 py-1.5 disabled:opacity-50" disabled={page<=1} onClick={() => setPage(p => Math.max(1, p-1))}>Prev</button>
            <button className="rounded-lg border px-3 py-1.5 disabled:opacity-50" disabled={rows.length < pageSize} onClick={() => setPage(p => p+1)}>Next</button>
          </div>
        </div>
      </div>
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
    gray: "bg-gray-100 text-gray-700 border-gray-200",
  };
  return <span className={`inline-flex items-center rounded-full text-xs px-2 py-1 border ${map[color] || map.gray}`}>{children}</span>;
}
