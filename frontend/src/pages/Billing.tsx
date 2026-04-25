import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api, BillingStatus } from "../api/client";

export default function Billing() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const success = params.get("success") === "true";
  const cancelled = params.get("cancelled") === "true";

  useEffect(() => {
    if (!localStorage.getItem("token")) { navigate("/"); return; }
    api.billing.status().then(setStatus).catch(() => { localStorage.removeItem("token"); navigate("/"); });
  }, [navigate]);

  async function handleUpgrade() {
    setLoading(true);
    try { await api.billing.checkout(); }
    catch { setLoading(false); }
  }

  async function handlePortal() {
    setLoading(true);
    try { await api.billing.portal(); }
    catch { setLoading(false); }
  }

  const s: Record<string, React.CSSProperties> = {
    page: { maxWidth: 560, margin: "0 auto", padding: "40px 24px" },
    back: { color: "#666", textDecoration: "none", fontSize: 14, display: "inline-block", marginBottom: 32 },
    heading: { fontSize: 24, fontWeight: 700, marginBottom: 32 },
    card: { background: "#111", border: "1px solid #1e1e1e", borderRadius: 14, padding: "28px" },
    label: { fontSize: 12, color: "#555", textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 6 },
    value: { fontSize: 18, fontWeight: 600, marginBottom: 20 },
    btn: { display: "block", width: "100%", background: "#fff", color: "#000", border: "none", borderRadius: 8, padding: "12px", fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 10, textAlign: "center" as const },
    secondaryBtn: { display: "block", width: "100%", background: "none", color: "#888", border: "1px solid #2a2a2a", borderRadius: 8, padding: "12px", fontSize: 14, cursor: "pointer", marginBottom: 10, textAlign: "center" as const },
    banner: { borderRadius: 10, padding: "14px 18px", marginBottom: 24, fontSize: 14 },
  };

  const statusLabel: Record<string, string> = {
    trial: `Free trial — ${status?.trial_days_remaining ?? 0} day${status?.trial_days_remaining === 1 ? "" : "s"} remaining`,
    active: "Active subscription",
    cancelled: "Subscription cancelled",
    past_due: "Payment failed — please update your card",
  };

  return (
    <div style={s.page}>
      <Link to="/dashboard" style={s.back}>← Dashboard</Link>
      <div style={s.heading}>Billing</div>

      {success && (
        <div style={{ ...s.banner, background: "#14532d22", border: "1px solid #166534", color: "#4ade80" }}>
          You're subscribed. Thanks for supporting Shiplog!
        </div>
      )}
      {cancelled && (
        <div style={{ ...s.banner, background: "#1a1a1a", border: "1px solid #2a2a2a", color: "#888" }}>
          Checkout cancelled. You're still on your free trial.
        </div>
      )}

      {status && (
        <div style={s.card}>
          <div style={s.label}>Current plan</div>
          <div style={s.value}>{statusLabel[status.subscription_status] ?? status.subscription_status}</div>

          {status.subscription_status !== "active" && (
            <>
              <div style={{ borderTop: "1px solid #1e1e1e", margin: "20px 0" }} />
              <div style={{ fontSize: 14, color: "#666", marginBottom: 16 }}>
                Upgrade to Pro — $19/month. Unlimited repos, unlimited entries.
              </div>
              <button style={s.btn} onClick={handleUpgrade} disabled={loading}>
                {loading ? "Redirecting…" : "Upgrade to Pro"}
              </button>
            </>
          )}

          {status.subscription_status === "active" && (
            <>
              <div style={{ borderTop: "1px solid #1e1e1e", margin: "20px 0" }} />
              <button style={s.secondaryBtn} onClick={handlePortal} disabled={loading}>
                {loading ? "Redirecting…" : "Manage subscription"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
