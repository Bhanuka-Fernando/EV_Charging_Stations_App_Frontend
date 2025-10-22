// src/pages/operator/OperatorDashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import usersApi from "../../api/usersApi";
import stationsApi from "../../api/stationsApi";
import bookingsApi from "../../api/bookingsApi";
import toast, { Toaster } from "react-hot-toast";

export default function OperatorDashboard() {
  const { user } = useAuth();

  const [stationId, setStationId] = useState("");
  const [stationName, setStationName] = useState("—");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kpi, setKpi] = useState({
    pending: 0,
    approved: 0,
    completed: 0,
    capacity: { avail: "-", total: "-" },
  });

  const today = useMemo(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  }, []);

  const formatDateTime = (val) => {
    if (!val) return "—";
    const d = new Date(val);
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
  };

  // Load operator profile + assigned station
  useEffect(() => {
    (async () => {
      try {
        const meRaw = await usersApi.getMyProfile();
        const me = meRaw?.profile ?? meRaw;
        const ids = me?.stationIds || me?.StationIds || [];

        if (!ids.length) {
          toast.error("No station assigned. Please contact Backoffice.");
          setLoading(false);
          return;
        }

        const sid = ids[0];
        setStationId(sid);

        const st = await stationsApi.get(sid);
        setStationName(st.name || "—");

        const total = st.totalSlots ?? st.TotalSlots ?? "-";
        const day = (st.schedule || st.Schedule || []).find(
          (d) => d.date === today || d.Date === today
        );
        const avail =
          typeof (day?.availableSlots ?? day?.AvailableSlots) === "number"
            ? day.availableSlots ?? day.AvailableSlots
            : total;

        setKpi((k) => ({ ...k, capacity: { avail, total } }));
      } catch (e) {
        toast.error(e?.message || "Failed to load profile/station");
      } finally {
        setLoading(false);
      }
    })();
  }, [today]);

  // Load bookings for assigned station
  useEffect(() => {
    if (!stationId) return;
    (async () => {
      try {
        setLoading(true);
        const data = await bookingsApi.list({
          status: "All",
          page: 1,
          pageSize: 200,
        });
        const all = Array.isArray(data) ? data : data.items ?? [];
        const normalized = all
          .map((b) => ({
            id: b.id ?? b.Id,
            stationId: b.stationId ?? b.StationId,
            status: b.status ?? b.Status,
            ownerName:
              b.ownerFullName ??
              b.owner?.fullName ??
              b.ownerName ??
              b.ownerNic ??
              b.nic ??
              "—",
            start: b.startTimeUtc ?? b.startTime ?? b.StartTimeUtc ?? b.StartTime,
            end: b.endTimeUtc ?? b.endTime ?? b.EndTimeUtc ?? b.EndTime,
          }))
          .filter((x) => x.stationId === stationId);

        setRows(normalized);

        const toLower = (s) => String(s || "").toLowerCase();
        setKpi((k) => ({
          ...k,
          pending: normalized.filter((b) => toLower(b.status) === "pending").length,
          approved: normalized.filter((b) => toLower(b.status) === "approved").length,
          completed: normalized.filter((b) => toLower(b.status) === "completed").length,
        }));
      } catch (e) {
        toast.error(e?.message || "Failed to load bookings");
      } finally {
        setLoading(false);
      }
    })();
  }, [stationId]);

  return (
    <div className="relative min-h-dvh">
      {/* Background */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-blue-50 via-white to-gray-50"
      />

      <Toaster />
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Operator Dashboard{" "}
              <span className="text-gray-500 text-base">— {stationName}</span>
            </h1>
            <p className="text-sm text-gray-500">
              Welcome back{user?.sub ? `, ${user.sub}` : ""}.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ActionBtn
              to={stationId ? `/stations/${stationId}/schedule` : "/stations"}
              color="gray"
              label="Edit Today’s Schedule"
            />
            <ActionBtn
              to="/operator/approvals"
              color="emerald"
              label="Pending Approvals"
            />
            {/* Scan QR removed */}
          </div>
        </div>

        {/* KPIs */}
        <section>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title="Pending"
              primary={kpi.pending}
              subtitle="Awaiting approval"
              gradient="from-amber-500/10 to-amber-500/0"
            />
            <KpiCard
              title="Approved"
              primary={kpi.approved}
              subtitle="Ready to start"
              gradient="from-blue-500/10 to-blue-500/0"
            />
            <KpiCard
              title="Completed"
              primary={kpi.completed}
              subtitle="Finished sessions"
              gradient="from-emerald-500/10 to-emerald-500/0"
            />
            <KpiCard
              title="Capacity (today)"
              primary={`${kpi.capacity.avail} / ${kpi.capacity.total}`}
              subtitle="Available / Total"
              gradient="from-violet-500/10 to-violet-500/0"
            />
          </div>
        </section>

        {/* Bookings Table */}
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Bookings</h2>
            <span className="text-sm text-gray-500">
              {loading ? "Loading…" : `${rows.length} bookings`}
            </span>
          </div>

          <div className="overflow-hidden rounded-2xl border">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <Th>Owner</Th>
                  <Th>Start</Th>
                  <Th>End</Th>
                  <Th>Status</Th>
                  <Th className="text-right pr-4">Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-gray-400">
                      Loading…
                    </td>
                  </tr>
                )}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-gray-400">
                      No bookings yet
                    </td>
                  </tr>
                )}
                {!loading &&
                  rows.map((b) => {
                    const st = String(b.status || "").toLowerCase();
                    const color =
                      st === "pending"
                        ? "amber"
                        : st === "approved"
                        ? "blue"
                        : st === "completed"
                        ? "green"
                        : "gray";

                    return (
                      <tr key={b.id} className="bg-white/60">
                        <Td>{b.ownerName}</Td>
                        <Td>{formatDateTime(b.start)}</Td>
                        <Td>{formatDateTime(b.end)}</Td>
                        <Td>
                          <Badge color={color}>{b.status}</Badge>
                        </Td>
                        <Td className="text-right pr-4 space-x-2">
                          {st === "pending" && (
                            <Link
                              to="/operator/approvals"
                              className="text-blue-600 hover:underline"
                            >
                              Approve
                            </Link>
                          )}
                          {/* Finalize action (Scan) removed */}
                        </Td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

/* ----------------------- Small Styled Components ----------------------- */

function KpiCard({ title, primary, subtitle, gradient }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 hover:shadow-md transition">
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${gradient}`}
      />
      <p className="text-sm text-gray-500">{title}</p>
      <div className="mt-2 flex items-end justify-between">
        <p className="text-3xl font-semibold text-gray-900">{primary}</p>
      </div>
      <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
    </div>
  );
}

function ActionBtn({ to, color = "gray", label }) {
  const map = {
    gray: "border-gray-300 text-gray-700 hover:bg-gray-100",
    emerald: "bg-emerald-700 text-white hover:bg-emerald-800",
    blue: "bg-blue-600 text-white hover:bg-blue-700",
  };
  const style =
    color === "gray"
      ? `rounded-lg border px-3 py-2 text-sm ${map[color]} transition`
      : `rounded-lg px-3 py-2 text-sm ${map[color]} transition`;

  return (
    <Link to={to} className={style}>
      {label}
    </Link>
  );
}

function Th({ children, className = "" }) {
  return (
    <th className={`text-left font-medium px-4 py-3 border-b ${className}`}>
      {children}
    </th>
  );
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
    <span
      className={`inline-flex items-center rounded-full text-xs px-2 py-1 border ${map[color]}`}
    >
      {children}
    </span>
  );
}
