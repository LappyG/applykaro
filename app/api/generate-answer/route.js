import { NextResponse } from "next/server";
import { getCredits, deductCredit } from "../../../lib/credits";

const MAX_QUESTION = 1000;
const MAX_RESUME = 4000;
const MAX_JD = 4000;
const ANON_FREE_CREDITS = 3;

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(request) {
  try {
    const body = await request.json();

    const question = String(body.question || "").slice(0, MAX_QUESTION).trim();
    const resumeText = String(body.resumeText || "").slice(0, MAX_RESUME).trim();
    const jobTitle = String(body.jobTitle || "").slice(0, 200).trim();
    const company = String(body.company || "").slice(0, 200).trim();
    const jobDescription = String(body.jobDescription || "").slice(0, MAX_JD).trim();
    const profile = body.profile && typeof body.profile === "object" ? body.profile : {};
    const userId = body.userId;
    const userApiKey = body.userApiKey;

    if (!question) {
      return NextResponse.json({ error: "Missing question" }, { status: 400 });
    }
    if (!resumeText && !profile.fullName) {
      return NextResponse.json(
        { error: "No profile or resume available. Set up your profile first." },
        { status: 400 }
      );
    }

    // Determine which API key to use (mirrors /api/autofill)
    let apiKey = userApiKey;
    if (!userApiKey) {
      const creditCheck = userId ? await getCredits(userId) : { credits: ANON_FREE_CREDITS };
      if (creditCheck.credits <= 0) {
        return NextResponse.json(
          { error: "No credits remaining", credits: 0, needsPayment: true },
          { status: 402 }
        );
      }
      apiKey = process.env.ANTHROPIC_API_KEY;
    }
    if (!apiKey) {
      return NextResponse.json({ error: "No API key available" }, { status: 500 });
    }

    const systemPrompt = `You are an expert job applicant writing answers to job application questions on behalf of the applicant.

Rules:
- Write in the FIRST PERSON as the applicant.
- Ground every claim ONLY in the applicant's real background below. NEVER invent employers, titles, dates, metrics, or achievements that are not present.
- Be specific and authentic; avoid generic filler and clichés.
- Match length to the question: 2-4 sentences for short questions, 2-3 short paragraphs for "cover letter" style prompts.
- Tailor the answer to the role and job description when provided.
- Professional but human tone — no buzzword salad.
- Output ONLY the answer text. No preamble, no "Here is", no surrounding quotes, no markdown headings.`;

    const roleLine = jobTitle || company
      ? `ROLE: ${jobTitle}${company ? ` at ${company}` : ""}`
      : "";
    const jdBlock = jobDescription ? `\nJOB DESCRIPTION:\n${jobDescription}` : "";
    const profileBlock = profile.fullName
      ? `\nAPPLICANT PROFILE:\n${JSON.stringify(profile, null, 2)}`
      : "";
    const resumeBlock = resumeText ? `\nRESUME TEXT:\n${resumeText}` : "";

    const userMessage = `APPLICATION QUESTION:
${question}
${roleLine ? `\n${roleLine}` : ""}${jdBlock}${profileBlock}${resumeBlock}

Write the applicant's answer to the question above.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error("Anthropic API error:", response.status, errText);
      if (userApiKey) {
        return NextResponse.json(
          { error: `API error (${response.status}). Check your API key.` },
          { status: 502 }
        );
      }
      return NextResponse.json(
        { error: `AI service error (${response.status})` },
        { status: 502 }
      );
    }

    // Deduct credit only after a successful call (and only when using our key)
    let remainingCredits = null;
    if (!userApiKey && userId) {
      const deductResult = await deductCredit(userId);
      remainingCredits = deductResult.credits;
    }

    const data = await response.json();
    const answer = data.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    if (!answer) {
      return NextResponse.json({ error: "AI returned an empty answer" }, { status: 502 });
    }

    return NextResponse.json({ answer, credits: remainingCredits });
  } catch (err) {
    console.error("Generate-answer error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
