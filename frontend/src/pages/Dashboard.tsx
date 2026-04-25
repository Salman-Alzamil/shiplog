import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, Project } from "../api/client";

const s: Record<string, React.CSSProperties> = {
  page: { maxWidth: 720, margin: "0 auto", padding: "40px 24px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 },
  logo: { fontSize: 22, fontWeight: 700 },
  logout: { background: "none", border: "1px solid #333", color: "#888", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontSize: 13 },
  heading: { fontSize: 24, fontWeight: 700, marginBottom: 8 },
  sub: { color: "#888", marginBottom: 32, fontSize: 14 },
  form: { display: "flex", gap: 12, marginBottom: 40, flexWrap: "wrap" as const },
  input: { flex: 1, minWidth: 140, background: "#1a1a1a", border: "1px solid #333", color: "#e8e8e8", borderRadius: 8, padding: "10px 14px", fontSize: 14, outline: "none" },
  addBtn: { background: "#fff", color: "#0f0f0f", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  card: { background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10, padding: "20px 24px", marginBottom: 16, cursor: "pointer", transition: "border-color 0.15s" },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  repoName: { fontSize: 16, fontWeight: 600, marginBottom: 4 },
  slug: { fontSize: 12, color: "#666" },
  deleteBtn: { background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 18, padding: "0 4px" },
  empty: { color: "#555", fontSize: 14, padding: "32px 0" },
  webhookBox: { background: "#111", border: "1px solid #2a2a2a", borderRadius: 8, padding: "16px", marginTop: 12 },
  webhookLabel: { fontSize: 12, color: "#666", marginBottom: 6 },
  webhookVal: { fontSize: 12, color: "#aaa", fontFamily: "monospace", wordBreak: "break-all" as const },
  viewBtn: { fontSize: 13, color: "#fff", textDecoration: "none", display: "inline-block", marginTop: 12 },
};

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("token")) { navigate("/"); return; }
    api.projects.list().then(setProjects).catch(() => { localStorage.removeItem("token"); navigate("/"); });
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

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.logo}>Shiplog</div>
        <button style={s.logout} onClick={() => { localStorage.removeItem("token"); navigate("/"); }}>Log out</button>
      </div>

      <div style={s.heading}>Your projects</div>
      <p style={s.sub}>Connect a GitHub repo and add the webhook to start generating changelogs.</p>

      <div style={s.form}>
        <input style={s.input} placeholder="owner" value={owner} onChange={(e) => setOwner(e.target.value)} />
        <input style={s.input} placeholder="repo" value={repo} onChange={(e) => setRepo(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addProject()} />
        <button style={s.addBtn} onClick={addProject} disabled={loading}>
          {loading ? "Adding…" : "Add repo"}
        </button>
      </div>

      {projects.length === 0 && <div style={s.empty}>No repos connected yet.</div>}

      {projects.map((p) => (
        <div key={p.id} style={s.card} onClick={() => navigate(`/dashboard/project/${p.id}`)}>
          <div style={s.cardTop}>
            <div>
              <div style={s.repoName}>{p.repo_owner}/{p.repo_name}</div>
              <div style={s.slug}>shiplog.app/changelog/{p.slug}</div>
            </div>
            <button style={s.deleteBtn} onClick={(e) => deleteProject(e, p.id)} title="Remove">×</button>
          </div>

          {expandedId === p.id && (
            <div style={s.webhookBox} onClick={(e) => e.stopPropagation()}>
              <SetupInstructions project={p} />
            </div>
          )}

          {expandedId !== p.id && (
            <button style={{ ...s.deleteBtn, color: "#555", fontSize: 13, marginTop: 8 }}
              onClick={(e) => { e.stopPropagation(); setExpandedId(p.id); }}>
              Show webhook setup ↓
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function SetupInstructions({ project }: { project: Project }) {
  return (
    <div style={{ fontSize: 13 }}>
      <p style={{ color: "#888", marginBottom: 12 }}>
        Go to <strong style={{ color: "#ccc" }}>GitHub → {project.repo_owner}/{project.repo_name} → Settings → Webhooks → Add webhook</strong> and use:
      </p>
      <div style={{ marginBottom: 10 }}>
        <div style={{ color: "#666", fontSize: 11, marginBottom: 3 }}>PAYLOAD URL</div>
        <code style={{ color: "#aaa", fontSize: 12, wordBreak: "break-all" }}>{project.webhook_url}</code>
      </div>
      <div style={{ marginBottom: 10 }}>
        <div style={{ color: "#666", fontSize: 11, marginBottom: 3 }}>SECRET</div>
        <code style={{ color: "#aaa", fontSize: 12 }}>{project.webhook_secret}</code>
      </div>
      <div>
        <div style={{ color: "#666", fontSize: 11, marginBottom: 3 }}>CONTENT TYPE</div>
        <code style={{ color: "#aaa", fontSize: 12 }}>application/json</code>
      </div>
      <p style={{ color: "#666", fontSize: 12, marginTop: 12 }}>
        Set to send <strong style={{ color: "#888" }}>Pull requests</strong> events only. That's it.
      </p>
    </div>
  );
}
