import { useAuth } from "../auth/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import ProfileIconLink from "../components/ProfileIconLink";

export default function BackofficeDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { signOut(); navigate("/login", { replace: true }); };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* KPIs */}
        <section>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard title="EV Owners" primary="—" secondary="Active / Deactivated" />
            <KpiCard title="Stations" primary="—" secondary="Active / Deactivated" />
            <KpiCard title="Bookings (7d)" primary="—" secondary="Pending / Approved" />
            <KpiCard title="System Users" primary="—" secondary="Backoffice / Operators" />
          </div>
        </section>

        {/* Quick actions + Token */}
        <section className="grid gap-6 lg:grid-cols-3">
          {/* Quick Actions */}
          <div className="lg:col-span-2 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Quick actions</h2>
              <span className="text-xs text-gray-400">Faster admin flows</span>
            </div>

            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              <ActionCard
                title="Create Web User"
                description="Backoffice or Station Operator"
                to="/register"
              />
              <ActionCard
                title="Register New Station"
                description="Location, type, slots"
                to="/stations/new"
              />
              <ActionCard
                title="Create EV Owner"
                description="Register by NIC"
                to="/owners/new"
              />
              <ActionCard
                title="Create Booking"
                description="Server rules apply"
                to="#/bookings/new"
              />
              <ActionCard
                title="Search"
                description="NIC / Owner / Station / Booking"
                to="#/search"
              />
              <ActionCard
                title="Audit & Logs"
                description="Recent approvals & updates"
                to="#/audit"
              />
            </div>
          </div>
        </section>

        {/* Work Queues */}
        <section className="grid gap-6 lg:grid-cols-3">
          <QueueCard
            title="Pending bookings"
            empty="No pending approvals"
            cta={{ label: "Open bookings", to: "#/bookings" }}
          />
          <QueueCard
            title="Owner account requests"
            empty="No owner activations needed"
            cta={{ label: "Manage owners", to: "#/owners" }}
          />
          <QueueCard
            title="Recent changes"
            empty="No recent updates"
            cta={{ label: "Open audit", to: "#/audit" }}
          />
        </section>

        {/* Stations Overview */}
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Stations overview</h2>
            <div className="flex items-center gap-2">
              <button className="text-sm rounded-lg border px-3 py-1.5 hover:bg-gray-50">Today</button>
              <button className="text-sm rounded-lg border px-3 py-1.5 hover:bg-gray-50">Next 7 days</button>
            </div>
          </div>

          {/* Placeholder table (no API calls yet) */}
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
                <tr className="bg-white/60">
                  <Td>—</Td>
                  <Td>—</Td>
                  <Td><Badge>—</Badge></Td>
                  <Td>—</Td>
                  <Td className="space-x-2">
                    <GhostBtn to="#/stations/1">View</GhostBtn>
                    <GhostBtn to="#/stations/1/edit">Edit</GhostBtn>
                  </Td>
                </tr>
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-400">
                    Data will appear here once wired to API
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-xs text-gray-400 mt-3">
            Note: A station cannot be deactivated if it has active bookings.
          </p>
        </section>

        {/* Help */}
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Help</h2>
          <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
            <li>Backoffice can manage users, EV owners, stations, and bookings.</li>
            <li>EV Owners use the Android app to register, book, and manage their accounts.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}

/** ——— Small presentational helpers (no logic added) ——— */

function KpiCard({ title, primary, secondary }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <p className="text-sm text-gray-500">{title}</p>
      <div className="mt-2 flex items-end justify-between">
        <p className="text-3xl font-semibold text-gray-900">{primary}</p>
        <span className="text-xs text-gray-400">{secondary}</span>
      </div>
    </div>
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

function QueueCard({ title, empty, cta }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {cta ? (
          <Link to={cta.to} className="text-sm text-emerald-700 hover:underline">
            {cta.label}
          </Link>
        ) : null}
      </div>
      <div className="rounded-xl border bg-gray-50 p-4 text-sm text-gray-500">
        {empty}
      </div>
    </div>
  );
}

function Th({ children }) {
  return <th className="text-left font-medium px-4 py-3 border-b">{children}</th>;
}
function Td({ children }) {
  return <td className="px-4 py-3">{children}</td>;
}
function Badge({ children }) {
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 text-xs px-2 py-1 border">
      {children}
    </span>
  );
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
