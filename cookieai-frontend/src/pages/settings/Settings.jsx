import React, { useState, useEffect } from "react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Skeleton from "../../components/ui/Skeleton";

/* ---------- TOGGLE ---------- */
const Toggle = ({ value, onChange }) => (
  <button
    onClick={onChange}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
      value ? "bg-indigo-600" : "bg-gray-200"
    }`}
  >
    <span
      className={`h-4 w-4 bg-white rounded-full shadow-sm transition transform ${
        value ? "translate-x-6" : "translate-x-1"
      }`}
    />
  </button>
);

/* ---------- ROW ---------- */
const Row = ({ title, desc, children }) => (
  <div className="flex items-center justify-between py-4">
    <div>
      <p className="text-sm font-medium text-gray-900">
        {title}
      </p>
      <p className="text-xs text-gray-500 mt-0.5">
        {desc}
      </p>
    </div>
    {children}
  </div>
);

/* ---------- SECTION ---------- */
const Section = ({ title, children }) => (
  <Card>
    <h2 className="text-sm font-semibold text-gray-900 mb-4">
      {title}
    </h2>
    <div className="divide-y">{children}</div>
  </Card>
);

const Settings = () => {
  const [loading, setLoading] = useState(true);

  const [notifications, setNotifications] = useState({
    email: true,
    weekly: true,
    realtime: true,
  });

  const [privacy, setPrivacy] = useState({
    public: false,
    analytics: true,
    cookies: true,
  });

  const [data, setData] = useState({
    retention: "30",
    autoDelete: false,
    export: true,
  });

  /* ---------- FAKE LOAD ---------- */
  useEffect(() => {
    setTimeout(() => setLoading(false), 800);
  }, []);

  const toggle = (group, key) => {
    if (group === "n")
      setNotifications({ ...notifications, [key]: !notifications[key] });

    if (group === "p")
      setPrivacy({ ...privacy, [key]: !privacy[key] });

    if (group === "d")
      setData({ ...data, [key]: !data[key] });
  };

  return (
    <div className="w-full px-4 md:px-8 py-6 flex justify-center">

      {/* CONTAINER */}
      <div className="w-full max-w-5xl space-y-8">

        {/* HEADER */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Settings
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your preferences and configuration
          </p>
        </div>

        {/* NOTIFICATIONS */}
        <Section title="Notifications">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="flex justify-between py-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <Skeleton className="h-6 w-10 rounded-full" />
              </div>
            ))
          ) : (
            <>
              <Row title="Email Alerts" desc="Important updates">
                <Toggle
                  value={notifications.email}
                  onChange={() => toggle("n", "email")}
                />
              </Row>

              <Row title="Weekly Reports" desc="Summary emails">
                <Toggle
                  value={notifications.weekly}
                  onChange={() => toggle("n", "weekly")}
                />
              </Row>

              <Row title="Realtime Alerts" desc="Instant events">
                <Toggle
                  value={notifications.realtime}
                  onChange={() => toggle("n", "realtime")}
                />
              </Row>
            </>
          )}
        </Section>

        {/* PRIVACY */}
        <Section title="Privacy">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="flex justify-between py-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-36" />
                </div>
                <Skeleton className="h-6 w-10 rounded-full" />
              </div>
            ))
          ) : (
            <>
              <Row title="Public Profile" desc="Visible to others">
                <Toggle
                  value={privacy.public}
                  onChange={() => toggle("p", "public")}
                />
              </Row>

              <Row title="Share Analytics" desc="Anonymous data">
                <Toggle
                  value={privacy.analytics}
                  onChange={() => toggle("p", "analytics")}
                />
              </Row>

              <Row title="Allow Cookies" desc="Tracking enabled">
                <Toggle
                  value={privacy.cookies}
                  onChange={() => toggle("p", "cookies")}
                />
              </Row>
            </>
          )}
        </Section>

        {/* DATA */}
        <Card>
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            Data
          </h2>

          {loading ? (
            <div className="space-y-5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 rounded-lg" />

              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex justify-between py-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                  <Skeleton className="h-6 w-10 rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-5">

              <div>
                <label className="text-xs font-medium text-gray-500">
                  Data Retention
                </label>
                <select
                  value={data.retention}
                  onChange={(e) =>
                    setData({ ...data, retention: e.target.value })
                  }
                  className="input mt-2 w-full"
                >
                  <option value="7">7 days</option>
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                </select>
              </div>

              <div className="divide-y">
                <Row title="Auto Delete" desc="Remove old data">
                  <Toggle
                    value={data.autoDelete}
                    onChange={() => toggle("d", "autoDelete")}
                  />
                </Row>

                <Row title="Export Data" desc="Allow exports">
                  <Toggle
                    value={data.export}
                    onChange={() => toggle("d", "export")}
                  />
                </Row>
              </div>

            </div>
          )}
        </Card>

        {/* ACTIONS */}
        <div className="flex justify-end gap-3 pt-2">
          {loading ? (
            <>
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-32" />
            </>
          ) : (
            <>
              <Button variant="secondary">
                Reset
              </Button>
              <Button>
                Save Changes
              </Button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default Settings;