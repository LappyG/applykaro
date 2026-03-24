export async function analyzeWithAI(resumeText, jdText) {
  const systemPrompt = `You are an expert ATS (Applicant Tracking System) resume analyzer specializing in the Indian job market. Analyze the resume against the job description and return ONLY a valid JSON object with no markdown, no backticks, no preamble. The JSON must have this exact structure:

{
  "finalScore": <number 0-100>,
  "verdict": "<one of: Excellent Match|Good Match|Needs Work|Weak Match>",
  "summary": "<2 sentence summary of the match quality>",
  "breakdown": {
    "skills": { "score": <0-100>, "matched": ["skill1", "skill2"], "missing": ["skill3", "skill4"], "note": "<1 sentence>" },
    "experience": { "score": <0-100>, "jdRequires": "<e.g. 3+ years>", "resumeShows": "<e.g. 2 years>", "note": "<1 sentence>" },
    "education": { "score": <0-100>, "match": true or false, "note": "<1 sentence>" },
    "keywords": { "score": <0-100>, "presentInResume": ["word1", "word2"], "missingFromResume": ["word3", "word4"], "note": "<1 sentence>" }
  },
  "actionItems": [
    { "priority": "high", "action": "<specific actionable suggestion>" }
  ],
  "rewriteSuggestions": [
    { "original": "<weak bullet point from resume>", "improved": "<rewritten version tailored to JD>" }
  ],
  "fitAnalysis": "<3-4 sentences explaining semantic fit beyond just keywords>"
}

Rules:
- Score honestly. Don't inflate scores.
- For Indian resumes, recognize B.Tech, M.Tech, IIT, NIT, BITS, etc.
- Identify semantic matches (e.g. "led a team" = leadership)
- Give 3-5 action items, prioritized as high/medium/low
- Give 2-3 rewrite suggestions for weakest resume bullet points
- fitAnalysis should assess real role fit beyond keywords
- Return ONLY the JSON. No other text.`;

  const userMessage = `RESUME:\n${resumeText.slice(0, 6000)}\n\n---\n\nJOB DESCRIPTION:\n${jdText.slice(0, 4000)}\n\nAnalyze and return the JSON now.`;

  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ systemPrompt, userMessage }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Server error ${response.status}`);
  }

  const result = await response.json();
  return result;
}

export async function extractPDFText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const typedArray = new Uint8Array(e.target.result);
        const pdfjsLib = window.pdfjsLib;
        if (!pdfjsLib) {
          reject(new Error("PDF parser not loaded yet. Please wait a moment."));
          return;
        }
        const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          fullText += content.items.map((item) => item.str).join(" ") + "\n";
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

export async function extractTextFromFile(file) {
  if (file.type === "application/pdf") return await extractPDFText(file);
  if (file.type === "text/plain" || file.name.endsWith(".txt"))
    return await file.text();
  throw new Error("Please upload a PDF or TXT file.");
}
