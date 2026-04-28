import { useState } from "react";
import { apiRequest } from "../../services/api";
import { Link, useNavigate } from "react-router-dom";

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");

  const [ui, setUI] = useState({
    loading: false,
    error: "",
    success: "",
    resetLink: "",
    copied: false,
  });

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (ui.loading) return;

    if (!email.trim()) {
      setUI((p) => ({ ...p, error: "Email is required" }));
      return;
    }

    setUI({
      loading: true,
      error: "",
      success: "",
      resetLink: "",
      copied: false,
    });

    try {
      const res = await apiRequest.post("/auth/forgot-password", { email });

      const link = res?.data?.resetURL || "";

      setUI({
        loading: false,
        error: "",
        success: res?.data?.message || "Reset link generated",
        resetLink: link,
        copied: false,
      });

    } catch (err) {
      setUI((p) => ({
        ...p,
        loading: false,
        error: "Unable to generate reset link",
      }));
    }
  };

  /* ================= COPY ================= */
  const handleCopy = async () => {
    if (!ui.resetLink) return;

    await navigator.clipboard.writeText(ui.resetLink);

    setUI((p) => ({ ...p, copied: true }));
  };

  /* ================= UI ================= */
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">

      <div className="w-full max-w-md">

        {/* HEADER */}
        <div className="text-center mb-8">
          <h1 className="text-xl font-semibold text-slate-900">
            CookieAI
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Password recovery
          </p>
        </div>

        {/* CARD */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">

          {/* SUCCESS STATE */}
          {ui.success ? (
            <div className="space-y-4">

              <h2 className="text-lg font-semibold text-slate-900">
                Reset link generated
              </h2>

              <p className="text-sm text-slate-500">
                Use the link below to reset your password.
              </p>

              {/* LINK BOX */}
              {ui.resetLink && (
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 text-sm break-all">
                  {ui.resetLink}
                </div>
              )}

              {/* ACTIONS */}
              <div className="flex gap-2">

                <button
                  onClick={handleCopy}
                  className="flex-1 py-2 rounded-lg border border-slate-200 text-sm hover:bg-slate-50"
                >
                  {ui.copied ? "Copied" : "Copy link"}
                </button>

                <a
                  href={ui.resetLink}
                  className="flex-1 text-center py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700"
                >
                  Open
                </a>
              </div>

              <button
                onClick={() => navigate("/login")}
                className="w-full text-sm text-indigo-600 hover:underline"
              >
                Back to login
              </button>

            </div>
          ) : (
            <>
              {/* FORM STATE */}
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Forgot password
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Enter your email to generate a secure reset link.
                </p>
              </div>

              {ui.error && (
                <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                  {ui.error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">

                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (ui.error) {
                      setUI((p) => ({ ...p, error: "" }));
                    }
                  }}
                  disabled={ui.loading}
                  placeholder="Email address"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm
                  focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100"
                />

                <button
                  type="submit"
                  disabled={ui.loading}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium
                  hover:bg-indigo-700 disabled:opacity-60"
                >
                  {ui.loading ? "Generating..." : "Generate reset link"}
                </button>

              </form>

              <p className="text-xs text-center text-slate-500">
                Remember your password?{" "}
                <Link to="/login" className="text-indigo-600 hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;