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
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(isEdit);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(isEdit ? editSchema : createSchema) });

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
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit, reset]);

  const onSubmit = async (v) => {
    try {
      if (isEdit) {
        await stationsApi.update(id, v);
        toast.success("Station updated successfully!");
      } else {
        const created = await stationsApi.create(v);
        toast.success("Station created successfully!");
        navigate(`/stations/${created.id}`, { replace: true });
        return;
      }
      navigate("/stations", { replace: true });
    } catch (e) {
      toast.error(e.message || "Save failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <Toaster />
      <div className="w-full max-w-2xl -mt-20 rounded-3xl bg-white/80 backdrop-blur-lg shadow-xl border border-gray-200 p-8 transition-all hover:shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-center flex-col mb-8">
          <div className="w-14 h-14 flex items-center justify-center rounded-full bg-emerald-100 mb-3">
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
                d="M13 16h-1v-4h-1m4 4h1a2 2 0 002-2V8a2 2 0 00-2-2H8a2 2 0 00-2 2v6a2 2 0 002 2h1m4 0v1a2 2 0 002 2h2m-6-3a2 2 0 01-2-2V8m6 11h.01"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
            {isEdit ? "Edit Station" : "Create Station"}
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            Fill in station details and location coordinates.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 transition-all"
        >
          <InputField
            label="Station Name"
            placeholder="Ex: Malabe Station"
            error={errors.name?.message}
            disabled={loading}
            {...register("name")}
          />

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Type</label>
              <select
                {...register("type")}
                disabled={loading}
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
              >
                <option value="AC">AC</option>
                <option value="DC">DC</option>
              </select>
              {errors.type && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.type.message}
                </p>
              )}
            </div>

            <InputField
              label="Total Slots"
              type="number"
              placeholder="Ex: 8"
              error={errors.totalSlots?.message}
              disabled={loading}
              {...register("totalSlots")}
            />
          </div>

          <InputField
            label="Location"
            placeholder="Ex: Colombo, Sri Lanka"
            error={errors.location?.message}
            disabled={loading}
            {...register("location")}
          />

          <div className="grid sm:grid-cols-2 gap-4">
            <InputField
              label="Latitude"
              type="number"
              step="any"
              placeholder="Ex: 6.9271"
              error={errors.lat?.message}
              disabled={loading}
              {...register("lat")}
            />
            <InputField
              label="Longitude"
              type="number"
              step="any"
              placeholder="Ex: 79.8612"
              error={errors.lng?.message}
              disabled={loading}
              {...register("lng")}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2 justify-end">
            <button
              type="button"
              onClick={() => history.back()}
              className="rounded-xl border border-gray-300 px-5 py-2.5 text-gray-700 hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-2.5 font-medium transition shadow-md disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : "Save Station"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* --------------------- Reusable Input Component --------------------- */
function InputField({ label, error, ...props }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input
        {...props}
        className={`mt-1 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 transition ${
          props.disabled ? "bg-gray-50" : ""
        }`}
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
