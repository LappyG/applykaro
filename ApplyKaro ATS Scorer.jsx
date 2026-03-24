import { useState, useCallback, useRef } from "react";

// ─── Skill taxonomy with synonyms ───
const SKILL_SYNONYMS = {
  javascript: ["js", "javascript", "ecmascript", "es6", "es2015"],
  typescript: ["ts", "typescript"],
  python: ["python", "py", "python3"],
  react: ["react", "reactjs", "react.js"],
  angular: ["angular", "angularjs", "angular.js"],
  vue: ["vue", "vuejs", "vue.js"],
  node: ["node", "nodejs", "node.js"],
  express: ["express", "expressjs", "express.js"],
  mongodb: ["mongodb", "mongo"],
  postgresql: ["postgresql", "postgres", "psql"],
  mysql: ["mysql", "sql"],
  sql: ["sql", "structured query language"],
  aws: ["aws", "amazon web services"],
  azure: ["azure", "microsoft azure"],
  gcp: ["gcp", "google cloud", "google cloud platform"],
  docker: ["docker", "containerization"],
  kubernetes: ["kubernetes", "k8s"],
  git: ["git", "github", "gitlab", "version control"],
  cicd: ["ci/cd", "cicd", "continuous integration", "continuous deployment", "jenkins", "github actions"],
  ml: ["machine learning", "ml", "deep learning", "dl"],
  ai: ["artificial intelligence", "ai"],
  nlp: ["nlp", "natural language processing"],
  cv: ["computer vision", "cv", "image processing"],
  tensorflow: ["tensorflow", "tf"],
  pytorch: ["pytorch", "torch"],
  java: ["java", "jdk", "jvm"],
  csharp: ["c#", "csharp", "c sharp", ".net", "dotnet"],
  cpp: ["c++", "cpp"],
  rust: ["rust"],
  go: ["golang", "go"],
  swift: ["swift", "ios development"],
  kotlin: ["kotlin", "android development"],
  flutter: ["flutter", "dart"],
  reactnative: ["react native"],
  html: ["html", "html5"],
  css: ["css", "css3", "scss", "sass", "less"],
  tailwind: ["tailwind", "tailwindcss"],
  bootstrap: ["bootstrap"],
  figma: ["figma"],
  redis: ["redis"],
  graphql: ["graphql", "gql"],
  rest: ["rest", "restful", "rest api"],
  agile: ["agile", "scrum", "kanban", "sprint"],
  jira: ["jira"],
  linux: ["linux", "ubuntu", "centos"],
  excel: ["excel", "ms excel", "microsoft excel", "spreadsheet"],
  powerbi: ["power bi", "powerbi"],
  tableau: ["tableau"],
  pandas: ["pandas"],
  numpy: ["numpy"],
  spark: ["spark", "apache spark", "pyspark"],
  hadoop: ["hadoop"],
  dataanalysis: ["data analysis", "data analytics", "analytics"],
  datascience: ["data science"],
  communication: ["communication", "verbal", "written communication"],
  leadership: ["leadership", "team lead", "team management"],
  problemsolving: ["problem solving", "analytical", "critical thinking"],
  teamwork: ["teamwork", "collaboration", "team player"],
  django: ["django"],
  flask: ["flask"],
  springboot: ["spring boot", "spring", "springboot"],
  php: ["php", "laravel"],
  ruby: ["ruby", "rails", "ruby on rails"],
  selenium: ["selenium", "test automation"],
  cypress: ["cypress"],
  jest: ["jest", "unit testing"],
  api: ["api", "apis", "microservices"],
  devops: ["devops"],
  terraform: ["terraform", "infrastructure as code", "iac"],
  ansible: ["ansible"],
  nginx: ["nginx"],
  kafka: ["kafka", "apache kafka"],
  elasticsearch: ["elasticsearch", "elastic"],
  powerpoint: ["powerpoint", "ppt", "presentation"],
  salesforce: ["salesforce", "sfdc"],
  sap: ["sap"],
  blockchain: ["blockchain", "web3", "smart contract"],
  cybersecurity: ["cybersecurity", "security", "penetration testing", "ethical hacking"],
};

const EDUCATION_KEYWORDS = [
  "b.tech", "btech", "b.e", "be", "m.tech", "mtech", "mba", "bca", "mca",
  "b.sc", "bsc", "m.sc", "msc", "phd", "bachelor", "master", "degree",
  "engineering", "computer science", "information technology", "electronics",
  "mechanical", "electrical", "civil", "iit", "nit", "iiit", "bits",
  "diploma", "12th", "10th", "cbse", "icse", "graduation", "post graduation",
  "b.com", "bcom", "m.com", "mcom", "ca", "chartered accountant", "b.a", "ba", "m.a", "ma"
];

const STOP_WORDS = new Set([
  "the", "and", "for", "with", "that", "this", "you", "are", "will", "our",
  "have", "from", "your", "about", "been", "can", "but", "not", "all", "who",
  "them", "than", "other", "its", "also", "into", "could", "would", "should",
  "may", "must", "shall", "has", "had", "was", "were", "being", "each",
  "which", "their", "what", "there", "when", "how", "any", "more", "some",
  "such", "only", "new", "very", "well", "just", "over", "after", "before",
  "between", "under", "both", "through", "during", "without", "within",
  "along", "across", "behind", "beyond", "able", "work", "working", "role",
  "experience", "looking", "join", "team", "company", "position", "candidate",
  "required", "requirements", "responsibilities", "skills", "preferred",
  "strong", "good", "excellent", "ability", "years", "year", "include",
  "including", "knowledge", "understanding", "etc", "using", "used", "use",
  "like", "based", "related", "relevant", "minimum", "least", "plus"
]);

const EXP_PATTERNS = [
  /(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp)/gi,
  /experience\s*(?:of\s*)?(\d+)\+?\s*(?:years?|yrs?)/gi,
  /(\d+)\s*-\s*(\d+)\s*(?:years?|yrs?)/gi,
];

function extractExperience(text) {
  let maxYears = 0;
  for (const pattern of EXP_PATTERNS) {
    const matches = [...text.matchAll(new RegExp(pattern))];
    for (const m of matches) {
      const y = parseInt(m[2] || m[1]);
      if (y > maxYears && y < 50) maxYears = y;
    }
  }
  return maxYears;
}

function tokenize(text) {
  return text.toLowerCase().replace(/[^a-z0-9#+.\-/\s]/g, " ").split(/\s+/).filter(Boolean);
}

function findNGrams(tokens, n) {
  const grams = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    grams.push(tokens.slice(i, i + n).join(" "));
  }
  return grams;
}

function analyzeATS(resumeText, jdText) {
  if (!resumeText.trim() || !jdText.trim()) return null;

  const rLower = resumeText.toLowerCase();
  const jLower = jdText.toLowerCase();
  const rTokens = tokenize(resumeText);
  const jTokens = tokenize(jdText);
  const rBigrams = findNGrams(rTokens, 2);
  const rTrigrams = findNGrams(rTokens, 3);
  const rAll = new Set([...rTokens, ...rBigrams, ...rTrigrams]);

  const matched = [];
  const missing = [];

  for (const [skillKey, synonyms] of Object.entries(SKILL_SYNONYMS)) {
    const inJD = synonyms.some(s => {
      if (s.length <= 2) return jTokens.includes(s) || jLower.includes(` ${s} `) || jLower.startsWith(s + " ") || jLower.endsWith(" " + s);
      return jLower.includes(s);
    });
    if (!inJD) continue;

    const inResume = synonyms.some(s => {
      if (s.length <= 2) return rTokens.includes(s) || rLower.includes(` ${s} `) || rLower.startsWith(s + " ") || rLower.endsWith(" " + s);
      return rLower.includes(s);
    });

    if (inResume) {
      matched.push({ key: skillKey, label: synonyms[1] || synonyms[0] });
    } else {
      missing.push({ key: skillKey, label: synonyms[1] || synonyms[0] });
    }
  }

  const jdWordFreq = {};
  for (const t of jTokens) {
    if (t.length > 3 && !STOP_WORDS.has(t)) {
      jdWordFreq[t] = (jdWordFreq[t] || 0) + 1;
    }
  }

  const repeatedJDWords = Object.entries(jdWordFreq)
    .filter(([w, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([w, c]) => ({ word: w, count: c, inResume: rLower.includes(w) }));

  const jdEdu = EDUCATION_KEYWORDS.filter(k => jLower.includes(k));
  const rEdu = EDUCATION_KEYWORDS.filter(k => rLower.includes(k));
  const eduMatch = jdEdu.length === 0 ? true : jdEdu.some(k => rEdu.includes(k));

  const jdExp = extractExperience(jdText);
  const rExp = extractExperience(resumeText);
  const expMatch = jdExp === 0 ? null : rExp >= jdExp;

  const totalSkills = matched.length + missing.length;
  const skillScore = totalSkills === 0 ? 70 : Math.round((matched.length / totalSkills) * 100);
  const repeatedMatched = repeatedJDWords.filter(w => w.inResume).length;
  const repeatedTotal = repeatedJDWords.length;
  const keywordScore = repeatedTotal === 0 ? 70 : Math.round((repeatedMatched / repeatedTotal) * 100);
  const eduScore = eduMatch ? 100 : 40;
  const expScore = expMatch === null ? 70 : (expMatch ? 100 : 30);

  const finalScore = Math.round(
    skillScore * 0.45 + keywordScore * 0.25 + eduScore * 0.15 + expScore * 0.15
  );

  const suggestions = [];
  if (missing.length > 0) {
    const top = missing.slice(0, 5).map(m => m.label);
    suggestions.push(`Add these skills to your resume: ${top.join(", ")}`);
  }
  if (!eduMatch && jdEdu.length > 0) {
    suggestions.push(`JD mentions "${jdEdu[0]}" — ensure your education section includes this`);
  }
  if (expMatch === false) {
    suggestions.push(`JD requires ${jdExp}+ years. Highlight projects and internships to show equivalent experience`);
  }
  const missingRepeated = repeatedJDWords.filter(w => !w.inResume).slice(0, 3);
  if (missingRepeated.length > 0) {
    suggestions.push(`JD emphasizes: ${missingRepeated.map(w => `"${w.word}" (${w.count}x)`).join(", ")} — weave these into your resume`);
  }
  if (totalSkills > 0 && matched.length === totalSkills) {
    suggestions.push("All skills matched! Tailor your summary to mirror the JD's language and tone for maximum impact.");
  }
  if (suggestions.length === 0) {
    suggestions.push("Solid match! Fine-tune your resume summary to echo the exact phrases in the JD.");
  }

  return { finalScore, skillScore, keywordScore, eduScore, expScore, matched, missing, repeatedJDWords, jdExp, rExp, eduMatch, expMatch, suggestions, totalSkills };
}

// ─── PDF Extraction ───
async function extractPDFText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async function (e) {
      try {
        const typedArray = new Uint8Array(e.target.result);
        const pdfjsLib = window.pdfjsLib;
        if (!pdfjsLib) {
          reject(new Error("PDF.js not loaded"));
          return;
        }
        const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items.map(item => item.str).join(" ");
          fullText += pageText + "\n";
        }
        resolve(fullText.trim());
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}

async function extractTextFromFile(file) {
  if (file.type === "application/pdf") {
    return await extractPDFText(file);
  } else if (file.type === "text/plain" || file.name.endsWith(".txt")) {
    return await file.text();
  } else if (file.type.includes("word") || file.name.endsWith(".docx") || file.name.endsWith(".doc")) {
    throw new Error("DOCX support coming soon. Please upload a PDF or paste your text.");
  }
  throw new Error("Unsupported file type. Please upload PDF or TXT.");
}

// ─── UI Components ───

function ScoreRing({ score, size = 150, stroke = 11 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 75 ? "#22c55e" : score >= 50 ? "#eab308" : "#ef4444";
  return (
    <div style={{ position: "relative", width: size, height: size, margin: "0 auto" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s ease-out" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: size * 0.28, fontWeight: 800, color, fontFamily: "'JetBrains Mono', monospace" }}>{score}</span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: 1.5, textTransform: "uppercase" }}>out of 100</span>
      </div>
    </div>
  );
}

function MiniBar({ label, score, weight }) {
  const color = score >= 75 ? "#22c55e" : score >= 50 ? "#eab308" : "#ef4444";
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{label} <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 10 }}>({weight})</span></span>
        <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: "'JetBrains Mono', monospace" }}>{score}</span>
      </div>
      <div style={{ height: 7, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${score}%`, background: color, borderRadius: 4, transition: "width 1s ease-out" }} />
      </div>
    </div>
  );
}

function SkillTag({ label, matched }) {
  return (
    <span style={{
      display: "inline-block", padding: "5px 11px", borderRadius: 7, fontSize: 12, fontWeight: 600,
      margin: "3px 5px 3px 0",
      background: matched ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.10)",
      color: matched ? "#4ade80" : "#f87171",
      border: `1px solid ${matched ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.18)"}`,
    }}>
      {matched ? "✓" : "✗"} {label}
    </span>
  );
}

function FileUploadBox({ label, icon, file, onFile, text, onTextChange, extracting, error }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [mode, setMode] = useState("upload"); // "upload" | "paste"

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  }, [onFile]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 1.2 }}>
          {icon} {label}
        </label>
        <div style={{ display: "flex", gap: 2, background: "rgba(255,255,255,0.04)", borderRadius: 6, padding: 2 }}>
          {["upload", "paste"].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              padding: "4px 10px", borderRadius: 5, border: "none", fontSize: 11, fontWeight: 600,
              background: mode === m ? "rgba(168,85,247,0.2)" : "transparent",
              color: mode === m ? "#c084fc" : "rgba(255,255,255,0.3)",
              cursor: "pointer", fontFamily: "inherit",
            }}>
              {m === "upload" ? "Upload" : "Paste"}
            </button>
          ))}
        </div>
      </div>

      {mode === "upload" ? (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{
            height: 160, borderRadius: 14,
            border: `2px dashed ${dragOver ? "#a855f7" : error ? "#ef4444" : file ? "#22c55e" : "rgba(255,255,255,0.1)"}`,
            background: dragOver ? "rgba(168,85,247,0.06)" : "rgba(255,255,255,0.02)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            cursor: "pointer", transition: "all 0.2s", position: "relative",
          }}
        >
          <input ref={inputRef} type="file" accept=".pdf,.txt,.doc,.docx" style={{ display: "none" }}
            onChange={e => { if (e.target.files[0]) onFile(e.target.files[0]); }} />

          {extracting ? (
            <>
              <div style={{ width: 32, height: 32, border: "3px solid rgba(168,85,247,0.2)", borderTopColor: "#a855f7", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 10 }}>Extracting text...</p>
            </>
          ) : file ? (
            <>
              <div style={{ fontSize: 28, marginBottom: 6 }}>📄</div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#4ade80", margin: 0 }}>{file.name}</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "4px 0 0" }}>
                {text ? `${text.split(/\s+/).filter(Boolean).length} words extracted` : "Processing..."}
              </p>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 6 }}>Click to replace</p>
            </>
          ) : (
            <>
              <div style={{ fontSize: 32, marginBottom: 6, opacity: 0.4 }}>⬆</div>
              <p style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.5)", margin: 0 }}>
                Drop PDF here or <span style={{ color: "#a855f7", fontWeight: 700 }}>click to upload</span>
              </p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 4 }}>PDF, TXT supported</p>
            </>
          )}
        </div>
      ) : (
        <textarea
          value={text}
          onChange={e => onTextChange(e.target.value)}
          placeholder={`Paste your ${label.toLowerCase()} text here...`}
          style={{
            width: "100%", height: 160, padding: 14, borderRadius: 14,
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
            color: "#e2e2e8", fontSize: 13, fontFamily: "inherit", resize: "vertical",
            outline: "none", boxSizing: "border-box",
          }}
          onFocus={e => e.target.style.borderColor = "rgba(168,85,247,0.4)"}
          onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
        />
      )}

      {error && (
        <p style={{ fontSize: 11, color: "#f87171", marginTop: 6 }}>{error}</p>
      )}
    </div>
  );
}

// ─── Main App ───
export default function ATSScorer() {
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
  const [pdfLoaded, setPdfLoaded] = useState(false);

  const resultRef = useRef(null);

  // Load pdf.js from CDN
  useState(() => {
    if (window.pdfjsLib) { setPdfLoaded(true); return; }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      setPdfLoaded(true);
    };
    document.head.appendChild(script);
  });

  const handleResumeFile = useCallback(async (file) => {
    setResumeFile(file);
    setResumeError("");
    setResumeExtracting(true);
    try {
      const text = await extractTextFromFile(file);
      if (!text || text.trim().length < 20) throw new Error("Could not extract enough text. Try a different PDF or paste manually.");
      setResumeText(text);
    } catch (err) {
      setResumeError(err.message);
      setResumeText("");
    }
    setResumeExtracting(false);
  }, []);

  const handleJdFile = useCallback(async (file) => {
    setJdFile(file);
    setJdError("");
    setJdExtracting(true);
    try {
      const text = await extractTextFromFile(file);
      if (!text || text.trim().length < 20) throw new Error("Could not extract enough text. Try a different file or paste manually.");
      setJdText(text);
    } catch (err) {
      setJdError(err.message);
      setJdText("");
    }
    setJdExtracting(false);
  }, []);

  const handleAnalyze = useCallback(() => {
    if (!resumeText.trim() || !jdText.trim()) return;
    setAnalyzing(true);
    setResult(null);
    setTimeout(() => {
      const r = analyzeATS(resumeText, jdText);
      setResult(r);
      setAnalyzing(false);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    }, 600);
  }, [resumeText, jdText]);

  const canAnalyze = resumeText.trim().length > 20 && jdText.trim().length > 20 && !resumeExtracting && !jdExtracting;

  const scoreLabel = (s) => s >= 85 ? "Excellent Match" : s >= 70 ? "Good Match" : s >= 50 ? "Needs Work" : "Weak Match";
  const scoreEmoji = (s) => s >= 85 ? "🟢" : s >= 70 ? "🟡" : s >= 50 ? "🟠" : "🔴";

  return (
    <div style={{
      minHeight: "100vh", background: "#08080d",
      fontFamily: "'Outfit', sans-serif", color: "#e2e2e8",
      padding: "0 16px 80px",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;700;800&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ textAlign: "center", padding: "40px 0 12px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 11,
            background: "linear-gradient(135deg, #6366f1, #a855f7)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, fontWeight: 900, color: "#fff",
          }}>A</div>
          <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>
            Apply<span style={{ color: "#a855f7" }}>Karo</span>
          </span>
        </div>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14, margin: "4px 0 0" }}>
          Upload your resume & job description — get your ATS match score instantly
        </p>
      </div>

      {/* Upload Section */}
      <div style={{ maxWidth: 840, margin: "20px auto 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
          <FileUploadBox
            label="Resume" icon="📄" file={resumeFile}
            onFile={handleResumeFile} text={resumeText}
            onTextChange={setResumeText} extracting={resumeExtracting} error={resumeError}
          />
          <FileUploadBox
            label="Job Description" icon="🎯" file={jdFile}
            onFile={handleJdFile} text={jdText}
            onTextChange={setJdText} extracting={jdExtracting} error={jdError}
          />
        </div>

        {/* Status indicators */}
        <div style={{ display: "flex", gap: 16, justifyContent: "center", marginBottom: 16 }}>
          <span style={{ fontSize: 12, color: resumeText.trim().length > 20 ? "#4ade80" : "rgba(255,255,255,0.2)" }}>
            {resumeText.trim().length > 20 ? "✓" : "○"} Resume ready {resumeText ? `(${resumeText.split(/\s+/).filter(Boolean).length} words)` : ""}
          </span>
          <span style={{ fontSize: 12, color: jdText.trim().length > 20 ? "#4ade80" : "rgba(255,255,255,0.2)" }}>
            {jdText.trim().length > 20 ? "✓" : "○"} JD ready {jdText ? `(${jdText.split(/\s+/).filter(Boolean).length} words)` : ""}
          </span>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={!canAnalyze || analyzing}
          style={{
            width: "100%", padding: "16px 0", borderRadius: 14, border: "none",
            background: canAnalyze ? "linear-gradient(135deg, #6366f1, #a855f7)" : "rgba(255,255,255,0.05)",
            color: canAnalyze ? "#fff" : "rgba(255,255,255,0.15)",
            fontSize: 16, fontWeight: 700, fontFamily: "inherit",
            cursor: canAnalyze ? "pointer" : "not-allowed",
            transition: "all 0.3s", letterSpacing: 0.5,
            boxShadow: canAnalyze ? "0 4px 24px rgba(99,102,241,0.25)" : "none",
          }}
        >
          {analyzing ? "⚡ Analyzing your match..." : !pdfLoaded ? "Loading PDF parser..." : "Analyze ATS Match →"}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div ref={resultRef} style={{ maxWidth: 840, margin: "36px auto 0" }}>

          {/* Main Score */}
          <div style={{
            background: "rgba(255,255,255,0.025)", borderRadius: 20,
            border: "1px solid rgba(255,255,255,0.06)", padding: "36px 32px",
            textAlign: "center", marginBottom: 20,
          }}>
            <ScoreRing score={result.finalScore} />
            <h2 style={{
              fontSize: 24, fontWeight: 800, marginTop: 18, marginBottom: 6,
              color: result.finalScore >= 75 ? "#4ade80" : result.finalScore >= 50 ? "#facc15" : "#f87171"
            }}>
              {scoreEmoji(result.finalScore)} {scoreLabel(result.finalScore)}
            </h2>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, maxWidth: 500, margin: "0 auto", lineHeight: 1.6 }}>
              {result.finalScore >= 85 ? "Your resume aligns strongly. Minor tweaks and you're through ATS." :
               result.finalScore >= 70 ? "Good foundation. Add missing keywords to boost your chances significantly." :
               result.finalScore >= 50 ? "ATS will likely filter this out. Address the gaps below." :
               "Major mismatch — you'll need to heavily tailor your resume for this role."}
            </p>
          </div>

          {/* Score Breakdown */}
          <div style={{
            background: "rgba(255,255,255,0.025)", borderRadius: 20,
            border: "1px solid rgba(255,255,255,0.06)", padding: 28, marginBottom: 20,
          }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 18, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: 1.5 }}>Score Breakdown</h3>
            <MiniBar label="Technical Skills" score={result.skillScore} weight="45%" />
            <MiniBar label="Keyword Density" score={result.keywordScore} weight="25%" />
            <MiniBar label="Education Match" score={result.eduScore} weight="15%" />
            <MiniBar label="Experience Level" score={result.expScore} weight="15%" />
          </div>

          {/* Skills */}
          {result.totalSkills > 0 && (
            <div style={{
              background: "rgba(255,255,255,0.025)", borderRadius: 20,
              border: "1px solid rgba(255,255,255,0.06)", padding: 28, marginBottom: 20,
            }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: 1.5 }}>Skills Analysis</h3>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginBottom: 16 }}>
                {result.matched.length}/{result.totalSkills} skills from JD found in your resume
              </p>
              {result.matched.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Found in resume</p>
                  {result.matched.map(s => <SkillTag key={s.key} label={s.label} matched />)}
                </div>
              )}
              {result.missing.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Missing — add these</p>
                  {result.missing.map(s => <SkillTag key={s.key} label={s.label} matched={false} />)}
                </div>
              )}
            </div>
          )}

          {/* JD Emphasis */}
          {result.repeatedJDWords.length > 0 && (
            <div style={{
              background: "rgba(255,255,255,0.025)", borderRadius: 20,
              border: "1px solid rgba(255,255,255,0.06)", padding: 28, marginBottom: 20,
            }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: 1.5 }}>JD Emphasis Keywords</h3>
              <div style={{ display: "grid", gap: 6 }}>
                {result.repeatedJDWords.map(w => (
                  <div key={w.word} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "8px 14px", borderRadius: 10,
                    background: w.inResume ? "rgba(34,197,94,0.05)" : "rgba(239,68,68,0.05)",
                    border: `1px solid ${w.inResume ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)"}`,
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: w.inResume ? "#4ade80" : "#f87171" }}>
                      {w.inResume ? "✓" : "✗"} {w.word}
                    </span>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: "'JetBrains Mono', monospace" }}>
                      {w.count}x in JD
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Experience */}
          {result.jdExp > 0 && (
            <div style={{
              background: "rgba(255,255,255,0.025)", borderRadius: 20,
              border: "1px solid rgba(255,255,255,0.06)", padding: 24, marginBottom: 20,
              display: "flex", justifyContent: "space-around", textAlign: "center",
            }}>
              <div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>JD Requires</div>
                <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: "#facc15" }}>{result.jdExp}+ yrs</div>
              </div>
              <div style={{ width: 1, background: "rgba(255,255,255,0.06)" }} />
              <div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Your Resume</div>
                <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: result.expMatch ? "#4ade80" : "#f87171" }}>
                  {result.rExp > 0 ? `${result.rExp} yrs` : "—"}
                </div>
              </div>
            </div>
          )}

          {/* Action Items */}
          <div style={{
            background: "linear-gradient(135deg, rgba(99,102,241,0.06), rgba(168,85,247,0.06))",
            borderRadius: 20, border: "1px solid rgba(168,85,247,0.12)", padding: 28, marginBottom: 20,
          }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: "#c084fc", textTransform: "uppercase", letterSpacing: 1.5 }}>
              💡 Action Items
            </h3>
            <div style={{ display: "grid", gap: 10 }}>
              {result.suggestions.map((s, i) => (
                <div key={i} style={{
                  padding: "12px 16px", borderRadius: 12,
                  background: "rgba(0,0,0,0.25)", fontSize: 13,
                  lineHeight: 1.6, color: "rgba(255,255,255,0.8)",
                  borderLeft: "3px solid #a855f7",
                }}>
                  <span style={{ color: "#a855f7", fontWeight: 800, marginRight: 8, fontFamily: "'JetBrains Mono', monospace" }}>{i + 1}</span>
                  {s}
                </div>
              ))}
            </div>
          </div>

          {/* Footer CTA */}
          <div style={{ textAlign: "center", padding: "28px 0", borderTop: "1px solid rgba(255,255,255,0.04)", marginTop: 8 }}>
            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, marginBottom: 6 }}>
              <strong style={{ color: "rgba(255,255,255,0.4)" }}>ApplyKaro</strong> — ATS scorer built for Indian job seekers
            </p>
            <p style={{ color: "rgba(255,255,255,0.15)", fontSize: 11 }}>
              Coming soon: Chrome autofill for Naukri & Internshala · Application tracker · AI resume rewriter
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
