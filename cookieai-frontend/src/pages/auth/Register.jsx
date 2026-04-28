import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../app/providers";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";

const Register = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [ui, setUI] = useState({
    loading: false,
    errors: {},
    showPassword: false,
    showConfirmPassword: false,
  });

  /* ================= INPUT ================= */
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (ui.errors[name]) {
      setUI((prev) => ({
        ...prev,
        errors: { ...prev.errors, [name]: "" },
      }));
    }
  };

  /* ================= VALIDATION ================= */
  const validate = () => {
    const err = {};

    if (!formData.name.trim()) err.name = "Name required";

    if (!formData.email.trim()) {
      err.email = "Email required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      err.email = "Invalid email";
    }

    if (formData.password.length < 6) {
      err.password = "Minimum 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      err.confirmPassword = "Passwords do not match";
    }

    return err;
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (ui.loading) return;

    const err = validate();

    if (Object.keys(err).length) {
      setUI((prev) => ({ ...prev, errors: err }));
      return;
    }

    setUI((prev) => ({ ...prev, loading: true, errors: {} }));

    try {
      await signup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      navigate("/dashboard");

    } catch (error) {
      setUI((prev) => ({
        ...prev,
        errors: {
          general:
            error?.response?.data?.message || "Signup failed",
        },
      }));
    } finally {
      setUI((prev) => ({ ...prev, loading: false }));
    }
  };

  /* ================= UI ================= */
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-slate-100">

      {/* LEFT PANEL */}
      <div className="hidden lg:flex w-1/2 items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-600">
        <div className="text-white max-w-md px-10 space-y-4">
          <h1 className="text-3xl font-semibold">
            Create your account
          </h1>
          <p className="text-sm text-indigo-100">
            Start using a fast, privacy-first analytics platform.
          </p>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex flex-1 items-center justify-center px-6">

        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">

          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Create account
            </h2>
            <p className="text-sm text-slate-500">
              Enter your details below
            </p>
          </div>

          {ui.errors.general && (
            <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {ui.errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            <Input
              icon={User}
              name="name"
              placeholder="Full name"
              value={formData.name}
              onChange={handleChange}
              error={ui.errors.name}
              disabled={ui.loading}
            />

            <Input
              icon={Mail}
              name="email"
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
              error={ui.errors.email}
              disabled={ui.loading}
            />

            <PasswordInput
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              error={ui.errors.password}
              show={ui.showPassword}
              toggle={() =>
                setUI((p) => ({ ...p, showPassword: !p.showPassword }))
              }
              disabled={ui.loading}
            />

            <PasswordInput
              name="confirmPassword"
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={ui.errors.confirmPassword}
              show={ui.showConfirmPassword}
              toggle={() =>
                setUI((p) => ({
                  ...p,
                  showConfirmPassword: !p.showConfirmPassword,
                }))
              }
              disabled={ui.loading}
            />

            <button
              type="submit"
              disabled={ui.loading}
              className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium
              hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {ui.loading ? "Creating..." : "Create account"}
            </button>

            <p className="text-sm text-center text-slate-500">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-indigo-600 hover:underline"
              >
                Sign in
              </Link>
            </p>

          </form>
        </div>
      </div>
    </div>
  );
};

/* ================= INPUT ================= */
const Input = ({ icon: Icon, error, disabled, ...props }) => (
  <div>
    <div className="relative">
      <Icon className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
      <input
        {...props}
        disabled={disabled}
        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm
        focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100"
      />
    </div>
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

/* ================= PASSWORD ================= */
const PasswordInput = ({
  name,
  value,
  onChange,
  show,
  toggle,
  error,
  disabled,
  placeholder,
}) => (
  <div>
    <div className="relative">
      <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
      <input
        name={name}
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm
        focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100"
      />
      <button
        type="button"
        onClick={toggle}
        className="absolute right-3 top-2.5 text-slate-400"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

export default Register;