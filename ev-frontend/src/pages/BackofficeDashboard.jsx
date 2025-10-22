import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import toast, { Toaster } from "react-hot-toast";

// APIs
import ownersApi from "../api/ownersApi";
import stationsApi from "../api/stationsApi";
import bookingsApi from "../api/bookingsApi";
import usersApi from "../api/usersApi";

// NEW: modal component
import StationDetailsModal from "../pages/stations/StationDetailsModal";

export default function BackofficeDashboard() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  // Raw data
  const [owners, setOwners] = useState([]);
  const [stations, setStations] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [staff, setStaff] = useState([]);

  // Modal state
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailStation, setDetailStation] = useState(null);

  // Fetch everything in parallel
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);

        const [ownersRes, stationsRes, bookingsRes, staffRes] = await Promise.all([
          ownersApi.list?.({ pageSize: 1000 }) ?? { items: [], total: 0 },
          stationsApi.list?.({ pageSize: 1000 }) ?? { items: [], total: 0 },
          bookingsApi.list?.({ pageSize: 1000 }) ?? { items: [], total: 0 }, // 7d filtered client-side below
          usersApi.list?.({ pageSize: 1000 }) ?? { items: [], total: 0 },
        ]);

        if (!alive) return;

        setOwners(ownersRes.items ?? ownersRes ?? []);
        setStations(stationsRes.items ?? stationsRes ?? []);
        setBookings(bookingsRes.items ?? bookingsRes ?? []);
        setStaff(staffRes.items ?? staffRes ?? []);
      } catch (e) {
        toast.error(e?.message || "Failed to load dashboard");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // ======== Derived KPI metrics ========
  const {
    ownerActive, ownerInactive,
    stationActive, stationInactive,
    bookings7dPending, bookings7dApproved,
    backofficeCount, operatorCount
  } = useMemo(() => {
    // owners
    const ownerActive = owners.filter(o => trueBool(o.isActive ?? o.active ?? o.IsActive ?? true)).length;
    const ownerInactive = (owners?.length || 0) - ownerActive;

    // stations
    const stationActive = stations.filter(s => trueBool(s.isActive ?? s.active ?? s.IsActive ?? true)).length;
    const stationInactive = (stations?.length || 0) - stationActive;

    // bookings last 7 days
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const recent = bookings.filter(b => {
      const dt = new Date(b.createdAtUtc || b.createdAt || b.date || b.startTime || now);
      return dt >= sevenDaysAgo && dt <= now;
    });
    const approvals = recent.reduce((acc, b) => {
      const status = (b.status || "").toLowerCase();
      if (status.includes("approve")) acc.approved++;
      else if (status.includes("pend")) acc.pending++;
      return acc;
    }, { approved: 0, pending: 0 });

    // staff: role counts
    const backofficeCount = staff.filter(u =>
      (u.role || (u.roles?.[0] ?? "")).toLowerCase() === "backoffice"
    ).length;
    const operatorCount = staff.filter(u =>
      (u.role || (u.roles?.[0] ?? "")).toLowerCase() === "operator"
    ).length;

    return {
      ownerActive,
      ownerInactive,
      stationActive,
      stationInactive,
      bookings7dPending: approvals.pending,
      bookings7dApproved: approvals.approved,
      backofficeCount,
      operatorCount
    };
  }, [owners, stations, bookings, staff]);

  // Stations overview rows (top 6 by recently updated)
  const stationRows = useMemo(() => {
    const todayISO = new Date().toISOString().slice(0, 10);

    return [...stations]
      .sort((a, b) => new Date(b.updatedAtUtc || b.updatedAt || 0) - new Date(a.updatedAtUtc || a.updatedAt || 0))
      .slice(0, 6)
      .map(s => {
        const active = trueBool(s.isActive ?? s.active ?? s.IsActive ?? true);
        const totalSlots = numOrNull(s.totalSlots ?? s.capacity);

        // Schedule can be under s.schedule or s.availability
        const schedule = Array.isArray(s.schedule) ? s.schedule
          : Array.isArray(s.availability) ? s.availability
          : [];

        let todayAvail = null;
        if (Array.isArray(schedule) && schedule.length) {
          // find exact yyyy-mm-dd match OR prefix match (just in case)
          const hit =
            schedule.find(d => (d.date || d.day) === todayISO)
            ?? schedule.find(d => (d.date || d.day)?.startsWith?.(todayISO));

          const raw = hit?.available ?? hit?.capacity ?? hit?.slots;
          todayAvail = numOrNull(raw);
        }

        // Fallback: show total slots if we didn't find a number
        if (!Number.isFinite(todayAvail) && Number.isFinite(totalSlots)) {
          todayAvail = totalSlots;
        }

        return {
          id: s.id ?? s._id ?? s.stationId ?? s.name,
          name: s.name ?? "—",
          type: s.type ?? s.kind ?? "—",
          location: s.location ?? s.city ?? s.town ?? "—",
          totalSlots,
          todayAvail,
          active,
          _raw: s, // keep original for modal
        };
      });
  }, [stations]);

  const handleLogout = () => { signOut(); navigate("/login", { replace: true }); };

  // ======== UI ========
  return (
    <div className="relative min-h-dvh">
      {/* Full-viewport gradient background (sits behind all content) */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-emerald-50 via-white to-gray-50" />

      <Toaster />
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Header strip */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Backoffice Dashboard</h1>
        </div>

        {/* KPIs */}
        <section>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              loading={loading}
              title="EV Owners"
              primary={owners.length}
              badges={[
                { label: "Active", value: ownerActive, color: "emerald" },
                { label: "Deactivated", value: ownerInactive, color: "slate" },
              ]}
              gradient="from-emerald-500/10 to-emerald-500/0"
              to="/owners"
            />

            <KpiCard
              loading={loading}
              title="Stations"
              primary={stations.length}
              badges={[
                { label: "Active", value: stationActive, color: "emerald" },
                { label: "Deactivated", value: stationInactive, color: "slate" },
              ]}
              gradient="from-blue-500/10 to-blue-500/0"
              to="/stations"
            />

            <KpiCard
              loading={loading}
              title="Bookings (7d)"
              primary={(bookings7dPending + bookings7dApproved)}
              badges={[
                { label: "Pending", value: bookings7dPending, color: "amber" },
                { label: "Approved", value: bookings7dApproved, color: "emerald" },
              ]}
              gradient="from-violet-500/10 to-violet-500/0"
              to="/bookings"
            />

            <KpiCard
              loading={loading}
              title="System Users"
              primary={staff.length}
              badges={[
                { label: "Backoffice", value: backofficeCount, color: "blue" },
                { label: "Operators", value: operatorCount, color: "emerald" },
              ]}
              gradient="from-rose-500/10 to-rose-500/0"
              to="/users"
            />
          </div>
        </section>

        {/* Quick actions */}
        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Quick actions</h2>
              <span className="text-xs text-gray-400">Faster admin flows</span>
            </div>

            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              <ActionCard title="Create Web User" description="Backoffice or Station Operator" to="/register" />
              <ActionCard title="Register New Station" description="Location, type, slots" to="/stations/new" />
              <ActionCard title="Create EV Owner" description="Register by NIC" to="/owners/new" />
              <ActionCard title="View Booking" description="Server rules apply" to="/bookings" />
              <ActionCard title="Search" description="NIC / Owner / Station / Booking" to="/owners" />
              <ActionCard title="View Users" description="Recent approvals & updates" to="/users" />
            </div>
          </div>

          {/* Right-side small activity box */}
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <h3 className="font-semibold mb-3">Today</h3>
            <ul className="text-sm space-y-2 text-gray-700">
              <li>• {ownerActive} owners are active</li>
              <li>• {stationActive} stations online</li>
              <li>• {bookings7dPending} pending bookings (last 7d)</li>
            </ul>
            <p className="mt-4 text-xs text-gray-400">
              Numbers refresh on load. Use the sections above to manage details.
            </p>
          </div>
        </section>

        {/* Stations Overview */}
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Stations overview</h2>
            <div className="flex items-center gap-2">
              <Link to="/stations" className="text-sm rounded-lg border px-3 py-1.5 hover:bg-gray-50">Manage all</Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <Th>Station</Th>
                  <Th>Location</Th>
                  <Th>Status</Th>
                  <Th>Today’s Slots</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading && (
                  <tr><td colSpan={5} className="p-6 text-center text-gray-400">Loading…</td></tr>
                )}

                {!loading && stationRows.length === 0 && (
                  <tr><td colSpan={5} className="p-6 text-center text-gray-400">No stations yet</td></tr>
                )}

                {!loading && stationRows.map(r => (
                  <tr key={r.id} className="bg-white/60">
                    <Td className="font-medium">
                      <span className="mr-2 text-gray-400">🔋</span>{r.name}
                      <span className="ml-2 text-xs text-gray-500">({r.type})</span>
                    </Td>
                    <Td>{r.location}</Td>
                    <Td>
                      <Badge color={r.active ? "green" : "gray"}>
                        {r.active ? "Active" : "Inactive"}
                      </Badge>
                    </Td>
                    <Td>
                      {Number.isFinite(r.todayAvail) && Number.isFinite(r.totalSlots)
                        ? <span>{r.todayAvail} / {r.totalSlots}</span>
                        : "—"}
                    </Td>
                    <Td className="space-x-2">
                      <button
                        className="inline-flex items-center rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
                        onClick={() => { setDetailStation(r._raw); setDetailOpen(true); }}
                      >
                        View
                      </button>
                      <GhostBtn to={`/stations/${encodeURIComponent(r.id)}/schedule`}>Schedule</GhostBtn>
                      <GhostBtn to={`/stations/${encodeURIComponent(r.id)}`}>Edit</GhostBtn>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Detail Modal */}
      {detailOpen && detailStation && (
        <StationDetailsModal
          station={detailStation}
          onClose={() => { setDetailOpen(false); setDetailStation(null); }}
        />
      )}
    </div>
  );
}

/* ===================== Helpers & Small Components ===================== */

function trueBool(v) { return v === true || v === "true" || v === 1 || v === "1"; }
function numOrNull(v) {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function KpiCard({ loading, title, primary, badges = [], gradient = "from-gray-500/10 to-gray-500/0", to = "#" }) {
  return (
    <Link
      to={to}
      className="group relative overflow-hidden rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 hover:shadow-md transition"
    >
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${gradient}`} />
      <p className="text-sm text-gray-500">{title}</p>
      <div className="mt-2 flex items-end justify-between">
        <p className="text-3xl font-semibold text-gray-900">{loading ? "—" : primary}</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {badges.map((b, i) => (
          <MiniBadge key={i} color={b.color}>
            <span className="text-gray-600">{b.label}:</span>{" "}
            <strong className="ml-1">{loading ? "—" : b.value}</strong>
          </MiniBadge>
        ))}
      </div>
    </Link>
  );
}

function MiniBadge({ children, color = "slate" }) {
  const map = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    violet: "bg-violet-50 text-violet-700 border-violet-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
  };
  return (
    <span className={`inline-flex items-center rounded-full text-xs px-2 py-1 border ${map[color] || map.slate}`}>
      {children}
    </span>
  );
}

function ActionCard({ title, description, to = "#" }) {
  return (
    <Link
      to={to}
      className="block rounded-2xl border bg-white p-4 hover:shadow-md hover:border-gray-300 transition"
    >
      <p className="font-medium text-gray-900">{title}</p>
      <p className="text-sm text-gray-500">{description}</p>
    </Link>
  );
}

function Th({ children }) {
  return <th className="text-left font-medium px-4 py-3 border-b">{children}</th>;
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
function GhostBtn({ to = "#", children }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
    >
      {children}
    </Link>
  );
}
