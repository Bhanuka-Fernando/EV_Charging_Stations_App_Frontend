import { useEffect, useState } from "react";
import { ownersApi } from "../../api/ownersApi";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

const createSchema = z.object({
  nic: z.string().min(5, "NIC is required"),
  fullName: z.string().min(3, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(7, "Valid phone required").max(20),
  password: z.string().min(6, "Password is required"),
});

const editSchema = createSchema.omit({ nic: true });

export default function OwnerUpsert() {
  const { nic } = useParams();
  const isEdit = Boolean(nic);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(isEdit);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm({ resolver: zodResolver(isEdit ? editSchema : createSchema) });

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        setLoading(true);
        const data = await ownersApi.get(nic);
        reset({
          nic: data.nic,
          fullName: data.fullName || "",
          email: data.email || "",
          phone: data.phone || "",
        });
      } catch (e) {
        toast.error(e.message || "Failed to load owner");
      } finally { setLoading(false); }
    })();
  }, [isEdit, nic, reset]);

  const onSubmit = async (v) => {
    try {
      if (isEdit) {
        await ownersApi.update(nic, { fullName: v.fullName, email: v.email, phone: v.phone });
        toast.success("Owner updated");
      } else {
        await ownersApi.create(v);
        toast.success("Owner created");
      }
      navigate("/owners", { replace: true });
    } catch (e) {
      toast.error(e.message || "Save failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      <div className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">
          {isEdit ? `Edit Owner — ${nic}` : "Create EV Owner"}
        </h1>

        <form className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          {!isEdit && (
            <div>
              <label className="text-sm font-medium">NIC</label>
              <input className="mt-1 w-full rounded-lg border px-3 py-2" disabled={loading} {...register("nic")} />
              {errors.nic && <p className="text-sm text-red-600">{errors.nic.message}</p>}
            </div>
          )}

          <div>
            <label className="text-sm font-medium">Full name</label>
            <input className="mt-1 w-full rounded-lg border px-3 py-2" disabled={loading} {...register("fullName")} />
            {errors.fullName && <p className="text-sm text-red-600">{errors.fullName.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium">Email</label>
            <input className="mt-1 w-full rounded-lg border px-3 py-2" disabled={loading} {...register("email")} />
            {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium">Phone</label>
            <input className="mt-1 w-full rounded-lg border px-3 py-2" disabled={loading} {...register("phone")} />
            {errors.phone && <p className="text-sm text-red-600">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium">Password</label>
            <input
            type="password"
            className="mt-1 w-full rounded-lg border px-3 py-2"
            disabled={loading}
            {...register("password")}
            />
            {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button className="rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2" disabled={isSubmitting || loading}>
              {isSubmitting ? "Saving..." : "Save"}
            </button>
            <button type="button" onClick={() => navigate("/owners")} className="rounded-xl border px-4 py-2">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
