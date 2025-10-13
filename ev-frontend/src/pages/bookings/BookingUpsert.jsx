import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast, { Toaster } from "react-hot-toast";
import bookingsApi from "../../api/bookingsApi";
import stationsApi from "../../api/stationsApi"; // to list active stations for select
import { useRole } from "../../auth/useRole";

const baseSchema = z.object({
  ownerNic: z.string().optional(), // Backoffice may create on behalf of owner; ignore if API derives from token
  stationId: z.string().min(1, "Station is required"),
  startLocal: z.string().min(1, "Start time required"), // datetime-local string
  endLocal: z.string().min(1, "End time required"),
});

export default function BookingUpsert() {
  const role = useRole();
  const canCreate = role === "Backoffice"; // hide ownerNic when not backoffice
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const { register, handleSubmit, setValue, reset, formState:{ errors, isSubmitting } } =
    useForm({ resolver: zodResolver(baseSchema) });

  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    (async () => {
      try {
        const data = await stationsApi.list({ isActive: true, pageSize: 100 });
        const items = Array.isArray(data) ? data : data.items ?? [];
        setStations(items);
      } catch (e) {
        toast.error(e.message || "Failed to load stations");
      }
    })();
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        setLoading(true);
        const b = await bookingsApi.get(id);
        const toLocal = (iso) => {
          const d = new Date(iso);
          const pad = (n)=> String(n).padStart(2,"0");
          const v = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
          return v;
        };
        reset({
          ownerNic: b.ownerNic || "",
          stationId: b.stationId,
          startLocal: toLocal(b.startTime),
          endLocal: toLocal(b.endTime),
        });
      } catch (e) {
        toast.error(e.message || "Failed to load booking");
      } finally { setLoading(false); }
    })();
  }, [id, isEdit, reset]);

  const toIso = (localStr) => new Date(localStr).toISOString();


  const validateRules = (startISO, endISO, editing=false, originalStartISO=null) => {
    const now = new Date();
    const start = new Date(startISO);
    const end   = new Date(endISO);

    if (end <= start) return "End must be after start.";
    const minutes = (end - start) / (1000*60);
    if (minutes < 60) return "Reservation must be at least 60 minutes.";

    // within 7 days from now
    const max = new Date(now); max.setDate(max.getDate()+7);
    if (start > max) return "Reservation must be within 7 days from now.";

    // if editing: ensure ≥12h before original start (UX hint; server enforces)
    if (editing && originalStartISO) {
      const cutoff = new Date(originalStartISO); cutoff.setHours(cutoff.getHours() - 12);
      if (now > cutoff) return "Changes allowed only until 12 hours before the original start time.";
    }
    return null;
  };

  const onSubmit = async (v) => {
    try {
      const payload = {
        stationId: v.stationId,
        startTime: toIso(v.startLocal),
        endTime: toIso(v.endLocal),
      };
      if (canCreate && v.ownerNic) payload.ownerNic = v.ownerNic;

      const hint = validateRules(payload.startTime, payload.endTime, isEdit);
      if (hint) {
        toast.error(hint);
        return;
      }

      if (isEdit) {
        await bookingsApi.update(id, payload);
        toast.success("Booking updated");
      } else {
        const created = await bookingsApi.create(payload);
        toast.success("Booking created");
        navigate(`/bookings`, { replace: true });
        return;
      }
      navigate("/bookings", { replace: true });
    } catch (e) {
      // server will send proper messages for 7-day / 12-hour / 409 conflicts
      toast.error(e.message || "Save failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      <div className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">
          {isEdit ? "Edit Booking" : "Create Booking"}
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 space-y-5">
          {canCreate && !isEdit && (
            <div>
              <label className="text-sm font-medium">Owner NIC (creating on behalf)</label>
              <input className="mt-1 w-full rounded-lg border px-3 py-2" {...register("ownerNic")} placeholder="200225803293" />
            </div>
          )}

          <div>
            <label className="text-sm font-medium">Station</label>
            <select className="mt-1 w-full rounded-lg border px-3 py-2" disabled={loading} {...register("stationId")}>
              <option value="">Select a station…</option>
              {stations.map(s => <option key={s.id} value={s.id}>{s.name} — {s.type} — {s.totalSlots} slots</option>)}
            </select>
            {errors.stationId && <p className="text-sm text-red-600">{errors.stationId.message}</p>}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Start</label>
              <input type="datetime-local" className="mt-1 w-full rounded-lg border px-3 py-2" disabled={loading} {...register("startLocal")} />
              {errors.startLocal && <p className="text-sm text-red-600">{errors.startLocal.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">End</label>
              <input type="datetime-local" className="mt-1 w-full rounded-lg border px-3 py-2" disabled={loading} {...register("endLocal")} />
              {errors.endLocal && <p className="text-sm text-red-600">{errors.endLocal.message}</p>}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button className="rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2" disabled={isSubmitting || loading}>
              {isEdit ? "Save changes" : "Create booking"}
            </button>
            <button type="button" onClick={() => history.back()} className="rounded-xl border px-4 py-2">
              Cancel
            </button>
          </div>

          <p className="text-xs text-gray-400">
            Tips: Reservation must be within 7 days. Update/cancel at least 12 hours before start. The server strictly enforces these.
          </p>
        </form>
      </div>
    </div>
  );
}
