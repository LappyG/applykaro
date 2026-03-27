"use client";
import { useState } from "react";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!email.trim() || !email.includes("@")) return;
    console.log("Waitlist signup:", email);
    setSubmitted(true);
  };

  return (
    <footer className="px-4 pb-16 pt-8">
      <div className="max-w-[860px] mx-auto">
        {/* Waitlist */}
        <div
          className="rounded-2xl p-8 text-center mb-8"
          style={{
            background: "linear-gradient(135deg, var(--section-gradient-start), var(--section-gradient-end))",
            border: "1px solid var(--section-border)",
          }}
        >
          <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text-secondary)" }}>
            🚀 ApplyKaro Autofill — Chrome Extension
          </h3>
          <p className="text-sm mb-5 max-w-md mx-auto" style={{ color: "var(--text-muted)" }}>
            AI-powered Chrome extension that auto-fills job applications on any website.
            Join the waitlist to get early access.
          </p>

          {submitted ? (
            <div className="py-3 px-6 rounded-xl inline-block" style={{ background: "var(--success-bg)", border: "1px solid var(--success-border)" }}>
              <p className="text-green-400 text-sm font-semibold m-0">✓ You&apos;re on the list! We&apos;ll notify you at launch.</p>
            </div>
          ) : (
            <div className="flex gap-2 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 py-3 px-4 rounded-xl outline-none text-sm"
                style={{
                  background: "var(--overlay-bg)",
                  border: "1px solid var(--input-border)",
                  color: "var(--text-primary)",
                  fontFamily: "inherit",
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
              <button
                onClick={handleSubmit}
                className="py-3 px-6 rounded-xl border-none text-sm font-bold text-white cursor-pointer transition-all"
                style={{
                  background: "linear-gradient(135deg, var(--accent-secondary), var(--accent))",
                  fontFamily: "inherit",
                }}
              >
                Join Waitlist
              </button>
            </div>
          )}
        </div>

        {/* Features coming */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { emoji: "🔌", title: "Chrome Extension", desc: "Auto-fill job applications on any website with AI", status: "Building" },
            { emoji: "📊", title: "Application Tracker", desc: "Track all your applications in one dashboard", status: "Planned" },
            { emoji: "🤖", title: "AI Resume Rewriter", desc: "Rewrite your entire resume for any specific JD", status: "Planned" },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-xl p-5"
              style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
            >
              <div className="text-xl mb-2">{f.emoji}</div>
              <h4 className="text-sm font-bold mb-1" style={{ color: "var(--text-secondary)" }}>{f.title}</h4>
              <p className="text-xs leading-relaxed mb-2" style={{ color: "var(--text-faint)" }}>{f.desc}</p>
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{
                  background: f.status === "Building" ? "var(--yellow-subtle-bg)" : "var(--neutral-subtle-bg)",
                  color: f.status === "Building" ? "#facc15" : "var(--neutral-subtle-text)",
                  border: `1px solid ${f.status === "Building" ? "var(--yellow-subtle-border)" : "var(--neutral-subtle-border)"}`,
                }}
              >
                {f.status}
              </span>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="text-center pt-6" style={{ borderTop: "1px solid var(--divider)" }}>
          <p className="text-xs mb-1" style={{ color: "var(--text-faint)" }}>
            <span className="font-bold" style={{ color: "var(--text-muted)" }}>ApplyKaro</span> — AI-powered ATS scorer, powered by Claude
          </p>
          <p className="text-[11px]" style={{ color: "var(--text-ghost)" }}>
            Your data stays in your browser. We don&apos;t store resumes.
          </p>
        </div>
      </div>
    </footer>
  );
}
