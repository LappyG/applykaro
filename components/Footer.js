"use client";
import { useState } from "react";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!email.trim() || !email.includes("@")) return;
    // TODO: Connect to your email service (Mailchimp, Resend, Supabase, etc.)
    // For now, log it. Replace with actual API call.
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
            background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.08))",
            border: "1px solid rgba(168,85,247,0.12)",
          }}
        >
          <h3 className="text-lg font-bold text-white/80 mb-2">
            🚀 Coming Soon: Auto-Apply for Naukri & Internshala
          </h3>
          <p className="text-sm text-white/40 mb-5 max-w-md mx-auto">
            Chrome extension that auto-fills job applications on Indian portals.
            Join the waitlist to get early access.
          </p>

          {submitted ? (
            <div className="py-3 px-6 rounded-xl inline-block" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
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
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#e2e2e8",
                  fontFamily: "inherit",
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
              <button
                onClick={handleSubmit}
                className="py-3 px-6 rounded-xl border-none text-sm font-bold text-white cursor-pointer transition-all"
                style={{
                  background: "linear-gradient(135deg, #6366f1, #a855f7)",
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
            { emoji: "🔌", title: "Chrome Extension", desc: "Auto-fill Naukri, Internshala, LinkedIn applications", status: "Building" },
            { emoji: "📊", title: "Application Tracker", desc: "Track all your applications in one dashboard", status: "Planned" },
            { emoji: "🤖", title: "AI Resume Rewriter", desc: "Rewrite your entire resume for any specific JD", status: "Planned" },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-xl p-5"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
            >
              <div className="text-xl mb-2">{f.emoji}</div>
              <h4 className="text-sm font-bold text-white/70 mb-1">{f.title}</h4>
              <p className="text-xs text-white/30 leading-relaxed mb-2">{f.desc}</p>
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{
                  background: f.status === "Building" ? "rgba(234,179,8,0.1)" : "rgba(255,255,255,0.05)",
                  color: f.status === "Building" ? "#facc15" : "rgba(255,255,255,0.3)",
                  border: `1px solid ${f.status === "Building" ? "rgba(234,179,8,0.15)" : "rgba(255,255,255,0.05)"}`,
                }}
              >
                {f.status}
              </span>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="text-center pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <p className="text-white/25 text-xs mb-1">
            <span className="font-bold text-white/35">ApplyKaro</span> — AI-powered ATS scorer for Indian job seekers
          </p>
          <p className="text-white/15 text-[11px]">
            Your data stays in your browser. We don&apos;t store resumes.
          </p>
        </div>
      </div>
    </footer>
  );
}
