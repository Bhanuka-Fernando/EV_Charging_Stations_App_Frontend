import { useEffect, useState } from "react";
import stationsApi from "../../api/stationsApi";
import { useNavigate } from "react-router-dom";
import usersApi from "../../api/usersApi";
import toast from "react-hot-toast";

export default function RegisterWebUser() {
  const [role, setRole] = useState("Operator");
  const [stations, setStations] = useState([]);
  const [stationId, setStationId] = useState(""); 
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await stationsApi.list({ page: 1, pageSize: 1000, isActive: true });
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
    const email    = e.target.email.value.trim();
    const password = e.target.password.value;
    const phone    = e.target.phone?.value.trim();

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
      const created = await usersApi.create({ fullName, email, password, role, phone: phone || undefined });

      if (role === "Operator") {
        let userId = created?.id;
        if (!userId) {
          // fallback if create() doesn’t return id
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
      setTimeout(() => {
        navigate("/users");
      },800)
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Failed to create user";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={onSubmit} className="rounded-2xl border bg-white p-6">
        <h1 className="text-2xl font-semibold">Create Web User</h1>
        <p className="text-sm text-gray-500 mt-1">Backoffice can create Backoffice or Operator users</p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium">Full name</label>
            <input name="fullName" type="text" required className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>

          <div>
            <label className="block text-sm font-medium">Email</label>
            <input name="email" type="email" required className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>

          <div>
            <label className="block text-sm font-medium">Password</label>
            <input name="password" type="password" required minLength={8} className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>

          <div>
            <label className="block text-sm font-medium">Phone (optional)</label>
            <input name="phone" type="tel" className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>

          <div>
            <label className="block text-sm font-medium">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="Backoffice">Backoffice</option>
              <option value="Operator">Station Operator</option>
            </select>
          </div>

          {role === "Operator" && (
            <div>
              <label className="block text-sm font-medium">Assign station</label>
              <select
                value={stationId}
                onChange={(e) => setStationId(e.target.value)}
                className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          <button type="submit" disabled={submitting} className="w-full rounded-xl bg-gray-900 text-white py-2 disabled:opacity-60">
            {submitting ? "Creating..." : "Create user"}
          </button>
        </div>
      </form>
    </div>
  );
}
