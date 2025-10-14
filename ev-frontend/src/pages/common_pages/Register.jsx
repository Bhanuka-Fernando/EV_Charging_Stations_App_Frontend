import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import stationsApi from "../../api/stationsApi";
import usersApi from "../../api/usersApi";
import toast, { Toaster } from "react-hot-toast";

export default function RegisterWebUser() {
  const [role, setRole] = useState("Operator");
  const [stations, setStations] = useState([]);
  const [stationId, setStationId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await stationsApi.list({
          page: 1,
          pageSize: 1000,
          isActive: true,
        });
        const items = Array.isArray(res) ? res : res.items ?? [];
        setStations(items);
        if (items.length) setStationId(items[0].id);
      } catch {
        setStations([]);
      }
    })();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const fullName = e.target.fullName.value.trim();
    const email = e.target.email.value.trim();
    const password = e.target.password.value;
    const phone = e.target.phone?.value.trim();

    if (!fullName || !email || !password) {
      toast.error("Please fill Full name, Email, and Password.");
      setSubmitting(false);
      return;
    }
    if (role === "Operator" && !stationId) {
      toast.error("Please choose a station for the Operator.");
      setSubmitting(false);
      return;
    }

    try {
      const created = await usersApi.create({
        fullName,
        email,
        password,
        role,
        phone: phone || undefined,
      });

      if (role === "Operator") {
        let userId = created?.id;
        if (!userId) {
          const found = await usersApi.findByEmail(email);
          userId = found?.id;
        }
        if (userId) {
          await usersApi.update(userId, { stationIds: [stationId] });
        }
      }

      toast.success("User Created successfully!");
      e.target.reset();
      setRole("Operator");
      if (stations.length) setStationId(stations[0].id);
      setTimeout(() => navigate("/users"), 800);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to create user";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-gray-50 flex items-center justify-center px-4 py-10">
      <Toaster />
      <div className="w-full max-w-2xl rounded-3xl bg-white/80 backdrop-blur-lg shadow-xl border border-gray-200 p-8 transition-all hover:shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 mb-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7 text-emerald-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 17h5l-1.405-1.405M15 17l-1.405-1.405M15 17V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10m10 0H5m5-6h.01"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Create Web User
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            Backoffice can create <span className="font-medium">Backoffice</span> or{" "}
            <span className="font-medium">Operator</span> users
          </p>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-5">
          <Field label="Full name" name="fullName" type="text" required />
          <Field label="Email" name="email" type="email" required />
          <Field
            label="Password"
            name="password"
            type="password"
            required
            minLength={8}
          />
          <Field label="Phone (optional)" name="phone" type="tel" />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition"
            >
              <option value="Backoffice">Backoffice</option>
              <option value="Operator">Station Operator</option>
            </select>
          </div>

          {role === "Operator" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assign station
              </label>
              <select
                value={stationId}
                onChange={(e) => setStationId(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition"
              >
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-3 mt-3 rounded-xl font-medium text-base transition disabled:opacity-60 shadow-md"
          >
            {submitting ? "Creating..." : "Create User"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* --------------------- Field helper component --------------------- */
function Field({ label, name, type = "text", required = false, ...rest }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        {...rest}
        className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 transition"
      />
    </div>
  );
}
