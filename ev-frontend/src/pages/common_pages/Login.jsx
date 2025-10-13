import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { authApi } from "../../api/authApi";
import { useAuth } from "../../auth/AuthContext";
import { useRole } from "../../auth/useRole";
import toast, { Toaster } from "react-hot-toast";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useState } from "react";
import { jwtDecode } from "jwt-decode";

const schema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

export default function Login() {
  const { signIn, token } = useAuth();
  const role = useRole();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const allowed = role === "Backoffice" || role === "Operator";
  if (token && allowed) return <Navigate to="/dashboard" replace />;
  if (token && !allowed) return <Navigate to="/unauthorized" replace />;

  const { register, handleSubmit, formState: { errors } } =
    useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    try {
      setLoading(true);
      const data = await authApi.login(values);

      let r = data?.role;
      if (!r && data?.token) {
        try {
          const decoded = jwtDecode(data.token);
          r = decoded?.role || (Array.isArray(decoded?.roles) ? decoded.roles[0] : undefined);
        } catch {}
      }

      if (!["Backoffice", "Operator"].includes(r)) {
        toast.error("Web access is only for Backoffice and Station Operator.");
        return;
      }

      signIn(data.token);
      toast.success("Logged in");
      setTimeout(() => navigate("/dashboard", { replace: true }), 0);
    } catch (e) {
      toast.error(e.message || "Login failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-gray-50">
      <Toaster />

      {/* Left — Carded form with generous spacing */}
      <div className="flex items-center justify-center p-7 md:p-10">
        <div className="w-full max-w-lg">    

          {/* Form Card */}
          <div className="w-[560px] h-[660px] rounded-3xl bg-white shadow-xl ring-1 ring-black/5 p-16 space-y-9 pt-15 mt-2 -ml-8">


          {/* Brand */}
          <div className="flex items-center gap-3 -mt-1">
            <div className="h-11 w-11 rounded-2xl bg-green-700 text-white grid place-items-center font-bold shadow-sm">EV</div>
            <div className="leading-tight">
              <p className="text-sm text-green-800">EV Charging</p>
              <p className="font-semibold text-green-800">Station Booking System</p>
            </div>
          </div>
            <div className="pt-2">
              <h1 className="text-3xl md:text-4xl text-gray-800 font-semibold tracking-wide">
                Welcome back,
              </h1>
              <p className="mt-2 text-lg text-gray-600 tracking-wide">
                Backoffice & Station Operator portal
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Username */}
              <div className="space-y-4 ">
                <label className="block text-base font-medium text-black tracking-wider">Username / Email</label>
                <div className="relative">
                  {/* icon */}
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H4.5a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5H4.5a2.25 2.25 0 0 0-2.25 2.25m19.5 0-9.75 6.375L2.25 6.75"/></svg>
                  <input
                    className="w-full rounded-xl border border-gray-300 bg-white pl-10 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Enter Email or Username"
                    {...register("username")}
                  />
                </div>
                {errors.username && <p className="text-sm text-red-600">{errors.username.message}</p>}
              </div>

              {/* Password */}
              <div className="space-y-4 pt-1">
                <label className="block text-base font-medium text-black tracking-wider">Password</label>
                <div className="relative">
                  {/* icon */}
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16.5 10.5V9a4.5 4.5 0 1 0-9 0v1.5M6.75 10.5h10.5a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5H6.75A1.5 1.5 0 0 1 5.25 18v-6a1.5 1.5 0 0 1 1.5-1.5z"/></svg>
                  <input
                    type="password"
                    className="w-full rounded-xl border border-gray-300 bg-white pl-10 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="••••••••"
                    {...register("password")}
                  />
                </div>
                {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
              </div>

              {/* Submit */}
              <div className="pt-8">
                <button
                  className="w-full rounded-xl bg-green-700 hover:bg-emerald-600 active:bg-emerald-700 text-white py-3 font-medium shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </div>
            </form>

            {allowed && role === "Backoffice" && (
              <div className="text-center">
                <Link to="/register" className="text-sm text-emerald-700 hover:underline">
                  Create user (Backoffice)
                </Link>
              </div>
            )}

            <p className="text-xs text-gray-400 text-center">
              By continuing you agree to our Terms & Privacy Policy.
            </p>
          </div>
        </div>
      </div>

      {/* Right — Elegant gradient with subtle shapes & glass card */}
      <div className="hidden lg:flex relative overflow-hidden">
        {/* gradient background */}
            <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage:
                "url('/images/ev.webp')",
              backgroundSize: "cover",   
              backgroundPosition: "center", 
            }}
          ></div>


        
      </div>
    </div>



  );
}
