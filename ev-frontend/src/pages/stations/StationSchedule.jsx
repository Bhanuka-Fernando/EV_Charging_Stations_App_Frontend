import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import stationsApi from "../../api/stationsApi";

function fmt(d){ return d.toISOString().slice(0,10); }

export default function StationSchedule() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [station, setStation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState([]); // [{date, availableSlots}]

  const totalSlots = station?.totalSlots ?? 0;

  // Load station and seed next 7 days
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const st = await stationsApi.get(id);
        setStation(st);

        // Map existing schedule by date for quick lookup
        const map = new Map((st.schedule || []).map(d => [d.date, d.availableSlots]));

        const start = new Date(); start.setHours(0,0,0,0);
        const next7 = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(start); d.setDate(start.getDate() + i);
          const key = fmt(d);
          return { date: key, availableSlots: map.get(key) ?? "" };
        });
        setDays(next7);
      } catch (e) {
        toast.error(e.message || "Failed to load station");
      } finally { setLoading(false); }
    })();
  }, [id]);

  const updateValue = (idx, value) => {
    setDays(prev => {
      const next = [...prev];
      // coerce to number within bounds or blank
      let v = value === "" ? "" : Number(value);
      if (v !== "" && !Number.isNaN(v)) {
        v = Math.max(0, Math.min(totalSlots, v));
      } else if (value !== "") {
        v = 0;
      }
      next[idx] = { ...next[idx], availableSlots: v };
      return next;
    });
  };

  const save = async (replaceAll = true) => {
    try {
      const payload = {
        replaceAll,
        days: days
          .filter(d => d.availableSlots !== "")
          .map(d => ({ date: d.date, availableSlots: Number(d.availableSlots) })),
      };
      await stationsApi.updateSchedule(id, payload);
      toast.success("Schedule saved");
      navigate("/stations", { replace: true });
    } catch (e) {
      // 409 if any availableSlots > TotalSlots
      toast.error(e.message || "Failed to save schedule");
    }
  };

  const setAll = (v) => {
    setDays(prev => prev.map(d => ({ ...d, availableSlots: v })));
  };

  const canSave = useMemo(() => {
    return days.some(d => d.availableSlots !== "");
  }, [days]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Station Schedule</h1>
            <p className="text-xs text-gray-500">
              {station ? `${station.name} • ${station.type} • ${station.totalSlots} slots` : "Loading…"}
            </p>
          </div>
          <button onClick={() => history.back()} className="rounded-lg border px-3 py-2 text-sm">Back</button>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">Edit availability for the next 7 days (0 – {totalSlots}).</p>
            <div className="flex gap-2">
              <button onClick={() => setAll(0)} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">Set all 0</button>
              <button onClick={() => setAll(totalSlots)} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">Set all {totalSlots}</button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {days.map((d, i) => (
              <div key={d.date} className="rounded-xl border p-4">
                <p className="text-sm text-gray-500 mb-2">{d.date}</p>
                <input
                  type="number"
                  min={0}
                  max={totalSlots}
                  value={d.availableSlots}
                  onChange={(e) => updateValue(i, e.target.value)}
                  className="w-full rounded-lg border px-3 py-2"
                />
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-5">
            <button
              onClick={() => save(true)}
              disabled={!canSave}
              className="rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2 disabled:opacity-50"
            >
              Save (replace all)
            </button>
            <button
              onClick={() => save(false)}
              disabled={!canSave}
              className="rounded-xl border px-4 py-2"
            >
              Save (merge)
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-4">
          Note: Server rejects capacity over total slots (409). Operators can edit schedule, but only Backoffice can activate/deactivate stations.
        </p>
      </div>
    </div>
  );
}
