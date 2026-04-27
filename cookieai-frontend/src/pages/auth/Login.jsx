import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../app/providers";
import Button from "../../components/ui/Button";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from || "/dashboard";

  /* ---------- INPUT ---------- */
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError("");
  };

  /* ---------- SUBMIT ---------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError("Email and password required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await login(formData);
      navigate(from, { replace: true });
    } catch (err) {
      setError(
        err?.data?.message ||
        err?.response?.data?.message ||
        "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-gray-50">

      {/* ===== LEFT SIDE (BRAND) ===== */}
      <div className="hidden lg:flex flex-col justify-center px-16 bg-gradient-to-br from-indigo-600 to-indigo-500 text-white relative overflow-hidden">

        {/* subtle background glow */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_30%,white,transparent_40%)]" />

        <div className="relative space-y-6 max-w-md">
          <h1 className="text-4xl font-bold tracking-tight">
            CookieAI
          </h1>

          <p className="text-indigo-100 text-sm leading-relaxed">
            Privacy-first analytics platform built for developers.  
            Track real-time user behavior with a fast, minimal interface.
          </p>

          <div className="space-y-2 text-sm text-indigo-100">
            <p>• Real-time analytics</p>
            <p>• No cookies tracking</p>
            <p>• Lightweight & fast</p>
          </div>
        </div>
      </div>

      {/* ===== RIGHT SIDE ===== */}
      <div className="flex items-center justify-center px-6 py-10">

        <div className="w-full max-w-md">

          {/* ===== MOBILE BRAND ===== */}
          <div className="lg:hidden mb-6 text-center">
            <h1 className="text-xl font-semibold">CookieAI</h1>
          </div>

          {/* ===== CARD ===== */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">

            {/* HEADER */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Sign in
              </h2>
              <p className="text-sm text-gray-500">
                Enter your credentials to continue
              </p>
            </div>

            {/* ERROR */}
            {error && (
              <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* EMAIL */}
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  name="email"
                  type="email"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm
                    focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                />
              </div>

              {/* PASSWORD */}
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm
                    focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* ACTION ROW */}
              <div className="flex justify-between text-xs text-gray-500">
                <span></span>
                <button type="button" className="hover:text-indigo-600">
                  Forgot password?
                </button>
              </div>

              {/* BUTTON */}
              <Button
                type="submit"
                className="w-full"
                loading={loading}
              >
                {loading ? "Signing in..." : "Sign in"}
              </Button>

              {/* FOOTER */}
              <p className="text-sm text-center text-gray-500">
                Don’t have an account?{" "}
                <Link
                  to="/register"
                  className="text-indigo-600 font-medium hover:underline"
                >
                  Create account
                </Link>
              </p>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;