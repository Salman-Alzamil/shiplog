import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, BillingStatus, Project } from "../api/client";

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("token")) { navigate("/"); return; }
    Promise.all([
      api.projects.list().then(setProjects),
      api.billing.status().then(setBilling),
    ]).catch(() => { localStorage.removeItem("token"); navigate("/"); });
  }, [navigate]);

  async function addProject() {
    if (!owner.trim() || !repo.trim()) return;
    setLoading(true);
    try {
      const p = await api.projects.create(owner.trim(), repo.trim());
      setProjects((prev) => [...prev, p]);
      setOwner(""); setRepo("");
      setExpandedId(p.id);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Error adding project");
    } finally { setLoading(false); }
  }

  async function deleteProject(e: React.MouseEvent, id: number) {
    e.stopPropagation();
    if (!confirm("Remove this project?")) return;
    await api.projects.delete(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }

  const trialDays = billing?.trial_days_remaining ?? 0;
  const isActive = billing?.is_active ?? true;

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", color: "#e8e8e8" }}>
      {/* Trial / expired banner */}
      {billing && billing.subscription_status === "trial" && trialDays <= 7 && (
        <div style={{ background: trialDays <= 2 ? "#7f1d1d" : "#1c1917", borderBottom: "1px solid #292524", padding: "10px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
          <span style={{ color: trialDays <= 2 ? "#fca5a5" : "#a8a29e" }}>
            {trialDays === 0 ? "Your trial has expired." : `Trial ends in ${trialDays} day${trialDays === 1 ? "" : "s"}.`}
          </span>
          <Link to="/billing" style={{ color: "#fff", fontWeight: 600, textDecoration: "none", background: "#fff", borderRadius: 6, padding: "5px 14px", color: "#000", fontSize: 12 }}>
            Upgrade now →
          </Link>
        </div>
      )}
      {billing && billing.subscription_status === "cancelled" && (
        <div style={{ background: "#1c1917", borderBottom: "1px solid #292524", padding: "10px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
          <span style={{ color: "#a8a29e" }}>Your subscription is inactive.</span>
          <Link to="/billing" style={{ color: "#000", fontWeight: 600, textDecoration: "none", background: "#fff", borderRadius: 6, padding: "5px 14px", fontSize: 12 }}>
            Reactivate →
          </Link>
        </div>
      )}

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 24px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
          <span style={{ fontSize: 20, fontWeight: 700 }}>Shiplog</span>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Link to="/billing" style={{ fontSize: 13, color: "#666", textDecoration: "none" }}>Billing</Link>
            <button style={{ background: "none", border: "1px solid #2a2a2a", color: "#666", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontSize: 13 }}
              onClick={() => { localStorage.removeItem("token"); navigate("/"); }}>
              Log out
            </button>
          </div>
        </div>

        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Your projects</div>
        <p style={{ color: "#555", fontSize: 14, marginBottom: 32 }}>Connect a repo and add the webhook to start generating changelogs.</p>

        {/* Add repo form */}
        <div style={{ display: "flex", gap: 10, marginBottom: 40, flexWrap: "wrap" as const }}>
          <input
            style={{ flex: 1, minWidth: 130, background: "#111", border: "1px solid #2a2a2a", color: "#e8e8e8", borderRadius: 8, padding: "10px 14px", fontSize: 14, outline: "none" }}
            placeholder="owner" value={owner} onChange={(e) => setOwner(e.target.value)}
          />
          <input
            style={{ flex: 1, minWidth: 130, background: "#111", border: "1px solid #2a2a2a", color: "#e8e8e8", borderRadius: 8, padding: "10px 14px", fontSize: 14, outline: "none" }}
            placeholder="repo" value={repo} onChange={(e) => setRepo(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addProject()}
          />
          <button
            style={{ background: "#fff", color: "#000", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: loading ? 0.6 : 1 }}
            onClick={addProject} disabled={loading}>
            {loading ? "Adding…" : "+ Add repo"}
          </button>
        </div>

        {projects.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#444" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 15 }}>No repos connected yet.</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Add a repo above to get started.</div>
          </div>
        )}

        {projects.map((p) => (
          <div key={p.id}
            style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 12, padding: "20px 24px", marginBottom: 14, cursor: "pointer", transition: "border-color 0.15s" }}
            onClick={() => navigate(`/dashboard/project/${p.id}`)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 3 }}>{p.repo_owner}/{p.repo_name}</div>
                <div style={{ fontSize: 12, color: "#555" }}>
                  <Link to={`/changelog/${p.slug}`} target="_blank" style={{ color: "#555" }} onClick={(e) => e.stopPropagation()}>
                    /changelog/{p.slug}
                  </Link>
                </div>
              </div>
              <button
                style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: 20, padding: "0 4px", lineHeight: 1 }}
                onClick={(e) => deleteProject(e, p.id)}>×</button>
            </div>

            {expandedId === p.id ? (
              <div style={{ marginTop: 16, background: "#0d0d0d", borderRadius: 8, padding: "16px" }} onClick={(e) => e.stopPropagation()}>
                <SetupInstructions project={p} />
              </div>
            ) : (
              <button
                style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 12, marginTop: 10, padding: 0 }}
                onClick={(e) => { e.stopPropagation(); setExpandedId(p.id); }}>
                Show webhook setup ↓
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SetupInstructions({ project }: { project: Project }) {
  const [copied, setCopied] = useState<string | null>(null);

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  const row = (label: string, value: string, key: string) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ color: "#555", fontSize: 11, textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 4 }}>{label}</div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <code style={{ color: "#aaa", fontSize: 12, wordBreak: "break-all" as const, flex: 1 }}>{value}</code>
        <button onClick={() => copy(value, key)}
          style={{ background: "none", border: "1px solid #2a2a2a", color: copied === key ? "#22c55e" : "#555", borderRadius: 4, padding: "3px 10px", fontSize: 11, cursor: "pointer", whiteSpace: "nowrap" as const }}>
          {copied === key ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ fontSize: 13 }}>
      <p style={{ color: "#666", marginBottom: 14 }}>
        Go to <strong style={{ color: "#888" }}>GitHub → {project.repo_owner}/{project.repo_name} → Settings → Webhooks → Add webhook</strong>
      </p>
      {row("Payload URL", project.webhook_url, "url")}
      {row("Secret", project.webhook_secret, "secret")}
      {row("Content type", "application/json", "ct")}
      <p style={{ color: "#555", fontSize: 12, marginTop: 8 }}>Select <strong style={{ color: "#777" }}>Pull requests</strong> events only.</p>
    </div>
  );
}
