import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast, { Toaster } from "react-hot-toast";
import usersApi from "../../api/usersApi";

/* ---------- helpers ---------- */
function normalizeProfile(raw) {
  const p = raw?.profile ?? raw ?? {};
  const fullName = p.fullName ?? p.FullName ?? p.name ?? p.Name ?? "";
  const email    = p.email ?? p.Email ?? p.username ?? p.userName ?? p.Username ?? "";
  const phone    = p.phone ?? p.Phone ?? p.phoneNumber ?? p.PhoneNumber ?? "";
  return { fullName, email, phone };
}

/* ---------- validation ---------- */
const profileSchema = z.object({
  fullName: z.string().min(3, "Full name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z
    .string()
    .max(20, "Phone too long")
    .regex(/^[0-9+\-()\s]*$/, "Digits and + - ( ) only")
    .or(z.literal("")),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, "Current password is required"),
  newPassword: z.string().min(8, "Minimum 8 characters"),
  confirmNewPassword: z.string().min(8, "Confirm your new password"),
}).refine(d => d.newPassword === d.confirmNewPassword, {
  path: ["confirmNewPassword"], message: "Passwords do not match",
});

export default function MyProfile() {
  const [loadingProfile, setLoadingProfile]   = useState(true);
  const [savingProfile, setSavingProfile]     = useState(false);
  const [savingPassword, setSavingPassword]   = useState(false);

  const {
    register: pReg,
    handleSubmit: pSubmit,
    reset: pReset,
    getValues: pGetValues,
    formState: { errors: pErr, isDirty: pDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: "", email: "", phone: "" },
    mode: "onBlur",
  });

  const {
    register: pwReg,
    handleSubmit: pwSubmit,
    reset: pwReset,
    formState: { errors: pwErr },
  } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmNewPassword: "" },
    mode: "onBlur",
  });

  /** Silent-aware loader: when silent=true, no loading spinner or error toast */
  const loadProfile = useCallback(async (opts = { silent: false }) => {
    if (!opts.silent) setLoadingProfile(true);
    try {
      const raw = await usersApi.getMyProfile();
      const n = normalizeProfile(raw);
      pReset({ fullName: n.fullName || "", email: n.email || "", phone: n.phone || "" });
    } catch (e) {
      if (!opts.silent) toast.error(e?.message || "Failed to load profile");
    } finally {
      if (!opts.silent) setLoadingProfile(false);
    }
  }, [pReset]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  // save profile
  const onSaveProfile = async (values) => {
    // clear any interceptor toasts that might have fired previously
    toast.dismiss();
    const tid = toast.loading("Saving…");
    try {
      setSavingProfile(true);
      await usersApi.updateMyProfile({
        email: values.email.trim(),
        fullName: values.fullName.trim(),
        phone: values.phone?.trim(),
      });

      // refresh from server quietly to avoid noisy transient errors
      await loadProfile({ silent: true });

      // ensure only the success toast remains visible
      toast.dismiss(tid);
      toast.success("Profile updated successfully");
    } catch (e) {
      toast.dismiss(tid);
      toast.error(e?.message || "Update failed");
    } finally {
      setSavingProfile(false);
    }
  };

  // change password (keeps name/phone/email intact)
  const onChangePassword = async (values) => {
    toast.dismiss();
    const tid = toast.loading("Changing password…");
    try {
      setSavingPassword(true);
      await usersApi.changeMyPassword({
        email: pGetValues("email") || "",
        fullName: pGetValues("fullName") || "",
        phone: pGetValues("phone") || "",
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      pwReset();
      await loadProfile({ silent: true });
      toast.dismiss(tid);
      toast.success("Password changed successfully");
    } catch (e) {
      toast.dismiss(tid);
      toast.error(e?.message || "Password change failed");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100">
      <Toaster />
      <div className="mx-auto max-w-4xl p-6 sm:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">My Profile</h1>
          <p className="mt-1 text-sm text-gray-500">Update your personal details and password securely.</p>
        </div>

        {/* Profile */}
        <section className="mb-8 rounded-2xl border border-gray-200 bg-white/90 shadow-lg backdrop-blur">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-800">Profile Details</h2>
            {loadingProfile && <span className="text-sm text-gray-500">Loading…</span>}
          </div>

          <form className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2" onSubmit={pSubmit(onSaveProfile)}>
            <div>
              <label className="text-sm font-medium text-gray-700">Full Name</label>
              <input
                {...pReg("fullName")}
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500"
                autoComplete="name"
              />
              {pErr.fullName && <p className="mt-1 text-sm text-red-600">{pErr.fullName.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                {...pReg("email")}
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500"
                autoComplete="email"
                placeholder="you@email.com"
              />
              {pErr.email && <p className="mt-1 text-sm text-red-600">{pErr.email.message}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Phone</label>
              <input
                {...pReg("phone")}
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="+94 71 234 5678"
                autoComplete="tel"
              />
              {pErr.phone && <p className="mt-1 text-sm text-red-600">{pErr.phone.message}</p>}
            </div>

            <div className="md:col-span-2 flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingProfile || loadingProfile || !pDirty}
                className="rounded-xl bg-emerald-700 px-5 py-2.5 font-medium text-white transition hover:bg-emerald-600 disabled:opacity-60"
              >
                {savingProfile ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        </section>

        {/* Password */}
        <section className="rounded-2xl border border-gray-200 bg-white/90 shadow-lg backdrop-blur">
          <div className="border-b px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-800">Change Password</h2>
            <p className="mt-0.5 text-xs text-gray-500">Use a strong password with at least 8 characters.</p>
          </div>

          <form className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2" onSubmit={pwSubmit(onChangePassword)}>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Current Password</label>
              <input
                type="password"
                {...pwReg("currentPassword")}
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500"
                autoComplete="current-password"
              />
              {pwErr.currentPassword && <p className="mt-1 text-sm text-red-600">{pwErr.currentPassword.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">New Password</label>
              <input
                type="password"
                {...pwReg("newPassword")}
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500"
                autoComplete="new-password"
              />
              {pwErr.newPassword && <p className="mt-1 text-sm text-red-600">{pwErr.newPassword.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
              <input
                type="password"
                {...pwReg("confirmNewPassword")}
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500"
                autoComplete="new-password"
              />
              {pwErr.confirmNewPassword && <p className="mt-1 text-sm text-red-600">{pwErr.confirmNewPassword.message}</p>}
            </div>

            <div className="md:col-span-2 flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingPassword}
                className="rounded-xl bg-gray-900 px-5 py-2.5 font-medium text-white transition hover:bg-gray-800 disabled:opacity-60"
              >
                {savingPassword ? "Changing…" : "Change Password"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
