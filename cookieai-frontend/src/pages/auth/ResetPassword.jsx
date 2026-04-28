import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { apiRequest } from "../../services/api";
import { Eye, EyeOff } from "lucide-react";

const ResetPassword = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const navigate = useNavigate();

  const [form, setForm] = useState({
    password: "",
    confirm: "",
  });

  const [ui, setUI] = useState({
    loading: false,
    error: "",
    success: false,
    show: false,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({ ...prev, [name]: value }));

    if (ui.error) {
      setUI((p) => ({ ...p, error: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (ui.loading) return;

    if (!token) {
      return setUI((p) => ({ ...p, error: "Invalid reset link" }));
    }

    if (form.password.length < 6) {
      return setUI((p) => ({ ...p, error: "Minimum 6 characters required" }));
    }

    if (form.password !== form.confirm) {
      return setUI((p) => ({ ...p, error: "Passwords do not match" }));
    }

    setUI((p) => ({ ...p, loading: true, error: "" }));

    try {
      await apiRequest.post("/auth/reset-password", {
        token,
        password: form.password,
      });

      setUI({
        loading: false,
        error: "",
        success: true,
        show: false,
      });

      setTimeout(() => navigate("/login"), 1800);

    } catch {
      setUI((p) => ({
        ...p,
        loading: false,
        error: "Invalid or expired link",
      }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">

      <div className="w-full max-w-md">

        {/* HEADER */}
        <div className="text-center mb-8">
          <h1 className="text-xl font-semibold text-slate-900">CookieAI</h1>
          <p className="text-sm text-slate-500 mt-1">Password reset</p>
        </div>

        {/* CARD */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">

          {/* SUCCESS */}
          {ui.success ? (
            <div className="text-center space-y-4">

              <div className="w-12 h-12 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
              </div>

              <h2 className="text-lg font-semibold text-slate-900">
                Password updated
              </h2>

              <p className="text-sm text-slate-500">
                Redirecting to login...
              </p>
            </div>
          ) : (
            <>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Set new password
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Choose a strong password for your account.
                </p>
              </div>

              {ui.error && (
                <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                  {ui.error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">

                {/* PASSWORD */}
                <div className="relative">
                  <input
                    name="password"
                    type={ui.show ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    disabled={ui.loading}
                    placeholder="New password"
                    className="w-full px-4 py-2.5 pr-10 border border-slate-200 rounded-xl text-sm
                    focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setUI((p) => ({ ...p, show: !p.show }))
                    }
                    className="absolute right-3 top-2.5 text-slate-400"
                  >
                    {ui.show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* CONFIRM */}
                <input
                  name="confirm"
                  type={ui.show ? "text" : "password"}
                  value={form.confirm}
                  onChange={handleChange}
                  disabled={ui.loading}
                  placeholder="Confirm password"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm
                  focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100"
                />

                {/* BUTTON */}
                <button
                  type="submit"
                  disabled={ui.loading}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium
                  hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {ui.loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update password"
                  )}
                </button>

              </form>

              <p className="text-xs text-center text-slate-500">
                Back to{" "}
                <Link to="/login" className="text-indigo-600 hover:underline">
                  login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;