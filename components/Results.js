"use client";
import ScoreRing from "./ScoreRing";

const scoreColor = (s) => (s >= 75 ? "#22c55e" : s >= 50 ? "#eab308" : "#ef4444");
const priorityColor = { high: "#ef4444", medium: "#eab308", low: "#22c55e" };

function MiniBar({ label, score, note }) {
  const color = scoreColor(score);
  return (
    <div className="mb-4">
      <div className="flex justify-between mb-1">
        <span className="text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>{label}</span>
        <span className="text-[13px] font-bold" style={{ color, fontFamily: "var(--font-mono)" }}>{score}</span>
      </div>
      <div className="h-[7px] rounded overflow-hidden" style={{ background: "var(--ring-track)" }}>
        <div className="h-full rounded transition-all duration-1000 ease-out" style={{ width: `${score}%`, background: color }} />
      </div>
      {note && <p className="text-[11px] mt-1 leading-relaxed" style={{ color: "var(--text-faint)" }}>{note}</p>}
    </div>
  );
}

function SkillTag({ label, matched }) {
  return (
    <span
      className="inline-block py-1 px-2.5 rounded-lg text-xs font-semibold m-0.5"
      style={{
        background: matched ? "var(--green-subtle-bg)" : "var(--red-subtle-bg)",
        color: matched ? "#4ade80" : "#f87171",
        border: `1px solid ${matched ? "var(--green-subtle-border)" : "var(--red-subtle-border)"}`,
      }}
    >
      {matched ? "✓" : "✗"} {label}
    </span>
  );
}

function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-2xl p-7 mb-5 ${className}`}
      style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h3 className="text-[13px] font-bold uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)" }}>
      {children}
    </h3>
  );
}

export default function Results({ result }) {
  if (!result) return null;
  const b = result.breakdown || {};

  return (
    <div className="animate-[fadeUp_0.5s_ease-out]">
      {/* Main Score */}
      <Card className="!text-center !pt-10 !pb-10">
        <ScoreRing score={result.finalScore || 0} />
        <h2
          className="text-2xl font-extrabold mt-5 mb-2"
          style={{ color: scoreColor(result.finalScore || 0) }}
        >
          {result.verdict || "Analysis Complete"}
        </h2>
        <p className="text-sm max-w-lg mx-auto leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {result.summary}
        </p>
      </Card>

      {/* Breakdown */}
      {b.skills && (
        <Card>
          <SectionTitle>Score Breakdown</SectionTitle>
          <MiniBar label="Technical Skills" score={b.skills?.score || 0} note={b.skills?.note} />
          <MiniBar label="Experience" score={b.experience?.score || 0} note={b.experience?.note} />
          <MiniBar label="Education" score={b.education?.score || 0} note={b.education?.note} />
          <MiniBar label="Keywords" score={b.keywords?.score || 0} note={b.keywords?.note} />
        </Card>
      )}

      {/* Skills */}
      {(b.skills?.matched?.length > 0 || b.skills?.missing?.length > 0) && (
        <Card>
          <SectionTitle>Skills Match</SectionTitle>
          {b.skills.matched?.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Matched</p>
              {b.skills.matched.map((s, i) => <SkillTag key={i} label={s} matched />)}
            </div>
          )}
          {b.skills.missing?.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Missing — add these</p>
              {b.skills.missing.map((s, i) => <SkillTag key={i} label={s} matched={false} />)}
            </div>
          )}
        </Card>
      )}

      {/* Keywords */}
      {(b.keywords?.presentInResume?.length > 0 || b.keywords?.missingFromResume?.length > 0) && (
        <Card>
          <SectionTitle>JD Keywords</SectionTitle>
          <div className="grid gap-1.5">
            {(b.keywords.presentInResume || []).map((w, i) => (
              <div key={`p${i}`} className="flex items-center py-2 px-3.5 rounded-xl" style={{ background: "var(--green-row-bg)", border: "1px solid var(--green-row-border)" }}>
                <span className="text-[13px] text-green-400 font-medium">✓ {w}</span>
              </div>
            ))}
            {(b.keywords.missingFromResume || []).map((w, i) => (
              <div key={`m${i}`} className="flex items-center py-2 px-3.5 rounded-xl" style={{ background: "var(--red-row-bg)", border: "1px solid var(--red-row-border)" }}>
                <span className="text-[13px] text-red-400 font-medium">✗ {w}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Experience */}
      {b.experience && (b.experience.jdRequires || b.experience.resumeShows) && (
        <Card className="!flex !justify-around !text-center">
          <div>
            <div className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>JD Requires</div>
            <div className="text-xl font-extrabold text-yellow-400" style={{ fontFamily: "var(--font-mono)" }}>
              {b.experience.jdRequires || "—"}
            </div>
          </div>
          <div className="w-px" style={{ background: "var(--card-border)" }} />
          <div>
            <div className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Your Resume</div>
            <div className="text-xl font-extrabold" style={{ color: scoreColor(b.experience.score || 0), fontFamily: "var(--font-mono)" }}>
              {b.experience.resumeShows || "—"}
            </div>
          </div>
        </Card>
      )}

      {/* Fit Analysis */}
      {result.fitAnalysis && (
        <Card>
          <SectionTitle>🧠 AI Fit Analysis</SectionTitle>
          <p className="text-sm leading-relaxed m-0" style={{ color: "var(--text-secondary)" }}>{result.fitAnalysis}</p>
        </Card>
      )}

      {/* Rewrite Suggestions */}
      {result.rewriteSuggestions?.length > 0 && (
        <Card>
          <SectionTitle>✏️ Resume Rewrite Suggestions</SectionTitle>
          <div className="grid gap-4">
            {result.rewriteSuggestions.map((s, i) => (
              <div key={i} className="rounded-xl overflow-hidden" style={{ background: "var(--overlay-deep)" }}>
                <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--card-border)" }}>
                  <span className="text-[10px] text-red-400 uppercase tracking-wider font-bold">Original</span>
                  <p className="text-[13px] mt-1.5 italic leading-relaxed" style={{ color: "var(--text-muted)" }}>"{s.original}"</p>
                </div>
                <div className="px-4 py-3">
                  <span className="text-[10px] text-green-400 uppercase tracking-wider font-bold">AI Improved</span>
                  <p className="text-[13px] mt-1.5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>"{s.improved}"</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Action Items */}
      {result.actionItems?.length > 0 && (
        <div
          className="rounded-2xl p-7 mb-5"
          style={{
            background: `linear-gradient(135deg, var(--section-gradient-start), var(--section-gradient-end))`,
            border: "1px solid var(--section-border)",
          }}
        >
          <SectionTitle>💡 Action Items</SectionTitle>
          <div className="grid gap-2.5">
            {result.actionItems.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 py-3 px-4 rounded-xl text-[13px] leading-relaxed"
                style={{
                  background: "var(--overlay-dark)",
                  borderLeft: `3px solid ${priorityColor[item.priority] || "var(--accent)"}`,
                  color: "var(--text-secondary)",
                }}
              >
                <span
                  className="text-[9px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded shrink-0 mt-0.5"
                  style={{
                    background: `${priorityColor[item.priority] || "var(--accent)"}22`,
                    color: priorityColor[item.priority] || "var(--accent)",
                  }}
                >
                  {item.priority}
                </span>
                <span>{item.action}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
