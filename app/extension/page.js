"use client";
import { useState } from "react";

export default function ExtensionPage() {
  const [expandedStep, setExpandedStep] = useState(null);

  return (
    <main className="min-h-screen px-4 py-12">
      <div className="max-w-3xl mx-auto">
        {/* Back link */}
        <a
          href="/"
          className="inline-flex items-center gap-1 text-sm mb-8 no-underline transition-colors"
          style={{ color: "var(--text-muted)" }}
        >
          ← Back to ApplyKaro
        </a>

        {/* Hero */}
        <div className="text-center mb-12">
          <div
            className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase"
            style={{
              background: "var(--badge-bg)",
              border: "1px solid var(--badge-border)",
              color: "var(--accent)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Chrome Extension
          </div>

          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mb-4"
          >
            ApplyKaro{" "}
            <span
              style={{
                background: "linear-gradient(to right, var(--accent-secondary), var(--accent))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Autofill
            </span>
          </h1>

          <p className="text-base sm:text-lg max-w-xl mx-auto mb-8 leading-relaxed" style={{ color: "var(--text-muted)" }}>
            AI-powered Chrome extension that auto-fills job applications on any website.
            Upload your resume once, fill forms with one click. Powered by Claude.
          </p>

          {/* Download button */}
          <a
            href="/applykaro-extension.zip"
            download
            className="inline-flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-white text-base no-underline cursor-pointer border-none transition-all duration-300 hover:scale-105"
            style={{
              background: "linear-gradient(135deg, var(--accent-secondary), var(--accent))",
              boxShadow: "0 4px 24px var(--accent-glow)",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download Extension (ZIP)
          </a>

          <p className="text-xs mt-3" style={{ color: "var(--text-faint)" }}>
            v1.0.0 &middot; Chrome &middot; Manifest V3 &middot; ~2MB
          </p>
        </div>

        {/* What it does */}
        <div
          className="rounded-2xl p-6 sm:p-8 mb-8"
          style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
        >
          <h2 className="text-lg font-bold mb-5" style={{ color: "var(--text-secondary)" }}>
            What it does
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: "📄", title: "Smart Resume Parsing", desc: "Upload your resume PDF — AI extracts your details automatically" },
              { icon: "⚡", title: "One-Click Autofill", desc: "Detects job forms on any site and fills them instantly" },
              { icon: "🧠", title: "AI Field Mapping", desc: "Claude intelligently maps your profile to any form layout" },
              { icon: "🔒", title: "Privacy First", desc: "Your data stays in your browser. Nothing stored on servers" },
              { icon: "🌐", title: "Works Everywhere", desc: "Lever, Greenhouse, Workday, company sites — any job form" },
              { icon: "✋", title: "Never Auto-Submits", desc: "You always review and submit manually — full control" },
            ].map((f) => (
              <div key={f.title} className="flex gap-3 items-start">
                <span className="text-lg mt-0.5">{f.icon}</span>
                <div>
                  <h3 className="text-sm font-bold mb-0.5" style={{ color: "var(--text-secondary)" }}>{f.title}</h3>
                  <p className="text-xs leading-relaxed m-0" style={{ color: "var(--text-faint)" }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Installation steps */}
        <div
          className="rounded-2xl p-6 sm:p-8 mb-8"
          style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
        >
          <h2 className="text-lg font-bold mb-5" style={{ color: "var(--text-secondary)" }}>
            Install in 3 steps
          </h2>

          {[
            {
              step: "1",
              title: "Download & unzip",
              desc: "Click the download button above. Extract the ZIP file — you'll get a folder called applykaro-extension.",
              detail: "On Mac: double-click the ZIP. On Windows: right-click → Extract All.",
            },
            {
              step: "2",
              title: "Open Chrome Extensions",
              desc: "Go to chrome://extensions in your browser. Turn on \"Developer mode\" (toggle in top-right corner).",
              detail: "Or type chrome://extensions in the address bar and press Enter.",
            },
            {
              step: "3",
              title: "Load the extension",
              desc: "Click \"Load unpacked\" → select the applykaro-extension folder. Done! You'll see the ApplyKaro icon in your toolbar.",
              detail: "If you don't see it, click the puzzle icon in Chrome toolbar and pin ApplyKaro.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="mb-4 last:mb-0 rounded-xl overflow-hidden"
              style={{ border: "1px solid var(--card-border)" }}
            >
              <button
                onClick={() => setExpandedStep(expandedStep === item.step ? null : item.step)}
                className="w-full flex items-center gap-4 p-4 text-left cursor-pointer border-none"
                style={{ background: "var(--input-bg)", fontFamily: "inherit" }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-extrabold text-white flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, var(--accent-secondary), var(--accent))" }}
                >
                  {item.step}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold m-0" style={{ color: "var(--text-secondary)" }}>{item.title}</h3>
                  <p className="text-xs m-0 mt-0.5" style={{ color: "var(--text-faint)" }}>{item.desc}</p>
                </div>
                <span
                  className="text-sm transition-transform duration-200"
                  style={{
                    color: "var(--text-faint)",
                    transform: expandedStep === item.step ? "rotate(180deg)" : "none",
                  }}
                >
                  ▼
                </span>
              </button>
              {expandedStep === item.step && (
                <div className="px-4 py-3" style={{ background: "var(--overlay-bg)" }}>
                  <p className="text-xs m-0" style={{ color: "var(--text-muted)" }}>
                    💡 {item.detail}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div
          className="rounded-2xl p-6 sm:p-8 mb-8"
          style={{
            background: "linear-gradient(135deg, var(--section-gradient-start), var(--section-gradient-end))",
            border: "1px solid var(--section-border)",
          }}
        >
          <h2 className="text-lg font-bold mb-2 text-center" style={{ color: "var(--text-secondary)" }}>
            Pricing
          </h2>
          <p className="text-sm text-center mb-6" style={{ color: "var(--text-muted)" }}>
            3 free autofills to try it out. Pay only when you need more.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Free */}
            <div
              className="rounded-xl p-5 text-center"
              style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
            >
              <div className="text-2xl font-extrabold mb-1" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                Free
              </div>
              <div className="text-xs mb-3" style={{ color: "var(--text-faint)" }}>to get started</div>
              <ul className="text-xs text-left space-y-1.5 m-0 p-0 list-none" style={{ color: "var(--text-muted)" }}>
                <li>✓ 3 autofills</li>
                <li>✓ Resume AI parsing</li>
                <li>✓ All form types</li>
              </ul>
            </div>

            {/* Pay-as-you-go */}
            <div
              className="rounded-xl p-5 text-center relative"
              style={{
                background: "var(--card-bg)",
                border: "2px solid var(--accent)",
                boxShadow: "0 0 20px var(--accent-glow)",
              }}
            >
              <div
                className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full text-white"
                style={{ background: "linear-gradient(135deg, var(--accent-secondary), var(--accent))" }}
              >
                Popular
              </div>
              <div className="text-2xl font-extrabold mb-1" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                $0.99
              </div>
              <div className="text-xs mb-3" style={{ color: "var(--text-faint)" }}>50 autofills</div>
              <ul className="text-xs text-left space-y-1.5 m-0 p-0 list-none" style={{ color: "var(--text-muted)" }}>
                <li>✓ 50 autofills</li>
                <li>✓ All free features</li>
                <li>✓ Pay via card / Gumroad</li>
              </ul>
            </div>

            {/* Own key */}
            <div
              className="rounded-xl p-5 text-center"
              style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
            >
              <div className="text-2xl font-extrabold mb-1" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                Free
              </div>
              <div className="text-xs mb-3" style={{ color: "var(--text-faint)" }}>bring your own key</div>
              <ul className="text-xs text-left space-y-1.5 m-0 p-0 list-none" style={{ color: "var(--text-muted)" }}>
                <li>✓ Unlimited autofills</li>
                <li>✓ Your Anthropic API key</li>
                <li>✓ Zero cost to us</li>
              </ul>
            </div>
          </div>

          <p className="text-xs text-center mt-4" style={{ color: "var(--text-faint)" }}>
            Payments powered by Gumroad. Pay with any card, globally.
          </p>
        </div>

        {/* FAQ */}
        <div
          className="rounded-2xl p-6 sm:p-8 mb-8"
          style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
        >
          <h2 className="text-lg font-bold mb-5" style={{ color: "var(--text-secondary)" }}>
            FAQ
          </h2>
          {[
            {
              q: "Is my data safe?",
              a: "Yes. Your profile is stored locally in your browser (chrome.storage). Resume text is sent to our API only during parsing — we don't store it.",
            },
            {
              q: "Does it work on all job sites?",
              a: "It works on any site with HTML forms — LinkedIn, Lever, Greenhouse, Workday, Ashby, company career pages, and more. AI adapts to any form layout.",
            },
            {
              q: "Will it auto-submit applications?",
              a: "Never. ApplyKaro only fills the form. You always review and click Submit yourself.",
            },
            {
              q: "What is 'Bring your own key'?",
              a: "If you have an Anthropic API key, paste it in the extension settings. All AI calls use your key directly — unlimited fills, no cost to us.",
            },
            {
              q: "How does payment work?",
              a: "Payments go through Gumroad — pay with any card globally. Credits are added automatically to your extension after purchase.",
            },
          ].map((item, i) => (
            <div key={i} className="mb-4 last:mb-0">
              <h3 className="text-sm font-bold mb-1" style={{ color: "var(--text-secondary)" }}>{item.q}</h3>
              <p className="text-xs leading-relaxed m-0" style={{ color: "var(--text-faint)" }}>{item.a}</p>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="text-center pt-6" style={{ borderTop: "1px solid var(--divider)" }}>
          <p className="text-xs mb-1" style={{ color: "var(--text-faint)" }}>
            <span className="font-bold" style={{ color: "var(--text-muted)" }}>ApplyKaro</span> — AI-powered job application autofill, powered by Claude
          </p>
          <p className="text-[11px]" style={{ color: "var(--text-ghost)" }}>
            Your data stays in your browser. We don&apos;t store resumes.
          </p>
        </div>
      </div>
    </main>
  );
}
