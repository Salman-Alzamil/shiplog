import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("token")) navigate("/dashboard");
  }, [navigate]);

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", color: "#e8e8e8" }}>
      <Nav />
      <Hero />
      <Features />
      <Pricing />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <nav style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5 }}>Shiplog</span>
      <a href="/auth/github" style={{ background: "#fff", color: "#000", borderRadius: 8, padding: "9px 20px", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
        Get started free
      </a>
    </nav>
  );
}

function Hero() {
  return (
    <section style={{ maxWidth: 760, margin: "0 auto", padding: "80px 32px 64px", textAlign: "center" }}>
      <div style={{ display: "inline-block", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 20, padding: "6px 14px", fontSize: 12, color: "#888", marginBottom: 28 }}>
        14-day free trial · No credit card required
      </div>
      <h1 style={{ fontSize: "clamp(36px, 6vw, 60px)", fontWeight: 800, lineHeight: 1.1, letterSpacing: -2, marginBottom: 24 }}>
        Your changelog,<br />
        <span style={{ color: "#666" }}>on autopilot.</span>
      </h1>
      <p style={{ fontSize: 18, color: "#888", lineHeight: 1.7, marginBottom: 40, maxWidth: 520, margin: "0 auto 40px" }}>
        Connect your GitHub repo. Every merged PR becomes a polished, user-facing changelog entry automatically. No writing. No forgetting.
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <a href="/auth/github" style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "#fff", color: "#000", borderRadius: 10, padding: "14px 28px", fontSize: 15, fontWeight: 700, textDecoration: "none" }}>
          <GithubIcon /> Start free with GitHub
        </a>
      </div>
      <p style={{ marginTop: 16, color: "#555", fontSize: 13 }}>$19/month after trial · Cancel anytime</p>
    </section>
  );
}

function Features() {
  const items = [
    {
      icon: "⚡",
      title: "Instant capture",
      desc: "Merge a PR and the entry appears in your changelog within seconds. Zero manual steps.",
    },
    {
      icon: "✏️",
      title: "Full control",
      desc: "Edit, hide, or delete any entry before it goes public. You're always in charge.",
    },
    {
      icon: "🔗",
      title: "Public changelog page",
      desc: "A clean, hosted page your users can bookmark. Share it in your app, docs, or emails.",
    },
    {
      icon: "📂",
      title: "Organized by type",
      desc: "Entries are auto-tagged as feature, fix, or improvement based on your PR naming.",
    },
  ];

  return (
    <section style={{ maxWidth: 1000, margin: "0 auto", padding: "0 32px 80px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        {items.map((item) => (
          <div key={item.title} style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 12, padding: "28px 24px" }}>
            <div style={{ fontSize: 28, marginBottom: 14 }}>{item.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{item.title}</div>
            <div style={{ color: "#777", fontSize: 14, lineHeight: 1.6 }}>{item.desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section style={{ maxWidth: 480, margin: "0 auto", padding: "0 32px 100px", textAlign: "center" }}>
      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Simple pricing</h2>
      <p style={{ color: "#666", marginBottom: 40, fontSize: 15 }}>One plan. Everything included.</p>
      <div style={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: 16, padding: "40px 36px", textAlign: "left" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Pro</div>
            <div style={{ color: "#666", fontSize: 14 }}>Everything you need</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 36, fontWeight: 800 }}>$19</div>
            <div style={{ color: "#666", fontSize: 13 }}>per month</div>
          </div>
        </div>
        <ul style={{ listStyle: "none", padding: 0, marginBottom: 32 }}>
          {[
            "Unlimited repos",
            "Unlimited changelog entries",
            "Public changelog page",
            "Edit & manage entries",
            "GitHub webhook integration",
            "14-day free trial",
          ].map((f) => (
            <li key={f} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, fontSize: 14, color: "#ccc" }}>
              <span style={{ color: "#22c55e", fontWeight: 700 }}>✓</span> {f}
            </li>
          ))}
        </ul>
        <a href="/auth/github" style={{ display: "block", background: "#fff", color: "#000", borderRadius: 10, padding: "14px", fontSize: 15, fontWeight: 700, textDecoration: "none", textAlign: "center" }}>
          Start 14-day free trial
        </a>
        <p style={{ textAlign: "center", marginTop: 12, color: "#555", fontSize: 12 }}>No credit card required</p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{ borderTop: "1px solid #1a1a1a", padding: "24px 32px", textAlign: "center", color: "#444", fontSize: 13 }}>
      © {new Date().getFullYear()} Shiplog · Built for shipping teams
    </footer>
  );
}

function GithubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}
