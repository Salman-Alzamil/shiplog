import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" },
  card: { textAlign: "center", maxWidth: 400, padding: "48px 32px" },
  logo: { fontSize: 32, fontWeight: 700, marginBottom: 8, letterSpacing: -1 },
  tagline: { color: "#888", marginBottom: 40, lineHeight: 1.6 },
  btn: {
    display: "inline-flex", alignItems: "center", gap: 10, background: "#fff", color: "#0f0f0f",
    border: "none", borderRadius: 8, padding: "12px 24px", fontSize: 15, fontWeight: 600,
    cursor: "pointer", textDecoration: "none",
  },
  features: { marginTop: 48, display: "grid", gap: 16, textAlign: "left" },
  feature: { background: "#1a1a1a", borderRadius: 8, padding: "14px 16px" },
  ftitle: { fontWeight: 600, fontSize: 14, marginBottom: 4 },
  fdesc: { color: "#888", fontSize: 13, lineHeight: 1.5 },
};

export default function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("token")) navigate("/dashboard");
  }, [navigate]);

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>Shiplog</div>
        <p style={s.tagline}>
          Merge a PR. Your changelog updates automatically.<br />
          Powered by AI. Built for small teams.
        </p>
        <a href="/auth/github" style={s.btn}>
          <GithubIcon />
          Continue with GitHub
        </a>
        <div style={s.features}>
          {[
            ["Automatic", "Every merged PR becomes a polished changelog entry via Claude."],
            ["Public page", "Share a clean, hosted changelog page with your users."],
            ["You stay in control", "Edit, hide, or delete any entry before it goes public."],
          ].map(([title, desc]) => (
            <div key={title} style={s.feature}>
              <div style={s.ftitle}>{title}</div>
              <div style={s.fdesc}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GithubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}
