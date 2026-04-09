import { NextResponse } from "next/server";

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

const SYSTEM_PROMPT = `You are a resume parser. Extract structured data from resume text.
Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "fullName": "string",
  "email": "string",
  "phone": "string",
  "city": "string",
  "linkedin": "string or empty",
  "portfolio": "string or empty",
  "gender": "",
  "dob": "",
  "education": [
    {
      "degree": "e.g. B.Tech Computer Science",
      "college": "college/university name",
      "year": "graduation year",
      "cgpa": "CGPA or percentage if mentioned",
      "field": "field of study"
    }
  ],
  "experience": [
    {
      "title": "job title",
      "company": "company name",
      "years": "duration e.g. 2 years or Jun 2022 - Present",
      "description": "brief 1-2 sentence summary of role"
    }
  ],
  "skills": "comma-separated list of all skills found",
  "totalExp": "total years of experience estimated from work history"
}

Rules:
- Extract ALL education entries and work experience entries found
- For skills, combine technical skills, tools, frameworks, languages into one comma-separated string
- If a field is not found in the resume, use empty string ""
- For totalExp, estimate from work history dates. If fresher/student, use "Fresher"
- Do NOT invent data — only extract what is explicitly in the resume`;

export async function POST(request) {
  try {
    const { resumeText } = await request.json();

    if (!resumeText || resumeText.trim().length < 50) {
      return NextResponse.json(
        { error: "Resume text too short to parse" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Parse this resume and extract structured data:\n\n${resumeText.substring(0, 6000)}`,
          },
          { role: "assistant", content: "{" },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error("Anthropic API error:", response.status, errText);
      return NextResponse.json(
        { error: `AI service error (${response.status})` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const rawText = data.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    let jsonStr = "{" + rawText;
    jsonStr = jsonStr.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    const firstBrace = jsonStr.indexOf("{");
    const lastBrace = jsonStr.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      return NextResponse.json(
        { error: "AI returned invalid response" },
        { status: 500 }
      );
    }

    jsonStr = jsonStr.slice(firstBrace, lastBrace + 1);

    const parsed = JSON.parse(jsonStr);

    // Ensure arrays exist
    if (!Array.isArray(parsed.education)) parsed.education = [];
    if (!Array.isArray(parsed.experience)) parsed.experience = [];

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Parse resume error:", err);
    return NextResponse.json(
      { error: "Failed to parse resume" },
      { status: 500 }
    );
  }
}
