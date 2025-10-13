// src/pages/backoffice/UsersList.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import usersApi from "../../api/usersApi";
import stationsApi from "../../api/stationsApi";

// ─── Helper UI Components ──────────────────────────────
function Th({ children, className = "" }) {
  return (
    <th className={`text-left font-semibold px-5 py-3 text-gray-700 bg-gray-50 ${className}`}>
      {children}
    </th>
  );
}
function Td({ children, className = "" }) {
  return <td className={`px-5 py-3 text-gray-700 ${className}`}>{children}</td>;
}
function Chip({ children, color = "gray" }) {
  const map = {
    green: "bg-emerald-100/80 text-emerald-800 border-emerald-200",
    gray: "bg-gray-100 text-gray-700 border-gray-200",
    blue: "bg-blue-100/80 text-blue-800 border-blue-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full text-xs font-medium px-2.5 py-1 border transition-all duration-150 ${map[color] || map.gray}`}
    >
      {children}
    </span>
  );
}
function IconButton({ children, color = "gray", ...props }) {
  const styles = {
    gray: "text-gray-600 hover:bg-gray-100",
    blue: "text-blue-600 hover:bg-blue-50",
    emerald: "text-emerald-700 hover:bg-emerald-50",
  };
  return (
    <button
      {...props}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${styles[color]}`}
    >
      {children}
    </button>
  );
}

// ─── Helper Logic ───────────────────────────────────────
function getActiveFlag(u) {
  const v =
    u?.isActive ??
    u?.IsActive ??
    u?.enabled ??
    u?.isEnabled ??
    u?.active ??
    (typeof u?.status === "string" ? u.status.toLowerCase() === "active" : undefined);
  return typeof v === "boolean" ? v : undefined;
}

// ─── Modal For Station Assignment ───────────────────────
function StationEditorModal({ open, onClose, user, onSaved }) {
  const [stations, setStations] = useState([]);
  const [selected, setSelected] = useState([]);
  const [q, setQ] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const res = await stationsApi.list({ pageSize: 1000 });
        const items = Array.isArray(res) ? res : res.items ?? [];
        setStations(items);
      } catch (e) {
        toast.error(e.message || "Failed to load stations");
      }
    })();
  }, [open]);

  useEffect(() => {
    const current = user?.stationIds ?? user?.StationIds ?? [];
    setSelected(current);
  }, [user]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return stations;
    return stations.filter(
      (s) =>
        s.name?.toLowerCase().includes(term) ||
        s.code?.toLowerCase().includes(term)
    );
  }, [stations, q]);

  const toggle = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const save = async () => {
    if (!user?.id) return;
    try {
      if (selected.length === 0) {
        toast.error("Operator must be assigned to at least one station.");
        return;
      }
      setSaving(true);
      await usersApi.update(user.id, { stationIds: selected });
      toast.success("Stations updated successfully");
      onSaved?.();
      onClose?.();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to update stations");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white/95 shadow-2xl border border-gray-200">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">
            Assign Stations — {user?.fullName || user?.email}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-lg leading-none"
          >
            &times;
          </button>
        </div>

        <div className="p-5">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search stations..."
            className="w-full mb-3 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />

          <div className="max-h-72 overflow-y-auto border rounded-lg divide-y divide-gray-100">
            {filtered.length === 0 && (
              <div className="p-4 text-sm text-gray-500">No stations found.</div>
            )}
            {filtered.map((s) => (
              <label
                key={s.id}
                className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-emerald-600"
                  checked={selected.includes(s.id)}
                  onChange={() => toggle(s.id)}
                />
                <div className="flex-1">
                  <div className="font-medium text-sm">{s.name}</div>
                  {s.code && (
                    <div className="text-xs text-gray-500">{s.code}</div>
                  )}
                </div>
              </label>
            ))}
          </div>
          <div className="mt-3 text-xs text-gray-600">
            Selected: {selected.length ? selected.join(", ") : "None"}
          </div>
        </div>

        <div className="px-6 py-4 border-t flex justify-end gap-2">
          <IconButton onClick={onClose}>Cancel</IconButton>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-emerald-700 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-600 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Users List ────────────────────────────────────
export default function UsersList() {
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rowBusy, setRowBusy] = useState(null);

  const [editUser, setEditUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await usersApi.list({ pageSize: 1000 });
      const items = Array.isArray(data) ? data : data.items ?? [];
      setRows(items);
      setTotal(items.length);
    } catch (e) {
      toast.error(e?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredRows = useMemo(() => {
    const searchTerm = q.trim().toLowerCase();
    return rows.filter((u) => {
      const role = u.role || (Array.isArray(u.roles) ? u.roles[0] : "");
      const name = u.fullName || u.name || "";
      const email = u.email || "";
      const active = getActiveFlag(u);
      const statusText = active === undefined ? "" : active ? "active" : "inactive";
      const matchesSearch =
        !searchTerm ||
        name.toLowerCase().includes(searchTerm) ||
        email.toLowerCase().includes(searchTerm) ||
        role.toLowerCase().includes(searchTerm) ||
        statusText.includes(searchTerm);
      const matchesRole =
        roleFilter === "All" || role.toLowerCase() === roleFilter.toLowerCase();
      return matchesSearch && matchesRole;
    });
  }, [rows, q, roleFilter]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize]);

  const toggleActive = async (user) => {
    if (!user?.id) return;
    try {
      setRowBusy(user.id);
      const active = getActiveFlag(user) ?? true;
      if (active) {
        await usersApi.deactivate(user.id);
        toast.success("User deactivated");
      } else {
        await usersApi.activate(user.id);
        toast.success("User activated");
      }
      await fetchData();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Operation failed");
    } finally {
      setRowBusy(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100">
      <Toaster />
      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
              User Management
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage Backoffice and Station Operator accounts.
            </p>
          </div>
          <Link
            to="/register"
            className="rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white px-5 py-2.5 text-sm font-medium shadow-sm transition-all duration-200"
          >
            + Create User
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
                placeholder="Search by name, email, role or status"
                className="w-80 rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option>All</option>
                <option>Backoffice</option>
                <option>Operator</option>
              </select>
            </div>
            <div className="text-sm text-gray-500">
              {loading ? "Loading…" : `${filteredRows.length} of ${total} users`}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-md border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th>Created</Th>
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
              {!loading && pagedRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-400">
                    No matching users
                  </td>
                </tr>
              )}
              {!loading &&
                pagedRows.map((u, i) => {
                  const role = u.role || (Array.isArray(u.roles) ? u.roles[0] : "—");
                  const created = u.createdAtUtc || u.createdAt || u.createdOn;
                  const active = getActiveFlag(u);
                  const isOperator = String(role).toLowerCase() === "operator";
                  const bg = i % 2 === 0 ? "bg-white" : "bg-gray-50/80";
                  return (
                    <tr key={u.id || u.email} className={`transition-colors ${bg} hover:bg-emerald-50/40`}>
                      <Td className="font-medium">{u.fullName || u.name || "—"}</Td>
                      <Td>{u.email || "—"}</Td>
                      <Td>
                        <Chip color={role === "Backoffice" ? "blue" : "green"}>{role}</Chip>
                      </Td>
                      <Td>
                        {active === undefined ? (
                          <Chip>—</Chip>
                        ) : active ? (
                          <Chip color="green">Active</Chip>
                        ) : (
                          <Chip>Inactive</Chip>
                        )}
                      </Td>
                      <Td>{created ? new Date(created).toLocaleDateString() : "—"}</Td>
                      <Td className="text-right pr-6 space-x-2">
                        {u.id && active !== undefined && (
                          <IconButton
                            color={active ? "gray" : "emerald"}
                            onClick={() => toggleActive(u)}
                            disabled={rowBusy === u.id}
                          >
                            {rowBusy === u.id
                              ? "Working…"
                              : active
                              ? "Deactivate"
                              : "Activate"}
                          </IconButton>
                        )}
                        {isOperator && (
                          <IconButton
                            color="blue"
                            onClick={() => {
                              setEditUser(u);
                              setModalOpen(true);
                            }}
                          >
                            Edit Stations
                          </IconButton>
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
          <div>
            Page {page} of {totalPages}
          </div>
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
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Station Assignment Modal */}
      <StationEditorModal
        open={modalOpen}
        user={editUser}
        onClose={() => setModalOpen(false)}
        onSaved={() => fetchData()}
      />
    </div>
  );
}
