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
        const data = await ownersApi.get(nic);
        reset({
          nic: data.nic,
          fullName: data.fullName || "",
          email: data.email || "",
          phone: data.phone || "",
        });
      } catch (e) {
        toast.error(e.message || "Failed to load owner");
      } finally {
        setLoading(false);
      }
    })();
  }, [isEdit, nic, reset]);

  const onSubmit = async (v) => {
    try {
      if (isEdit) {
        await ownersApi.update(nic, {
          fullName: v.fullName,
          email: v.email,
          phone: v.phone,
        });
        toast.success("Owner updated successfully!");
      } else {
        await ownersApi.create(v);
        toast.success("Owner created successfully!");
      }
      navigate("/owners", { replace: true });
    } catch (e) {
      toast.error(e.message || "Save failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-gray-50 flex items-center justify-center px-4 py-10">
      <Toaster />
      <div className="w-full max-w-2xl rounded-3xl bg-white/80 backdrop-blur-lg shadow-xl border border-gray-200 p-8 transition-all hover:shadow-2xl">
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
                d="M12 11c0 .828-.336 1.578-.879 2.121A3 3 0 1112 11zm0 0a3 3 0 010-6 3 3 0 010 6zm0 0v8m0-8a5 5 0 00-5 5m10 0a5 5 0 00-5-5"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
            {isEdit ? "Edit EV Owner" : "Create EV Owner"}
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            {isEdit
              ? "Update owner details and contact information."
              : "Fill in the EV owner's registration details below."}
          </p>
        </div>

        {/* Form */}
        <form
          className="space-y-5 transition-all"
          onSubmit={handleSubmit(onSubmit)}
        >
          {!isEdit && (
            <InputField
              label="NIC"
              placeholder="Enter NIC"
              error={errors.nic?.message}
              disabled={loading}
              {...register("nic")}
            />
          )}
          <InputField
            label="Full Name"
            placeholder="Enter full name"
            error={errors.fullName?.message}
            disabled={loading}
            {...register("fullName")}
          />
          <InputField
            label="Email"
            type="email"
            placeholder="example@email.com"
            error={errors.email?.message}
            disabled={loading}
            {...register("email")}
          />
          <InputField
            label="Phone"
            placeholder="07XXXXXXXX"
            error={errors.phone?.message}
            disabled={loading}
            {...register("phone")}
          />
          <InputField
            label="Password"
            type="password"
            placeholder="Enter password"
            error={errors.password?.message}
            disabled={loading}
            {...register("password")}
          />

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => history.back()}
              className="rounded-xl border border-gray-300 px-5 py-2.5 text-gray-700 hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-2.5 font-medium transition shadow-md disabled:opacity-60"
              disabled={isSubmitting || loading}
            >
              {isSubmitting ? "Saving..." : isEdit ? "Update" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* -------------------- Reusable Input Component -------------------- */
function InputField({ label, error, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        {...props}
        className={`w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 transition ${
          props.disabled ? "bg-gray-50" : ""
        }`}
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
