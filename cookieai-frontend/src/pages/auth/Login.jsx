import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../app/providers";
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
      await new Promise((r) => setTimeout(r, 0));
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
    <div className="min-h-screen flex bg-gray-50">

      {/* LEFT PANEL */}
      <div className="hidden lg:flex w-1/2 items-center justify-center bg-gradient-to-br from-indigo-600 to-indigo-500 relative overflow-hidden">

        {/* soft glow */}
        <div className="absolute w-[500px] h-[500px] bg-indigo-400/20 blur-3xl rounded-full" />

        <div className="relative text-white max-w-md space-y-6 px-10">
          <h1 className="text-4xl font-bold tracking-tight">
            CookieAI
          </h1>

          <p className="text-sm text-indigo-100 leading-relaxed">
            A modern privacy-first analytics platform designed for speed,
            simplicity, and real-time insights.
          </p>

          <div className="space-y-2 text-sm text-indigo-100">
            <p>Real-time tracking</p>
            <p>No cookies required</p>
            <p>Fast and lightweight</p>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex flex-1 items-center justify-center px-6 py-10">

        <div className="w-full max-w-md">

          {/* MOBILE TITLE */}
          <div className="lg:hidden text-center mb-6">
            <h1 className="text-xl font-semibold">CookieAI</h1>
          </div>

          {/* CARD */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">

            {/* HEADER */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Welcome back
              </h2>
              <p className="text-sm text-gray-500">
                Sign in to continue
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
                  focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
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
                  focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium
                hover:bg-indigo-700 transition active:scale-[0.98]"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>

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