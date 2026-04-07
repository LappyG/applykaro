export default function Footer() {
  return (
    <footer className="px-4 pb-16 pt-8">
      <div className="max-w-[860px] mx-auto">
        {/* Extension CTA */}
        <div
          className="rounded-2xl p-8 text-center mb-8"
          style={{
            background: "linear-gradient(135deg, var(--section-gradient-start), var(--section-gradient-end))",
            border: "1px solid var(--section-border)",
          }}
        >
          <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text-secondary)" }}>
            ⚡ ApplyKaro Autofill — Chrome Extension
          </h3>
          <p className="text-sm mb-5 max-w-md mx-auto" style={{ color: "var(--text-muted)" }}>
            AI-powered Chrome extension that auto-fills job applications on Lever, Greenhouse, Workday, LinkedIn, and more.
            3 free autofills — no signup needed.
          </p>
          <a
            href="/extension"
            style={{
              display: "inline-block",
              padding: "12px 28px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, var(--accent-secondary), var(--accent))",
              color: "#fff",
              fontWeight: 700,
              fontSize: "14px",
              textDecoration: "none",
            }}
          >
            Download Extension →
          </a>
        </div>

        {/* Features coming */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { emoji: "🔌", title: "Chrome Extension", desc: "Auto-fill job applications on any website with AI", status: "Live", href: "/extension" },
            { emoji: "📊", title: "Application Tracker", desc: "Track all your applications in one dashboard", status: "Planned", href: null },
            { emoji: "🤖", title: "AI Resume Rewriter", desc: "Rewrite your entire resume for any specific JD", status: "Planned", href: null },
          ].map((f) => (
            <a
              key={f.title}
              href={f.href || "#"}
              style={{ textDecoration: "none" }}
            >
              <div
                className="rounded-xl p-5"
                style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", height: "100%" }}
              >
                <div className="text-xl mb-2">{f.emoji}</div>
                <h4 className="text-sm font-bold mb-1" style={{ color: "var(--text-secondary)" }}>{f.title}</h4>
                <p className="text-xs leading-relaxed mb-2" style={{ color: "var(--text-faint)" }}>{f.desc}</p>
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{
                    background: f.status === "Live" ? "rgba(34,197,94,0.1)" : "var(--neutral-subtle-bg)",
                    color: f.status === "Live" ? "#4ade80" : "var(--neutral-subtle-text)",
                    border: `1px solid ${f.status === "Live" ? "rgba(34,197,94,0.2)" : "var(--neutral-subtle-border)"}`,
                  }}
                >
                  {f.status}
                </span>
              </div>
            </a>
          ))}
        </div>

        {/* Bottom */}
        <div className="text-center pt-6" style={{ borderTop: "1px solid var(--divider)" }}>
          <p className="text-xs mb-1" style={{ color: "var(--text-faint)" }}>
            <span className="font-bold" style={{ color: "var(--text-muted)" }}>ApplyKaro</span> — AI-powered ATS scorer, powered by Claude
          </p>
          <p className="text-[11px] mb-2" style={{ color: "var(--text-ghost)" }}>
            Your data stays in your browser. We don&apos;t store resumes.
          </p>
          <a href="/privacy" style={{ fontSize: "11px", color: "var(--text-faint)", textDecoration: "underline" }}>
            Privacy Policy
          </a>
        </div>
      </div>
    </footer>
  );
}
