import React, { useEffect, useState } from "react";
import { adminAPI } from "../../api";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import toast from "react-hot-toast";

export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    site_name: "",
    maintenance_mode: false,
    registration_enabled: true,
  });

  useEffect(() => {
    adminAPI
      .getSiteSettings()
      .then(({ data }) => {
        setSettings(data.data);
        setForm({
          site_name: data.data.site_name || "Inkboard",
          maintenance_mode: data.data.maintenance_mode || false,
          registration_enabled: data.data.registration_enabled !== false,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await adminAPI.updateSiteSettings({ settings: form });
      toast.success("Settings saved!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Site Settings
      </h1>

      <div className="card p-6 space-y-5">
        <h2 className="font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-3">
          General
        </h2>

        <Input
          label="Site Name"
          value={form.site_name}
          onChange={(e) => setForm({ ...form, site_name: e.target.value })}
        />

        <Toggle
          label="Maintenance Mode"
          description="When enabled, only admins can access the site."
          value={form.maintenance_mode}
          onChange={(v) => setForm({ ...form, maintenance_mode: v })}
        />

        <Toggle
          label="Registration Enabled"
          description="Allow new users to create accounts."
          value={form.registration_enabled}
          onChange={(v) => setForm({ ...form, registration_enabled: v })}
        />

        <Button onClick={save} loading={saving}>
          Save Settings
        </Button>
      </div>

      {/* plan info (read-only) */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
          Plan Pricing
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                <th className="pb-3">Plan</th>
                <th className="pb-3">Price</th>
                <th className="pb-3">Boards</th>
                <th className="pb-3">AI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {settings?.plans &&
                Object.entries(settings.plans).map(([key, val]) => (
                  <tr key={key}>
                    <td className="py-2 capitalize font-medium text-gray-800 dark:text-gray-200">
                      {key}
                    </td>
                    <td className="py-2 text-gray-500">
                      {val.price === 0
                        ? "Free"
                        : `Rp${val.price.toLocaleString()}`}
                    </td>
                    <td className="py-2 text-gray-500">
                      {val.boards === -1 ? "Unlimited" : val.boards}
                    </td>
                    <td className="py-2">
                      <span
                        className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${val.ai ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400"}`}
                      >
                        {val.ai ? "Yes" : "No"}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Toggle({ label, description, value, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </p>
        {description && (
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        )}
      </div>
      <div
        onClick={() => onChange(!value)}
        className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0 ${value ? "bg-primary-500" : "bg-gray-300 dark:bg-gray-600"}`}
      >
        <div
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? "translate-x-5" : ""}`}
        />
      </div>
    </div>
  );
}
