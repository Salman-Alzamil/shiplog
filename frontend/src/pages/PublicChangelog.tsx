import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, Entry, PublicChangelog as CLData } from "../api/client";

const CATEGORY_COLORS: Record<string, string> = {
  feature: "#3b82f6",
  fix: "#ef4444",
  improvement: "#8b5cf6",
};

const CATEGORY_LABELS: Record<string, string> = {
  feature: "New feature",
  fix: "Bug fix",
  improvement: "Improvement",
};

const s: Record<string, React.CSSProperties> = {
  page: { maxWidth: 680, margin: "0 auto", padding: "60px 24px" },
  header: { marginBottom: 56, borderBottom: "1px solid #1e1e1e", paddingBottom: 32 },
  repoLabel: { fontSize: 13, color: "#555", marginBottom: 8 },
  title: { fontSize: 28, fontWeight: 700, marginBottom: 12 },
  tagline: { color: "#666", fontSize: 15 },
  entry: { padding: "28px 0", borderBottom: "1px solid #1a1a1a" },
  meta: { display: "flex", gap: 12, alignItems: "center", marginBottom: 12 },
  badge: { fontSize: 11, fontWeight: 600, borderRadius: 4, padding: "3px 8px", textTransform: "uppercase" as const },
  date: { fontSize: 12, color: "#555" },
  entryTitle: { fontSize: 18, fontWeight: 600, marginBottom: 8, lineHeight: 1.4 },
  entrySummary: { color: "#999", fontSize: 14, lineHeight: 1.7 },
  empty: { color: "#555", fontSize: 15, padding: "40px 0" },
  footer: { marginTop: 64, color: "#444", fontSize: 12, textAlign: "center" as const },
  footerLink: { color: "#555", textDecoration: "none" },
  notFound: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#555" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default function PublicChangelog() {
  const { slug } = useParams();
  const [data, setData] = useState<CLData | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    api.public.changelog(slug).then(setData).catch(() => setNotFound(true));
  }, [slug]);

  if (notFound) return <div style={s.notFound}>Changelog not found.</div>;
  if (!data) return null;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.repoLabel}>{data.repo_owner}/{data.repo_name}</div>
        <div style={s.title}>What's new</div>
        <div style={s.tagline}>The latest updates and improvements.</div>
      </div>

      {data.entries.length === 0 && <div style={s.empty}>No updates published yet.</div>}

      {data.entries.map((entry: Entry) => (
        <div key={entry.id} style={s.entry}>
          <div style={s.meta}>
            <span style={{
              ...s.badge,
              background: CATEGORY_COLORS[entry.category] + "22",
              color: CATEGORY_COLORS[entry.category],
            }}>
              {CATEGORY_LABELS[entry.category] ?? entry.category}
            </span>
            {entry.published_at && <span style={s.date}>{formatDate(entry.published_at)}</span>}
          </div>
          <div style={s.entryTitle}>{entry.generated_title}</div>
          <div style={s.entrySummary}>{entry.generated_summary}</div>
        </div>
      ))}

      <div style={s.footer}>
        Powered by <a href="/" style={s.footerLink}>Shiplog</a>
      </div>
    </div>
  );
}
