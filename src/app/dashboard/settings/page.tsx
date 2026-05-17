"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { motion } from "framer-motion";
import { Loader2, Save, Trash2, User, Globe, Palette, Shield, CreditCard } from "lucide-react";

interface UserSettings {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  timezone: string;
  preferences: Record<string, unknown> | null;
  subscriptionTier: string;
  subscriptionExpiry: string | null;
  createdAt: string;
}

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [theme, setTheme] = useState("light");
  const [activeTab, setActiveTab] = useState("profile");
  const [showDelete, setShowDelete] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        setName(data.name || "");
        setTimezone(data.timezone || "UTC");
        setTheme((data.preferences as Record<string, string>)?.theme || "light");
      }
    } catch { /* */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          timezone,
          preferences: { ...(settings?.preferences as Record<string, unknown> || {}), theme },
        }),
      });
      setSaved(true);
      await update({ name });
      setTimeout(() => setSaved(false), 2000);
    } catch { /* */ } finally { setSaving(false); }
  };

  const deleteAccount = async () => {
    if (!confirm("This action is permanent. Are you sure?")) return;
    await fetch("/api/settings", { method: "DELETE" });
    signOut({ callbackUrl: "/" });
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "preferences", label: "Preferences", icon: Palette },
    { id: "subscription", label: "Subscription", icon: CreditCard },
    { id: "security", label: "Security", icon: Shield },
  ];

  const timezones = [
    "UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
    "Europe/London", "Europe/Paris", "Europe/Berlin", "Asia/Kolkata", "Asia/Tokyo",
    "Asia/Shanghai", "Australia/Sydney", "Pacific/Auckland",
  ];

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-zinc-400" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
        <p className="text-sm text-zinc-500 mt-0.5">Manage your profile, preferences, and account.</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-zinc-100 rounded-xl p-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium flex-1 transition-all ${activeTab === t.id ? "bg-white text-black shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}>
            <t.icon className="w-4 h-4" /><span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-zinc-200/60 p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-zinc-700 to-zinc-900 flex items-center justify-center text-white text-xl font-bold">
              {(name || "U").charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-semibold">{name || "User"}</h3>
              <p className="text-sm text-zinc-500">{settings?.email || settings?.phone || "No email set"}</p>
              <p className="text-xs text-zinc-400 mt-0.5">Member since {new Date(settings?.createdAt || "").toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Display Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10 placeholder:text-zinc-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Timezone</label>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-zinc-400" />
              <select value={timezone} onChange={e => setTimezone(e.target.value)} className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10">
                {timezones.map(tz => <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>)}
              </select>
            </div>
          </div>
          <button onClick={saveSettings} disabled={saving} className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 transition-all">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <><Save className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
        </motion.div>
      )}

      {/* Preferences Tab */}
      {activeTab === "preferences" && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-zinc-200/60 p-6 shadow-sm space-y-5">
          <h3 className="font-semibold text-sm">Appearance</h3>
          <div className="grid grid-cols-3 gap-3">
            {["light", "dark", "auto"].map(t => (
              <button key={t} onClick={() => setTheme(t)} className={`p-4 rounded-xl border text-sm font-medium text-center transition-all ${theme === t ? "bg-black text-white border-black" : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:border-zinc-300"}`}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <h3 className="font-semibold text-sm pt-4">Notification Preferences</h3>
          <div className="space-y-3">
            {["Daily plan reminders", "Habit check-ins", "Weekly review summary", "AI insights & tips"].map(item => (
              <label key={item} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl cursor-pointer group">
                <span className="text-sm text-zinc-700">{item}</span>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-black rounded" />
              </label>
            ))}
          </div>
          <button onClick={saveSettings} disabled={saving} className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-zinc-800 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save</>}
          </button>
        </motion.div>
      )}

      {/* Subscription Tab */}
      {activeTab === "subscription" && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-white rounded-2xl border border-zinc-200/60 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Current Plan</h3>
                <p className="text-sm text-zinc-500 mt-0.5">You&apos;re on the {settings?.subscriptionTier || "FREE"} plan</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${settings?.subscriptionTier === "PRO" ? "bg-gradient-to-r from-violet-500 to-indigo-500 text-white" : "bg-zinc-100 text-zinc-700"}`}>
                {settings?.subscriptionTier || "FREE"}
              </span>
            </div>
            {settings?.subscriptionTier === "FREE" && (
              <p className="text-sm text-zinc-500">Upgrade to unlock unlimited AI generations, advanced analytics, and priority support.</p>
            )}
          </div>

          {/* Pricing Cards */}
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { tier: "FREE", price: "$0", desc: "For getting started", features: ["5 AI generations/day", "Basic habits & tasks", "7-day insights"] },
              { tier: "PRO", price: "$9", desc: "For power users", features: ["Unlimited AI", "Advanced analytics", "Priority support", "Custom integrations"], popular: true },
              { tier: "TEAM", price: "$29", desc: "For teams", features: ["Everything in Pro", "Team dashboards", "Shared goals", "Admin controls"] },
            ].map(plan => (
              <div key={plan.tier} className={`rounded-2xl border p-5 ${plan.popular ? "border-black shadow-lg relative" : "border-zinc-200/60"}`}>
                {plan.popular && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-bold px-3 py-0.5 rounded-full">POPULAR</span>}
                <h4 className="font-semibold text-sm mb-0.5">{plan.tier}</h4>
                <div className="text-2xl font-bold mb-1">{plan.price}<span className="text-sm font-normal text-zinc-400">/mo</span></div>
                <p className="text-xs text-zinc-500 mb-4">{plan.desc}</p>
                <ul className="space-y-2 text-xs text-zinc-600 mb-5">
                  {plan.features.map(f => <li key={f} className="flex items-center gap-2">✓ {f}</li>)}
                </ul>
                <button disabled={settings?.subscriptionTier === plan.tier} className={`w-full py-2 rounded-lg text-xs font-medium ${plan.popular ? "bg-black text-white hover:bg-zinc-800" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"} disabled:opacity-50 transition-all`}>
                  {settings?.subscriptionTier === plan.tier ? "Current" : "Upgrade"}
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Security Tab */}
      {activeTab === "security" && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-white rounded-2xl border border-zinc-200/60 p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-sm">Change Password</h3>
            <input type="password" placeholder="Current password" className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10 placeholder:text-zinc-400" />
            <input type="password" placeholder="New password" className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10 placeholder:text-zinc-400" />
            <button className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-zinc-800"><Shield className="w-4 h-4" /> Update Password</button>
          </div>

          <div className="bg-white rounded-2xl border border-red-100 p-6 shadow-sm">
            <h3 className="font-semibold text-sm text-red-600 mb-2">Danger Zone</h3>
            <p className="text-sm text-zinc-500 mb-4">Permanently delete your account and all data. This cannot be undone.</p>
            {!showDelete ? (
              <button onClick={() => setShowDelete(true)} className="text-sm font-medium text-red-600 hover:text-red-700">Delete my account</button>
            ) : (
              <div className="flex items-center gap-3">
                <button onClick={deleteAccount} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-700"><Trash2 className="w-4 h-4" /> Confirm Delete</button>
                <button onClick={() => setShowDelete(false)} className="text-sm text-zinc-500">Cancel</button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
