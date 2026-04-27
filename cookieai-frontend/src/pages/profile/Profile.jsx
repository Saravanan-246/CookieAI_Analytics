import React, { useState, useEffect } from "react";
import { useAuth } from "../../app/providers";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Skeleton from "../../components/ui/Skeleton";

const Input = ({ label, ...props }) => (
  <div className="space-y-1">
    <label className="text-xs text-gray-500">{label}</label>
    <input
      {...props}
      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm"
    />
  </div>
);

const Profile = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
  });

  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        email: user.email || "",
        company: user.company || "",
      });
      setLoading(false);
    }
  }, [user]);

  const update = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    setSaving(true);
    setSuccess("");

    try {
      // 🔥 connect backend later
      await new Promise((r) => setTimeout(r, 800));

      setSuccess("Profile updated successfully");
    } catch {
      setSuccess("Update failed");
    } finally {
      setSaving(false);

      setTimeout(() => setSuccess(""), 2000);
    }
  };

  return (
    <div className="w-full px-4 md:px-8 py-6 flex justify-center">
      <div className="w-full max-w-3xl space-y-6">

        {/* HEADER */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {loading ? <Skeleton className="h-6 w-40" /> : form.name}
          </h1>
          <p className="text-sm text-gray-500">
            Manage your account settings
          </p>
        </div>

        {/* PROFILE CARD */}
        <Card className="p-6 space-y-5">

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-10 rounded-lg" />
              ))}
            </div>
          ) : (
            <>
              {/* NAME */}
              <Input
                label="Full Name"
                name="name"
                value={form.name}
                onChange={update}
              />

              {/* EMAIL (READ ONLY 🔒) */}
              <div className="space-y-1">
                <label className="text-xs text-gray-500">
                  Email (cannot be changed)
                </label>
                <input
                  value={form.email}
                  disabled
                  className="w-full px-3 py-2.5 rounded-xl border bg-gray-100 text-gray-500 text-sm cursor-not-allowed"
                />
              </div>

              {/* COMPANY */}
              <Input
                label="Company"
                name="company"
                value={form.company}
                onChange={update}
              />

              {/* SAVE */}
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-green-600">
                  {success}
                </p>

                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </>
          )}
        </Card>

      </div>
    </div>
  );
};

export default Profile;