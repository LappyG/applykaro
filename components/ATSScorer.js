"use client";
import { useState, useCallback, useRef } from "react";
import FileUpload from "./FileUpload";
import Results from "./Results";
import { analyzeWithAI, extractTextFromFile } from "../lib/analyze";

const STEPS = [
  "Reading your resume...",
  "Parsing job description...",
  "Matching skills semantically...",
  "Evaluating experience fit...",
  "Analyzing keyword density...",
  "Generating rewrite suggestions...",
  "Computing final score...",
];

function AnalyzingState() {
  const [step, setStep] = useState(0);
  useState(() => {
    let i = 0;
    const interval = setInterval(() => { i = (i + 1) % STEPS.length; setStep(i); }, 1800);
    return () => clearInterval(interval);
  });

  return (
    <div className="text-center py-16 rounded-2xl mb-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="w-12 h-12 mx-auto mb-5 rounded-full animate-spin" style={{ border: "4px solid rgba(168,85,247,0.15)", borderTopColor: "#a855f7" }} />
      <p className="text-[15px] font-semibold text-purple-400 mb-1.5">AI is analyzing your resume</p>
      <p className="text-[13px] text-white/35 transition-opacity min-h-[20px]">{STEPS[step]}</p>
    </div>
  );
}

export default function ATSScorer({ pdfReady }) {
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [resumeExtracting, setResumeExtracting] = useState(false);
  const [resumeError, setResumeError] = useState("");

  const [jdFile, setJdFile] = useState(null);
  const [jdText, setJdText] = useState("");
  const [jdExtracting, setJdExtracting] = useState(false);
  const [jdError, setJdError] = useState("");

  const [result, setResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiError, setAiError] = useState("");

  const resultRef = useRef(null);

  const handleFile = useCallback(async (file, setText, setFile, setError, setExtracting) => {
    setFile(file);
    setError("");
    setExtracting(true);
    try {
      const text = await extractTextFromFile(file);
      if (text.trim().length < 30) throw new Error("Could not extract enough text. Try another file or paste manually.");
      setText(text);
    } catch (err) {
      setError(err.message);
      setText("");
    }
    setExtracting(false);
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!resumeText.trim() || !jdText.trim()) return;
    setAnalyzing(true);
    setResult(null);
    setAiError("");
    try {
      const r = await analyzeWithAI(resumeText, jdText);
      setResult(r);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
    } catch (err) {
      setAiError(err.message || "Analysis failed. Please try again.");
    }
    setAnalyzing(false);
  }, [resumeText, jdText]);

  const canAnalyze =
    resumeText.trim().length > 30 &&
    jdText.trim().length > 30 &&
    !resumeExtracting &&
    !jdExtracting &&
    !analyzing;

  return (
    <section id="scorer" className="px-4 pt-8 pb-12">
      <div className="max-w-[860px] mx-auto">
        {/* Upload */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
          <FileUpload
            label="Resume" icon="📄" file={resumeFile} text={resumeText}
            onFile={(f) => handleFile(f, setResumeText, setResumeFile, setResumeError, setResumeExtracting)}
            onTextChange={setResumeText} extracting={resumeExtracting} error={resumeError}
          />
          <FileUpload
            label="Job Description" icon="🎯" file={jdFile} text={jdText}
            onFile={(f) => handleFile(f, setJdText, setJdFile, setJdError, setJdExtracting)}
            onTextChange={setJdText} extracting={jdExtracting} error={jdError}
          />
        </div>

        {/* Status */}
        <div className="flex gap-4 justify-center mb-3.5 text-xs">
          <span style={{ color: resumeText.trim().length > 30 ? "#4ade80" : "rgba(255,255,255,0.2)" }}>
            {resumeText.trim().length > 30 ? "✓" : "○"} Resume
            {resumeText ? ` (${resumeText.split(/\s+/).filter(Boolean).length} words)` : ""}
          </span>
          <span style={{ color: jdText.trim().length > 30 ? "#4ade80" : "rgba(255,255,255,0.2)" }}>
            {jdText.trim().length > 30 ? "✓" : "○"} JD
            {jdText ? ` (${jdText.split(/\s+/).filter(Boolean).length} words)` : ""}
          </span>
        </div>

        {/* Analyze button */}
        <button
          onClick={handleAnalyze}
          disabled={!canAnalyze}
          className="w-full py-4 rounded-xl border-none text-base font-bold transition-all duration-300 cursor-pointer"
          style={{
            background: canAnalyze ? "linear-gradient(135deg, #6366f1, #a855f7)" : "rgba(255,255,255,0.05)",
            color: canAnalyze ? "#fff" : "rgba(255,255,255,0.15)",
            cursor: canAnalyze ? "pointer" : "not-allowed",
            boxShadow: canAnalyze ? "0 4px 24px rgba(99,102,241,0.25)" : "none",
            fontFamily: "inherit",
          }}
        >
          {!pdfReady ? "Loading PDF parser..." : analyzing ? "⚡ AI Analyzing..." : "Analyze with AI →"}
        </button>

        {aiError && (
          <p className="text-center text-[13px] text-red-400 mt-3 py-2.5 px-4 rounded-xl" style={{ background: "rgba(239,68,68,0.08)" }}>
            {aiError}
          </p>
        )}

        {/* Results */}
        <div className="mt-8" ref={resultRef}>
          {analyzing && <AnalyzingState />}
          {result && !analyzing && <Results result={result} />}
        </div>
      </div>
    </section>
  );
}
