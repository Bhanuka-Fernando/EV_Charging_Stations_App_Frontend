import { useEffect, useState } from "react";
import ownersApi from "../../api/ownersApi";
import { Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

export default function OwnersList() {
  const [q, setQ] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [allRows, setAllRows] = useState([]);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch all owners
  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await ownersApi.list({ page: 1, pageSize: 1000 });
      const items = Array.isArray(data) ? data : data.items ?? [];
      setAllRows(items);
    } catch (e) {
      toast.error(e.message || "Failed to load owners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter and paginate
  useEffect(() => {
    let filtered = allRows;
    if (q.trim()) {
      const qLower = q.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.nic?.toLowerCase().includes(qLower) ||
          r.fullName?.toLowerCase().includes(qLower) ||
          r.email?.toLowerCase().includes(qLower) ||
          r.phone?.toLowerCase().includes(qLower)
      );
    }

    if (activeFilter !== "all") {
      const shouldBeActive = activeFilter === "active";
      filtered = filtered.filter((r) => {
        const active =
          typeof r.isActive === "boolean"
            ? r.isActive
            : String(r.status || "").toLowerCase() === "active";
        return active === shouldBeActive;
      });
    }

    const start = (page - 1) * pageSize;
    const paginated = filtered.slice(start, start + pageSize);
    setRows(paginated);
    setTotal(filtered.length);
  }, [q, activeFilter, page, allRows, pageSize]);

  const activateOwner = async (r) => {
    try {
      if (!window.confirm(`Activate ${r.fullName || r.nic}?`)) return;
      await ownersApi.activate(r.nic, "Reactivated by Backoffice");
      toast.success("Owner activated");
      fetchData();
    } catch (e) {
      toast.error(e.message || "Activation failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100">
      <Toaster />
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
              EV Owners
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage owners by NIC. Deleting is blocked when bookings exist.
            </p>
          </div>
          <Link
            to="/owners/new"
            className="rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white px-5 py-2.5 text-sm font-medium shadow-sm transition-all duration-200"
          >
            + Create Owner
          </Link>
        </div>

        {/* Filters */}
        <div className="rounded-2xl bg-white/80 backdrop-blur-sm p-5 shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by NIC, name, email, phone"
                className="w-80 rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <select
                value={activeFilter}
                onChange={(e) => {
                  setActiveFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Deactivated</option>
              </select>
            </div>
            <div className="text-sm text-gray-500">
              {loading ? "Loading…" : `${rows.length} of ${total} shown`}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-md border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <Th>NIC</Th>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Phone</Th>
                <Th>Status</Th>
                <Th className="text-right pr-6">Actions</Th>
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
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-400">
                    No owners found
                  </td>
                </tr>
              )}
              {!loading &&
                rows.map((r, i) => {
                  const active =
                    typeof r.isActive === "boolean"
                      ? r.isActive
                      : String(r.status || "").toLowerCase() === "active";
                  const bg = i % 2 === 0 ? "bg-white" : "bg-gray-50/80";
                  return (
                    <tr
                      key={r.nic}
                      className={`transition-colors ${bg} hover:bg-emerald-50/40`}
                    >
                      <Td className="font-medium text-gray-800">{r.nic}</Td>
                      <Td>{r.fullName || "—"}</Td>
                      <Td>{r.email || "—"}</Td>
                      <Td>{r.phone || "—"}</Td>
                      <Td>
                        <Badge color={active ? "green" : "red"}>
                          {active ? "Active" : "Deactivated"}
                        </Badge>
                      </Td>
                      <Td className="text-right pr-6 space-x-2">
                        <ActionButton
                          color="blue"
                          to={`/owners/${encodeURIComponent(r.nic)}`}
                        >
                          Edit
                        </ActionButton>
                        {!active && (
                          <ActionButton
                            color="emerald"
                            onClick={() => activateOwner(r)}
                          >
                            Activate
                          </ActionButton>
                        )}
                      </Td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6 text-sm text-gray-600">
          <div>Page {page}</div>
          <div className="flex gap-2">
            <button
              className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-100 disabled:opacity-40"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <button
              className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-100 disabled:opacity-40"
              disabled={page * pageSize >= total}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Helper Components ─────────────────────────────── */
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
    red: "bg-red-100/80 text-red-800 border-red-200",
    gray: "bg-gray-100 text-gray-700 border-gray-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full text-xs font-medium px-2.5 py-1 border transition-all duration-150 ${map[color] || map.gray}`}
    >
      {children}
    </span>
  );
}

function ActionButton({ color = "gray", to, onClick, children }) {
  const base =
    "inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150";
  const colors = {
    blue: "text-blue-600 hover:bg-blue-50",
    emerald: "text-emerald-700 hover:bg-emerald-50",
    red: "text-red-600 hover:bg-red-50",
  };
  if (to)
    return (
      <Link to={to} className={`${base} ${colors[color] || colors.gray}`}>
        {children}
      </Link>
    );
  return (
    <button onClick={onClick} className={`${base} ${colors[color] || colors.gray}`}>
      {children}
    </button>
  );
}
