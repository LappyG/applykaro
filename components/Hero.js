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
            "radial-gradient(ellipse at center, rgba(99,102,241,0.3) 0%, rgba(168,85,247,0.15) 40%, transparent 70%)",
        }}
      />

      {/* Badge */}
      <div className="relative inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-purple-400 tracking-wide uppercase">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        Powered by Claude AI
      </div>

      {/* Headline */}
      <h1 className="relative text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight max-w-3xl mx-auto mb-5">
        Know your{" "}
        <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          ATS score
        </span>{" "}
        before you apply
      </h1>

      <p className="relative text-base sm:text-lg text-white/40 max-w-xl mx-auto mb-8 leading-relaxed">
        Upload your resume and job description. Get instant AI-powered analysis
        with skill matching, keyword gaps, and rewrite suggestions.
        Built for Indian job seekers.
      </p>

      {/* CTA */}
      <button
        onClick={scrollToScorer}
        className="relative inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-white text-base cursor-pointer border-none transition-all duration-300 hover:scale-105"
        style={{
          background: "linear-gradient(135deg, #6366f1, #a855f7)",
          boxShadow: "0 4px 24px rgba(99,102,241,0.3)",
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
            <div className="text-xs text-white/30 tracking-wide">{s.label}</div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="relative max-w-2xl mx-auto mt-16">
        <h2 className="text-sm font-bold text-white/30 uppercase tracking-widest mb-8">
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
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-extrabold text-white mb-3"
                style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }}
              >
                {item.step}
              </div>
              <h3 className="text-sm font-bold text-white/80 mb-1.5">{item.title}</h3>
              <p className="text-xs text-white/30 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
