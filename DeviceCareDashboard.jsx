import React, { useState, useMemo } from "react";
import {
  Monitor,
  HardDrive,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Building2,
  CreditCard,
  Receipt,
  LayoutGrid,
  Mail,
  MessageSquare,
  FileText,
  Package,
  RefreshCw,
  ShieldCheck,
  Download,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Mock data — stands in for what a real backend/API will eventually return.
// Shape mirrors the actual DeviceCare .txt report fields (CPU, disk, storage
// health, executed actions, errors) so wiring up the real API later is a
// straight swap, not a redesign.
// ---------------------------------------------------------------------------

const COMPANIES = [
  { id: "acme", name: "Acme Freight Co." },
  { id: "blue-harbor", name: "Blue Harbor Logistics" },
];

const now = new Date("2026-09-06T12:00:00Z");
const hoursAgo = (h) => new Date(now.getTime() - h * 3600 * 1000);
const fmtAgo = (d) => {
  if (!d) return "never";
  const h = Math.round((now - d) / 3600000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
};
const fmtTime = (d) => {
  if (!d) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
const fmtDuration = (seconds) => {
  if (seconds == null) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
};

// Maps a /api/v1/admin/companies/:id/machines row (real backend shape) into
// the same shape the UI already renders from mock MACHINES data.
function mapLiveMachine(m) {
  const r = m.latestReport;
  return {
    id: m.id,
    name: m.name,
    user: r?.runBy || "—",
    os: "—",
    status: m.status === "never_reported" ? "never_reported" : m.status,
    lastRun: m.lastSeenAt ? new Date(m.lastSeenAt) : null,
    duration: r ? fmtDuration(r.durationSeconds) : "—",
    cpu: r?.cpuLoadPercent != null ? Number(r.cpuLoadPercent) : null,
    diskFreePct: r?.diskFreePercent != null ? Number(r.diskFreePercent) : null,
    storage: (r?.storage || []).map((d) => ({
      name: d.name || "Unknown drive",
      type: d.type || "—",
      health: d.health || "—",
      tempC: d.tempC ?? "—",
      wear: d.wear ?? "—",
    })),
    actions: r?.actions || [],
    errors: r?.errors || [],
    history: [],
  };
}

const MACHINES = {
  acme: [
    {
      id: "m1",
      name: "DESKTOP-TBP8BFL",
      user: "anas",
      os: "Windows 11 Pro",
      status: "warning",
      lastRun: hoursAgo(19),
      duration: "40m 17s",
      cpu: 6.9,
      diskFreePct: 29.95,
      storage: [
        { name: "CT1000P3SSD8", type: "SSD", health: "Healthy", tempC: 41, wear: 0 },
        { name: "Kingston DataTraveler 3.0", type: "USB", health: "Healthy", tempC: 30, wear: 0 },
      ],
      actions: [
        "Pending Reboot Check: Clean",
        "CPU Load Check Passed (6.9% average over 3 samples)",
        "Disk Space Healthy (29.95% free)",
        "Temp & Recycle Bins: 4 removed, 46 skipped",
        "SFC Scan: Clean (exit code 0)",
        "Vendor Hardware Update: Dell — already up to date",
      ],
      errors: [
        "DISM RestoreHealth failed — repair source not found or component store cannot be repaired",
      ],
      history: ["ok", "ok", "warning", "ok", "warning"],
    },
    {
      id: "m2",
      name: "DESKTOP-N8S7FOE",
      user: "mohamed",
      os: "Windows 11 Pro",
      status: "ok",
      lastRun: hoursAgo(4),
      duration: "11m 3s",
      cpu: 25.8,
      diskFreePct: 26.24,
      storage: [
        { name: "WDC WD10SPZX-08Z10", type: "HDD", health: "Healthy", tempC: 34, wear: 0 },
        { name: "Solid", type: "SSD", health: "Healthy", tempC: 33, wear: 0 },
      ],
      actions: [
        "Pending Reboot Check: Clean",
        "CPU Load Check Passed (25.8% average over 3 samples)",
        "Disk Space Healthy (26.24% free)",
        "Temp & Recycle Bins: 11 removed, 11 skipped",
        "DISM Repair: Success — ImageHealthState: Healthy",
        "SFC Scan: Clean (exit code 0)",
        "Vendor Hardware Update: Lenovo — already up to date",
      ],
      errors: [],
      history: ["ok", "ok", "ok", "ok", "ok"],
    },
    {
      id: "m3",
      name: "LT-ACME-0311",
      user: "farah",
      os: "Windows 10 Pro",
      status: "critical",
      lastRun: hoursAgo(72),
      duration: "—",
      cpu: null,
      diskFreePct: 4.1,
      storage: [
        { name: "ST500LM021", type: "HDD", health: "Warning", tempC: 47, wear: 12 },
      ],
      actions: ["Pending Reboot Check: Reboot required (3 days pending)"],
      errors: [
        "Disk Space Critical (4.1% free) — cleanup could not free enough space",
        "SFC Scan: Corruption found, repair failed",
      ],
      history: ["ok", "warning", "warning", "critical", "critical"],
    },
  ],
  "blue-harbor": [
    {
      id: "m4",
      name: "BH-WAREHOUSE-02",
      user: "system",
      os: "Windows 11 Pro",
      status: "ok",
      lastRun: hoursAgo(2),
      duration: "8m 40s",
      cpu: 11.2,
      diskFreePct: 61.0,
      storage: [{ name: "Samsung 870 EVO", type: "SSD", health: "Healthy", tempC: 29, wear: 0 }],
      actions: [
        "Pending Reboot Check: Clean",
        "CPU Load Check Passed (11.2% average over 3 samples)",
        "Disk Space Healthy (61.0% free)",
        "DISM Repair: Success — ImageHealthState: Healthy",
        "SFC Scan: Clean (exit code 0)",
      ],
      errors: [],
      history: ["ok", "ok", "ok", "ok", "ok"],
    },
    {
      id: "m5",
      name: "BH-OFFICE-07",
      user: "youssef",
      os: "Windows 11 Pro",
      status: "warning",
      lastRun: hoursAgo(30),
      duration: "22m 10s",
      cpu: 18.4,
      diskFreePct: 15.8,
      storage: [{ name: "Crucial MX500", type: "SSD", health: "Healthy", tempC: 36, wear: 2 }],
      actions: [
        "Pending Reboot Check: Clean",
        "CPU Load Check Passed (18.4% average over 3 samples)",
        "Disk Space Low (15.8% free)",
        "SFC Scan: Clean (exit code 0)",
      ],
      errors: ["Vendor Hardware Update: HP — tool timed out after 1800s"],
      history: ["ok", "ok", "ok", "warning", "warning"],
    },
  ],
};

// ---------------------------------------------------------------------------
// Billing mock data — one subscription record per client company. Pricing
// model: flat monthly fee per plan tier, tier caps a machine count, overage
// billed per extra machine. Mirrors a typical seat/agent-based SaaS.
// ---------------------------------------------------------------------------

const BILLING = {
  acme: {
    plan: "Growth",
    priceMonthly: 149,
    machinesIncluded: 25,
    machinesUsed: MACHINES.acme.length,
    status: "active",
    nextRenewal: new Date("2026-10-01T00:00:00Z"),
    paymentMethod: "Visa •••• 4417",
    invoices: [
      { id: "INV-2026-09", date: new Date("2026-09-01T00:00:00Z"), amount: 149, status: "paid" },
      { id: "INV-2026-08", date: new Date("2026-08-01T00:00:00Z"), amount: 149, status: "paid" },
      { id: "INV-2026-07", date: new Date("2026-07-01T00:00:00Z"), amount: 149, status: "paid" },
    ],
  },
  "blue-harbor": {
    plan: "Starter",
    priceMonthly: 49,
    machinesIncluded: 10,
    machinesUsed: MACHINES["blue-harbor"].length,
    status: "past_due",
    nextRenewal: new Date("2026-09-08T00:00:00Z"),
    paymentMethod: "Mastercard •••• 2290",
    invoices: [
      { id: "INV-2026-09", date: new Date("2026-09-01T00:00:00Z"), amount: 49, status: "failed" },
      { id: "INV-2026-08", date: new Date("2026-08-01T00:00:00Z"), amount: 49, status: "paid" },
      { id: "INV-2026-07", date: new Date("2026-07-01T00:00:00Z"), amount: 49, status: "paid" },
    ],
  },
};

const PLANS = [
  { name: "Starter", price: 49, machines: 10 },
  { name: "Growth", price: 149, machines: 25 },
  { name: "Scale", price: 349, machines: 75 },
];

const SUB_STATUS_META = {
  active: { label: "Active", cls: "st-ok" },
  trial: { label: "Trial", cls: "st-warn" },
  past_due: { label: "Past due", cls: "st-crit" },
};

// ---------------------------------------------------------------------------
// Inventory mock data — asset/software details per machine.
// ---------------------------------------------------------------------------

const INVENTORY = {
  m1: {
    purchaseDate: new Date("2023-02-14T00:00:00Z"),
    warrantyExpiry: new Date("2026-02-14T00:00:00Z"),
    manufacturer: "Dell",
    model: "OptiPlex 7010",
    software: [
      { name: "Google Chrome", version: "128.0.6613" },
      { name: "Microsoft Office LTSC", version: "2021" },
      { name: "Adobe Acrobat Reader", version: "24.002" },
      { name: "7-Zip", version: "23.01" },
    ],
  },
  m2: {
    purchaseDate: new Date("2024-06-01T00:00:00Z"),
    warrantyExpiry: new Date("2027-06-01T00:00:00Z"),
    manufacturer: "Lenovo",
    model: "ThinkCentre M70q",
    software: [
      { name: "Google Chrome", version: "128.0.6613" },
      { name: "Zoom", version: "6.1.11" },
      { name: "Slack", version: "4.39.95" },
    ],
  },
  m3: {
    purchaseDate: new Date("2020-11-20T00:00:00Z"),
    warrantyExpiry: new Date("2023-11-20T00:00:00Z"),
    manufacturer: "Generic",
    model: "LT-500",
    software: [
      { name: "Google Chrome", version: "119.0.6045 (outdated)" },
      { name: "Microsoft Office", version: "2016" },
    ],
  },
  m4: {
    purchaseDate: new Date("2025-01-10T00:00:00Z"),
    warrantyExpiry: new Date("2028-01-10T00:00:00Z"),
    manufacturer: "HP",
    model: "ProDesk 400 G9",
    software: [
      { name: "Google Chrome", version: "128.0.6613" },
      { name: "SAP GUI", version: "7.80" },
    ],
  },
  m5: {
    purchaseDate: new Date("2022-09-05T00:00:00Z"),
    warrantyExpiry: new Date("2025-09-05T00:00:00Z"),
    manufacturer: "HP",
    model: "EliteDesk 800 G6",
    software: [
      { name: "Google Chrome", version: "127.0.6533" },
      { name: "Microsoft Office 365", version: "2409" },
    ],
  },
};

// ---------------------------------------------------------------------------
// Alerts mock data — per-company rules plus a shared recent-alerts log.
// ---------------------------------------------------------------------------

const ALERT_RULES = {
  acme: [
    { id: "r1", event: "Machine status becomes Critical", channels: ["email", "sms"], recipients: ["it@acmefreight.com"] },
    { id: "r2", event: "Disk free space below 10%", channels: ["email"], recipients: ["it@acmefreight.com"] },
    { id: "r3", event: "DISM/SFC repair fails", channels: ["email"], recipients: ["it@acmefreight.com"] },
  ],
  "blue-harbor": [
    { id: "r4", event: "Machine status becomes Critical", channels: ["email"], recipients: ["ops@blueharborlog.com"] },
    { id: "r5", event: "Vendor update tool times out", channels: ["email"], recipients: ["ops@blueharborlog.com"] },
  ],
};

const ALERT_LOG = [
  { id: "a1", time: hoursAgo(1), company: "acme", machine: "LT-ACME-0311", message: "Disk space Critical (4.1% free)", channels: ["email", "sms"] },
  { id: "a2", time: hoursAgo(1), company: "acme", machine: "LT-ACME-0311", message: "SFC Scan corruption found, repair failed", channels: ["email"] },
  { id: "a3", time: hoursAgo(28), company: "blue-harbor", machine: "BH-OFFICE-07", message: "HP vendor update tool timed out after 1800s", channels: ["email"] },
  { id: "a4", time: hoursAgo(70), company: "acme", machine: "LT-ACME-0311", message: "Machine status changed to Critical", channels: ["email", "sms"] },
];

// ---------------------------------------------------------------------------
// Reports mock data — scheduled digest config + generated report history.
// ---------------------------------------------------------------------------

const REPORT_SETTINGS = {
  acme: { frequency: "Weekly", recipients: ["management@acmefreight.com"], dayOfWeek: "Monday" },
  "blue-harbor": { frequency: "Monthly", recipients: ["owner@blueharborlog.com"], dayOfWeek: "1st of month" },
};

const REPORT_HISTORY = {
  acme: [
    { id: "REP-2026-W36", period: "Aug 31 – Sep 6, 2026", generatedAt: hoursAgo(20) },
    { id: "REP-2026-W35", period: "Aug 24 – Aug 30, 2026", generatedAt: hoursAgo(20 + 168) },
    { id: "REP-2026-W34", period: "Aug 17 – Aug 23, 2026", generatedAt: hoursAgo(20 + 336) },
  ],
  "blue-harbor": [
    { id: "REP-2026-08", period: "August 2026", generatedAt: hoursAgo(140) },
    { id: "REP-2026-07", period: "July 2026", generatedAt: hoursAgo(140 + 720) },
  ],
};

const STATUS_META = {
  ok: { label: "Healthy", cls: "st-ok", Icon: CheckCircle2 },
  warning: { label: "Needs attention", cls: "st-warn", Icon: AlertTriangle },
  critical: { label: "Critical", cls: "st-crit", Icon: AlertTriangle },
  never_reported: { label: "Never reported", cls: "st-warn", Icon: Clock },
};

function StatusDot({ status }) {
  return <span className={`dot ${STATUS_META[status].cls}`} />;
}

function HistoryBars({ history }) {
  return (
    <div className="hist">
      {history.map((s, i) => (
        <span key={i} className={`hist-bar ${STATUS_META[s].cls}`} title={s} />
      ))}
    </div>
  );
}

function FleetStat({ label, value, cls }) {
  return (
    <div className="fleet-stat">
      <div className={`fleet-stat-value ${cls || ""}`}>{value}</div>
      <div className="fleet-stat-label">{label}</div>
    </div>
  );
}

function SubBadge({ status }) {
  const meta = SUB_STATUS_META[status];
  return (
    <span className={`status-badge badge-${meta.cls === "st-ok" ? "ok" : meta.cls === "st-warn" ? "warn" : "crit"}`}>
      <span className={`dot ${meta.cls}`} />
      {meta.label}
    </span>
  );
}

export default function DeviceCareDashboard() {
  const [view, setView] = useState("fleet"); // 'fleet' | 'billing' | 'alerts' | 'reports'
  const [companyId, setCompanyId] = useState("acme");
  const [billingCompanyId, setBillingCompanyId] = useState("acme");

  // --- Live backend connection (Fleet tab only; Billing/Alerts/Reports stay
  // on mock data until those endpoints exist) -----------------------------
  const [showConnect, setShowConnect] = useState(false);
  const [apiBaseUrl, setApiBaseUrl] = useState("https://devicecare-backend.vercel.app");
  const [adminKey, setAdminKey] = useState("");
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState("");
  const [liveCompanies, setLiveCompanies] = useState([]);
  const [liveMachines, setLiveMachines] = useState([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState("");

  const connectToBackend = async () => {
    setConnecting(true);
    setConnectError("");
    try {
      const res = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/api/v1/admin/companies`, {
        headers: { "X-Admin-Key": adminKey },
      });
      if (!res.ok) throw new Error(res.status === 401 ? "Invalid admin key" : `Server returned ${res.status}`);
      const data = await res.json();
      setLiveCompanies(data);
      setConnected(true);
      if (data[0]) setCompanyId(data[0].id);
      setShowConnect(false);
    } catch (err) {
      setConnectError(err.message === "Failed to fetch" ? "Couldn't reach that URL" : err.message);
    } finally {
      setConnecting(false);
    }
  };

  React.useEffect(() => {
    if (!connected) return;
    let cancelled = false;
    setLiveLoading(true);
    setLiveError("");
    fetch(`${apiBaseUrl.replace(/\/$/, "")}/api/v1/admin/companies/${companyId}/machines`, {
      headers: { "X-Admin-Key": adminKey },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setLiveMachines(data);
      })
      .catch((err) => {
        if (!cancelled) setLiveError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLiveLoading(false);
      });
    return () => { cancelled = true; };
  }, [connected, companyId, apiBaseUrl, adminKey]);

  const effectiveCompanies = connected ? liveCompanies : COMPANIES;
  const machines = connected ? liveMachines.map(mapLiveMachine) : MACHINES[companyId];
  const [machineId, setMachineId] = useState(machines[0]?.id);
  const billing = BILLING[billingCompanyId];
  const billingCompanyName = COMPANIES.find((c) => c.id === billingCompanyId).name;

  const mrrTotal = useMemo(
    () => Object.values(BILLING).reduce((sum, b) => sum + b.priceMonthly, 0),
    []
  );
  const pastDueCount = useMemo(
    () => Object.values(BILLING).filter((b) => b.status === "past_due").length,
    []
  );
  const totalMachinesBilled = useMemo(
    () => Object.values(BILLING).reduce((sum, b) => sum + b.machinesUsed, 0),
    []
  );
  const [scanState, setScanState] = useState({}); // { [machineId]: 'scanning' | 'done' }
  const runScan = (id) => {
    setScanState((s) => ({ ...s, [id]: "scanning" }));
    setTimeout(() => setScanState((s) => ({ ...s, [id]: "done" })), 1800);
  };

  // Reset selection when switching companies
  const handleCompanyChange = (id) => {
    setCompanyId(id);
    setMachineId(undefined);
  };

  React.useEffect(() => {
    if (!machines.find((m) => m.id === machineId)) {
      setMachineId(machines[0]?.id);
    }
  }, [machines]);

  const machine = useMemo(
    () => machines.find((m) => m.id === machineId) || machines[0],
    [machines, machineId]
  );

  const counts = useMemo(() => {
    const c = { ok: 0, warning: 0, critical: 0, never_reported: 0 };
    machines.forEach((m) => { c[m.status] = (c[m.status] || 0) + 1; });
    return c;
  }, [machines]);

  return (
    <div className="dc-root">
      <style>{`
        .dc-root {
          --bg: #14181F;
          --surface: #1B212B;
          --surface-2: #212836;
          --border: #2A3140;
          --text: #E8EAED;
          --text-muted: #8A93A3;
          --ok: #3FB88A;
          --warn: #E8A33D;
          --crit: #E2574C;
          background: var(--bg);
          color: var(--text);
          font-family: 'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif;
          min-height: 640px;
          border-radius: 12px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          border: 1px solid var(--border);
        }
        .mono { font-family: 'IBM Plex Mono', ui-monospace, monospace; }

        .topbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 20px; border-bottom: 1px solid var(--border);
          background: var(--surface);
        }
        .brand { display: flex; align-items: baseline; gap: 10px; }
        .brand-name { font-weight: 600; font-size: 15px; letter-spacing: 0.2px; }
        .brand-sub { font-size: 11px; color: var(--text-muted); }
        .company-select {
          background: var(--surface-2); border: 1px solid var(--border); color: var(--text);
          font-size: 13px; padding: 6px 10px; border-radius: 6px; display: flex; align-items: center; gap: 6px;
        }
        .company-select select { background: transparent; border: none; color: var(--text); font-size: 13px; outline: none; }
        .sync-note { font-size: 11px; color: var(--text-muted); }

        .conn-badge {
          display: flex; align-items: center; gap: 6px; font-size: 11px; padding: 5px 10px;
          border-radius: 999px; border: 1px solid var(--border); background: var(--surface-2);
          color: var(--text-muted); cursor: pointer;
        }
        .conn-badge.conn-live { color: var(--ok); }
        .conn-badge.conn-preview { color: var(--warn); }

        .connect-bar {
          display: flex; align-items: center; gap: 8px; padding: 10px 20px;
          border-bottom: 1px solid var(--border); background: var(--surface);
        }
        .connect-input {
          background: var(--surface-2); border: 1px solid var(--border); color: var(--text);
          font-size: 12px; padding: 6px 10px; border-radius: 6px; flex: 1; min-width: 0;
        }

        .nav-tabs { display: flex; gap: 4px; }
        .nav-tab {
          display: flex; align-items: center; gap: 6px; background: transparent; border: 1px solid transparent;
          color: var(--text-muted); font-size: 13px; padding: 6px 12px; border-radius: 6px; cursor: pointer;
        }
        .nav-tab:hover { color: var(--text); }
        .nav-tab.active { background: var(--surface-2); border-color: var(--border); color: var(--text); }

        .past-due-note {
          font-size: 12px; color: var(--crit); background: color-mix(in srgb, var(--crit) 12%, transparent);
          border: 1px solid color-mix(in srgb, var(--crit) 35%, transparent); border-radius: 6px;
          padding: 10px 12px; margin-bottom: 16px;
        }

        .plan-card { position: relative; }
        .plan-current { border-color: var(--ok); }

        .ghost-btn {
          display: inline-flex; align-items: center; gap: 6px; background: var(--surface-2);
          border: 1px solid var(--border); color: var(--text); font-size: 12px; padding: 6px 10px;
          border-radius: 6px; cursor: pointer;
        }
        .ghost-btn:hover { border-color: var(--ok); }
        .ghost-btn:disabled { opacity: 0.6; cursor: default; }
        .spin { animation: dc-spin 1s linear infinite; }
        @keyframes dc-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .scan-note {
          font-size: 12px; color: var(--ok); background: color-mix(in srgb, var(--ok) 12%, transparent);
          border: 1px solid color-mix(in srgb, var(--ok) 35%, transparent); border-radius: 6px;
          padding: 10px 12px; margin-bottom: 16px;
        }

        .body { display: flex; flex: 1; min-height: 0; }

        .sidebar {
          width: 260px; border-right: 1px solid var(--border); background: var(--surface);
          overflow-y: auto; flex-shrink: 0;
        }
        .sidebar-head {
          padding: 12px 16px 6px; font-size: 11px; color: var(--text-muted);
          text-transform: uppercase; letter-spacing: 0.6px;
        }
        .machine-row {
          display: flex; align-items: center; gap: 10px; padding: 10px 16px;
          cursor: pointer; border-left: 2px solid transparent;
        }
        .machine-row:hover { background: var(--surface-2); }
        .machine-row.active { background: var(--surface-2); border-left-color: var(--ok); }
        .machine-row-name { font-size: 13px; font-weight: 500; }
        .machine-row-sub { font-size: 11px; color: var(--text-muted); }

        .main { flex: 1; overflow-y: auto; padding: 20px 24px; min-width: 0; }

        .fleet-strip { display: flex; gap: 0; border: 1px solid var(--border); border-radius: 8px; overflow: hidden; margin-bottom: 22px; }
        .fleet-stat { flex: 1; padding: 14px 18px; border-right: 1px solid var(--border); }
        .fleet-stat:last-child { border-right: none; }
        .fleet-stat-value { font-family: 'IBM Plex Mono', monospace; font-size: 22px; font-weight: 600; }
        .fleet-stat-label { font-size: 12px; color: var(--text-muted); margin-top: 2px; }

        .panel { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 18px 20px; margin-bottom: 16px; }
        .panel-title { font-size: 12px; text-transform: uppercase; letter-spacing: 0.6px; color: var(--text-muted); margin-bottom: 12px; }

        .m-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; }
        .m-title { font-size: 18px; font-weight: 600; }
        .m-meta { font-size: 12px; color: var(--text-muted); margin-top: 3px; }
        .status-badge { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; padding: 5px 10px; border-radius: 999px; border: 1px solid var(--border); }

        .metric-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
        .metric-card { background: var(--surface-2); border: 1px solid var(--border); border-radius: 8px; padding: 12px 14px; }
        .metric-label { font-size: 11px; color: var(--text-muted); display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
        .metric-value { font-family: 'IBM Plex Mono', monospace; font-size: 20px; font-weight: 600; }

        .drive-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-top: 1px solid var(--border); font-size: 13px; }
        .drive-row:first-child { border-top: none; }
        .drive-name { display: flex; align-items: center; gap: 8px; }
        .drive-detail { color: var(--text-muted); font-size: 12px; font-family: 'IBM Plex Mono', monospace; }

        .action-list { list-style: none; margin: 0; padding: 0; }
        .action-list li { font-size: 13px; padding: 6px 0; border-top: 1px solid var(--border); display: flex; gap: 8px; }
        .action-list li:first-child { border-top: none; }
        .action-list li::before { content: '›'; color: var(--ok); flex-shrink: 0; }

        .error-list li::before { content: '!'; color: var(--crit); font-weight: 700; }

        .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; flex-shrink: 0; }
        .dot.st-ok { background: var(--ok); }
        .dot.st-warn { background: var(--warn); }
        .dot.st-crit { background: var(--crit); }

        .hist { display: flex; gap: 3px; }
        .hist-bar { width: 8px; height: 16px; border-radius: 2px; opacity: 0.85; }
        .hist-bar.st-ok { background: var(--ok); }
        .hist-bar.st-warn { background: var(--warn); }
        .hist-bar.st-crit { background: var(--crit); }

        .badge-ok { color: var(--ok); border-color: color-mix(in srgb, var(--ok) 40%, transparent); }
        .badge-warn { color: var(--warn); border-color: color-mix(in srgb, var(--warn) 40%, transparent); }
        .badge-crit { color: var(--crit); border-color: color-mix(in srgb, var(--crit) 40%, transparent); }
      `}</style>

      {/* Top bar */}
      <div className="topbar">
        <div className="brand">
          <span className="brand-name">DeviceCare</span>
          <span className="brand-sub mono">FLEET CONSOLE</span>
        </div>
        <div className="nav-tabs">
          <button className={`nav-tab ${view === "fleet" ? "active" : ""}`} onClick={() => setView("fleet")}>
            <LayoutGrid size={14} /> Fleet
          </button>
          <button className={`nav-tab ${view === "alerts" ? "active" : ""}`} onClick={() => setView("alerts")}>
            <Mail size={14} /> Alerts
          </button>
          <button className={`nav-tab ${view === "reports" ? "active" : ""}`} onClick={() => setView("reports")}>
            <FileText size={14} /> Reports
          </button>
          <button className={`nav-tab ${view === "billing" ? "active" : ""}`} onClick={() => setView("billing")}>
            <CreditCard size={14} /> Billing
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {view === "fleet" && (
            <div className="company-select">
              <Building2 size={14} color="var(--text-muted)" />
              <select value={companyId} onChange={(e) => handleCompanyChange(e.target.value)}>
                {effectiveCompanies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
          {view === "fleet" ? (
            <button className={`conn-badge ${connected ? "conn-live" : "conn-preview"}`} onClick={() => setShowConnect((s) => !s)}>
              <span className={`dot ${connected ? "st-ok" : "st-warn"}`} />
              {connected ? "Live" : "Preview data"}
            </button>
          ) : (
            <span className="sync-note mono">Preview data</span>
          )}
        </div>
      </div>

      {showConnect && (
        <div className="connect-bar">
          <input
            className="connect-input"
            placeholder="Backend URL, e.g. https://devicecare-backend.onrender.com"
            value={apiBaseUrl}
            onChange={(e) => setApiBaseUrl(e.target.value)}
          />
          <input
            className="connect-input"
            placeholder="Admin key"
            type="password"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
          />
          <button className="ghost-btn" disabled={connecting || !apiBaseUrl || !adminKey} onClick={connectToBackend}>
            {connecting ? "Connecting…" : "Connect"}
          </button>
          {connectError && <span style={{ color: "var(--crit)", fontSize: 12 }}>{connectError}</span>}
        </div>
      )}

      <div className="body">
        {/* Sidebar */}
        {view === "fleet" ? (
          <div className="sidebar">
            <div className="sidebar-head">Machines ({machines.length})</div>
            {machines.map((m) => (
              <div
                key={m.id}
                className={`machine-row ${m.id === machineId ? "active" : ""}`}
                onClick={() => setMachineId(m.id)}
              >
                <StatusDot status={m.status} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="machine-row-name mono">{m.name}</div>
                  <div className="machine-row-sub">{fmtAgo(m.lastRun)}</div>
                </div>
                <ChevronRight size={14} color="var(--text-muted)" />
              </div>
            ))}
          </div>
        ) : (
          <div className="sidebar">
            <div className="sidebar-head">Clients ({COMPANIES.length})</div>
            {COMPANIES.map((c) => {
              const b = BILLING[c.id];
              return (
                <div
                  key={c.id}
                  className={`machine-row ${c.id === billingCompanyId ? "active" : ""}`}
                  onClick={() => setBillingCompanyId(c.id)}
                >
                  <StatusDot status={b.status === "past_due" ? "critical" : b.status === "trial" ? "warning" : "ok"} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="machine-row-name">{c.name}</div>
                    <div className="machine-row-sub">{b.plan} · ${b.priceMonthly}/mo</div>
                  </div>
                  <ChevronRight size={14} color="var(--text-muted)" />
                </div>
              );
            })}
          </div>
        )}

        {/* Main */}
        <div className="main">
        {view === "fleet" ? (
        <>
          <div className="fleet-strip">
            <FleetStat label="Total machines" value={machines.length} />
            <FleetStat label="Healthy" value={counts.ok} cls="badge-ok" />
            <FleetStat label="Needs attention" value={counts.warning} cls="badge-warn" />
            <FleetStat label="Critical" value={counts.critical} cls="badge-crit" />
          </div>

          {connected && liveLoading && (
            <div className="panel" style={{ color: "var(--text-muted)", fontSize: 13 }}>Loading machines…</div>
          )}

          {connected && liveError && !liveLoading && (
            <div className="panel">
              <div className="past-due-note">Couldn't load machines: {liveError}</div>
            </div>
          )}

          {!liveLoading && !liveError && !machine && (
            <div className="panel" style={{ color: "var(--text-muted)", fontSize: 13 }}>
              No machines registered for this company yet. Run <code className="mono">Register-Machine.ps1</code> on a client machine to activate it.
            </div>
          )}

          {!liveLoading && !liveError && machine && (
          <div className="panel">
            <div className="m-header">
              <div>
                <div className="m-title mono">{machine.name}</div>
                <div className="m-meta">
                  {machine.os} · {machine.user} · Last run {fmtTime(machine.lastRun)} ({machine.duration})
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  className="ghost-btn"
                  disabled={scanState[machine.id] === "scanning"}
                  onClick={() => runScan(machine.id)}
                >
                  <RefreshCw size={12} className={scanState[machine.id] === "scanning" ? "spin" : ""} />
                  {scanState[machine.id] === "scanning" ? "Scanning…" : "Run scan now"}
                </button>
                <span className={`status-badge badge-${machine.status === "ok" ? "ok" : machine.status === "critical" ? "crit" : "warn"}`}>
                  <StatusDot status={machine.status} />
                  {STATUS_META[machine.status].label}
                </span>
              </div>
            </div>

            {scanState[machine.id] === "done" && (
              <div className="scan-note">
                Scan complete on {machine.name} — results match the last scheduled run, no new issues found.
              </div>
            )}

            <div className="metric-grid">
              <div className="metric-card">
                <div className="metric-label"><Cpu size={13} /> CPU load (avg)</div>
                <div className="metric-value">{machine.cpu !== null ? `${machine.cpu}%` : "—"}</div>
              </div>
              <div className="metric-card">
                <div className="metric-label"><HardDrive size={13} /> Disk free</div>
                <div className="metric-value">{machine.diskFreePct != null ? `${machine.diskFreePct}%` : "—"}</div>
              </div>
              <div className="metric-card">
                <div className="metric-label"><Clock size={13} /> Recent runs</div>
                <div style={{ marginTop: 4 }}><HistoryBars history={machine.history} /></div>
              </div>
            </div>

            <div className="panel-title">Storage health</div>
            <div style={{ marginBottom: 18 }}>
              {machine.storage.map((d, i) => (
                <div className="drive-row" key={i}>
                  <div className="drive-name">
                    <Monitor size={13} color="var(--text-muted)" />
                    {d.name} <span className="drive-detail">[{d.type}]</span>
                  </div>
                  <div className="drive-detail">
                    {d.health} · {d.tempC}°C · wear {d.wear}%
                  </div>
                </div>
              ))}
            </div>

            <div className="panel-title">Executed actions</div>
            <ul className="action-list" style={{ marginBottom: machine.errors.length ? 18 : 0 }}>
              {machine.actions.map((a, i) => (
                <li key={i} className="mono">{a}</li>
              ))}
            </ul>

            {machine.errors.length > 0 && (
              <>
                <div className="panel-title" style={{ color: "var(--crit)" }}>Errors</div>
                <ul className="action-list error-list">
                  {machine.errors.map((e, i) => (
                    <li key={i} className="mono">{e}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
          )}

          {!liveLoading && !liveError && machine && INVENTORY[machine.id] && (
          <div className="panel">
            <div className="m-header">
              <div>
                <div className="m-title">Inventory</div>
                <div className="m-meta">
                  {INVENTORY[machine.id].manufacturer} {INVENTORY[machine.id].model} · purchased {fmtTime(INVENTORY[machine.id].purchaseDate)}
                </div>
              </div>
              {(() => {
                const expired = INVENTORY[machine.id].warrantyExpiry < now;
                return (
                  <span className={`status-badge badge-${expired ? "crit" : "ok"}`}>
                    <ShieldCheck size={12} />
                    {expired ? "Warranty expired" : `Warranty until ${fmtTime(INVENTORY[machine.id].warrantyExpiry)}`}
                  </span>
                );
              })()}
            </div>

            <div className="panel-title">Installed software</div>
            <ul className="action-list">
              {INVENTORY[machine.id].software.map((s, i) => (
                <li key={i} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span className="mono">{s.name}</span>
                  <span className="drive-detail">{s.version}</span>
                </li>
              ))}
            </ul>
          </div>
          )}
        </>
        ) : view === "billing" ? (
        <>
          <div className="fleet-strip">
            <FleetStat label="MRR" value={`$${mrrTotal}`} />
            <FleetStat label="Active clients" value={COMPANIES.length} />
            <FleetStat label="Machines billed" value={totalMachinesBilled} />
            <FleetStat label="Past due" value={pastDueCount} cls={pastDueCount ? "badge-crit" : ""} />
          </div>

          <div className="panel">
            <div className="m-header">
              <div>
                <div className="m-title">{billingCompanyName}</div>
                <div className="m-meta">
                  {billing.plan} plan · {billing.machinesUsed}/{billing.machinesIncluded} machines used · {billing.paymentMethod}
                </div>
              </div>
              <SubBadge status={billing.status} />
            </div>

            <div className="metric-grid">
              <div className="metric-card">
                <div className="metric-label"><CreditCard size={13} /> Monthly price</div>
                <div className="metric-value">${billing.priceMonthly}</div>
              </div>
              <div className="metric-card">
                <div className="metric-label"><HardDrive size={13} /> Machines used</div>
                <div className="metric-value">{billing.machinesUsed}/{billing.machinesIncluded}</div>
              </div>
              <div className="metric-card">
                <div className="metric-label"><Clock size={13} /> Next renewal</div>
                <div className="metric-value" style={{ fontSize: 15 }}>{fmtTime(billing.nextRenewal)}</div>
              </div>
            </div>

            {billing.status === "past_due" && (
              <div className="past-due-note">
                Payment failed for the {fmtTime(billing.nextRenewal)} renewal. Monitoring continues for now — update the payment method to avoid a pause in coverage.
              </div>
            )}

            <div className="panel-title">Invoice history</div>
            <ul className="action-list">
              {billing.invoices.map((inv) => (
                <li key={inv.id} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span className="mono">{inv.id} · {fmtTime(inv.date)}</span>
                  <span className="mono" style={{ color: inv.status === "paid" ? "var(--ok)" : "var(--crit)" }}>
                    ${inv.amount} · {inv.status === "paid" ? "Paid" : "Failed"}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="panel">
            <div className="panel-title">Plan tiers</div>
            <div className="metric-grid">
              {PLANS.map((p) => (
                <div key={p.name} className={`metric-card plan-card ${p.name === billing.plan ? "plan-current" : ""}`}>
                  <div className="metric-label">{p.name}{p.name === billing.plan ? " (current)" : ""}</div>
                  <div className="metric-value">${p.price}<span style={{ fontSize: 12, color: "var(--text-muted)" }}>/mo</span></div>
                  <div className="drive-detail" style={{ marginTop: 6 }}>Up to {p.machines} machines</div>
                </div>
              ))}
            </div>
          </div>
        </>
        ) : view === "alerts" ? (
        <>
          <div className="fleet-strip">
            <FleetStat label="Active rules" value={Object.values(ALERT_RULES).flat().length} />
            <FleetStat label="Alerts (7d)" value={ALERT_LOG.length} cls="badge-warn" />
            <FleetStat label="Email channel" value={ALERT_RULES[billingCompanyId].filter(r => r.channels.includes("email")).length} />
            <FleetStat label="SMS channel" value={ALERT_RULES[billingCompanyId].filter(r => r.channels.includes("sms")).length} />
          </div>

          <div className="panel">
            <div className="m-header">
              <div>
                <div className="m-title">{billingCompanyName}</div>
                <div className="m-meta">Alert rules — who gets notified, and about what</div>
              </div>
            </div>

            <ul className="action-list">
              {ALERT_RULES[billingCompanyId].map((r) => (
                <li key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>{r.event}</span>
                  <span className="drive-detail" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {r.channels.includes("email") && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Mail size={12} /> Email</span>}
                    {r.channels.includes("sms") && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MessageSquare size={12} /> SMS</span>}
                    · {r.recipients.join(", ")}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="panel">
            <div className="panel-title">Recent alerts sent</div>
            <ul className="action-list">
              {ALERT_LOG.filter((a) => a.company === billingCompanyId).map((a) => (
                <li key={a.id} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span className="mono">{a.machine} — {a.message}</span>
                  <span className="drive-detail">{fmtAgo(a.time)}</span>
                </li>
              ))}
              {ALERT_LOG.filter((a) => a.company === billingCompanyId).length === 0 && (
                <li style={{ color: "var(--text-muted)" }}>No alerts sent for this client in the last 7 days.</li>
              )}
            </ul>
          </div>
        </>
        ) : (
        <>
          <div className="fleet-strip">
            <FleetStat label="Frequency" value={REPORT_SETTINGS[billingCompanyId].frequency} />
            <FleetStat label="Reports sent" value={REPORT_HISTORY[billingCompanyId].length} />
            <FleetStat label="Recipients" value={REPORT_SETTINGS[billingCompanyId].recipients.length} />
            <FleetStat label="Next send" value={REPORT_SETTINGS[billingCompanyId].dayOfWeek} />
          </div>

          <div className="panel">
            <div className="m-header">
              <div>
                <div className="m-title">{billingCompanyName}</div>
                <div className="m-meta">
                  {REPORT_SETTINGS[billingCompanyId].frequency} digest · sent to {REPORT_SETTINGS[billingCompanyId].recipients.join(", ")}
                </div>
              </div>
            </div>

            <div className="panel-title">Report history</div>
            <ul className="action-list">
              {REPORT_HISTORY[billingCompanyId].map((r) => (
                <li key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="mono">{r.id} · {r.period}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className="drive-detail">{fmtAgo(r.generatedAt)}</span>
                    <button className="ghost-btn"><Download size={12} /> PDF</button>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </>
        )}
        </div>
      </div>
    </div>
  );
}
