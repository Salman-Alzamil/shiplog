import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, Entry } from "../api/client";

const CATEGORY_COLORS: Record<string, string> = {
  feature: "#3b82f6",
  fix: "#ef4444",
  improvement: "#8b5cf6",
};

const s: Record<string, React.CSSProperties> = {
  page: { maxWidth: 720, margin: "0 auto", padding: "40px 24px" },
  back: { color: "#666", textDecoration: "none", fontSize: 14, display: "inline-block", marginBottom: 32 },
  heading: { fontSize: 22, fontWeight: 700, marginBottom: 6 },
  sub: { color: "#666", fontSize: 13, marginBottom: 32 },
  entry: { background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10, padding: "20px 24px", marginBottom: 14 },
  entryTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  badge: { fontSize: 11, fontWeight: 600, borderRadius: 4, padding: "2px 8px", textTransform: "uppercase" as const },
  entryTitle: { fontSize: 16, fontWeight: 600, marginBottom: 6 },
  entrySummary: { color: "#aaa", fontSize: 14, lineHeight: 1.6 },
  actions: { display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" as const },
  actionBtn: { background: "none", border: "1px solid #333", color: "#888", borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontSize: 12 },
  prLink: { color: "#555", fontSize: 12 },
  editInput: { width: "100%", background: "#111", border: "1px solid #333", color: "#e8e8e8", borderRadius: 6, padding: "8px 12px", fontSize: 14, outline: "none", marginBottom: 8 },
  editArea: { width: "100%", background: "#111", border: "1px solid #333", color: "#e8e8e8", borderRadius: 6, padding: "8px 12px", fontSize: 14, outline: "none", resize: "vertical" as const, minHeight: 80, marginBottom: 8 },
  saveBtn: { background: "#fff", color: "#0f0f0f", border: "none", borderRadius: 6, padding: "6px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  empty: { color: "#555", fontSize: 14, padding: "32px 0" },
};

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [slug, setSlug] = useState("");

  useEffect(() => {
    if (!localStorage.getItem("token")) { navigate("/"); return; }
    api.projects.list().then((projects) => {
      const project = projects.find((p) => p.id === Number(id));
      if (!project) { navigate("/dashboard"); return; }
      setSlug(project.slug);
    });
    api.entries.list(Number(id)).then(setEntries);
  }, [id, navigate]);

  async function togglePublish(entry: Entry) {
    const updated = await api.entries.update(entry.id, { is_published: !entry.is_published });
    setEntries((prev) => prev.map((e) => (e.id === entry.id ? updated : e)));
  }

  function startEdit(entry: Entry) {
    setEditingId(entry.id);
    setEditTitle(entry.generated_title ?? "");
    setEditSummary(entry.generated_summary ?? "");
  }

  async function saveEdit(entry: Entry) {
    const updated = await api.entries.update(entry.id, {
      generated_title: editTitle,
      generated_summary: editSummary,
    });
    setEntries((prev) => prev.map((e) => (e.id === entry.id ? updated : e)));
    setEditingId(null);
  }

  async function deleteEntry(id: number) {
    if (!confirm("Delete this entry?")) return;
    await api.entries.delete(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div style={s.page}>
      <Link to="/dashboard" style={s.back}>← Dashboard</Link>
      <div style={s.heading}>Changelog entries</div>
      {slug && (
        <p style={s.sub}>
          Public page:{" "}
          <Link to={`/changelog/${slug}`} target="_blank" style={{ color: "#888" }}>
            /changelog/{slug}
          </Link>
        </p>
      )}

      {entries.length === 0 && (
        <div style={s.empty}>No entries yet. Merge a PR to generate the first one.</div>
      )}

      {entries.map((entry) => (
        <div key={entry.id} style={{ ...s.entry, opacity: entry.is_published ? 1 : 0.5 }}>
          <div style={s.entryTop}>
            <span style={{ ...s.badge, background: CATEGORY_COLORS[entry.category] + "22", color: CATEGORY_COLORS[entry.category] }}>
              {entry.category}
            </span>
            {entry.pr_url && (
              <a href={entry.pr_url} target="_blank" rel="noreferrer" style={s.prLink}>
                PR #{entry.pr_number}
              </a>
            )}
          </div>

          {editingId === entry.id ? (
            <>
              <input style={s.editInput} value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
              <textarea style={s.editArea} value={editSummary} onChange={(e) => setEditSummary(e.target.value)} />
              <div style={{ display: "flex", gap: 8 }}>
                <button style={s.saveBtn} onClick={() => saveEdit(entry)}>Save</button>
                <button style={s.actionBtn} onClick={() => setEditingId(null)}>Cancel</button>
              </div>
            </>
          ) : (
            <>
              <div style={s.entryTitle}>{entry.generated_title}</div>
              <div style={s.entrySummary}>{entry.generated_summary}</div>
              <div style={s.actions}>
                <button style={s.actionBtn} onClick={() => startEdit(entry)}>Edit</button>
                <button style={s.actionBtn} onClick={() => togglePublish(entry)}>
                  {entry.is_published ? "Hide" : "Publish"}
                </button>
                <button style={{ ...s.actionBtn, color: "#ef4444", borderColor: "#ef444433" }}
                  onClick={() => deleteEntry(entry.id)}>
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
