// src/pages/me/MyProfile.jsx
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast, { Toaster } from "react-hot-toast";
import usersApi from "../../api/usersApi";

// ---- Validation Schemas ----
const profileSchema = z.object({
  fullName: z.string().min(3, "Full name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z
    .string()
    .min(7, "Enter a valid phone")
    .max(20, "Phone too long")
    .regex(/^[0-9+\-()\s]*$/, "Digits and + - ( ) only"),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(6, "Current password is required"),
    newPassword: z.string().min(8, "Minimum 8 characters"),
    confirmNewPassword: z.string().min(8, "Confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    path: ["confirmNewPassword"],
    message: "Passwords do not match",
  });

export default function MyProfile() {
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // ─── Profile form ───────────────────────────
  const {
    register: pReg,
    handleSubmit: pSubmit,
    reset: pReset,
    formState: { errors: pErr, isDirty: pDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: "", email: "", phone: "" },
  });

  // ─── Password form ──────────────────────────
  const {
    register: pwReg,
    handleSubmit: pwSubmit,
    reset: pwReset,
    formState: { errors: pwErr },
  } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  // ─── Load profile data ───────────────────────
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoadingProfile(true);
        const data = await usersApi.getMyProfile();
        if (alive) {
          pReset({
            fullName: data.fullName || "",
            email: data.email || "",
            phone: data.phone || "",
          });
        }
      } catch (e) {
        toast.error(e?.message || "Failed to load profile");
      } finally {
        if (alive) setLoadingProfile(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [pReset]);

  // ─── Submit handlers ────────────────────────
  const onSaveProfile = async (values) => {
    try {
      setSavingProfile(true);
      await usersApi.updateMyProfile(values);
      toast.success("Profile updated successfully");
      pReset(values);
    } catch (e) {
      toast.error(e?.message || "Update failed");
    } finally {
      setSavingProfile(false);
    }
  };

  const onChangePassword = async (values) => {
    try {
      setSavingPassword(true);
      await usersApi.changeMyPassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast.success("Password changed successfully");
      pwReset();
    } catch (e) {
      toast.error(e?.message || "Password change failed");
    } finally {
      setSavingPassword(false);
    }
  };

  // ─── Render UI ───────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100">
      <Toaster />
      <div className="max-w-4xl mx-auto p-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
              My Profile
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Update your personal details and password securely.
            </p>
          </div>
        </div>

        {/* Profile Section */}
        <div className="rounded-2xl bg-white/90 backdrop-blur-md shadow-lg border border-gray-200 mb-8 transition-all duration-300 hover:shadow-xl">
          <div className="border-b px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">
              Profile Details
            </h2>
            {loadingProfile && (
              <span className="text-sm text-gray-500">Loading…</span>
            )}
          </div>

          <form
            className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6"
            onSubmit={pSubmit(onSaveProfile)}
          >
            {/* Full Name */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                {...pReg("fullName")}
              />
              {pErr.fullName && (
                <p className="text-sm text-red-600 mt-1">
                  {pErr.fullName.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-gray-800 bg-gray-50"
                type="email"
                disabled
                {...pReg("email")}
              />
              {pErr.email && (
                <p className="text-sm text-red-600 mt-1">
                  {pErr.email.message}
                </p>
              )}
            </div>

            {/* Phone */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Phone</label>
              <input
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="+94 71 234 5678"
                {...pReg("phone")}
              />
              {pErr.phone && (
                <p className="text-sm text-red-600 mt-1">
                  {pErr.phone.message}
                </p>
              )}
            </div>

            {/* Save Button */}
            <div className="md:col-span-2 pt-2 flex justify-end">
              <button
                className="rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-medium px-5 py-2.5 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-60"
                disabled={savingProfile || loadingProfile || !pDirty}
                type="submit"
              >
                {savingProfile ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>

        {/* Password Section */}
        <div className="rounded-2xl bg-white/90 backdrop-blur-md shadow-lg border border-gray-200 transition-all duration-300 hover:shadow-xl">
          <div className="border-b px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Change Password
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Use a strong password with at least 8 characters.
            </p>
          </div>

          <form
            className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6"
            onSubmit={pwSubmit(onChangePassword)}
          >
            {/* Current Password */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">
                Current Password
              </label>
              <input
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                type="password"
                {...pwReg("currentPassword")}
              />
              {pwErr.currentPassword && (
                <p className="text-sm text-red-600 mt-1">
                  {pwErr.currentPassword.message}
                </p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                type="password"
                {...pwReg("newPassword")}
              />
              {pwErr.newPassword && (
                <p className="text-sm text-red-600 mt-1">
                  {pwErr.newPassword.message}
                </p>
              )}
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <input
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                type="password"
                {...pwReg("confirmNewPassword")}
              />
              {pwErr.confirmNewPassword && (
                <p className="text-sm text-red-600 mt-1">
                  {pwErr.confirmNewPassword.message}
                </p>
              )}
            </div>

            {/* Change Button */}
            <div className="md:col-span-2 pt-2 flex justify-end">
              <button
                className="rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-medium px-5 py-2.5 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-60"
                disabled={savingPassword}
                type="submit"
              >
                {savingPassword ? "Changing…" : "Change Password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
