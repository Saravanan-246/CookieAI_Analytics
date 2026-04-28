import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../app/providers";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { motion } from "framer-motion";

/* ================= MAIN ================= */
const Login = () => {
  const [ready, setReady] = useState(false);

  // ✅ real mount-ready (no fake UX delay)
  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) return <LoginSkeleton />;

  return <LoginForm />;
};

/* ================= FORM ================= */
const LoginForm = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from || "/dashboard";

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [ui, setUI] = useState({
    loading: false,
    error: "",
    showPassword: false,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (ui.error) {
      setUI((p) => ({ ...p, error: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (ui.loading) return;

    if (!formData.email || !formData.password) {
      setUI((p) => ({
        ...p,
        error: "Email and password required",
      }));
      return;
    }

    setUI((p) => ({ ...p, loading: true, error: "" }));

    try {
      await login(formData);
      navigate(from, { replace: true });
    } catch (err) {
      setUI((p) => ({
        ...p,
        error:
          err?.response?.data?.message ||
          "Invalid email or password",
      }));
    } finally {
      setUI((p) => ({ ...p, loading: false }));
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-slate-100">

      {/* LEFT */}
      <div className="hidden lg:flex w-1/2 items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-600">
        <div className="text-white max-w-md px-10 space-y-4">
          <h1 className="text-3xl font-semibold">CookieAI</h1>
          <p className="text-sm text-indigo-100">
            Privacy-first analytics platform built for speed and simplicity.
          </p>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex flex-1 items-center justify-center px-6">

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6"
        >

          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Sign in
            </h2>
            <p className="text-sm text-slate-500">
              Enter your credentials
            </p>
          </div>

          {ui.error && (
            <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {ui.error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* EMAIL */}
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={ui.loading}
                placeholder="Email"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm
                focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100"
              />
            </div>

            {/* PASSWORD */}
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                name="password"
                type={ui.showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                disabled={ui.loading}
                placeholder="Password"
                className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm
                focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100"
              />

              <button
                type="button"
                onClick={() =>
                  setUI((p) => ({
                    ...p,
                    showPassword: !p.showPassword,
                  }))
                }
                className="absolute right-3 top-2.5 text-slate-400"
              >
                {ui.showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-xs text-indigo-600 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={ui.loading}
              className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium
              hover:bg-indigo-700 disabled:opacity-60"
            >
              {ui.loading ? "Signing in..." : "Sign in"}
            </button>

            <p className="text-sm text-center text-slate-500">
              Don’t have an account?{" "}
              <Link to="/register" className="text-indigo-600 hover:underline">
                Create account
              </Link>
            </p>

          </form>
        </motion.div>
      </div>
    </div>
  );
};

/* ================= SKELETON ================= */
const LoginSkeleton = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-100">
    <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow animate-pulse space-y-4">

      <div className="h-6 bg-gray-200 rounded w-1/2" />
      <div className="h-4 bg-gray-200 rounded w-2/3" />

      <div className="space-y-3">
        <div className="h-10 bg-gray-200 rounded" />
        <div className="h-10 bg-gray-200 rounded" />
      </div>

      <div className="h-10 bg-gray-300 rounded" />
    </div>
  </div>
);

export default Login;