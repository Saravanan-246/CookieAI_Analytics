import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../app/providers";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { signup } = useAuth();
  const navigate = useNavigate();

  /* ---------- INPUT ---------- */
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });

    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  /* ---------- VALIDATION ---------- */
  const validate = () => {
    const err = {};

    if (!formData.name.trim()) err.name = "Name required";
    if (!formData.email.trim()) err.email = "Email required";
    if (formData.password.length < 6)
      err.password = "Minimum 6 characters required";
    if (formData.password !== formData.confirmPassword)
      err.confirmPassword = "Passwords do not match";

    return err;
  };

  /* ---------- SUBMIT ---------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const err = validate();
    if (Object.keys(err).length) {
      setErrors(err);
      return;
    }

    setLoading(true);

    try {
      await signup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      navigate("/dashboard");
    } catch (error) {
      setErrors({
        general:
          error?.data?.message ||
          error?.message ||
          "Signup failed",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">

      {/* LEFT PANEL */}
      <div className="hidden lg:flex w-1/2 items-center justify-center bg-gradient-to-br from-indigo-600 to-indigo-500 relative overflow-hidden">
        <div className="absolute w-[500px] h-[500px] bg-indigo-400/20 blur-3xl rounded-full" />

        <div className="relative text-white max-w-md space-y-6 px-10">
          <h1 className="text-4xl font-bold tracking-tight">
            Create your account
          </h1>

          <p className="text-sm text-indigo-100 leading-relaxed">
            Start tracking user behavior in real-time with a fast,
            privacy-focused analytics platform.
          </p>

          <div className="space-y-2 text-sm text-indigo-100">
            <p>Real-time insights</p>
            <p>Privacy-first tracking</p>
            <p>Lightweight integration</p>
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
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">

            {/* HEADER */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Sign up
              </h2>
              <p className="text-sm text-gray-500">
                Create your account to continue
              </p>
            </div>

            {/* ERROR */}
            {errors.general && (
              <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                {errors.general}
              </div>
            )}

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* NAME */}
              <InputField
                icon={User}
                name="name"
                placeholder="Full name"
                value={formData.name}
                onChange={handleInputChange}
                error={errors.name}
              />

              {/* EMAIL */}
              <InputField
                icon={Mail}
                name="email"
                type="email"
                placeholder="Email address"
                value={formData.email}
                onChange={handleInputChange}
                error={errors.email}
              />

              {/* PASSWORD */}
              <PasswordField
                value={formData.password}
                onChange={handleInputChange}
                show={showPassword}
                setShow={setShowPassword}
                error={errors.password}
                name="password"
                placeholder="Password"
              />

              {/* CONFIRM PASSWORD */}
              <PasswordField
                value={formData.confirmPassword}
                onChange={handleInputChange}
                show={showConfirmPassword}
                setShow={setShowConfirmPassword}
                error={errors.confirmPassword}
                name="confirmPassword"
                placeholder="Confirm password"
              />

              {/* BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium
                hover:bg-indigo-700 transition active:scale-[0.98]"
              >
                {loading ? "Creating account..." : "Create account"}
              </button>

              {/* FOOTER */}
              <p className="text-sm text-center text-gray-500">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-indigo-600 font-medium hover:underline"
                >
                  Sign in
                </Link>
              </p>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

/* INPUT FIELD */
const InputField = ({ icon: Icon, error, ...props }) => (
  <div>
    <div className="relative">
      <Icon className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
      <input
        {...props}
        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm
        focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
      />
    </div>
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

/* PASSWORD FIELD */
const PasswordField = ({
  value,
  onChange,
  show,
  setShow,
  error,
  name,
  placeholder,
}) => (
  <div>
    <div className="relative">
      <Lock className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
      <input
        name={name}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm
        focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
      />
      <button
        type="button"
        onClick={() => setShow((p) => !p)}
        className="absolute right-3 top-2.5 text-gray-400"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

export default Register;