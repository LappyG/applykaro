"use client";

export default function Hero() {
  const scrollToScorer = () => {
    document.getElementById("scorer")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative overflow-hidden px-4 pt-16 pb-20 text-center">
      {/* Gradient bg effects */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] opacity-20"
        style={{
          background:
            "radial-gradient(ellipse at center, var(--gradient-hero-start) 0%, var(--gradient-hero-mid) 40%, transparent 70%)",
        }}
      />

      {/* Badge */}
      <div
        className="relative inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase"
        style={{
          background: "var(--badge-bg)",
          border: "1px solid var(--badge-border)",
          color: "var(--accent)",
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        Powered by Claude AI
      </div>

      {/* Headline */}
      <h1 className="relative text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight max-w-3xl mx-auto mb-5">
        Know your{" "}
        <span
          style={{
            background: "linear-gradient(to right, var(--accent-secondary), var(--accent))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          ATS score
        </span>{" "}
        before you apply
      </h1>

      <p className="relative text-base sm:text-lg max-w-xl mx-auto mb-8 leading-relaxed" style={{ color: "var(--text-muted)" }}>
        Upload your resume and job description. Get instant AI-powered analysis
        with skill matching, keyword gaps, and rewrite suggestions.
        Built for Indian job seekers.
      </p>

      {/* CTA */}
      <button
        onClick={scrollToScorer}
        className="relative inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-white text-base cursor-pointer border-none transition-all duration-300 hover:scale-105"
        style={{
          background: `linear-gradient(135deg, var(--accent-secondary), var(--accent))`,
          boxShadow: `0 4px 24px var(--accent-glow)`,
        }}
      >
        Check Your Score — Free ↓
      </button>

      {/* Stats */}
      <div className="relative flex flex-wrap justify-center gap-8 sm:gap-12 mt-14 text-center">
        {[
          { num: "45s", label: "Average scan time" },
          { num: "Free", label: "3 scans, no signup" },
          { num: "AI", label: "Semantic matching" },
          { num: "🇮🇳", label: "Built for India" },
        ].map((s) => (
          <div key={s.label}>
            <div
              className="text-2xl font-extrabold mb-0.5"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {s.num}
            </div>
            <div className="text-xs tracking-wide" style={{ color: "var(--text-faint)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="relative max-w-2xl mx-auto mt-16">
        <h2 className="text-sm font-bold uppercase tracking-widest mb-8" style={{ color: "var(--text-faint)" }}>
          How it works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              step: "1",
              title: "Upload Resume",
              desc: "Drop your PDF. Text is extracted in your browser — nothing leaves your device.",
            },
            {
              step: "2",
              title: "Add Job Description",
              desc: "Upload JD as PDF or paste it. Works with any job posting from any portal.",
            },
            {
              step: "3",
              title: "Get AI Analysis",
              desc: "Score, skill gaps, keyword matches, rewrite suggestions — all in 30 seconds.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="p-5 rounded-2xl text-left"
              style={{
                background: "var(--card-bg)",
                border: "1px solid var(--card-border)",
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-extrabold text-white mb-3"
                style={{ background: `linear-gradient(135deg, var(--accent-secondary), var(--accent))` }}
              >
                {item.step}
              </div>
              <h3 className="text-sm font-bold mb-1.5" style={{ color: "var(--text-secondary)" }}>{item.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-faint)" }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
