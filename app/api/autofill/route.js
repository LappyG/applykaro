import { NextResponse } from "next/server";
import { getCredits, deductCredit } from "../../../lib/credits";

export async function POST(request) {
  try {
    const { fields, profile, userId, userApiKey } = await request.json();

    if (!fields || !profile) {
      return NextResponse.json(
        { error: "Missing fields or profile" },
        { status: 400 }
      );
    }

    // Determine which API key to use
    let apiKey = userApiKey;

    if (!userApiKey) {
      // Using our API key — check credits
      const creditCheck = userId
        ? await getCredits(userId)
        : { credits: 3 }; // anonymous fallback: allow 3 free uses

      if (creditCheck.credits <= 0) {
        return NextResponse.json(
          {
            error: "No credits remaining",
            credits: 0,
            needsPayment: true,
          },
          { status: 402 }
        );
      }

      apiKey = process.env.ANTHROPIC_API_KEY;
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: "No API key available" },
        { status: 500 }
      );
    }

    // Build the prompt for Claude
    const systemPrompt = `You are a job application form filler. Given a user's profile data and a list of form fields, map the profile data to the appropriate form fields.

Return ONLY valid JSON with this structure:
{
  "mapping": {
    "field_identifier": "value to fill",
    ...
  },
  "skipped": ["field_identifier1", "field_identifier2"],
  "notes": "any important notes for the user"
}

Rules:
- field_identifier should be the field's id, or name, or a generated key from the field list
- Match fields intelligently: "fname" = first name, "lname" = last name, "yoe" = years of experience, etc.
- For select/dropdown fields, pick the closest matching option from the available options
- For fields asking about experience, skills, etc., compose natural answers from the profile
- Skip fields you cannot confidently fill (add to "skipped" array)
- Never fill password fields
- For "Why do you want to work here" type questions, write a brief professional answer using the profile context
- For salary/CTC fields, use the expected CTC from profile
- Split full name into first/last name if separate fields exist`;

    const userMessage = `USER PROFILE:
${JSON.stringify(profile, null, 2)}

FORM FIELDS TO FILL:
${JSON.stringify(fields, null, 2)}

Map the profile data to these form fields. Return the mapping as JSON.`;

    // Call Claude API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        system: systemPrompt,
        messages: [
          { role: "user", content: userMessage },
          { role: "assistant", content: "{" },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error("Anthropic API error:", response.status, errText);

      // If user's own key failed, don't deduct credits
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

    // Deduct credit only after successful API call (and only if using our key)
    let remainingCredits = null;
    if (!userApiKey && userId) {
      const deductResult = await deductCredit(userId);
      remainingCredits = deductResult.credits;
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

    return NextResponse.json({
      ...parsed,
      credits: remainingCredits,
    });
  } catch (err) {
    console.error("Autofill error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
