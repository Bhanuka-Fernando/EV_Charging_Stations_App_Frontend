import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast, { Toaster } from "react-hot-toast";
import stationsApi from "../../api/stationsApi";

const baseSchema = {
  name: z.string().min(2, "Name is required"),
  type: z.enum(["AC", "DC"]),
  totalSlots: z.coerce.number().int().min(1, "At least 1 slot"),
  location: z.string().min(2, "Location is required"),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
};
const createSchema = z.object(baseSchema);
const editSchema = z.object(baseSchema);

export default function StationUpsert() {
  const { id } = useParams(); // undefined on create
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(isEdit);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm({ resolver: zodResolver(isEdit ? editSchema : createSchema) });

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        setLoading(true);
        const st = await stationsApi.get(id);
        reset({
          name: st.name,
          type: st.type,
          totalSlots: st.totalSlots,
          location: st.location || "",
          lat: st.lat ?? 0,
          lng: st.lng ?? 0,
        });
      } catch (e) {
        toast.error(e.message || "Failed to load station");
      } finally { setLoading(false); }
    })();
  }, [id, isEdit, reset]);

  const onSubmit = async (v) => {
    try {
      if (isEdit) {
        await stationsApi.update(id, v);
        toast.success("Station updated");
      } else {
        const created = await stationsApi.create(v);
        toast.success("Station created");
        navigate(`/stations/${created.id}`, { replace: true });
        return;
      }
      navigate("/stations", { replace: true });
    } catch (e) {
      toast.error(e.message || "Save failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      <div className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">
          {isEdit ? "Edit Station" : "Create Station"}
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <input className="mt-1 w-full rounded-lg border px-3 py-2" disabled={loading} {...register("name")} />
            {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Type</label>
              <select className="mt-1 w-full rounded-lg border px-3 py-2" disabled={loading} {...register("type")}>
                <option value="AC">AC</option>
                <option value="DC">DC</option>
              </select>
              {errors.type && <p className="text-sm text-red-600">{errors.type.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">Total Slots</label>
              <input type="number" className="mt-1 w-full rounded-lg border px-3 py-2" disabled={loading} {...register("totalSlots")} />
              {errors.totalSlots && <p className="text-sm text-red-600">{errors.totalSlots.message}</p>}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Location</label>
            <input className="mt-1 w-full rounded-lg border px-3 py-2" disabled={loading} {...register("location")} />
            {errors.location && <p className="text-sm text-red-600">{errors.location.message}</p>}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Latitude</label>
              <input type="number" step="any" className="mt-1 w-full rounded-lg border px-3 py-2" disabled={loading} {...register("lat")} />
              {errors.lat && <p className="text-sm text-red-600">{errors.lat.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">Longitude</label>
              <input type="number" step="any" className="mt-1 w-full rounded-lg border px-3 py-2" disabled={loading} {...register("lng")} />
              {errors.lng && <p className="text-sm text-red-600">{errors.lng.message}</p>}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button className="rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2" disabled={isSubmitting || loading}>
              {isSubmitting ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={() => history.back()} className="rounded-xl border px-4 py-2">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
