import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useRole } from "../auth/useRole";

function cx(...a){ return a.filter(Boolean).join(" "); }

export default function AppNavbar() {
  const { signOut } = useAuth();
  const role = useRole(); // "Backoffice" | "Operator"
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // Menu config (same component, filtered by role)
  const items = [
    { to: "/dashboard", label: "Dashboard", roles: ["Backoffice","Operator"] },
    { to: "/owners",    label: "Ev_Owners",    roles: ["Backoffice"] },       // hidden for Operator
    { to: "/stations",  label: "Stations",  roles: ["Backoffice"] },
    { to: "/bookings",  label: "Bookings",  roles: ["Backoffice"] },
    { to: "/users",     label: "Users",     roles: ["Backoffice"]},
    { to: "/stationDetails",     label: "Station Details",     roles: ["Operator"]},
    { to: "/operator/bookings",     label: "Bookings",     roles: ["Operator"]},
    // add more as needed (Audit, Reports etc.)
  ].filter(i => !role || i.roles.includes(role));

  const onLogout = () => { signOut(); navigate("/login", { replace: true }); };

  return (
    <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="h-16 flex items-center justify-between">
          {/* Left: Brand + Desktop menu */}
          <div className="flex items-center gap-8">
            <Link to={role === "Operator" ? "/operator" : "/backoffice"} className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white grid place-items-center font-bold">EV</div>
              <span className="hidden sm:block font-semibold">EV Charging</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {items.map(i => (
                <NavLink
                  key={i.to}
                  to={i.to}
                  className={({ isActive }) =>
                    cx(
                      "px-3 py-2 rounded-lg text-sm transition",
                      isActive
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )
                  }
                >
                  {i.label}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Right: role chip, profile & logout */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 text-xs px-2.5 py-1 border border-emerald-100">
              {role || "—"}
            </span>

            <Link
              to="/me/profile"
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
            >
              {/* user icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" className="text-gray-600">
                <path fill="currentColor" d="M12 12a5 5 0 1 0-5-5a5 5 0 0 0 5 5m0 2c-5.33 0-8 2.667-8 6v1h16v-1c0-3.333-2.67-6-8-6"/>
              </svg>
              <span className="hidden sm:inline">Profile</span>
            </Link>

            <button
              onClick={onLogout}
              className="rounded-lg bg-gray-900 hover:bg-black text-white px-3 py-2 text-sm"
            >
              Logout
            </button>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden ml-1 rounded-lg border p-2 hover:bg-gray-50"
              onClick={() => setOpen(v => !v)}
              aria-label="Toggle menu"
            >
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M3 7h18v2H3zm0 8h18v2H3z"/></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t bg-white">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1">
            {items.map(i => (
              <NavLink
                key={i.to}
                to={i.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cx(
                    "px-3 py-2 rounded-lg text-sm",
                    isActive ? "bg-emerald-50 text-emerald-700" : "text-gray-700 hover:bg-gray-50"
                  )
                }
              >
                {i.label}
              </NavLink>
            ))}
            <Link
              to="/me/profile"
              onClick={() => setOpen(false)}
              className="px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              Profile
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
