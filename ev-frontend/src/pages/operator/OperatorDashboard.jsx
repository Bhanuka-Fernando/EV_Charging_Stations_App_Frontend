import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import usersApi from "../../api/usersApi";
import stationsApi from "../../api/stationsApi";
import bookingsApi from "../../api/bookingsApi";
import toast from "react-hot-toast";

function Kpi({ title, primary = "—", secondary = "" }) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <p className="text-sm text-gray-500">{title}</p>
      <div className="mt-2 text-2xl font-semibold text-gray-900">{primary}</div>
      {secondary && <div className="text-xs text-gray-500 mt-0.5">{secondary}</div>}
    </div>
  );
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

function Th({ children, className = "" }) {
  return <th className={`text-left font-medium px-4 py-3 border-b ${className}`}>{children}</th>;
}
function Td({ children, className = "" }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}

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
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const formatDateTime = (val) => {
    if (!val) return "—";
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
  };

  // 1) Load my profile (support both {profile:{…}} and flat {…}) and lock to first station
  useEffect(() => {
    (async () => {
      try {
        const meRaw = await usersApi.getMyProfile();
        const me = meRaw?.profile ?? meRaw; // <-- important
        const ids = me?.stationIds || me?.StationIds || [];
        if (!ids.length) {
          setStationId("");
          setLoading(false);
          toast.error("No station assigned to your account. Please contact Backoffice.");
          return;
        }
        const sid = ids[0];
        setStationId(sid);

        // station name + capacity for today
        const st = await stationsApi.get(sid);
        setStationName(st.name || "—");

        const total = st.totalSlots ?? st.TotalSlots ?? "-";
        const day = (st.schedule || st.Schedule || []).find((d) => d.date === today || d.Date === today);
        const avail = typeof (day?.availableSlots ?? day?.AvailableSlots) === "number"
          ? (day.availableSlots ?? day.AvailableSlots)
          : total;

        setKpi((k) => ({ ...k, capacity: { avail, total } }));
      } catch (e) {
        toast.error(e?.message || "Failed to load profile/station");
        setLoading(false);
      }
    })();
  }, [today]);

  // 2) Load bookings for the assigned station (server already scopes by StationIds)
  useEffect(() => {
    if (!stationId) return;
    (async () => {
      try {
        setLoading(true);

        const data = await bookingsApi.list({
          status: "All",
          page: 1,
          pageSize: 200,
          // stationId not required; server restricts by operator scope
        });
        const all = Array.isArray(data) ? data : data.items ?? [];

        // Normalize fields + keep only current station (defensive)
        const normalized = all.map((b) => ({
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
        })).filter((x) => x.stationId === stationId);

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Operator Dashboard<span className="text-gray-400"> — {stationName}</span>
            </h1>
            <p className="text-xs text-gray-500">
              Welcome back{user?.sub ? `, ${user.sub}` : ""}.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to={stationId ? `/stations/${stationId}/schedule` : "/stations"}
              className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
            >
              Edit Today’s Schedule
            </Link>
            <Link
              to="/operator/approvals"
              className="rounded-lg bg-emerald-700 text-white px-3 py-2 text-sm hover:bg-emerald-600"
            >
              Pending Approvals
            </Link>
            <Link
              to="/operator/scan"
              className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
            >
              Scan QR
            </Link>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <Kpi title="Today – Pending" primary={kpi.pending} secondary="Awaiting approval" />
          <Kpi title="Today – Approved" primary={kpi.approved} secondary="Ready to start" />
          <Kpi title="Today – Completed" primary={kpi.completed} secondary="Finished sessions" />
          <Kpi
            title="Capacity (today)"
            primary={`${kpi.capacity.avail} / ${kpi.capacity.total}`}
            secondary="Available / Total slots"
          />
        </div>

        {/* Bookings */}
        <div className="rounded-2xl border bg-white">
          <div className="p-5 border-b flex items-center justify-between">
            <h2 className="font-semibold">Bookings</h2>
            <div className="text-sm text-gray-500">
              {loading ? "Loading…" : `${rows.length} shown`}
            </div>
          </div>
          <div className="overflow-x-auto">
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
                      No bookings
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
                        <Td>{b.ownerName}</Td>
                        <Td>{formatDateTime(b.start)}</Td>
                        <Td>{formatDateTime(b.end)}</Td>
                        <Td>
                          <Badge color={color}>{b.status}</Badge>
                        </Td>
                        <Td className="text-right pr-4">
                          {st === "pending" && (
                            <Link to="/operator/approvals" className="text-blue-600 hover:underline">
                              Approve
                            </Link>
                          )}
                          {st === "approved" && (
                            <Link to="/operator/scan" className="text-emerald-700 hover:underline">
                              Finalize
                            </Link>
                          )}
                        </Td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
